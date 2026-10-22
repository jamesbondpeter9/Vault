class ModelStorageDB {
    static async initDB() {
        if (!localStorage.getItem('video_portal_models_db')) {
            localStorage.setItem('video_portal_models_db', JSON.stringify([]));
        }
        await ModelStorageDB.syncFromRemoteJSON();
    }

    static async syncFromRemoteJSON() {
        try {
            const currentModels = ModelStorageDB.getModels();
            
            if (currentModels.length === 0 && typeof PortalConfig !== 'undefined') {
                const token = PortalConfig.getToken();
                if (token) {
                    const apiUrl = `https://api.github.com/repos/${PortalConfig.owner}/${PortalConfig.repo}/contents/Model/Models.json`;
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
                        console.log('Successfully bootstrapped models from Model/Models.json!');
                    }
                }
            }
        } catch (e) {
            console.log('Could not fetch remote Model/Models.json during init:', e);
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
}
