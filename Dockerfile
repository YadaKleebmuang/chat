# ใช้ Node.js เวอร์ชันล่าสุด
FROM node:18

# กำหนด Working Directory ใน Container
WORKDIR /app

# คัดลอกไฟล์ package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง Dependencies
RUN npm install

# คัดลอกโค้ดทั้งหมดลง Container
COPY . .

# กำหนดพอร์ตที่ Container จะใช้
EXPOSE 3000

# รันเซิร์ฟเวอร์
CMD ["node", "app.js"]
