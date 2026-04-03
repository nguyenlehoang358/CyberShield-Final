const container = document.querySelector('.auth-container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        container?.classList.add('active');
    });
}

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        container?.classList.remove('active');
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('login-error');
        errEl.style.display = 'none';
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;
        try {
            const data = await Auth.login(email, password);
            const redirect = new URLSearchParams(location.search).get('redirect');
            const isAdmin = data.roles && data.roles.some(r => r.includes('ADMIN'));
            if (redirect && redirect.startsWith('/')) {
                window.location.href = redirect;
            } else if (isAdmin) {
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('register-error');
        errEl.style.display = 'none';
        const username = registerForm.username.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        try {
            const data = await Auth.register(username, email, password);
            const redirect = new URLSearchParams(location.search).get('redirect');
            const isAdmin = data.roles && data.roles.some(r => r.includes('ADMIN'));
            if (redirect && redirect.startsWith('/')) {
                window.location.href = redirect;
            } else if (isAdmin) {
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        }
    });
}
