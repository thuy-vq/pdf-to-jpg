const express = require('express');
const multer = require('multer');
const { exportImages } = require('pdf-export-images');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Cấu hình ghi log
const logFile = path.join(__dirname, 'system_log.txt');

function writeLog(message) {
    const time = new Date().toLocaleString('vi-VN');
    const logLine = `[${time}] ${message}\n`;
    fs.appendFileSync(logFile, logLine, 'utf8');
    console.log(logLine.trim());
}

// API: Xử lý giải nén từng file
app.post('/api/extract-single', upload.single('pdfFile'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'Thiếu file PDF' });
    }

    // Tạo thư mục đầu ra dựa trên tên file gốc (Bỏ đuôi .pdf)
    const originalName = file.originalname.replace(/\.[^/.]+$/, "");
    const outputDir = path.join(__dirname, 'output_images', originalName);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const images = await exportImages(file.path, outputDir);
        
        // Dọn dẹp file tạm
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        // Ghi log thành công
        writeLog(`THÀNH CÔNG | File: "${file.originalname}" | Trích xuất: ${images.length} ảnh | Lưu tại: ${outputDir}`);

        res.json({
            status: 'success',
            filename: file.originalname,
            imageCount: images.length
        });
    } catch (error) {
        // Dọn dẹp file tạm khi lỗi
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        
        writeLog(`LỖI | File: "${file.originalname}" | Chi tiết: ${error.message}`);
        res.status(500).json({ status: 'error', filename: file.originalname, msg: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server chạy tại http://localhost:3000');
    writeLog('HỆ THỐNG | Server khởi động');
});