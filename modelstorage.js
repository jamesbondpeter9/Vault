class ModelStorage {
    static async initDB() {
        if (!localStorage.getItem('video_portal_models_db')) {
            localStorage.setItem('video_portal_models_db', JSON.stringify([]));
        }
        await ModelStorage.syncFromRemoteJSON();
    }

    static async syncFromRemoteJSON() {
        try {
            const currentModels = ModelStorage.getModels();
            if (currentModels.length === 0) {
                const remoteModels = await ModelStorage.fetchModelsJson();
                if (remoteModels.length > 0) {
                    localStorage.setItem('video_portal_models_db', JSON.stringify(remoteModels));
                }
            }
        } catch (e) {
            console.log('Failed to sync models from remote models.json.');
        }
    }

    static async fetchModelsJson() {
        try {
            const res = await fetch('./models.json?' + Date.now());
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data.models || []);
        } catch (e) {
            return [];
        }
    }

    static getModels() {
        try {
            const raw = localStorage.getItem('video_portal_models_db');
            let models = raw ? JSON.parse(raw) : [];
            
            if (!Array.isArray(models)) {
                models = [];
            }
            return models;
        } catch (e) {
            return [];
        }
    }

    static saveModels(models) {
        try {
            const validModels = Array.isArray(models) ? models : [];
            localStorage.setItem('video_portal_models_db', JSON.stringify(validModels));
            
            // GitHubSync bridge to write/remove changes in models.json
            if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.triggerAutoSync === 'function') {
                GitHubSync.triggerAutoSync().catch(err => console.error('GitHub auto-sync error for models:', err));
            }
        } catch (e) {
            console.error('Error saving models to LocalStorage:', e);
        }
    }

    static addModel(modelData) {
        if (!modelData || !modelData.name) return;
        const models = ModelStorage.getModels();
        const modelName = String(modelData.name).trim();
        const existingIndex = models.findIndex(m => m && m.name && m.name.toLowerCase() === modelName.toLowerCase());
        
        if (existingIndex >= 0) {
            models[existingIndex].thumbnail = modelData.thumbnail || models[existingIndex].thumbnail || '';
            models[existingIndex].shape = modelData.shape || models[existingIndex].shape || 'portrait';
        } else {
            models.push({
                id: modelData.id || ('m_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
                name: modelName,
                thumbnail: modelData.thumbnail || '',
                shape: modelData.shape || 'portrait',
                createdAt: modelData.createdAt || Date.now()
            });
        }
        ModelStorage.saveModels(models);
    }

    static deleteModel(modelNameOrKey) {
        if (!modelNameOrKey) return;
        const target = String(modelNameOrKey).trim().toLowerCase();
        const models = ModelStorage.getModels();
        const filteredModels = models.filter(m => {
            if (!m) return false;
            const mId = String(m.id || '').toLowerCase();
            const mName = String(m.name || '').toLowerCase();
            return mId !== target && mName !== target;
        });
        ModelStorage.saveModels(filteredModels);
    }
}
