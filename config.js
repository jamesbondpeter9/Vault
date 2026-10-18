const PortalConfig = {
    // Replace with your actual GitHub username or organization
    owner: "YOUR_GITHUB_USERNAME",
    
    // Replace with your actual GitHub repository name
    repo: "YOUR_REPOSITORY_NAME",
    
    // The branch you want to commit to (usually 'main' or 'master')
    branch: "main",

    // Helper to get your GitHub Personal Access Token (PAT) securely from localStorage
    getToken() {
        return localStorage.getItem('github_pat_token') || '';
    },

    // Helper to save your token
    setToken(token) {
        localStorage.setItem('github_pat_token', token.trim());
    }
};
