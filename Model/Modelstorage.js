class ModelStorageDB {
    static async initDB() {
        if (!localStorage.getItem('video_portal_models_db')) {
            localStorage.setItem('video_portal_models_db', JSON.stringify([]));
        }
        await ModelStorageDB.syncFromRemoteJSON();
    }

    static async syncFromRemoteJSON() {
        try {
            let remoteData = null;
            const cacheBuster = `?t=${Date.now()}`;

            // 1. Try public static fetch first with cache-busting
            const pathsToTry = [
                `Models.json${cacheBuster}`,
                `Model/Models.json${cacheBuster}`,
                `./Models.json${cacheBuster}`,
                `../Model/Models.json${cacheBuster}`
            ];

            for (const path of pathsToTry) {
                try {
                    const res = await fetch(path, { cache: 'no-store' });
                    if (res.ok) {
                        const json = await res.json();
                        if (json) {
                            remoteData = json;
                            break;
                        }
                    }
                } catch (err) {
                    // Try next path fallback
                }
            }

            // 2. Fallback to GitHub API if token exists and public fetch returned nothing
            if (!remoteData && typeof PortalConfig !== 'undefined') {
                const token = PortalConfig.getToken();
                if (token) {
                    const apiUrl = `https://api.github.com/repos/${PortalConfig.owner}/${PortalConfig.repo}/contents/Model/Models.json`;
                    const res = await fetch(apiUrl, {
                        headers: { 'Authorization': `token ${token}` },
                        cache: 'no-store'
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const decodedString = decodeURIComponent(escape(atob(data.content)));
                        remoteData = JSON.parse(decodedString);
                    }
                }
            }

            // 3. Normalize and sync into localStorage (Handles both Array and {models: [...]} formats)
            let modelsArray = [];
            if (Array.isArray(remoteData)) {
                modelsArray = remoteData;
            } else if (remoteData && Array.isArray(remoteData.models)) {
                modelsArray = remoteData.models;
            }

            if (modelsArray.length > 0) {
                localStorage.setItem('video_portal_models_db', JSON.stringify(modelsArray));
                console.log('Successfully synchronized models from remote source!');
            }
        } catch (e) {
            console.warn('Could not fetch remote Model/Models.json during init:', e);
        }
    }

    static getModels() {
        try {
            const data = JSON.parse(localStorage.getItem('video_portal_models_db'));
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.models)) return data.models;
            return [];
        } catch (e) {
            return [];
        }
    }

    static saveModels(models) {
        localStorage.setItem('video_portal_models_db', JSON.stringify(models));
    }

    static async saveAndSyncModels(models, immediate = false) {
        localStorage.setItem('video_portal_models_db', JSON.stringify(models));
        if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.triggerAutoSync === 'function') {
            return await GitHubSync.triggerAutoSync(immediate).catch(err => {
                console.error('GitHub auto-sync error for models:', err);
                return false;
            });
        }
        return true;
    }

    static async addModel(modelData) {
        const models = ModelStorageDB.getModels();
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
        return await ModelStorageDB.saveAndSyncModels(models, true);
    }

    static async deleteModel(modelName) {
        if (!modelName) return false;
        const models = ModelStorageDB.getModels();
        const filteredModels = models.filter(m => m.name.toLowerCase() !== modelName.toLowerCase());
        return await ModelStorageDB.saveAndSyncModels(filteredModels, true);
    }
}
