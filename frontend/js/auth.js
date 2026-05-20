document.getElementById('authForm')?.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the page from reloading.
    
    // MOCK DATA: This simulates a Cognito token for local development.
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5c..."; 
    localStorage.setItem('userToken', fakeToken);
    
    // Redirect to the workspace.
    window.location.href = "index.html";
});

function logout() {
    localStorage.removeItem('userToken');
    window.location.href = "login.html";
}
