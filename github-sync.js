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

        // Directly point to vault/Media/videos.json relative to repository root
        const jsonFilePath = 'vault/Media/videos.json';

        let dbData = { streams: [] };
        if (typeof StorageDB !== 'undefined') {
            dbData.streams = typeof StorageDB.getStreams === 'function' ? await StorageDB.getStreams() || [] : [];
        }

        // Safety fallback if local storage is empty
        const hasLocalStreams = dbData.streams.length > 0;
        if (!hasLocalStreams) {
            try {
                const remoteData = await this.fetchRemoteJSON(owner, repo, jsonFilePath, token);
                if (remoteData && remoteData.streams && remoteData.streams.length > 0) {
                    dbData.streams = remoteData.streams;
                }
            } catch (e) {
                console.warn('Could not verify remote JSON fallback:', e);
            }
        }

        // Sync videos.json payload
        const jsonContent = JSON.stringify(dbData, null, 4);
        const jsonSynced = await this.pushToGitHub(owner, repo, branch, token, jsonFilePath, jsonContent, `Stream sync: Updated ${jsonFilePath} via portal`);

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
