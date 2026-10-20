const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../images.json');
const galleryPath = path.join(__dirname, '../image-gallery.html');

let dbData = { models: [], photostreams: [], folders: [] };

if (fs.existsSync(filePath)) {
    try {
        dbData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.log('Could not parse existing images.json, starting fresh.');
    }
}

// Sync models, photostreams, and folders from image-gallery.html if present
if (fs.existsSync(galleryPath)) {
    try {
        const htmlContent = fs.readFileSync(galleryPath, 'utf8');
        const match = htmlContent.match(/<script type="application\/json" id="embedded-(?:images?-)?database">([\s\S]*?)<\/script>/i);
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
            if (galleryData.photostreams && Array.isArray(galleryData.photostreams)) {
                const existingStreams = new Set(dbData.photostreams.map(s => s.url || s.thumbnail));
                galleryData.photostreams.forEach(s => {
                    const key = s.url || s.thumbnail;
                    if (key && !existingStreams.has(key)) {
                        dbData.photostreams.push(s);
                        existingStreams.add(key);
                    }
                });
            }
            if (galleryData.folders && Array.isArray(galleryData.folders)) {
                const existingFolders = new Set(dbData.folders.map(f => f.name.toLowerCase()));
                galleryData.folders.forEach(f => {
                    if (f && f.name && !existingFolders.has(f.name.toLowerCase())) {
                        dbData.folders.push(f);
                        existingFolders.add(f.name.toLowerCase());
                    }
                });
            }
            console.log('Synced models, photostreams, and folders from image-gallery.html successfully.');
        }
    } catch (e) {
        console.log('Could not parse embedded database from image-gallery.html:', e.message);
    }
}

if (!dbData.models) dbData.models = [];
if (!dbData.photostreams) dbData.photostreams = [];
if (!dbData.folders) dbData.folders = [];

fs.writeFileSync(filePath, JSON.stringify(dbData, null, 4), 'utf8');
console.log('Successfully updated, filtered, and verified images.json schema!');
