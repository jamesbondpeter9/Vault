const StorageDB = {
    STREAMS_KEY: 'video_portal_streams_db',
    MODELS_KEY: 'video_portal_models_db',
    FOLDERS_KEY: 'video_portal_folders_db',

    async initDB() {
        if (!localStorage.getItem(this.MODELS_KEY)) localStorage.setItem(this.MODELS_KEY, JSON.stringify([]));
        if (!localStorage.getItem(this.STREAMS_KEY)) localStorage.setItem(this.STREAMS_KEY, JSON.stringify([]));
        if (!localStorage.getItem(this.FOLDERS_KEY)) localStorage.setItem(this.FOLDERS_KEY, JSON.stringify([]));

        try {
            const response = await fetch('videos.json?' + new Date().getTime());
            if (response.ok) {
                const data = await response.json();
                const localModels = JSON.parse(localStorage.getItem(this.MODELS_KEY) || '[]');
                if (data.models && data.models.length > 0 && localModels.length === 0) {
                    localStorage.setItem(this.MODELS_KEY, JSON.stringify(data.models));
                }
                const localStreams = JSON.parse(localStorage.getItem(this.STREAMS_KEY) || '[]');
                if (data.streams && data.streams.length > 0 && localStreams.length === 0) {
                    localStorage.setItem(this.STREAMS_KEY, JSON.stringify(data.streams));
                }
            }
        } catch (e) {
            console.log('Running on local cache.');
        }
    },

    getStreams() {
        try { return JSON.parse(localStorage.getItem(this.STREAMS_KEY) || '[]'); } catch (e) { return []; }
    },
    saveStreams(streams) {
        localStorage.setItem(this.STREAMS_KEY, JSON.stringify(streams));
    },
    addStream(streamData) {
        const streams = this.getStreams();
        const newStream = {
            title: streamData.title || 'Untitled Stream',
            url: streamData.url || '',
            thumbnail: streamData.thumbnail || '',
            models: streamData.models || [],
            folder: streamData.folder || (streamData.folders && streamData.folders.length > 0 ? streamData.folders[0] : ''),
            folders: streamData.folders || (streamData.folder ? [streamData.folder] : []),
            type: streamData.type || 'stream',
            createdAt: Date.now()
        };
        streams.unshift(newStream);
        this.saveStreams(streams);
        return newStream;
    },

    getModels() {
        try { return JSON.parse(localStorage.getItem(this.MODELS_KEY) || '[]'); } catch (e) { return []; }
    },
    saveModels(models) {
        localStorage.setItem(this.MODELS_KEY, JSON.stringify(models));
    },
    addModel(name, thumbnail, shape = 'square') {
        const models = this.getModels();
        const newModel = { name: name.trim(), thumbnail: thumbnail.trim(), shape, createdAt: Date.now() };
        models.push(newModel);
        this.saveModels(models);
        return newModel;
    },

    getVideoStreams() {
        return this.getStreams().filter(item => item.type === 'stream' || !item.type || item.type === 'video');
    },

    getPhotoStreams() {
        return this.getStreams().filter(item => item.type === 'photo');
    },

    addVideoStream(streamData) {
        return this.addStream({ ...streamData, type: 'stream' });
    },

    addPhotoStream(streamData) {
        return this.addStream({ ...streamData, type: 'photo' });
    },

    getFolders(modelName = null) {
        try {
            const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY) || '[]');
            if (modelName) {
                return folders.filter(f => f.model === modelName);
            }
            return folders;
        } catch (e) {
            return [];
        }
    },

    saveFolder(folderObj) {
        try {
            const folders = this.getFolders();
            const exists = folders.some(f => f.name === folderObj.name && f.model === folderObj.model);
            if (!exists) {
                folders.push({
                    name: folderObj.name.trim(),
                    model: folderObj.model || '',
                    createdAt: Date.now()
                });
                localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
            }
        } catch (e) {
            console.error('Error saving folder:', e);
        }
    }
};
