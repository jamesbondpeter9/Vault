const ImageStorageDB = {
    initDB() {
        if (!localStorage.getItem('image_portal_models_db')) {
            localStorage.setItem('image_portal_models_db', JSON.stringify([]));
        }
        if (!localStorage.getItem('image_portal_folders_db')) {
            localStorage.setItem('image_portal_folders_db', JSON.stringify([]));
        }
        if (!localStorage.getItem('image_portal_streams_db')) {
            localStorage.setItem('image_portal_streams_db', JSON.stringify([]));
        }
    },

    getModels() {
        try {
            return JSON.parse(localStorage.getItem('image_portal_models_db')) || [];
        } catch (e) { return []; }
    },

    saveModels(models) {
        localStorage.setItem('image_portal_models_db', JSON.stringify(models));
        this.triggerAsyncSyncIfNeeded();
    },

    getFolders() {
        try {
            return JSON.parse(localStorage.getItem('image_portal_folders_db')) || [];
        } catch (e) { return []; }
    },

    saveFolders(folders) {
        localStorage.setItem('image_portal_folders_db', JSON.stringify(folders));
        this.triggerAsyncSyncIfNeeded();
    },

    getPhotoStreams() {
        try {
            return JSON.parse(localStorage.getItem('image_portal_streams_db')) || [];
        } catch (e) { return []; }
    },

    savePhotoStreams(streams) {
        localStorage.setItem('image_portal_streams_db', JSON.stringify(streams));
        this.triggerAsyncSyncIfNeeded();
    },

    addPhotoStream(photo) {
        const streams = this.getPhotoStreams();
        streams.push(photo);
        this.savePhotoStreams(streams);
    },

    triggerAsyncSyncIfNeeded() {
        if (typeof GitHubSync !== 'undefined' && typeof GitHubSync.triggerAutoSync === 'function') {
            GitHubSync.triggerAutoSync().catch(err => {
                console.error('Background GitHub auto-sync error:', err);
            });
        }
    }
};
