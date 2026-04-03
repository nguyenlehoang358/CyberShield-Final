const Auth = {
    TOKEN_KEY: 'auth_token',
    API_BASE: '',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    clearToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    async login(email, password) {
        const res = await fetch(`${this.API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
        this.setToken(data.token);
        return data;
    },

    async register(username, email, password) {
        const res = await fetch(`${this.API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
        this.setToken(data.token);
        return data;
    },

    logout() {
        this.clearToken();
    },

    async fetchMe() {
        const res = await fetch(`${this.API_BASE}/api/auth/me`, {
            headers: this.getAuthHeader()
        });
        if (!res.ok) return null;
        return res.json();
    },

    checkAndUpdateUI() {
        const token = this.getToken();
        const loginLink = document.getElementById('login-link');
        const logoutLink = document.getElementById('logout-link');
        const userBadge = document.getElementById('user-badge');
        const dashboardLink = document.getElementById('dashboard-link');

        if (token && (logoutLink || userBadge)) {
            this.fetchMe().then(me => {
                if (me && userBadge) userBadge.textContent = me.username;
                if (me) userBadge.style.display = 'inline';
                const heroCta = document.getElementById('hero-cta');
                if (heroCta && me?.authorities?.some(a => String(a).includes('ADMIN'))) {
                    heroCta.href = '/dashboard.html';
                    heroCta.textContent = 'Vào Dashboard';
                }
            }).catch(() => this.clearToken());
            if (loginLink) loginLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'inline';
            if (dashboardLink) dashboardLink.style.display = 'inline';
        } else if (loginLink) {
            if (userBadge) userBadge.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'none';
            if (dashboardLink) dashboardLink.style.display = 'none';
            loginLink.style.display = 'inline';
            const heroCta = document.getElementById('hero-cta');
            if (heroCta) {
                heroCta.href = '/login.html';
                heroCta.textContent = 'Bắt đầu ngay';
            }
        }
    }
};
