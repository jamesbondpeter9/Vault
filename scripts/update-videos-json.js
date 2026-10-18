const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../videos.json');
let dbData = { models: [], streams: [], homepage_thumbnails: [] };

if (fs.existsSync(filePath)) {
    try {
        dbData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.log('Could not parse existing videos.json, starting fresh.');
    }
}

if (!dbData.models) dbData.models = [];
if (!dbData.streams) dbData.streams = [];
if (!dbData.homepage_thumbnails) dbData.homepage_thumbnails = [];

dbData.streams = dbData.streams.filter(item => {
    const type = (item.type || 'stream').toLowerCase();
    return type === 'stream' || type === 'video';
});

fs.writeFileSync(filePath, JSON.stringify(dbData, null, 4), 'utf8');
console.log('Successfully updated, filtered, and verified videos.json schema!');
