// frontend/js/components/redeemShop.js
const RedeemShop = {
    render: async () => {
        const container = document.getElementById('shopPanel');
        container.innerHTML = '<div>加载兑换券...</div>';
        try {
            const couponsRes = await api.getUserCoupons(window.currentUserId);
            const coupons = couponsRes.data;
            let html = `<div><button id="exchangeShardsBtn" class="btn-accent">🧩 10碎片兑换5元优惠券</button></div><h3>我的果实兑换券</h3>`;
            if(coupons.length === 0) html += '<p>暂无兑换券，快收获果树吧~</p>';
            else {
                for(const c of coupons) {
                    html += `<div class="coupon-card">
                        <div><strong>${c.productName}</strong><br><small>码: ${c.couponCode}</small></div>
                        <button class="btn btn-sm" data-code="${c.couponCode}" data-name="${c.productName}" data-custom="${c.customFormula||''}">立即兑换</button>
                    </div>`;
                }
            }
            container.innerHTML = html;
            document.querySelectorAll('[data-code]').forEach(btn => {
                btn.onclick = () => {
                    const code = btn.dataset.code;
                    const productName = btn.dataset.name;
                    showModal('兑换果泥', `
                        <p>兑换: ${productName}</p>
                        <input id="address" placeholder="收货地址" /><input id="phone" placeholder="手机号" />
                        <button id="confirmRedeemBtn" class="btn-primary">确认兑换</button>
                    `);
                    document.getElementById('confirmRedeemBtn').onclick = async () => {
                        const address = document.getElementById('address').value;
                        const phone = document.getElementById('phone').value;
                        if(!address) return showToast('地址不能为空');
                        try {
                            await api.redeemProduct(window.currentUserId, code, { address, phone }, null);
                            showToast('兑换成功，订单已生成，7日内发货');
                            closeModal();
                            await RedeemShop.render();
                        } catch(e) { showToast('兑换失败', true); }
                    };
                };
            });
            document.getElementById('exchangeShardsBtn')?.addEventListener('click', async () => {
                try {
                    await api.exchangeCouponWithShards(window.currentUserId);
                    showToast('兑换优惠券成功！');
                    await loadResources();
                    await RedeemShop.render();
                } catch(e) { showToast(e.response?.data?.error || '碎片不足', true); }
            });
        } catch(e) { container.innerHTML = '<p>加载失败</p>'; }
    }
};