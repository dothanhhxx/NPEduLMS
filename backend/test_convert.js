const fs = require('fs').promises;
const path = require('path');
const libre = require('libreoffice-convert');

async function test() {
    try {
        // Create a dummy txt file
        const input = path.join(__dirname, 'test.txt');
        await fs.writeFile(input, 'Hello World');
        const fileBuf = await fs.readFile(input);
        
        console.log('Starting conversion...');
        const pdfBuf = await new Promise((resolve, reject) => {
            libre.convert(fileBuf, '.pdf', undefined, (err, done) => {
                if (err) return reject(err);
                resolve(done);
            });
        });
        console.log('Conversion successful. Buffer length:', pdfBuf.length);
        await fs.unlink(input);
    } catch (e) {
        console.error('CONVERSION ERROR:', e);
    }
}

test();
