const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../videos.json');

if (!fs.existsSync(filePath)) {
    console.error('videos.json not found!');
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const dbData = JSON.parse(rawData);

    // Ensure baseline arrays exist
    if (!dbData.models) dbData.models = [];
    if (!dbData.streams) dbData.streams = [];

    // Filter valid stream and video types
    dbData.streams = dbData.streams.filter(item => {
        const type = (item.type || 'stream').toLowerCase();
        return type === 'stream' || type === 'video';
    });

    // Write back normalized format
    fs.writeFileSync(filePath, JSON.stringify(dbData, null, 4), 'utf8');
    console.log('videos.json schema validated and normalized successfully.');
} catch (err) {
    console.error('Invalid JSON format in videos.json:', err.message);
    process.exit(1);
}
