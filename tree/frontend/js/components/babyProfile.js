// frontend/js/components/babyProfile.js
const BabyProfileComponent = {
    renderModal: async () => {
        try {
            const res = await api.getBabyProfile(window.currentUserId);
            const profile = res.data;
            const html = `
                <label>宝宝月龄: <input id="monthAge" type="number" value="${profile.monthAge}" /></label>
                <label>过敏史(逗号分隔): <input id="allergies" value="${(profile.allergies||[]).join(',')}" /></label>
                <label>饮食偏好: <input id="preferences" value="${(profile.preferences||[]).join(',')}" /></label>
                <button id="saveProfileBtn" class="btn-primary">保存档案</button>
            `;
            showModal('完善宝宝档案', html, null);
            document.getElementById('saveProfileBtn').onclick = async () => {
                const data = {
                    monthAge: parseInt(document.getElementById('monthAge').value),
                    allergies: document.getElementById('allergies').value.split(',').filter(s=>s.trim()),
                    preferences: document.getElementById('preferences').value.split(',').filter(s=>s.trim())
                };
                await api.updateBabyProfile(window.currentUserId, data);
                showToast('档案已更新');
                closeModal();
            };
        } catch(e) { showToast('获取档案失败', true); }
    }
};