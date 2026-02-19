const express = require('express');
const multer = require('multer');
const { exportImages } = require('pdf-export-images');
const path = require('path');
const fs = require('fs');

const app = express();
// Cấu hình multer để lưu file tạm vào thư mục 'uploads'
const upload = multer({ dest: 'uploads/' });

// Phục vụ giao diện web tĩnh
app.use(express.static('public'));

app.post('/api/extract', upload.array('pdfFiles'), async (req, res) => {
  const files = req.files;
  const results = [];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Không có file nào được tải lên.' });
  }

  console.log(`Bắt đầu xử lý ${files.length} file PDF...`);

  // Dùng vòng lặp for...of để xử lý TUẦN TỰ (lần lượt từng file)
  for (const file of files) {
    // Tạo tên thư mục đầu ra dựa trên tên file PDF gốc
    const originalName = file.originalname.replace('.pdf', '');
    const outputDir = path.join(__dirname, 'output_images', originalName);

    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      console.log(`Đang xử lý file: ${file.originalname}...`);
      // Trích xuất ảnh
      const images = await exportImages(file.path, outputDir);
      results.push({
        filename: file.originalname,
        status: 'Thành công',
        imageCount: images.length
      });
    } catch (error) {
      console.error(`Lỗi ở file ${file.originalname}:`, error);
      results.push({
        filename: file.originalname,
        status: 'Lỗi',
        errorMsg: error.message
      });
    } finally {
      // Dọn dẹp: Xóa file PDF tạm sau khi xử lý xong
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  console.log('Đã xử lý xong tất cả các file!');
  // Trả kết quả về cho giao diện
  res.json({ results });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});