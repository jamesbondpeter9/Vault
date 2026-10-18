class ImageStorageDB {
    static async initDB() {
        if (!localStorage.getItem('image_portal_models_db')) {
            localStorage.setItem('image_portal_models_db', JSON.stringify([]));
        }
        if (!localStorage.getItem('image_portal_photostreams_db')) {
            localStorage.setItem('image_portal_photostreams_db', JSON.stringify([]));
        }
        if (!localStorage.getItem('image_portal_folders_db')) {
            localStorage.setItem('image_portal_folders_db', JSON.stringify([]));
        }
        await ImageStorageDB.syncFromEmbeddedJSON();
    }

    static async syncFromEmbeddedJSON() {
        try {
            const scriptTag = document.getElementById('embedded-images-database');
            if (scriptTag) {
                const embeddedData = JSON.parse(scriptTag.textContent);
                if (embeddedData.models) {
                    localStorage.setItem('image_portal_models_db', JSON.stringify(embeddedData.models));
                }
                if (embeddedData.photostreams) {
                    const photoStreams = embeddedData.photostreams.filter(s => {
                        const t = (s.type || 'photo').toLowerCase();
                        return t === 'photo' || t === 'photostream';
                    });
                    localStorage.setItem('image_portal_photostreams_db', JSON.stringify(photoStreams));
                }
                if (embeddedData.folders) {
                    localStorage.setItem('image_portal_folders_db', JSON.stringify(embeddedData.folders));
                }
            }
        } catch (e) {
            console.log('No embedded images database found or failed to parse.');
        }
    }

    static getModels() {
        try {
            return JSON.parse(localStorage.getItem('image_portal_models_db')) || [];
        } catch (e) {
            return [];
        }
    }

    static saveModels(models) {
        localStorage.setItem('image_portal_models_db', JSON.stringify(models));
    }

    static getPhotoStreams() {
        try {
            const streams = JSON.parse(localStorage.getItem('image_portal_photostreams_db')) || [];
            return streams.filter(s => {
                const t = (s.type || 'photo').toLowerCase();
                return t === 'photo' || t === 'photostream';
            });
        } catch (e) {
            return [];
        }
    }

    static savePhotoStreams(streams) {
        localStorage.setItem('image_portal_photostreams_db', JSON.stringify(streams));
    }

    static addPhotoStream(streamData) {
        const streams = ImageStorageDB.getPhotoStreams();
        streams.push({
            title: streamData.title,
            url: streamData.url,
            thumbnail: streamData.thumbnail || streamData.url,
            models: streamData.models || [],
            type: 'photo',
            createdAt: Date.now()
        });
        ImageStorageDB.savePhotoStreams(streams);
    }

    static getFolders() {
        try {
            return JSON.parse(localStorage.getItem('image_portal_folders_db')) || [];
        } catch (e) {
            return [];
        }
    }

    static saveFolders(folders) {
        localStorage.setItem('image_portal_folders_db', JSON.stringify(folders));
    }
}
