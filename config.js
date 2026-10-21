const PortalConfig = {
    owner: 'jamesbondpeter9', // Keep your GitHub username here
    repo: 'Vault',  // Keep your repository name here
    branch: 'main',                // or 'master'
    getToken: function() {
        // Automatically checks browser storage for the token
        return localStorage.getItem('github_token') || sessionStorage.getItem('github_token') || null;
    }
};

// Console helper function to save your token easily
function setGitHubToken(token) {
    if (!token || !token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        console.warn('Warning: Token format looks unusual. Make sure it is a valid GitHub PAT.');
    }
    localStorage.setItem('github_token', token.trim());
    console.log('GitHub PAT token successfully saved to browser localStorage!');
}
