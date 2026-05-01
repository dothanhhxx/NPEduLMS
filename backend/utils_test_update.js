const http = require('http');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');

async function testUpdate() {
    try {
        const token = jwt.sign({ userId: 3, role: 'Teacher' }, 'np_edu_secret_key_2026', { expiresIn: '1h' });
        
        const form = new FormData();
        form.append('title', 'Test Update');
        form.append('description', 'Description');
        form.append('start_date', '2026-04-18');
        form.append('due_date', '2026-04-20');
        form.append('due_time', '23:59:59');

        const request = http.request(
            {
                hostname: '127.0.0.1',
                port: 5000,
                path: '/api/homework/1',
                method: 'PUT',
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            },
            (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    console.log('BODY:', data);
                });
            }
        );

        request.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        form.pipe(request);
    } catch (err) {
        console.error("Error:", err);
    }
}
testUpdate();
