// เชื่อมต่อกับเซิร์ฟเวอร์ผ่าน Socket.IO
// และส่งข้อความไปยังเซิร์ฟเวอร์เพื่อบันทึกลงฐานข้อมูล
document.addEventListener("DOMContentLoaded", () => {
    let socket = io.connect("http://localhost:3000"); 

    let usernameInput = document.querySelector("#username"); 
    let usernameBtn = document.querySelector("#usernameBtn");
    let displayUsername = document.querySelector("#displayUsername"); 

    let messageInput = document.querySelector("#message"); 
    let messageBtn = document.querySelector("#messageBtn"); 
    let messageList = document.querySelector("#message-list");

    let username = "Anonymous"; // ✅ ชื่อผู้ใช้เริ่มต้น
    displayUsername.textContent = username;

    // ✅ เปลี่ยนชื่อผู้ใช้ และอัปเดตด้านบน
    usernameBtn.addEventListener("click", () => {
        if (usernameInput.value.trim() !== "") { // ✅ ตรวจสอบว่าชื่อผู้ใช้ไม่ว่าง
            username = usernameInput.value.trim();
            socket.emit("change_username", { username }); // ✅ ส่งชื่อผู้ใช้ไปยังเซิร์ฟเวอร์

            displayUsername.textContent = username;
            usernameInput.value = ""; // ✅ ล้างช่องใส่ชื่อผู้ใช้
        }
    });

    // ✅ โหลดข้อความทั้งหมดจากฐานข้อมูล
    function loadChatHistory() {
        fetch("/api/messages") 
            .then(res => res.json()) 
            .then(messages => { 
                messageList.innerHTML = ""; // ✅ เคลียร์ก่อนโหลดใหม่
                messages.forEach(data => { 
                    addMessageToUI(data.username, data.message); 
                });
            })
            .catch(err => console.error("Error loading chat history:", err));
    }
    // ✅ โหลดข้อความทั้งหมดทันทีเมื่อเปิดหน้าเว็บ
    loadChatHistory();

    // ✅ ส่งข้อความเมื่อกดปุ่มส่ง
    messageBtn.addEventListener("click", () => {
        const messageText = messageInput.value.trim(); 
        if (messageText === "") return; // ✅ ไม่ส่งข้อความว่าง

        // ✅ ส่งข้อความไปยังเซิร์ฟเวอร์ และแสดงผลทันที
        socket.emit("new_message", { username, message: messageText });

        // ✅ บันทึกข้อความลงฐานข้อมูล
        fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, message: messageText })
        })
        // ✅ ล้างช่องใส่ข้อความหลังจากส่ง
        .then(res => res.json())
        .then(() => {
            messageInput.value = "";
        })
        .catch(err => console.error("Error sending message:", err));
    });

    // ✅ ตรวจสอบว่า WebSocket ถูกลงทะเบียนเพียงครั้งเดียว
    if (!window.hasSocketListener) {
        socket.on("receive_message", data => {
            addMessageToUI(data.username, data.message);
        });
        window.hasSocketListener = true;
    }

    // ✅ ฟังก์ชันเพิ่มข้อความลงใน UI (กันซ้ำ)
    function addMessageToUI(username, message) {
        // ✅ ตรวจสอบว่าข้อความนี้มีอยู่แล้วหรือไม่
        const existingMessages = Array.from(document.querySelectorAll("#message-list li")) 
            .map(li => li.textContent); 

        if (!existingMessages.includes(`${username}: ${message}`)) { // ✅ ถ้าไม่มีให้เพิ่ม
            let listItem = document.createElement("li"); 
            listItem.textContent = `${username}: ${message}`; // ✅ แสดงชื่อผู้ใช้และข้อความ
            listItem.classList.add("list-group-item"); 
            messageList.appendChild(listItem); 
        }
    }
});
