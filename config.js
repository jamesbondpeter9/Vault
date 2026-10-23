const PortalConfig = {
    owner: 'jamesbondpeter9', 
    repo: 'Vault',  
    branch: 'main', 
    getToken: function() {
        // 1. Check browser storages first
        let token = localStorage.getItem('github_token') || 
                    localStorage.getItem('github_pat') || 
                    sessionStorage.getItem('github_token') || 
                    sessionStorage.getItem('github_pat');

        // 2. Fallback: If missing (like in Incognito mode), ask the user once
        if (!token) {
            token = prompt('GitHub PAT Token missing. Please enter your token to enable sync:');
            if (token && token.trim()) {
                token = token.trim();
                try {
                    localStorage.setItem('github_token', token);
                    sessionStorage.setItem('github_token', token);
                } catch (e) {
                    // Handles private tab restrictions
                }
            }
        }
        return token || null;
    }
};

// Console helper function to save your token easily in normal browsing
function setGitHubToken(token) {
    if (!token) {
        console.warn('Warning: No token provided.');
        return;
    }
    localStorage.setItem('github_token', token.trim());
    sessionStorage.setItem('github_token', token.trim());
    console.log('GitHub PAT token successfully saved!');
}
