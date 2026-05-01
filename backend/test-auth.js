async function testAuth() {
    console.log("=== BẮT ĐẦU TEST AUTH API ===");

    // 1. Test Đăng Ký (Register)
    console.log("\n[1] Đang test API Đăng ký (/api/users/register)...");
    try {
        const regRes = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'hocsinh_test1@np.edu.vn',
                password: 'password123',
                full_name: 'Học Sinh Test',
                role_name: 'Student',
                phone: '0901234567'
            })
        });
        const regData = await regRes.json();
        console.log("-> Kết quả Đăng ký:", regData);
    } catch (e) {
        console.error("-> Lỗi Đăng ký:", e.message);
    }

    // 2. Test Đăng Nhập (Login)
    console.log("\n[2] Đang test API Đăng nhập (/api/auth/login)...");
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'hocsinh_test1@np.edu.vn',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log("-> Kết quả Đăng nhập:", loginData);

        if (loginData.token) {
            console.log("-> ✅ JWT Token trả về thành công! (Dài:", loginData.token.length, "ký tự)");
        } else {
            console.log("-> ❌ Lỗi: Không nhận được JWT Token.");
        }
    } catch (e) {
        console.error("-> Lỗi Đăng nhập:", e.message);
    }
}

testAuth();
