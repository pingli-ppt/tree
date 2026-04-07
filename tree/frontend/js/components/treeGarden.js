// frontend/js/components/treeGarden.js
const TreeGarden = {
    render: async () => {
        const container = document.getElementById('gardenPanel');
        container.innerHTML = '<div style="text-align:center">加载果树中...</div>';
        try {
            const res = await api.getTrees(window.currentUserId);
            const trees = res.data;
            if (trees.length === 0) {
                container.innerHTML = '<p>暂无果树，去完成任务获取新果树吧～</p>';
                return;
            }
            let html = '<div class="tree-grid">';
            for (const tree of trees) {
                const stageNames = ['🌱 幼苗期', '🌸 开花期', '🍏 结果期', '🍎 成熟期', '🎁 可收获'];
                const stageName = stageNames[tree.stage] || '生长中';
                const progressPercent = tree.stage < 4 ? ( (1 - (tree.remainingDays / [2,2,3,2][tree.stage])) * 100 ) : 100;
                html += `
                    <div class="tree-card" data-tree-id="${tree._id}">
                        <div class="tree-header">
                            <span class="tree-name">${getTreeDisplayName(tree.treeType)}</span>
                            <span class="tree-stage">${stageName}</span>
                        </div>
                        <div class="stage-progress">
                            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,progressPercent)}%"></div></div>
                            <small>${tree.stage<4 ? `还需约${tree.remainingDays?.toFixed(1)}天` : '成熟可收获'}</small>
                        </div>
                        <div class="tree-actions">
                            ${tree.stage < 4 ? `<button class="btn btn-sm btn-icon" data-action="accelerate" data-type="fertilizer">🌿 肥料加速(-12h)</button>
                            <button class="btn btn-sm btn-icon" data-action="accelerate" data-type="water">💧 水滴加速(-6h)</button>` : ''}
                            ${tree.stage === 4 ? `<button class="btn btn-primary btn-sm" data-action="harvest">🍯 收获果实</button>` : ''}
                            <button class="btn btn-sm" data-action="trace">🔍 溯源日记</button>
                        </div>
                    </div>
                `;
            }
            html += `<div class="tree-card" style="background:#f9f3e3;"><button class="btn btn-accent" id="plantSeasonalBtn">🌿 种植季节限定果树</button>
            <button class="btn" id="plantCustomBtn" style="margin-top:8px">✨ 定制果树（需完成档案）</button></div>`;
            html += '</div>';
            container.innerHTML = html;
            // 绑定事件
            document.querySelectorAll('[data-action="accelerate"]').forEach(btn => {
                btn.onclick = async (e) => {
                    const treeCard = btn.closest('.tree-card');
                    const treeId = treeCard.dataset.treeId;
                    const type = btn.dataset.type;
                    try {
                        await api.accelerateTree(window.currentUserId, treeId, type);
                        showToast(`加速成功！`);
                        await TreeGarden.render();
                        await loadResources();
                    } catch(err) { showToast(err.response?.data?.error || '加速失败', true); }
                };
            });
            document.querySelectorAll('[data-action="harvest"]').forEach(btn => {
                btn.onclick = async () => {
                    const treeId = btn.closest('.tree-card').dataset.treeId;
                    try {
                        const res = await api.harvestTree(window.currentUserId, treeId);
                        showToast(`收获成功！获得兑换券: ${res.data.coupon.couponCode}`);
                        await TreeGarden.render();
                        await RedeemShop.render();
                    } catch(err) { showToast(err.response?.data?.error, true); }
                };
            });
            document.querySelectorAll('[data-action="trace"]').forEach(btn => {
                btn.onclick = async () => {
                    const treeId = btn.closest('.tree-card').dataset.treeId;
                    try {
                        const traceRes = await api.getTreeTrace(treeId);
                        const data = traceRes.data;
                        const traceHtml = `<div><strong>区块链存证号:</strong> ${data.blockchainHash}</div>
                        <div><strong>种植基地:</strong> ${data.trace.farmInfo.name} ${data.trace.farmInfo.location}</div>
                        <div><strong>施肥记录:</strong> ${data.trace.records.fertilizing.map(f=>`${f.type} ${f.date}`).join(',')}</div>
                        <div><strong>检测报告:</strong> <a href="${data.trace.records.testing.reportUrl}" target="_blank">查看完整报告</a></div>
                        <div><strong>当前阶段:</strong> ${data.stageInfo.description}</div>`;
                        showModal('溯源生长日记', traceHtml);
                    } catch(e) { showToast('获取溯源失败', true); }
                };
            });
            document.getElementById('plantSeasonalBtn')?.addEventListener('click', async () => {
                try {
                    await api.plantSeasonalTree(window.currentUserId);
                    showToast('季节果树幼苗已种下！');
                    await TreeGarden.render();
                } catch(e) { showToast('种植失败', true); }
            });
            document.getElementById('plantCustomBtn')?.addEventListener('click', () => {
                showModal('定制果树', `<input id="customType" placeholder="果树类型 (如:火龙果)" /><input id="customFormula" placeholder="配方描述(可选)" /><button id="confirmCustom" class="btn-primary">种植</button>`);
                document.getElementById('confirmCustom').onclick = async () => {
                    const type = document.getElementById('customType').value;
                    const formula = document.getElementById('customFormula').value;
                    if(!type) return showToast('请输入果树类型');
                    await api.plantCustomTree(window.currentUserId, type, formula);
                    closeModal();
                    await TreeGarden.render();
                };
            });
        } catch(e) { container.innerHTML = '<p>加载失败，请刷新</p>'; }
    }
};

function getTreeDisplayName(type) {
    const map = { apple:'苹果树', banana:'香蕉树', dragonfruit:'火龙果树', cherry:'樱桃树', peach:'桃子树', pear:'梨枣树', orange:'橙子树' };
    return map[type] || `${type}果树`;
}