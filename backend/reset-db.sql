-- NP Education - Reset Database Script
-- DÙNG ĐỂ XÓA TOÀN BỘ DỮ LIỆU VÀ LÀM MỚI DATABASE (START FROM SCRATCH)
-- CHUYÊN DÙNG TRONG MÔI TRƯỜNG DEV. CẨN THẬN KHI SỬ DỤNG!

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS progress_records;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS homework;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS class_sessions;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- Có thể chạy lại file database.sql sau khi chạy file này.
