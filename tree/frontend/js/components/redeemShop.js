// frontend/js/components/redeemShop.js
const RedeemShop = {
    render: async () => {
        const container = document.getElementById('shopPanel');
        container.innerHTML = '<div>加载中...</div>';
        try {
            // 获取优惠券
            const couponsRes = await api.getUserCoupons(window.currentUserId);
            const coupons = couponsRes.data || [];
            
            // 获取订单
            let orders = [];
            try {
                const ordersRes = await axios.get(`/api/redeem/orders?userId=${window.currentUserId}`);
                orders = ordersRes.data || [];
            } catch(e) {
                console.log('订单接口暂不可用');
            }
            
            let html = `
                <div style="margin-bottom: 20px;">
                    <button id="exchangeShardsBtn" class="btn-accent" style="background:#e67e22; padding:12px 20px; border:none; border-radius:8px; cursor:pointer;">
                        🧩 10碎片兑换5元优惠券
                    </button>
                </div>
                
                <h3>🎫 我的果实兑换券</h3>
                <div id="couponsList">
            `;
            
            if (coupons.length === 0) {
                html += '<p style="color:#999;">暂无兑换券，快收获果树吧~</p>';
            } else {
                for (const c of coupons) {
                    html += `
                        <div class="coupon-card" style="border:1px solid #ddd; border-radius:12px; padding:12px; margin-bottom:12px; background:#fff;">
                            <div><strong>🍎 ${c.productName || '果泥优惠券'}</strong><br/>
                            <small style="color:#e67e22;">券码: ${c.couponCode}</small></div>
                            <button class="btn btn-sm redeem-btn" data-code="${c.couponCode}" data-name="${c.productName}" 
                                style="margin-top:8px; background:#2a6b2f; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">立即兑换实物</button>
                        </div>
                    `;
                }
            }
            
            html += `</div><h3>📦 我的订单</h3><div id="ordersList">`;
            
            if (orders.length === 0) {
                html += '<p style="color:#999;">暂无订单</p>';
            } else {
                for (const order of orders) {
                    const statusMap = { pending: '待处理', processing: '制作中', shipped: '已发货' };
                    const statusText = statusMap[order.status] || order.status;
                    const addressText = typeof order.address === 'object' ? order.address.address : order.address;
                    html += `
                        <div class="order-card" style="border:1px solid #ddd; border-radius:12px; padding:12px; margin-bottom:12px; background:#f9f9f9;">
                            <div><strong>${order.productName || '果泥'}</strong></div>
                            <div>状态: ${statusText}</div>
                            <div>地址: ${addressText || '未填写'}</div>
                            <div>下单时间: ${new Date(order.createdAt).toLocaleString()}</div>
                            ${order.traceLink ? `<a href="${order.traceLink}" target="_blank" style="color:#2a6b2f;">查看溯源</a>` : ''}
                        </div>
                    `;
                }
            }
            
            html += `</div>`;
            container.innerHTML = html;
            
            // 碎片兑换按钮
            document.getElementById('exchangeShardsBtn')?.addEventListener('click', async () => {
                try {
                    const res = await api.exchangeCouponWithShards(window.currentUserId);
                    showToast('✅ 兑换成功！优惠券已发放');
                    await loadResources();
                    await RedeemShop.render();
                } catch(e) {
                    showToast(e.response?.data?.error || '碎片不足，无法兑换', true);
                }
            });
            
            // 实物兑换按钮
            document.querySelectorAll('.redeem-btn').forEach(btn => {
                btn.onclick = () => {
                    const code = btn.dataset.code;
                    const productName = btn.dataset.name;
                    showModal('🎁 兑换果泥', `
                        <div style="padding:10px;">
                            <p>兑换产品：<strong>${productName || '果泥'}</strong></p>
                            <p>优惠券码：<strong>${code}</strong></p>
                            <input id="address" placeholder="收货地址" style="width:100%; padding:8px; margin:10px 0; border:1px solid #ddd; border-radius:6px;" />
                            <input id="phone" placeholder="手机号" style="width:100%; padding:8px; margin:10px 0; border:1px solid #ddd; border-radius:6px;" />
                            <button id="confirmRedeemBtn" class="btn-primary" style="width:100%; background:#2a6b2f; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">确认兑换</button>
                        </div>
                    `);
                    document.getElementById('confirmRedeemBtn').onclick = async () => {
                        const address = document.getElementById('address').value;
                        const phone = document.getElementById('phone').value;
                        if (!address) return showToast('请填写收货地址');
                        try {
                            await api.redeemProduct(window.currentUserId, code, { address, phone }, null);
                            showToast('✅ 兑换成功！订单已生成');
                            closeModal();
                            await loadResources();
                            await RedeemShop.render();
                        } catch(e) {
                            showToast('兑换失败', true);
                        }
                    };
                };
            });
        } catch(e) {
            console.error(e);
            container.innerHTML = '<p>加载失败，请刷新</p>';
        }
    }
};