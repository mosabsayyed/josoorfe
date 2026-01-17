const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../public/assets');

if (!fs.existsSync(assetsDir)) {
    console.error(`Directory not found: ${assetsDir}`);
    process.exit(1);
}

fs.readdirSync(assetsDir).forEach(file => {
    if (!file.endsWith('.png')) return;

    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath);

    // Check if it looks like a PNG header (0x89 0x50 0x4E 0x47)
    if (content[0] === 0x89 && content[1] === 0x50 && content[2] === 0x4E && content[3] === 0x47) {
        console.log(`Skipping valid PNG: ${file}`);
        return;
    }

    // Check if it's base64 text
    const text = content.toString('utf8').trim();
    // Simple heuristic: valid base64 chars + starts with something reasonable for PNG base64 (iVBORw...)
    // Note: Some files might be raw SVG data or something else, but we suspect base64 PNG.
    // Common PNG base64 start: iVBORw0KGgo
    if (text.startsWith('iVBORw') || text.match(/^[A-Za-z0-9+/=]+$/)) {
        try {
            const buffer = Buffer.from(text, 'base64');
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
                fs.writeFileSync(filePath, buffer);
                console.log(`Fixed base64-encoded PNG: ${file}`);
            } else {
                console.warn(`Decoded file does not have PNG header: ${file}`);
            }
        } catch (e) {
            console.error(`Failed to decode ${file}: ${e.message}`);
        }
    } else {
        console.warn(`File is neither valid PNG nor recognized base64: ${file} (Start: ${text.substring(0, 20)}...)`);
    }
});
