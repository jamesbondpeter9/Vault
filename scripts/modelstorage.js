class ModelStorage {
    static async initDB() {
        let models = ModelStorage.getModels();
        
        if (models.length === 0) {
            const scriptTag = document.getElementById('embedded-models-database') || document.getElementById('embedded-database');
            if (scriptTag && scriptTag.textContent.trim()) {
                try {
                    const parsed = JSON.parse(scriptTag.textContent);
                    models = Array.isArray(parsed) ? parsed : (parsed.models || []);
                } catch (e) {}
            }
        }

        if (models.length === 0) {
            models = await ModelStorage.fetchModelsJson();
        }

        if (models.length > 0) {
            localStorage.setItem('video_portal_models_db', JSON.stringify(models));
        } else if (!localStorage.getItem('video_portal_models_db')) {
            localStorage.setItem('video_portal_models_db', JSON.stringify([]));
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
            const models = raw ? JSON.parse(raw) : [];
            return Array.isArray(models) ? models : [];
        } catch (e) {
            return [];
        }
    }

    static saveModels(models) {
        try {
            const validModels = Array.isArray(models) ? models : [];
            localStorage.setItem('video_portal_models_db', JSON.stringify(validModels));
            
            const scriptTag = document.getElementById('embedded-models-database') || document.getElementById('embedded-database');
            if (scriptTag) {
                scriptTag.textContent = JSON.stringify({ models: validModels }, null, 2);
            }

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
