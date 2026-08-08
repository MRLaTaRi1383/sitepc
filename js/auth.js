// ============================================================
//  AUTHENTICATION
// ============================================================

// Check if user is logged in
function isLoggedIn() {
    return !!DB.get('currentUser', null);
}

function getCurrentUser() {
    return DB.get('currentUser', null);
}

function login(email, password) {
    const users = DB.get('users', {});
    if (users[email] && users[email] === password) {
        DB.set('currentUser', { email, name: email.split('@')[0] });
        return true;
    }
    return false;
}

function register(email, password) {
    const users = DB.get('users', {});
    if (users[email]) return false;
    users[email] = password;
    DB.set('users', users);
    DB.set('currentUser', { email, name: email.split('@')[0] });
    return true;
}

function logout() {
    DB.set('currentUser', null);
    const btn = document.getElementById('authToggle');
    if (btn) btn.innerHTML = '<i class="fas fa-user"></i> ورود';
}

// Update auth button on load
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    const btn = document.getElementById('authToggle');
    if (user && btn) {
        btn.innerHTML = `<i class="fas fa-user-check"></i> ${user.name}`;
    }
});
