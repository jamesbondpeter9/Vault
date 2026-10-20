class ModelStorageDB {
    constructor() {
        this.dbName = "PortalModelsDB";
        this.storeName = "models";
        this.db = null;
        this.initPromise = null;
    }

    async initDB() {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => {
                this.initPromise = null;
                reject(request.error);
            };
            request.onsuccess = () => {
                this.db = request.result;
                this.initPromise = null;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
                }
            };
        });
        return this.initPromise;
    }

    async getModels() {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async saveModel(modelData) {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(modelData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteModel(id) {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

window.ModelStorage = new ModelStorageDB();
