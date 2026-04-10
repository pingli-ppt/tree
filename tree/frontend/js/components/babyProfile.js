// frontend/js/components/babyProfile.js
const BabyProfileComponent = {
    renderModal: async () => {
        try {
            const res = await api.getBabyProfile(window.currentUserId);
            const profile = res.data || {};
            
            const html = `
                <div style="padding:10px;">
                    <div style="margin-bottom:15px;">
                        <label>宝宝昵称：</label>
                        <input id="babyName" type="text" value="${profile.name || ''}" placeholder="如：小苹果" style="width:100%; padding:8px; margin:5px 0; border:1px solid #ddd; border-radius:6px;" />
                    </div>
                    <div style="margin-bottom:15px;">
                        <label>月龄：</label>
                        <input id="monthAge" type="number" value="${profile.monthAge || ''}" placeholder="如：6" style="width:100%; padding:8px; margin:5px 0; border:1px solid #ddd; border-radius:6px;" />
                    </div>
                    <div style="margin-bottom:15px;">
                        <label>体重(kg)：</label>
                        <input id="weight" type="text" value="${profile.weight || ''}" placeholder="如：7.5" style="width:100%; padding:8px; margin:5px 0; border:1px solid #ddd; border-radius:6px;" />
                    </div>
                    <div style="margin-bottom:15px;">
                        <label>过敏食物：</label>
                        <input id="allergies" type="text" value="${(profile.allergies || []).join(',')}" placeholder="如：鸡蛋,牛奶" style="width:100%; padding:8px; margin:5px 0; border:1px solid #ddd; border-radius:6px;" />
                    </div>
                    <div style="margin-bottom:15px;">
                        <label>饮食偏好：</label>
                        <input id="preferences" type="text" value="${(profile.preferences || []).join(',')}" placeholder="如：爱吃水果" style="width:100%; padding:8px; margin:5px 0; border:1px solid #ddd; border-radius:6px;" />
                    </div>
                    <button id="saveProfileBtn" class="btn-primary" style="width:100%; background:#2a6b2f; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">保存档案</button>
                </div>
            `;
            
            showModal('👶 宝宝档案', html);
            
            document.getElementById('saveProfileBtn').onclick = async () => {
                const data = {
                    name: document.getElementById('babyName').value,
                    monthAge: parseInt(document.getElementById('monthAge').value) || 0,
                    weight: document.getElementById('weight').value,
                    allergies: document.getElementById('allergies').value.split(',').filter(s => s.trim()),
                    preferences: document.getElementById('preferences').value.split(',').filter(s => s.trim())
                };
                await api.updateBabyProfile(window.currentUserId, data);
                showToast('✅ 档案已保存');
                closeModal();
            };
        } catch(e) {
            showToast('获取档案失败', true);
        }
    }
};