const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file an toàn để tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Bộ lọc file dành cho bài nộp của học sinh (PDF, DOC, DOCX)
const submissionFileFilter = (req, file, cb) => {
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tệp tải lên không đúng định dạng. Chỉ chấp nhận PDF, DOC, DOCX.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // Giới hạn file 100MB
    }
});

// Upload dành riêng cho nộp bài (có filter định dạng)
upload.submissionUpload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: submissionFileFilter
});

module.exports = upload;
