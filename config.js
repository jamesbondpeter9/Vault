const PortalConfig = {
    owner: 'jamesbondpeter9', 
    repo: 'Vault',  
    branch: 'main', 
    username: 'Janice',    
    password: 'James@123', 
    getToken: function() {
        let token = null;
        try {
            token = localStorage.getItem('github_token') || 
                    localStorage.getItem('github_pat') || 
                    sessionStorage.getItem('github_token') || 
                    sessionStorage.getItem('github_pat');
        } catch (e) {
            // Fallback if storage throws security errors in strict incognito
            token = sessionStorage.getItem('github_token') || sessionStorage.getItem('github_pat');
        }
        return token ? token.trim() : null;
    }
};

function setGitHubToken(token) {
    if (!token) {
        console.warn('Warning: No token provided.');
        return;
    }
    const cleanToken = token.trim();
    sessionStorage.setItem('github_token', cleanToken);
    sessionStorage.setItem('github_pat', cleanToken);
    try {
        localStorage.setItem('github_token', cleanToken);
        localStorage.setItem('github_pat', cleanToken);
    } catch (e) {}
    console.log('GitHub PAT token successfully saved!');
}
