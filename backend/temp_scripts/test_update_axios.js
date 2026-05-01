const axios = require('axios');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const fs = require('fs');

async function testUpdate() {
    try {
        const token = jwt.sign({ userId: 3, role: 'Teacher' }, 'np_edu_secret_key_2026', { expiresIn: '1h' });
        
        const form = new FormData();
        form.append('title', 'Test API Title xyz');
        form.append('description', 'Test desc!!');
        form.append('start_date', '2026-04-18');
        form.append('due_date', '2026-05-30');
        form.append('due_time', '23:59:59');

        console.log("Sending PUT request...");
        const res = await axios.put('http://localhost:5000/api/homework/1', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Success Output:", res.data);
    } catch (err) {
        console.error("AXIOS ERROR DETECTED!");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
            if (typeof err.response.data === 'string') {
                console.error("Found HTML response!");
            }
        } else {
            console.error(err.message);
        }
    }
}
testUpdate();
