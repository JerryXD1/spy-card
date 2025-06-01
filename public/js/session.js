// Simple session management using localStorage
function storeUsername(username) {
    localStorage.setItem('username', username);
}

function getStoredUsername() {
    return localStorage.getItem('username');
}

function clearSession() {
    localStorage.removeItem('username');
}