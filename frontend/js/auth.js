/**
 * Auth Page Controller — handles login/register forms.
 */

// ── Redirect if already logged in ──────────────────────────────────────────
if (isAuthenticated()) {
    window.location.href = '/static/dashboard.html';
}

// ── Password Toggle Function ────────────────────────────────────────────────
function togglePassword(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    const eyeIcon = toggle.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.add('active');
        if (eyeIcon) {
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        toggle.classList.remove('active');
        if (eyeIcon) {
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    }
}

// ── Show Inline Error ──────────────────────────────────────────────────────
function showInlineError(inputId, message) {
    const errorEl = document.getElementById(inputId + 'Error');
    const input = document.getElementById(inputId);
    
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        input.classList.add('error');
    }
}

// ── Clear Inline Error ──────────────────────────────────────────────────────
function clearInlineError(inputId) {
    const errorEl = document.getElementById(inputId + 'Error');
    const input = document.getElementById(inputId);
    
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
        input.classList.remove('error');
    }
}

// ── Clear All Inline Errors ─────────────────────────────────────────────────
function clearAllInlineErrors() {
    const errorIds = ['loginEmail', 'loginPassword', 'regEmail', 'regPassword', 'regConfirm'];
    errorIds.forEach(id => clearInlineError(id));
}

// ── Setup Input Event Listeners ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Clear errors when user starts typing
    const inputs = ['loginEmail', 'loginPassword', 'regEmail', 'regPassword', 'regConfirm'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearInlineError(id));
        }
    });
});

// ── Tab switching ──────────────────────────────────────────────────────────
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const alertEl = document.getElementById('authAlert');

    alertEl.className = 'hidden';
    clearAllInlineErrors();

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }
}

// ── Show alert ─────────────────────────────────────────────────────────────
function showAuthAlert(message, type = 'error') {
    const el = document.getElementById('authAlert');
    el.className = `alert alert-${type}`;
    el.textContent = message;
}

// ── Login handler ──────────────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    clearAllInlineErrors();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    // Basic validation
    if (!email) {
        showInlineError('loginEmail', 'Email is required');
        return;
    }
    if (!password) {
        showInlineError('loginPassword', 'Password is required');
        return;
    }
    if (password.length < 6) {
        showInlineError('loginPassword', 'Password must be at least 6 characters');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Signing in...';

    try {
        const data = await apiLogin(email, password);
        setToken(data.access_token);
        showAuthAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = '/static/dashboard.html';
        }, 500);
    } catch (err) {
        // Show inline errors based on error message
        if (err.message.toLowerCase().includes('email') || err.message.toLowerCase().includes('user')) {
            showInlineError('loginEmail', err.message);
        } else if (err.message.toLowerCase().includes('password') || err.message.toLowerCase().includes('invalid')) {
            showInlineError('loginPassword', err.message);
        } else {
            showAuthAlert(err.message, 'error');
        }
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
    }
}

// ── Register handler ───────────────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    clearAllInlineErrors();
    
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const btn = document.getElementById('registerBtn');

    // Basic validation
    if (!email) {
        showInlineError('regEmail', 'Email is required');
        return;
    }
    if (!password) {
        showInlineError('regPassword', 'Password is required');
        return;
    }
    if (password.length < 6) {
        showInlineError('regPassword', 'Password must be at least 6 characters');
        return;
    }
    if (!confirm) {
        showInlineError('regConfirm', 'Please confirm your password');
        return;
    }
    if (password !== confirm) {
        showInlineError('regConfirm', 'Passwords do not match');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Creating account...';

    try {
        await apiRegister(email, password);
        showAuthAlert('Account created! You can now sign in.', 'success');
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
        // Switch to login tab after successful registration
        setTimeout(() => switchTab('login'), 1200);
    } catch (err) {
        // Show inline errors based on error message
        if (err.message.toLowerCase().includes('email') || err.message.toLowerCase().includes('already') || err.message.toLowerCase().includes('exists')) {
            showInlineError('regEmail', err.message);
        } else if (err.message.toLowerCase().includes('password')) {
            showInlineError('regPassword', err.message);
        } else {
            showAuthAlert(err.message, 'error');
        }
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
    }
}
