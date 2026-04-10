// frontend/js/app.js
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if(token && userId) {
        window.authToken = token;
        window.currentUserId = userId;
        initAppAfterLogin();
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    } else {
        AuthComponent.render();
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tabId}Panel`).classList.add('active');
        });
    });
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });
    // 档案按钮
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        BabyProfileComponent.renderModal();
});
});