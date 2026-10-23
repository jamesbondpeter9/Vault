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
            const currentStreams = StorageDB.getStreams();
            
            if (currentStreams.length === 0) {
                let remoteData = null;

                // 1. Try public static fetch first (Works instantly on phones & new sessions without needing a PAT)
                const pathsToTry = ['Media/videos.json', './videos.json', '../Media/videos.json'];
                for (const path of pathsToTry) {
                    try {
                        const res = await fetch(path);
                        if (res.ok) {
                            remoteData = await res.json();
                            break;
                        }
                    } catch (err) {
                        // Continue trying next path fallback
                    }
                }

                // 2. If public fetch didn't resolve, fallback to GitHub API if token exists
                if (!remoteData && typeof PortalConfig !== 'undefined') {
                    const token = PortalConfig.getToken();
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
                }

                // 3. Populate local database if data was successfully fetched
                if (remoteData && remoteData.streams && Array.isArray(remoteData.streams)) {
                    const videoStreams = remoteData.streams.filter(s => {
                        const t = (s.type || 'stream').toLowerCase();
                        return t === 'stream' || t === 'video';
                    });
                    localStorage.setItem('video_portal_streams_db', JSON.stringify(videoStreams));
                    console.log('Successfully bootstrapped streams from remote JSON!');
                }
            }
        } catch (e) {
            console.log('Could not fetch remote Media/videos.json during init:', e);
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

    static async deleteStream(identifier) {
        const streams = StorageDB.getStreams();
        let filteredStreams = [];

        if (typeof identifier === 'number') {
            filteredStreams = streams.filter((_, index) => index !== identifier);
        } else if (typeof identifier === 'object' && identifier !== null) {
            filteredStreams = streams.filter(s => !(s.url === identifier.url && s.title === identifier.title));
        } else {
            filteredStreams = streams;
        }

        return await StorageDB.saveStreams(filteredStreams, true);
    }
}
