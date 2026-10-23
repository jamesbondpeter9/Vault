const PortalConfig = {
    owner: 'jamesbondpeter9', 
    repo: 'Vault',  
    branch: 'main', 
    username: 'Janice',    // Default login username
    password: 'James@123', // Default login password
    getToken: function() {
        // Quietly checks all browser storage layers for the token
        let token = localStorage.getItem('github_token') || 
                    localStorage.getItem('github_pat') || 
                    sessionStorage.getItem('github_token') || 
                    sessionStorage.getItem('github_pat');

        return token ? token.trim() : null;
    }
};

// Console helper function to save your token easily in normal browsing
function setGitHubToken(token) {
    if (!token) {
        console.warn('Warning: No token provided.');
        return;
    }
    const cleanToken = token.trim();
    localStorage.setItem('github_token', cleanToken);
    localStorage.setItem('github_pat', cleanToken);
    sessionStorage.setItem('github_token', cleanToken);
    sessionStorage.setItem('github_pat', cleanToken);
    console.log('GitHub PAT token successfully saved!');
}
