class StorageDB {
    static async initDB() {
        if (!localStorage.getItem('video_portal_models_db')) {
            localStorage.setItem('video_portal_models_db', JSON.stringify([]));
        }
        if (!localStorage.getItem('video_portal_streams_db')) {
            localStorage.setItem('video_portal_streams_db', JSON.stringify([]));
        }
        if (!localStorage.getItem('video_portal_folders_db')) {
            localStorage.setItem('video_portal_folders_db', JSON.stringify([]));
        }
        await StorageDB.syncFromEmbeddedJSON();
    }

    static async syncFromEmbeddedJSON() {
        try {
            const scriptTag = document.getElementById('embedded-database');
            if (scriptTag) {
                const embeddedData = JSON.parse(scriptTag.textContent);
                
                const currentModels = StorageDB.getModels();
                if (currentModels.length === 0 && embeddedData.models && embeddedData.models.length > 0) {
                    localStorage.setItem('video_portal_models_db', JSON.stringify(embeddedData.models));
                }

                const currentStreams = StorageDB.getStreams();
                if (currentStreams.length === 0 && embeddedData.streams && embeddedData.streams.length > 0) {
                    const videoStreams = embeddedData.streams.filter(s => {
                        const t = (s.type || 'stream').toLowerCase();
                        return t === 'stream' || t === 'video';
                    });
                    localStorage.setItem('video_portal_streams_db', JSON.stringify(videoStreams));
                }
            }
        } catch (e) {
            console.log('No embedded database found or failed to parse.');
        }
    }

    static getModels() {
        try {
            return JSON.parse(localStorage.getItem('video_portal_models_db')) || [];
        } catch (e) {
            return [];
        }
    }

    static saveModels(models) {
        localStorage.setItem('video_portal_models_db', JSON.stringify(models));
    }

    static addModel(modelData) {
        const models = StorageDB.getModels();
        const existingIndex = models.findIndex(m => m.name.toLowerCase() === modelData.name.toLowerCase());
        
        if (existingIndex >= 0) {
            models[existingIndex].thumbnail = modelData.thumbnail || models[existingIndex].thumbnail;
            models[existingIndex].shape = modelData.shape || models[existingIndex].shape;
        } else {
            models.push({
                name: modelData.name,
                thumbnail: modelData.thumbnail || '',
                shape: modelData.shape || 'portrait',
                createdAt: Date.now()
            });
        }
        StorageDB.saveModels(models);
    }

    static getStreams() {
        try {
            const streams = JSON.parse(localStorage.getItem('video_portal_streams_db')) || [];
            return streams.filter(s => {
                const t = (s.type || 'stream').toLowerCase();
                return t === 'stream' || t === 'video';
            });
        } catch (e) {
            return [];
        }
    }

    static getVideoStreams() {
        return StorageDB.getStreams();
    }

    static saveStreams(streams) {
        localStorage.setItem('video_portal_streams_db', JSON.stringify(streams));
    }

    static addVideoStream(streamData) {
        const streams = StorageDB.getStreams();
        streams.push({
            title: streamData.title,
            url: streamData.url,
            thumbnail: streamData.thumbnail || '',
            models: streamData.models || [],
            type: 'stream',
            createdAt: Date.now()
        });
        StorageDB.saveStreams(streams);
    }
}
