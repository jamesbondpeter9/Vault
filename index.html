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
            if (typeof PortalConfig !== 'undefined') {
                const token = PortalConfig.getToken();
                let remoteData = null;

                // 1. Try authenticated fetch if token exists
                if (token) {
                    const apiUrl = `https://api.github.com/repos/${PortalConfig.owner}/${PortalConfig.repo}/contents/Media/videos.json`;
                    const res = await fetch(apiUrl, {
                        headers: { 'Authorization': `token ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const decodedString = decodeURIComponent(escape(atob(data.content)));
                        remoteData = JSON.parse(decodedString);
                    }
                }

                // 2. Fallback to public raw GitHub fetch if token is missing or authenticated fetch failed
                if (!remoteData) {
                    const rawUrl = `https://raw.githubusercontent.com/${PortalConfig.owner}/${PortalConfig.repo}/${PortalConfig.branch}/Media/videos.json`;
                    const rawRes = await fetch(rawUrl);
                    if (rawRes.ok) {
                        remoteData = await rawRes.json();
                    }
                }

                // 3. Process and apply streams if retrieved successfully
                if (remoteData) {
                    const rawList = Array.isArray(remoteData) ? remoteData : (remoteData.streams || []);
                    if (Array.isArray(rawList)) {
                        const videoStreams = rawList.filter(s => {
                            const t = (s.type || 'stream').toLowerCase();
                            return t === 'stream' || t === 'video';
                        });
                        localStorage.setItem('video_portal_streams_db', JSON.stringify(videoStreams));
                        console.log('Successfully synced streams from Media/videos.json!');
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

    static deleteModel(modelName) {
        if (!modelName) return;
        const models = StorageDB.getModels();
        const filteredModels = models.filter(m => m.name.toLowerCase() !== modelName.toLowerCase());
        StorageDB.saveModels(filteredModels);

        const streams = StorageDB.getStreams();
        streams.forEach(s => {
            if (s.models) {
                s.models = s.models.filter(m => m.toLowerCase() !== modelName.toLowerCase());
            }
        });
        StorageDB.saveStreams(streams, true);
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
            return await GitHubSync.triggerAutoSync(immediate).catch(err => {
                console.error('GitHub auto-sync error:', err);
                return false;
            });
        }
        return true;
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
        return await StorageDB.saveStreams(streams, true);
    }

    static async deleteVideoStream(index) {
        let streams = StorageDB.getStreams();
        if (index >= 0 && index < streams.length) {
            streams.splice(index, 1);
            return await StorageDB.saveStreams(streams, true);
        }
        return false;
    }
}
