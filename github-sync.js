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
        const isImagePage = path.includes('image') || path.includes('photo');

        // 1. Gather live data directly from active storage
        let dbData = { models: [], photostreams: [], folders: [], streams: [] };

        if (isImagePage && typeof ImageStorageDB !== 'undefined') {
            dbData.models = typeof ImageStorageDB.getModels === 'function' ? ImageStorageDB.getModels() || [] : [];
            dbData.photostreams = typeof ImageStorageDB.getPhotoStreams === 'function' ? ImageStorageDB.getPhotoStreams() || [] : [];
            dbData.folders = typeof ImageStorageDB.getFolders === 'function' ? ImageStorageDB.getFolders() || [] : [];
        } else if (typeof StorageDB !== 'undefined') {
            dbData.models = typeof StorageDB.getModels === 'function' ? StorageDB.getModels() || [] : [];
            dbData.streams = typeof StorageDB.getStreams === 'function' ? StorageDB.getStreams() || [] : [];
        }

        // 2. Update the embedded script tag in DOM so the downloaded HTML is also populated
        const scriptTag = document.getElementById('embedded-database') || 
                          document.getElementById('embedded-video-database') || 
                          document.getElementById('embedded-images-database');
        if (scriptTag) {
            scriptTag.textContent = JSON.stringify(dbData, null, 2);
        }

        // 3. Sync Current HTML File
        const updatedHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        await this.pushToGitHub(owner, repo, branch, token, path, updatedHTML, `Auto-sync: Updated ${path} via portal`);

        // 4. Dual-Sync Corresponding JSON File (images.json or videos.json)
        let jsonFilename = isImagePage ? 'images.json' : 'videos.json';
        const jsonContent = JSON.stringify(dbData, null, 4);
        await this.pushToGitHub(owner, repo, branch, token, jsonFilename, jsonContent, `Auto-sync: Updated ${jsonFilename} via portal`);
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
