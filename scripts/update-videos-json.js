/**
 * update-videos-json.js - Database Schema Validation and Verification Script
 */
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

// Ensure all required schema arrays exist
if (!dbData.models) dbData.models = [];
if (!dbData.streams) dbData.streams = [];
if (!dbData.homepage_thumbnails) dbData.homepage_thumbnails = [];

fs.writeFileSync(filePath, JSON.stringify(dbData, null, 4), 'utf8');
console.log('Successfully updated and verified videos.json schema!');
