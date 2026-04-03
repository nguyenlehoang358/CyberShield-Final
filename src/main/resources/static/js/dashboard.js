const API = '/api/dashboard';

// Kiểm tra đăng nhập
if (!Auth.getToken()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent('/dashboard.html');
}

// Navigation
document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.classList.contains('disabled')) return;
        const section = item.dataset.section;
        showSection(section);
        document.querySelectorAll('.nav-item[data-section]').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    const section = document.getElementById('section-' + sectionId);
    if (section) section.style.display = 'block';

    const titles = {
        overview: 'Tổng quan',
        database: 'Database',
        users: 'Người dùng'
    };
    document.getElementById('page-title').textContent = titles[sectionId] || sectionId;

    if (sectionId === 'database') loadUsers();
    if (sectionId === 'overview') loadStats();
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
    window.location.href = '/login.html';
});

// Load stats
async function loadStats() {
    try {
        const res = await fetch(API + '/stats', { headers: Auth.getAuthHeader() });
        if (res.status === 401) {
            window.location.href = '/login.html?redirect=' + encodeURIComponent('/dashboard.html');
            return;
        }
        if (res.status === 403) {
            document.getElementById('stat-users').textContent = '—';
            document.getElementById('stat-tables').textContent = '—';
            document.querySelector('.stats-grid').insertAdjacentHTML('beforeend',
                '<div class="stat-card" style="grid-column:1/-1;color:var(--text-secondary)">Bạn cần quyền Admin để xem dashboard.</div>');
            return;
        }
        const data = await res.json();
        document.getElementById('stat-users').textContent = data.userCount ?? 0;
        document.getElementById('stat-tables').textContent = data.tables?.length ?? 0;
    } catch (e) {
        document.getElementById('stat-users').textContent = '?';
        document.getElementById('stat-tables').textContent = '?';
    }
}

// Load users table
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Đang tải...</td></tr>';

    try {
        const res = await fetch(API + '/database/users', { headers: Auth.getAuthHeader() });
        if (res.status === 401) {
            window.location.href = '/login.html?redirect=' + encodeURIComponent('/dashboard.html');
            return;
        }
        if (res.status === 403) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Bạn cần quyền Admin để xem dữ liệu.</td></tr>';
            return;
        }
        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Chưa có dữ liệu</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${u.oauthProvider || '-'}</td>
                <td><code>${escapeHtml(u.roles || '-')}</code></td>
                <td>${u.createdAt ? formatDate(u.createdAt) : '-'}</td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Lỗi tải dữ liệu</td></tr>';
    }
}

function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function formatDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('vi-VN');
    } catch (_) { return iso; }
}

// Refresh button
document.getElementById('refresh-users')?.addEventListener('click', loadUsers);

// Init
Auth.fetchMe().then(me => {
    if (me) {
        document.getElementById('user-info').textContent = me.username;
    }
}).catch(() => Auth.logout());

loadStats();
