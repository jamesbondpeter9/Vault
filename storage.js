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
            if (scriptTag && scriptTag.textContent) {
                let embeddedData = {};
                try {
                    embeddedData = typeof scriptTag.textContent === 'string' ? JSON.parse(scriptTag.textContent) : scriptTag.textContent;
                } catch (e) {
                    embeddedData = {};
                }
                
                const currentModels = StorageDB.getModels();
                if (currentModels.length === 0 && embeddedData && Array.isArray(embeddedData.models) && embeddedData.models.length > 0) {
                    localStorage.setItem('video_portal_models_db', JSON.stringify(embeddedData.models));
                }

                const currentStreams = StorageDB.getStreams();
                if (currentStreams.length === 0 && embeddedData && Array.isArray(embeddedData.streams) && embeddedData.streams.length > 0) {
                    const videoStreams = embeddedData.streams.filter(s => {
                        if (!s) return false;
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
            const raw = localStorage.getItem('video_portal_models_db');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static saveModels(models) {
        try {
            const validModels = Array.isArray(models) ? models : [];
            localStorage.setItem('video_portal_models_db', JSON.stringify(validModels));
            if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.triggerAutoSync === 'function') {
                GitHubSync.triggerAutoSync().catch(err => console.error('GitHub auto-sync error:', err));
            }
        } catch (e) {
            console.error('Error saving models to LocalStorage:', e);
        }
    }

    static addModel(modelData) {
        if (!modelData || !modelData.name) return;
        const models = StorageDB.getModels();
        const modelName = String(modelData.name).trim();
        const existingIndex = models.findIndex(m => m && m.name && m.name.toLowerCase() === modelName.toLowerCase());
        
        if (existingIndex >= 0) {
            models[existingIndex].thumbnail = modelData.thumbnail || models[existingIndex].thumbnail || '';
            models[existingIndex].shape = modelData.shape || models[existingIndex].shape || 'portrait';
        } else {
            models.push({
                name: modelName,
                thumbnail: modelData.thumbnail || '',
                shape: modelData.shape || 'portrait',
                createdAt: modelData.createdAt || Date.now()
            });
        }
        StorageDB.saveModels(models);
    }

    static deleteModel(modelName) {
        if (!modelName) return;
        const targetName = String(modelName).trim().toLowerCase();
        const models = StorageDB.getModels();
        const filteredModels = models.filter(m => m && m.name && m.name.toLowerCase() !== targetName);
        StorageDB.saveModels(filteredModels);

        // Cascade delete associated video streams tagged with this model
        const streams = StorageDB.getStreams();
        const filteredStreams = streams.filter(s => {
            if (!s || !s.models || !Array.isArray(s.models)) return true;
            return !s.models.some(m => String(m).toLowerCase() === targetName);
        });
        StorageDB.saveStreams(filteredStreams);

        // Clean up associated folders if any exist in storage
        try {
            const rawFolders = localStorage.getItem('video_portal_folders_db');
            const folders = rawFolders ? JSON.parse(rawFolders) : [];
            if (Array.isArray(folders)) {
                const filteredFolders = folders.filter(f => !(f && f.model && String(f.model).toLowerCase() === targetName));
                localStorage.setItem('video_portal_folders_db', JSON.stringify(filteredFolders));
            }
        } catch (e) {
            console.error('Error cleaning up folders on model delete:', e);
        }
    }

    static getStreams() {
        try {
            const raw = localStorage.getItem('video_portal_streams_db');
            const streams = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(streams)) return [];
            return streams.filter(s => {
                if (!s) return false;
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
        try {
            const validStreams = Array.isArray(streams) ? streams : [];
            localStorage.setItem('video_portal_streams_db', JSON.stringify(validStreams));
            if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.triggerAutoSync === 'function') {
                GitHubSync.triggerAutoSync().catch(err => console.error('GitHub auto-sync error:', err));
            }
        } catch (e) {
            console.error('Error saving streams to LocalStorage:', e);
        }
    }

    static addVideoStream(streamData) {
        if (!streamData) return;
        const streams = StorageDB.getStreams();
        streams.push({
            title: streamData.title || 'Untitled Stream',
            url: streamData.url || '',
            thumbnail: streamData.thumbnail || '',
            models: Array.isArray(streamData.models) ? streamData.models : [],
            type: 'stream',
            createdAt: streamData.createdAt || Date.now()
        });
        StorageDB.saveStreams(streams);
    }
}
