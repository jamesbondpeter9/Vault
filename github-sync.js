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
                await this._executeSync();
                resolve();
            }, 2000);
        });
    }

    static async _executeSync() {
        if (typeof PortalConfig === 'undefined') {
            console.warn('PortalConfig is not defined. Skipping auto-sync.');
            return;
        }

        const token = PortalConfig.getToken();
        if (!token) {
            console.warn('GitHub PAT token not found. Skipping auto-sync.');
            return;
        }

        const owner = PortalConfig.owner;
        const repo = PortalConfig.repo;
        const branch = PortalConfig.branch;

        const path = window.location.pathname.split('/').pop() || 'index.html';
        
        const isImagePage = path.includes('image') || 
                            path.includes('photo') || 
                            path.includes('album') || 
                            path.includes('folder');

        const isVideoPage = path.includes('video') || 
                            path.includes('stream') || 
                            path.includes('watch') || 
                            path.includes('vault') || 
                            path.includes('tag') ||
                            path.includes('index');

        // 1. Determine target JSON filename
        let jsonFilename = 'videos.json';
        if (isImagePage) {
            jsonFilename = 'images.json';
        } else if (isVideoPage) {
            jsonFilename = 'videos.json';
        }

        // 2. Gather live data directly from active storage
        let dbData = { models: [], photostreams: [], folders: [], streams: [] };

        if (isImagePage && typeof ImageStorageDB !== 'undefined') {
            dbData.models = typeof ImageStorageDB.getModels === 'function' ? await ImageStorageDB.getModels() || [] : [];
            dbData.photostreams = typeof ImageStorageDB.getPhotoStreams === 'function' ? await ImageStorageDB.getPhotoStreams() || [] : [];
            dbData.folders = typeof ImageStorageDB.getFolders === 'function' ? await ImageStorageDB.getFolders() || [] : [];
        } else if (isVideoPage && typeof StorageDB !== 'undefined') {
            dbData.models = typeof StorageDB.getModels === 'function' ? await StorageDB.getModels() || [] : [];
            dbData.streams = typeof StorageDB.getStreams === 'function' ? await StorageDB.getStreams() || [] : [];
        }

        // Safety Guard: If local data is completely empty, fetch remote JSON to prevent accidental data wipes
        const hasLocalData = dbData.models.length > 0 || dbData.photostreams.length > 0 || dbData.folders.length > 0 || dbData.streams.length > 0;
        if (!hasLocalData) {
            try {
                const remoteData = await this.fetchRemoteJSON(owner, repo, jsonFilename, token);
                if (remoteData) {
                    const remoteHasData = (remoteData.models && remoteData.models.length > 0) || 
                                          (remoteData.photostreams && remoteData.photostreams.length > 0) || 
                                          (remoteData.folders && remoteData.folders.length > 0) || 
                                          (remoteData.streams && remoteData.streams.length > 0);
                    if (remoteHasData) {
                        console.warn('Local storage returned empty data, preserving existing remote database integrity.');
                        dbData = remoteData;
                    }
                }
            } catch (e) {
                console.warn('Could not verify remote JSON fallback:', e);
            }
        }

        // 3. Sync Current HTML File
        const updatedHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        await this.pushToGitHub(owner, repo, branch, token, path, updatedHTML, `Auto-sync: Updated ${path} via portal`);

        // 4. Sync Corresponding JSON File with complete data payload
        const jsonContent = JSON.stringify(dbData, null, 4);
        await this.pushToGitHub(owner, repo, branch, token, jsonFilename, jsonContent, `Auto-sync: Updated ${jsonFilename} via portal`);
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
                console.log(`Successfully synced ${filePath} to GitHub repository!`);
            } else {
                const errData = await putRes.json();
                console.error(`GitHub API commit error for ${filePath}:`, errData.message);
            }
        } catch (err) {
            console.error(`GitHub Sync Exception for ${filePath}:`, err);
        }
    }
}
