const fs = require('fs').promises;
const path = require('path');
const libre = require('libreoffice-convert');

function convertAsync(fileBuf, ext, filterOptions) {
    return new Promise((resolve, reject) => {
        libre.convert(fileBuf, ext, filterOptions, (err, done) => {
            if (err) return reject(err);
            resolve(done);
        });
    });
}

async function convertToPdf(inputPath, outputPath) {
    try {
        const fileBuf = await fs.readFile(inputPath);
        console.log(`Converting ${inputPath} to PDF...`);
        const pdfBuf = await convertAsync(fileBuf, '.pdf', undefined);
        await fs.writeFile(outputPath, pdfBuf);
        console.log(`Converted to ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`Error converting ${inputPath}:`, error);
        return false;
    }
}

module.exports = { convertToPdf };
