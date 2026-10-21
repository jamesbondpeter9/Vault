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
        await StorageDB.syncFromRemoteJSON();
    }

    static async syncFromRemoteJSON() {
        try {
            const currentModels = StorageDB.getModels();
            const currentStreams = StorageDB.getStreams();
            
            if (currentModels.length === 0 && currentStreams.length === 0 && typeof PortalConfig !== 'undefined') {
                const token = PortalConfig.getToken();
                if (token) {
                    const apiUrl = `https://api.github.com/repos/${PortalConfig.owner}/${PortalConfig.repo}/contents/videos.json`;
                    const res = await fetch(apiUrl, {
                        headers: { 'Authorization': `token ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const decodedString = decodeURIComponent(escape(atob(data.content)));
                        const remoteData = JSON.parse(decodedString);

                        if (remoteData.models && Array.isArray(remoteData.models)) {
                            localStorage.setItem('video_portal_models_db', JSON.stringify(remoteData.models));
                        }
                        if (remoteData.streams && Array.isArray(remoteData.streams)) {
                            const videoStreams = remoteData.streams.filter(s => {
                                const t = (s.type || 'stream').toLowerCase();
                                return t === 'stream' || t === 'video';
                            });
                            localStorage.setItem('video_portal_streams_db', JSON.stringify(videoStreams));
                        }
                        console.log('Successfully bootstrapped storage from remote videos.json!');
                    }
                }
            }
        } catch (e) {
            console.log('Could not fetch remote videos.json during init:', e);
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
