const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../imagess.json');
let dbData = { models: [], photostreams: [], folders: [] };

if (fs.existsSync(filePath)) {
    try {
        dbData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.log('Could not parse existing imagess.json, starting fresh.');
    }
}

if (!dbData.models) dbData.models = [];
if (!dbData.photostreams) dbData.photostreams = [];
if (!dbData.folders) dbData.folders = [];

dbData.photostreams = dbData.photostreams.filter(item => {
    const type = (item.type || 'photo').toLowerCase();
    return type === 'photo' || type === 'photostream';
});

fs.writeFileSync(filePath, JSON.stringify(dbData, null, 4), 'utf8');
console.log('Successfully updated, filtered, and verified imagess.json schema!');
