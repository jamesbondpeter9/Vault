class GitHubSync {
    static async triggerAutoSync() {
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

        // 1. Update embedded database script tag in DOM
        const scriptTag = document.getElementById('embedded-database') || 
                          document.getElementById('embedded-video-database') || 
                          document.getElementById('embedded-images-database');
        
        let extractedDbData = null;

        // Detect correct storage engine (ImageStorageDB for images, StorageDB for videos)
        const activeStorage = (path.includes('image') || path.includes('photo')) 
            ? (typeof ImageStorageDB !== 'undefined' ? ImageStorageDB : null)
            : (typeof StorageDB !== 'undefined' ? StorageDB : null);

        if (scriptTag) {
            try {
                const dbData = JSON.parse(scriptTag.textContent);
                if (activeStorage) {
                    if (path.includes('image') || path.includes('photo')) {
                        dbData.models = activeStorage.getModels ? activeStorage.getModels() : (dbData.models || []);
                        dbData.photostreams = activeStorage.getPhotoStreams ? activeStorage.getPhotoStreams() : (dbData.photostreams || []);
                        dbData.folders = activeStorage.getFolders ? activeStorage.getFolders() : (dbData.folders || []);
                    } else {
                        dbData.models = activeStorage.getModels ? activeStorage.getModels() : (dbData.models || []);
                        dbData.streams = activeStorage.getStreams ? activeStorage.getStreams() : (dbData.streams || []);
                    }
                }
                scriptTag.textContent = JSON.stringify(dbData, null, 2);
                extractedDbData = dbData;
            } catch (e) {
                console.error('Failed to update embedded database before sync:', e);
            }
        }

        // 2. Sync Current HTML File
        const updatedHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        await this.pushToGitHub(owner, repo, branch, token, path, updatedHTML, `Auto-sync: Updated ${path} via portal`);

        // 3. Dual-Sync Corresponding JSON File
        if (extractedDbData) {
            let jsonFilename = '';
            if (path.includes('image') || path.includes('photo')) {
                jsonFilename = 'images.json';
            } else if (path.includes('video') || path.includes('watch') || path.includes('vault')) {
                jsonFilename = 'videos.json';
            }

            if (jsonFilename) {
                const jsonContent = JSON.stringify(extractedDbData, null, 4);
                await this.pushToGitHub(owner, repo, branch, token, jsonFilename, jsonContent, `Auto-sync: Updated ${jsonFilename} via portal`);
            }
        }
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

        // 2. Sync Current HTML File
        const updatedHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        await this.pushToGitHub(owner, repo, branch, token, path, updatedHTML, `Auto-sync: Updated ${path} via portal`);

        // 3. Dual-Sync Corresponding JSON File
        if (extractedDbData) {
            let jsonFilename = '';
            if (path.includes('image') || path.includes('photo')) {
                jsonFilename = 'images.json';
            } else if (path.includes('video') || path.includes('watch') || path.includes('vault')) {
                jsonFilename = 'videos.json';
            }

            if (jsonFilename) {
                const jsonContent = JSON.stringify(extractedDbData, null, 4);
                await this.pushToGitHub(owner, repo, branch, token, jsonFilename, jsonContent, `Auto-sync: Updated ${jsonFilename} via portal`);
            }
        }
    }

    static async pushToGitHub(owner, repo, branch, token, filePath, fileContent, commitMessage) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

        try {
            // Get file SHA if it already exists
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
