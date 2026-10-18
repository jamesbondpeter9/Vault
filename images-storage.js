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
    },

    getFolders() {
        try {
            return JSON.parse(localStorage.getItem('image_portal_folders_db')) || [];
        } catch (e) { return []; }
    },

    saveFolders(folders) {
        localStorage.setItem('image_portal_folders_db', JSON.stringify(folders));
    },

    getPhotoStreams() {
        try {
            return JSON.parse(localStorage.getItem('image_portal_streams_db')) || [];
        } catch (e) { return []; }
    },

    savePhotoStreams(streams) {
        localStorage.setItem('image_portal_streams_db', JSON.stringify(streams));
    },

    addPhotoStream(photo) {
        const streams = this.getPhotoStreams();
        streams.push(photo);
        this.savePhotoStreams(streams);
    }
};
