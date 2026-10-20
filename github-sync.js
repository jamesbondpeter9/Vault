class GitHubSync {
    static debounceTimer = null;

    static async triggerAutoSync() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
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
        
        // Page identity checks
        const isModelPage = path.includes('model');
        const isImagePage = path.includes('image') || 
                            path.includes('photo') || 
                            path.includes('album') || 
                            path.includes('folder') ||
                            path.includes('view');

        const isVideoPage = path.includes('video') || 
                            path.includes('stream') || 
                            path.includes('watch') || 
                            path.includes('vault') || 
                            path.includes('tag');

        // 1. Determine target JSON filename precisely based on active page
        let jsonFilename = 'videos.json';
        if (isModelPage) {
            jsonFilename = 'models.json';
        } else if (isImagePage) {
            jsonFilename = 'images.json';
        } else if (isVideoPage) {
            jsonFilename = 'videos.json';
        }

        // 2. Gather live data directly from active storage with specific payload boundaries
        let dbData = {};

        if (isModelPage && typeof ModelStorage !== 'undefined') {
            dbData = {
                models: typeof ModelStorage.getModels === 'function' ? await ModelStorage.getModels() || [] : []
            };
        } else if (isImagePage && typeof ImageStorageDB !== 'undefined') {
            // images.json now strictly stores ONLY photostreams and folders metadata
            dbData = {
                photostreams: typeof ImageStorageDB.getPhotoStreams === 'function' ? await ImageStorageDB.getPhotoStreams() || [] : [],
                folders: typeof ImageStorageDB.getFolders === 'function' ? await ImageStorageDB.getFolders() || [] : []
            };
        } else if (isVideoPage && typeof StorageDB !== 'undefined') {
            dbData = {
                models: typeof StorageDB.getModels === 'function' ? await StorageDB.getModels() || [] : [],
                streams: typeof StorageDB.getStreams === 'function' ? await StorageDB.getStreams() || [] : []
            };
        } else {
            dbData = { models: [], photostreams: [], folders: [], streams: [] };
        }

        // Safety Guard: If local data is completely empty, fetch remote JSON to prevent accidental data wipes
        const hasLocalData = Object.values(dbData).some(arr => Array.isArray(arr) && arr.length > 0);
        if (!hasLocalData) {
            try {
                const remoteData = await this.fetchRemoteJSON(owner, repo, jsonFilename, token);
                if (remoteData) {
                    const remoteHasData = Object.values(remoteData).some(arr => Array.isArray(arr) && arr.length > 0);
                    if (remoteHasData) {
                        console.warn('Local storage returned empty data, preserving existing remote database integrity.');
                        dbData = remoteData;
                    }
                }
            } catch (e) {
                console.warn('Could not verify remote JSON fallback:', e);
            }
        }

        // 3. Update the embedded script tag in DOM safely matching available IDs
        const scriptTag = document.getElementById('embedded-database') || 
                          document.getElementById('embedded-video-database') || 
                          document.getElementById('embedded-images-database') ||
                          document.getElementById('embedded-models-database');
        if (scriptTag) {
            scriptTag.textContent = JSON.stringify(dbData, null, 2);
        }

        // 4. Sync Current HTML File (Only if the current path is a real file tracked in repo)
        if (path && path.endsWith('.html')) {
            const updatedHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
            await this.pushToGitHub(owner, repo, branch, token, path, updatedHTML, `Auto-sync: Updated ${path} via portal`);
        }

        // 5. Dual-Sync Corresponding JSON File with precise payload data
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
