document.addEventListener("DOMContentLoaded", () => {
    let socket = io.connect("http://localhost:3000");

    let usernameInput = document.querySelector("#username");
    let usernameBtn = document.querySelector("#usernameBtn");
    let displayUsername = document.querySelector("#displayUsername");

    let messageInput = document.querySelector("#message");
    let messageBtn = document.querySelector("#messageBtn");
    let messageList = document.querySelector("#message-list");

    let username = "Anonymous";
    displayUsername.textContent = username;

    // ✅ เปลี่ยนชื่อผู้ใช้ และอัปเดตด้านบน
    usernameBtn.addEventListener("click", () => {
        if (usernameInput.value.trim() !== "") {
            username = usernameInput.value.trim();
            socket.emit("change_username", { username });

            displayUsername.textContent = username;
            usernameInput.value = "";
        }
    });

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

    loadChatHistory();

    messageBtn.addEventListener("click", () => {
        const messageText = messageInput.value.trim();
        if (messageText === "") return;

        // ✅ ส่งข้อความไปยังเซิร์ฟเวอร์ และแสดงผลทันที
        socket.emit("new_message", { username, message: messageText });

        fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, message: messageText })
        })
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

        if (!existingMessages.includes(`${username}: ${message}`)) {
            let listItem = document.createElement("li");
            listItem.textContent = `${username}: ${message}`;
            listItem.classList.add("list-group-item");
            messageList.appendChild(listItem);
        }
    }
});
