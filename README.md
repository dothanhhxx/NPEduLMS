# Tên Dự án: NP Education Management System

## 1. Tổng quan Dự án (Project Overview)
Ứng dụng quản lý trung tâm tiếng Anh NP Education, hỗ trợ quản lý học viên, điểm danh, xếp lớp, lên thời khóa biểu và cung cấp tài liệu học tập.
Hệ thống bao gồm:
- **Frontend**: ReactJS (Vite), Design System custom (CSS Variables).
- **Backend**: Node.js (Express), tuân thủ RESTful API.
- **Database**: MySQL (tương tác trực tiếp bằng `mysql2`).
- **Authentication**: Xác thực phân quyền bằng `jsonwebtoken` (JWT) và `bcrypt`.

### Các tính năng chính (Key Features)
- **Quản lý Tài khoản (RBAC)**: Phân quyền rõ ràng cho Admin, Giáo viên, và Học sinh.
- **Quản lý Học viên**: Đăng ký, hiển thị danh sách học sinh theo từng lớp.
- **Quản lý Lớp học**: API tạo và quản lý lớp học (Branch, Class).
- **Thời khóa biểu (Schedule)**: Lấy lịch học theo từng đối tượng rành mạch.
- **Tài liệu học tập (Materials)**: Đóng tiền ghi danh lớp nào mới được tải tài liệu lớp đó.

---

## 2. Hướng dẫn Cài đặt & Chạy Local (Setup & Run)

### Yêu cầu (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 trở lên).
- [MySQL Server](https://dev.mysql.com/downloads/) hoặc [XAMPP](https://www.apachefriends.org/) (đã cài đặt và đang chạy).
- [Git](https://git-scm.com/).

### Bước 1: Clone dự án
```bash
git clone https://github.com/Hoa2-p/NP-Education-.git
cd NP-Education-
```

### Bước 2: Cài đặt Dependencies
```bash
# Cài Frontend
npm install

# Cài Backend
cd backend
npm install
cd ..
```

### Bước 3: Khởi tạo Database [CHỈ CHẠY 1 LẦN KHI SETUP]
1. Mở MySQL Workbench, phpMyAdmin hoặc Command Line.
2. Import file `backend/database.sql`. Lưu ý: File này hiện tại KHÔNG tự xóa bảng cũ, nếu bạn muốn xóa sạch hãy xem mục "Reset Database" bên dưới.


### Bước 4: Cấu hình Môi trường (.env)
Tạo file `.env` tại thư mục `backend/` với nội dung sau:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=np_education
JWT_SECRET=np_edu_secret_key_2026

# Cấu hình gửi mail (Quên mật khẩu)
EMAIL_USER=
EMAIL_PASS=
```
> **Lưu ý:** Chỉnh `DB_PORT` và `DB_PASSWORD` cho khớp với MySQL của bạn. XAMPP thường dùng port `3307`, MySQL standalone dùng `3306`.
> **Lưu ý tính năng Quên mật khẩu:** Để hệ thống gửi email thật, hãy tạo "App Password" của Gmail và điền vào 2 biến `EMAIL_USER` và `EMAIL_PASS`. Nếu bỏ trống, hệ thống sẽ tự động sinh link test thư giả lập ra Terminal.

### Bước 5: Sinh dữ liệu mẫu (Seed Data) [CHỈ CHẠY 1 LẦN]
```bash
cd backend
node seed-data.js
```
Script này tự động tạo tài khoản test. **Lưu ý:** Nếu bạn chạy lại lệnh này khi đã có dữ liệu, script sẽ tự động bỏ qua để tránh ghi đè/xóa dữ liệu mới của bạn.


### Bước 6: Chạy dự án

**Terminal 1 — Backend:**
```bash
cd backend
npm start         # hoặc: node server.js
```
> Server chạy tại `http://localhost:5000`. Dùng `npm run server` nếu muốn auto-reload (nodemon).

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
> Giao diện chạy tại `http://localhost:5173`.

### Tài khoản Test
| Role | Email | Mật khẩu | Ghi chú |
|------|-------|-----------|---------|
| Admin | `admin@np.edu.vn` | `123456` | Seed DB |
| Giáo viên | `teacher_mike@np.edu.vn` | `123456` | Seed DB |
| Học viên | `student_an@np.edu.vn` | `123456` | Seed DB |

### Lưu ý quan trọng: Reset Database
Nếu bạn muốn xóa sạch toàn bộ dữ liệu và bắt đầu lại từ đầu (WARNING: Mất hết dữ liệu hiện tại):
1. Import file `backend/reset-db.sql` vào MySQL.
2. Chạy lại lệnh `node seed-data.js --force` trong thư mục `backend`.

---


## 3. Cấu trúc Dự án (Project Structure)
```
np-education/
├── src/                    # Frontend (ReactJS)
│   ├── components/         # Các Widget UI (Dashboard, Schedule...)
│   ├── api.js              # Cấu hình gọi API
│   ├── App.jsx             # Logic chính Frontend
│   └── index.css           # Global Styles
├── backend/                # Backend (Node.js)
│   ├── config/             # Cấu hình kết nối MySQL (db.js)
│   ├── controllers/        # Xử lý Logic (auth, class, schedule...)
│   ├── middleware/         # Xác thực JWT Token và Phân quyền (RBAC)
│   ├── routes/             # Cấu hình API Endpoints
│   ├── database.sql        # File SQL tạo bảng Schema trống
│   ├── seed-data.js        # File rải dữ liệu mồi bằng Node
│   ├── server.js           # Entry point của toàn bộ Server
│   └── generate-postman.js # Tự sinh file cấu hình test API cho Postman
├── .env                    # (Nên đưa vào .gitignore) Biến môi trường
├── package.json            # Quản lý dependencies chung
└── README.md               # Sổ tay dự án này
```
