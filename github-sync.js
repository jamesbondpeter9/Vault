class GitHubSync {
    static async triggerAutoSync() {
        if (typeof PortalConfig === 'undefined') {
            console.warn('PortalConfig is not defined. Skipping auto-sync.');
            return;
        }

        const token = PortalConfig.getToken();
        if (!token) {
            console.warn('GitHub PAT token not found in session. Skipping auto-sync.');
            return;
        }

        const owner = PortalConfig.owner;
        const repo = PortalConfig.repo;
        const branch = PortalConfig.branch;

        // Determine current page filename (e.g., models.html, video-gallery.html)
        const path = window.location.pathname.split('/').pop() || 'index.html';

        // Update the embedded database script tag in the DOM with latest localStorage data before committing
        const scriptTag = document.getElementById('embedded-database') || document.getElementById('embedded-video-database');
        if (scriptTag && typeof StorageDB !== 'undefined') {
            try {
                const dbData = JSON.parse(scriptTag.textContent);
                dbData.models = StorageDB.getModels();
                dbData.streams = StorageDB.getStreams();
                scriptTag.textContent = JSON.stringify(dbData, null, 2);
            } catch (e) {
                console.error('Failed to update embedded database before sync:', e);
            }
        }

        const updatedHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        try {
            // 1. Fetch current file SHA from GitHub (required for updates)
            const getRes = await fetch(apiUrl, {
                headers: { 'Authorization': `token ${token}` }
            });
            if (!getRes.ok) throw new Error('Failed to retrieve file SHA from GitHub repository.');
            
            const getData = await getRes.json();
            const sha = getData.sha;

            // 2. Convert updated HTML string to Base64 (Unicode-safe)
            const base64Content = btoa(unescape(encodeURIComponent(updatedHTML)));

            // 3. Commit the updated file directly via GitHub REST API
            const putRes = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Auto-sync: Updated ${path} via portal interface`,
                    content: base64Content,
                    sha: sha,
                    branch: branch
                })
            });

            if (putRes.ok) {
                console.log(`Successfully synced ${path} to GitHub repository!`);
            } else {
                const errData = await putRes.json();
                console.error('GitHub API commit error:', errData.message);
            }
        } catch (err) {
            console.error('GitHub Sync Exception:', err);
        }
    }
}
