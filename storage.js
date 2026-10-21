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
            const scriptTag = document.getElementById('embedded-database') || document.getElementById('embedded-video-database');
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

    static async saveModels(models, immediate = false) {
        localStorage.setItem('video_portal_models_db', JSON.stringify(models));
        if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.triggerAutoSync === 'function') {
            await GitHubSync.triggerAutoSync(immediate).catch(err => console.error('GitHub auto-sync error:', err));
        }
    }

    static async addModel(modelData) {
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
        await StorageDB.saveModels(models, true);
    }

    static async deleteModel(modelName) {
        if (!modelName) return;
        const models = StorageDB.getModels();
        const filteredModels = models.filter(m => m.name.toLowerCase() !== modelName.toLowerCase());
        await StorageDB.saveModels(filteredModels, true);

        // Cascade delete associated video streams tagged with this model
        const streams = StorageDB.getStreams();
        const filteredStreams = streams.filter(s => {
            if (!s.models) return true;
            return !s.models.some(m => m.toLowerCase() === modelName.toLowerCase());
        });
        await StorageDB.saveStreams(filteredStreams, true);

        // Clean up associated folders if any exist in storage
        try {
            const folders = JSON.parse(localStorage.getItem('video_portal_folders_db')) || [];
            const filteredFolders = folders.filter(f => !(f.model && f.model.toLowerCase() === modelName.toLowerCase()));
            localStorage.setItem('video_portal_folders_db', JSON.stringify(filteredFolders));
        } catch (e) {}
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

    static async saveStreams(streams, immediate = false) {
        localStorage.setItem('video_portal_streams_db', JSON.stringify(streams));
        if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.triggerAutoSync === 'function') {
            await GitHubSync.triggerAutoSync(immediate).catch(err => console.error('GitHub auto-sync error:', err));
        }
    }

    static async addVideoStream(streamData) {
        const streams = StorageDB.getStreams();
        streams.push({
            title: streamData.title,
            url: streamData.url,
            thumbnail: streamData.thumbnail || '',
            models: streamData.models || [],
            type: 'stream',
            createdAt: Date.now()
        });
        await StorageDB.saveStreams(streams, true);
    }
}
