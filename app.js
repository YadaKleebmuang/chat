const express = require("express");
const http = require("http"); // ✅ ใช้ HTTP Server
const socketio = require("socket.io");
const db = require("./db");
const path = require("path");


const app = express();
const server = http.createServer(app);
const io = socketio(server); // ✅ ใช้ HTTP Server สร้าง WebSocket Server

const PORT = process.env.PORT || 3000;

// ✅ ตั้งค่า Express สำหรับรับ JSON และเรียกใช้งานไฟล์ส่วนตัว
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ API: ดึงข้อความแชททั้งหมด
app.get("/api/messages", (req, res) => {
    const sql = `SELECT messages.id, users.username, messages.message, messages.timestamp 
                 FROM messages JOIN users ON messages.user_id = users.id 
                 ORDER BY messages.timestamp ASC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ✅ API: บันทึกข้อความลง MySQL และส่งให้ทุก Client แบบ Realtime
app.post("/api/messages", (req, res) => {
    console.log("📥 Received data:", req.body);

    const { username, message } = req.body;

    // ✅ ตรวจสอบข้อมูลที่ส่งมา
    if (!username || !message) { 
        console.error("❌ Missing username or message"); 
        return res.status(400).json({ error: "Username and message are required" }); // ส่งข้อความแจ้งเตือนว่าข้อมูลไม่ครบ
    }

    // ✅ ตรวจสอบว่ามี User นี้ในระบบหรือยัง
    db.query("SELECT id FROM users WHERE username = ?", [username], (err, result) => {
        if (err) {
            console.error("❌ Database Error (Checking user):", err);
            return res.status(500).json({ error: err.message });
        }

        // ✅ ถ้าไม่มี User นี้ในระบบ ให้สร้าง User ใหม่
        let userId = result.length > 0 ? result[0].id : null;

        // ✅ บันทึกข้อความลง MySQL และส่งให้ทุก Client แบบ Realtime
        if (!userId) {
            db.query("INSERT INTO users (username) VALUES (?)", [username], (err, result) => {
                if (err) {
                    console.error("❌ Database Error (Inserting user):", err);
                    return res.status(500).json({ error: err.message });
                }
                userId = result.insertId;

                saveMessage(userId, username, message, res);
            });
        } else {
            saveMessage(userId, username, message, res);
        }
    });
});

// ✅ ฟังก์ชันบันทึกข้อความลง MySQL และส่งข้อความให้ทุก Client
function saveMessage(userId, username, message, res) {
    db.query("INSERT INTO messages (user_id, message) VALUES (?, ?)", [userId, message], (err) => {
        if (err) {
            console.error("❌ Database Error (Inserting message):", err);
            return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Message saved: ${username}: ${message}`);

        // ✅ ส่งข้อความใหม่ไปให้ทุก Client ผ่าน WebSocket
        io.sockets.emit("receive_message", { username, message });

        res.json({ success: true });
    });
}

// ✅ ตั้งค่า WebSocket สำหรับ Realtime Chat
io.on("connection", (socket) => {
    console.log("✅ New user connected");

    socket.on("change_username", (data) => {
        socket.username = data.username || "Anonymous";
    });

    socket.on("new_message", (data) => {
        console.log(`📩 New message from ${data.username}: ${data.message}`);

        // ✅ บันทึกข้อความลง MySQL และกระจายข้อความให้ทุกคน
        db.query("SELECT id FROM users WHERE username = ?", [data.username], (err, result) => {
            if (err) return console.error("❌ Database Error:", err);

            let userId = result.length > 0 ? result[0].id : null;

            if (!userId) {
                db.query("INSERT INTO users (username) VALUES (?)", [data.username], (err, result) => {
                    if (err) return console.error("❌ Database Error (Creating user):", err);
                    userId = result.insertId;
                    saveMessage(userId, data.username, data.message, { json: () => {} });
                });
            } else {
                saveMessage(userId, data.username, data.message, { json: () => {} });
            }
        });
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected");
    });
});

// ✅ ใช้ `server.listen` แทน `app.listen` เพื่อรองรับ WebSocket
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
