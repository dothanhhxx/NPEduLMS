const axios = require('axios');
const fs = require('fs');

async function test() {
    try {
        console.log("Logging in...");
        const login = await axios.post('http://localhost:5000/api/auth/login', { email: 'teacher@npeducation.edu', password: 'password123' });
        const token = login.data.token;
        console.log("Token:", token.slice(0, 10));

        // Let's create a dummy file
        fs.writeFileSync('test.pdf', 'dummy pdf content');

        const FormData = require('axios').toFormData ? require('axios').toFormData : undefined; // checking if form-data exists natively? actually node 18+ has FormData global
        
        let formData;
        let headers = { Authorization: `Bearer ${token}` };
        
        try {
            console.log("Using native FormData");
            formData = new FormData();
            formData.append('name', 'test name');
            formData.append('description', 'test description');
            // Mock file blob
            const blob = new Blob([fs.readFileSync('test.pdf')], { type: 'application/pdf' });
            formData.append('file', blob, 'test.pdf');
        } catch(e) {
            console.log("Error with FormData", e.message);
        }

        console.log("Sending upload request...");
        const res = await axios.post('http://localhost:5000/api/learning-materials/class/1', formData, { 
            headers: headers
        });
        console.log('Success:', res.data);
    } catch(e) {
        console.error('Upload Error:', e.response ? e.response.data : e.message);
    }
}
test();
