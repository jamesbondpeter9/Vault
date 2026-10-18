const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../videos.json');
const galleryPath = path.join(__dirname, '../video-gallery.html');

let dbData = { models: [], streams: [], homepage_thumbnails: [] };

if (fs.existsSync(filePath)) {
    try {
        dbData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.log('Could not parse existing videos.json, starting fresh.');
    }
}

// Sync models and streams from video-gallery.html if present
if (fs.existsSync(galleryPath)) {
    try {
        const htmlContent = fs.readFileSync(galleryPath, 'utf8');
        const match = htmlContent.match(/<script type="application\/json" id="embedded-(?:video-)?database">([\s\S]*?)<\/script>/i);
        if (match) {
            const galleryData = JSON.parse(match[1].trim());
            if (galleryData.models && Array.isArray(galleryData.models)) {
                const existingModelNames = new Set(dbData.models.map(m => m.name.toLowerCase()));
                galleryData.models.forEach(m => {
                    if (m && m.name && !existingModelNames.has(m.name.toLowerCase())) {
                        dbData.models.push(m);
                        existingModelNames.add(m.name.toLowerCase());
                    }
                });
            }
            if (galleryData.streams && Array.isArray(galleryData.streams)) {
                const existingUrls = new Set(dbData.streams.map(s => s.url || s.thumbnail));
                galleryData.streams.forEach(s => {
                    const key = s.url || s.thumbnail;
                    if (key && !existingUrls.has(key)) {
                        dbData.streams.push(s);
                        existingUrls.add(key);
                    }
                });
            }
            console.log('Synced models and streams from video-gallery.html successfully.');
        }
    } catch (e) {
        console.log('Could not parse embedded database from video-gallery.html:', e.message);
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
