class GitHubSync {
    static debounceTimer = null;

    static async triggerAutoSync(immediate = false) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        if (immediate) {
            return await this._executeSync();
        }

        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(async () => {
                const success = await this._executeSync();
                resolve(success);
            }, 2000);
        });
    }

    static async _executeSync() {
        if (typeof PortalConfig === 'undefined') {
            console.warn('PortalConfig is not defined. Skipping auto-sync.');
            return false;
        }

        const token = PortalConfig.getToken();
        if (!token) {
            console.warn('GitHub PAT token not found in localStorage. Please run setGitHubToken("your_token").');
            return false;
        }

        const owner = PortalConfig.owner;
        const repo = PortalConfig.repo;
        const branch = PortalConfig.branch;

        const pathname = window.location.pathname.toLowerCase();
        
        let jsonFilename = 'Media/videos.json';
        let dbData = {};

        // ==========================================
        // SECTION 1: MODEL SECTION (Model/)
        // ==========================================
        if (pathname.includes('/model/') || pathname.includes('models.html') || pathname.includes('vault.html') || pathname.includes('model')) {
            jsonFilename = 'Model/Models.json';
            dbData = { models: [] };
            // Check both ModelStorageDB and StorageDB fallback since Model/storage.js defines ModelStorageDB
            if (typeof ModelStorageDB !== 'undefined') {
                dbData.models = typeof ModelStorageDB.getModels === 'function' ? await ModelStorageDB.getModels() || [] : [];
            } else if (typeof StorageDB !== 'undefined' && typeof StorageDB.getModels === 'function') {
                dbData.models = await StorageDB.getModels() || [];
            }
        } 
        // ==========================================
        // SECTION 2: IMAGE SECTION (Image/)
        // ==========================================
        else if (pathname.includes('/image/') || pathname.includes('photostream') || pathname.includes('album') || pathname.includes('view.html')) {
            jsonFilename = 'Image/images.json';
            dbData = { models: [], photostreams: [], folders: [] };
            if (typeof ImageStorageDB !== 'undefined') {
                dbData.models = typeof ImageStorageDB.getModels === 'function' ? await ImageStorageDB.getModels() || [] : [];
                dbData.photostreams = typeof ImageStorageDB.getPhotoStreams === 'function' ? await ImageStorageDB.getPhotoStreams() || [] : [];
                dbData.folders = typeof ImageStorageDB.getFolders === 'function' ? await ImageStorageDB.getFolders() || [] : [];
            }
        } 
        // ==========================================
        // SECTION 3: MEDIA SECTION (Media/)
        // ==========================================
        else {
            jsonFilename = 'Media/videos.json';
            dbData = { streams: [] };
            if (typeof StorageDB !== 'undefined') {
                dbData.streams = typeof StorageDB.getStreams === 'function' ? await StorageDB.getStreams() || [] : [];
            }
        }

        // Validate local data presence using Array check so deletions (even resulting in []) sync properly
        const hasLocalData = Array.isArray(dbData.streams) || 
                             Array.isArray(dbData.models) || 
                             Array.isArray(dbData.photostreams) || 
                             Array.isArray(dbData.folders);
                           
        if (!hasLocalData) {
            try {
                const remoteData = await this.fetchRemoteJSON(owner, repo, jsonFilename, token);
                if (remoteData) {
                    dbData = remoteData;
                }
            } catch (e) {
                console.warn('Could not verify remote JSON fallback:', e);
            }
        }

        const jsonContent = JSON.stringify(dbData, null, 4);
        const jsonSynced = await this.pushToGitHub(owner, repo, branch, token, jsonFilename, jsonContent, `Sync: Updated ${jsonFilename} via portal`);

        return jsonSynced;
    }

    static async fetchRemoteJSON(owner, repo, filePath, token) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const res = await fetch(apiUrl, {
            headers: { 'Authorization': `token ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        const decodedString = decodeURIComponent(escape(atob(data.content)));
        return JSON.parse(decodedString);
    }

    static async pushToGitHub(owner, repo, branch, token, filePath, fileContent, commitMessage) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

        try {
            let sha = null;
            const getRes = await fetch(apiUrl, {
                headers: { 'Authorization': `token ${token}` }
            });
            
            if (getRes.ok) {
                const getData = await getRes.json();
                sha = getData.sha;
            }

            const base64Content = btoa(unescape(encodeURIComponent(fileContent)));

            const putRes = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: base64Content,
                    sha: sha,
                    branch: branch
                })
            });

            if (putRes.ok) {
                console.log(`Successfully synced ${filePath} to GitHub!`);
                return true;
            } else {
                const errData = await putRes.json();
                console.error(`GitHub API commit error for ${filePath}:`, errData.message);
                return false;
            }
        } catch (err) {
            console.error(`GitHub Sync Exception for ${filePath}:`, err);
            return false;
        }
    }
}
