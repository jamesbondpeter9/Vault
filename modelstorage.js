class ModelStorage {
    static async initDB() {
        if (!localStorage.getItem('video_portal_models_db')) {
            localStorage.setItem('video_portal_models_db', JSON.stringify([]));
        }
        await ModelStorage.syncFromEmbeddedJSON();
    }

    static async syncFromEmbeddedJSON() {
        try {
            const scriptTag = document.getElementById('embedded-models-database') || document.getElementById('embedded-database');
            if (scriptTag && scriptTag.textContent) {
                let embeddedData = {};
                try {
                    embeddedData = typeof scriptTag.textContent === 'string' ? JSON.parse(scriptTag.textContent) : scriptTag.textContent;
                } catch (e) {
                    embeddedData = {};
                }

                const currentModels = ModelStorage.getModels();
                const sourceModels = Array.isArray(embeddedData) ? embeddedData : (embeddedData.models || []);

                if (currentModels.length === 0 && sourceModels.length > 0) {
                    localStorage.setItem('video_portal_models_db', JSON.stringify(sourceModels));
                }
            }
        } catch (e) {
            console.log('No embedded models database found or failed to parse.');
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
            
            // Trigger automatic GitHub synchronization / models.json update
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
                name: modelName,
                thumbnail: modelData.thumbnail || '',
                shape: modelData.shape || 'portrait',
                createdAt: modelData.createdAt || Date.now()
            });
        }
        ModelStorage.saveModels(models);
    }

    static deleteModel(modelName) {
        if (!modelName) return;
        const targetName = String(modelName).trim().toLowerCase();
        const models = ModelStorage.getModels();
        const filteredModels = models.filter(m => m && m.name && m.name.toLowerCase() !== targetName);
        ModelStorage.saveModels(filteredModels);
    }
}
