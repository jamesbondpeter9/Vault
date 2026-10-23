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
            let remoteData = null;
            let fetchedFromServer = false;
            const cacheBuster = `?t=${Date.now()}`;

            // Dynamically detect location to pick correct path without ever causing 404 or Media/Media/ duplication
            const isInsideMedia = window.location.pathname.includes('/Media/');
            const pathsToTry = isInsideMedia ? [
                `./videos.json${cacheBuster}`,
                `videos.json${cacheBuster}`,
                `/Vault/Media/videos.json${cacheBuster}`
            ] : [
                `Media/videos.json${cacheBuster}`,
                `./Media/videos.json${cacheBuster}`,
                `/Vault/Media/videos.json${cacheBuster}`
            ];

            for (const path of pathsToTry) {
                try {
                    const res = await fetch(path, { cache: 'no-store' });
                    if (res.ok) {
                        fetchedFromServer = true;
                        const json = await res.json();
                        if (json && json.streams && json.streams.length > 0) {
                            remoteData = json;
                            break;
                        } else if (!remoteData) {
                            remoteData = json;
                        }
                    } else if (res.status === 404) {
                        fetchedFromServer = true;
                        remoteData = { streams: [] };
                        break;
                    }
                } catch (err) {}
            }

            if ((!remoteData || !remoteData.streams || remoteData.streams.length === 0) && !fetchedFromServer && typeof PortalConfig !== 'undefined') {
                const token = PortalConfig.getToken();
                if (token) {
                    const apiUrl = `https://api.github.com/repos/${PortalConfig.owner}/${PortalConfig.repo}/contents/Media/videos.json${cacheBuster}`;
                    const res = await fetch(apiUrl, {
                        headers: { 'Authorization': `token ${token}` },
                        cache: 'no-store'
                    });
                    if (res.ok) {
                        fetchedFromServer = true;
                        const data = await res.json();
                        const decodedString = decodeURIComponent(escape(atob(data.content)));
                        remoteData = JSON.parse(decodedString);
                    } else if (res.status === 404) {
                        fetchedFromServer = true;
                        remoteData = { streams: [] };
                    }
                }
            }

            if (remoteData && remoteData.streams && Array.isArray(remoteData.streams)) {
                const videoStreams = remoteData.streams.filter(s => {
                    const t = (s.type || 'stream').toLowerCase();
                    return t === 'stream' || t === 'video';
                });
                
                const localCurrent = JSON.parse(localStorage.getItem('video_portal_streams_db') || '[]');
                if (fetchedFromServer || localCurrent.length === 0) {
                    localStorage.setItem('video_portal_streams_db', JSON.stringify(videoStreams));
                    console.log('Successfully synchronized streams from remote source!');
                }
            }
        } catch (e) {
            console.warn('Could not sync remote videos.json during init:', e);
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
