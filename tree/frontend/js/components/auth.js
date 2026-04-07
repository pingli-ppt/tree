// frontend/js/components/auth.js
const AuthComponent = {
    render: () => {
        const container = document.getElementById('authContainer');
        container.innerHTML = `
            <div class="auth-card">
                <h2>🌱 欢迎来到溯源果园</h2>
                <div class="auth-tabs">
                    <button id="showLoginBtn" class="active">登录</button>
                    <button id="showRegisterBtn">注册</button>
                </div>
                <div id="loginForm">
                    <input type="text" id="loginUsername" placeholder="用户名" />
                    <input type="password" id="loginPassword" placeholder="密码" />
                    <button id="doLoginBtn" class="btn-primary">登录</button>
                </div>
                <div id="registerForm" style="display:none;">
                    <input type="text" id="regUsername" placeholder="用户名" />
                    <input type="password" id="regPassword" placeholder="密码" />
                    <input type="number" id="regMonthAge" placeholder="宝宝月龄 (默认6)" value="6" />
                    <button id="doRegisterBtn" class="btn-primary">注册并开始种植</button>
                </div>
            </div>
        `;
        document.getElementById('showLoginBtn').onclick = () => {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('showLoginBtn').classList.add('active');
            document.getElementById('showRegisterBtn').classList.remove('active');
        };
        document.getElementById('showRegisterBtn').onclick = () => {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
            document.getElementById('showRegisterBtn').classList.add('active');
            document.getElementById('showLoginBtn').classList.remove('active');
        };
        document.getElementById('doLoginBtn').onclick = async () => {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const res = await api.login({ username, password });
                window.currentUserId = res.data.userId;
                window.authToken = res.data.token;
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userId', res.data.userId);
                showToast('登录成功');
                initAppAfterLogin();
            } catch (err) {
                showToast(err.response?.data?.error || '登录失败', true);
            }
        };
        document.getElementById('doRegisterBtn').onclick = async () => {
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const babyMonthAge = parseInt(document.getElementById('regMonthAge').value) || 6;
            try {
                const res = await api.register({ username, password, babyMonthAge });
                window.currentUserId = res.data.userId;
                window.authToken = res.data.token;
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userId', res.data.userId);
                showToast('注册成功，已为您种下一棵苹果树');
                initAppAfterLogin();
            } catch (err) {
                showToast(err.response?.data?.error || '注册失败', true);
            }
        };
    }
};

async function initAppAfterLogin() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('usernameDisplay').innerText = `宝宝妈妈`;
    // 加载资源及各模块
    await loadResources();
    await TreeGarden.render();
    await TaskPanel.render();
    await NutritionAgent.render();
    await RedeemShop.render();
}

async function loadResources() {
    try {
        const res = await api.getResources(window.currentUserId);
        const data = res.data;
        document.getElementById('waterCount').innerText = data.water || 0;
        document.getElementById('fertilizerCount').innerText = data.fertilizer || 0;
        document.getElementById('shardsCount').innerText = data.traceShards || 0;
    } catch (e) { console.error(e); }
}