const TreeGarden = {
    render: async () => {
        // 清理旧定时器
        if (window.treeAnimationInterval) clearInterval(window.treeAnimationInterval);

        const container = document.getElementById('gardenPanel');
        container.innerHTML = '<div style="text-align:center">加载果树中...</div>';
        try {
            const res = await api.getTrees(window.currentUserId);
            const trees = res.data;
            if (trees.length === 0) {
                container.innerHTML = '<p>暂无果树，去完成任务获取新果树吧～</p>';
                return;
            }

            // 档案提示（在果树列表上方）
            let html = '';
            const profileRes = await api.getBabyProfile(window.currentUserId);
            const profile = profileRes.data || {};
            if (!profile.monthAge) {
                html += `<div class="profile-tip" style="background:#f0f7ff; padding:10px; border-radius:8px; margin-bottom:15px;">
                    📝 完善 <a href="#" id="completeProfileTip" style="color:#2a6b2f;">宝宝档案</a>，解锁定制果树功能
                </div>`;
            }

            html += '<div class="tree-grid">';
            for (const tree of trees) {
                const stageNames = ['🌱 幼苗期', '🌸 开花期', '🍏 结果期', '🍎 成熟期', '🎁 可收获'];
                const stageName = stageNames[tree.stage] || '生长中';
                
                // 计算剩余天数
                let remainingDays = tree.remainingDays;
                if (remainingDays === undefined && tree.plantedAt) {
                    const plantedAt = new Date(tree.plantedAt);
                    const now = new Date();
                    const daysPassed = (now - plantedAt) / (1000 * 60 * 60 * 24);
        
                    // 根据果树类型设置总成长天数
                    const growthDaysMap = {
                        'apple': 30,
                        'cherry': 45,
                        'peach': 40,
                        'banana': 35,
                        'dragonfruit': 50
                    };
                    const totalDays = growthDaysMap[tree.treeType] || 30;
                    remainingDays = Math.max(0, totalDays - daysPassed);
                }

                const progressPercent = tree.stage < 4 ? ( (1 - (remainingDays / [2,2,3,2][tree.stage])) * 100 ) : 100;
                const canvasId = `treeCanvas_${tree._id}`;

                html += `
                    <div class="tree-card" data-tree-id="${tree._id}">
                        <canvas id="${canvasId}" width="180" height="160" style="width:100%; max-width:180px; margin:0 auto 10px; display:block;"></canvas>
                        <div class="tree-header">
                            <span class="tree-name">${getTreeDisplayName(tree.treeType)}</span>
                            <span class="tree-stage">${stageName}</span>
                        </div>
                        <div class="stage-progress">
                            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,progressPercent)}%"></div></div>
                            <small>${tree.stage<4 ? `还需约${remainingDays?.toFixed(1)}天` : '成熟可收获'}</small>
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

            // 绘制所有果树
            for (const tree of trees) {
                const canvasId = `treeCanvas_${tree._id}`;
                drawFruitTree(canvasId, tree.treeType, tree.stage);
            }

            // 启动动画定时器（让花朵摆动、星星闪烁）
            if (window.treeAnimationInterval) clearInterval(window.treeAnimationInterval);
            window.treeAnimationInterval = setInterval(() => {
                for (const tree of trees) {
                    const canvasId = `treeCanvas_${tree._id}`;
                    const canvas = document.getElementById(canvasId);
                    if (canvas && canvas.isConnected) {
                        drawFruitTree(canvasId, tree.treeType, tree.stage);
                    } else {
                        clearInterval(window.treeAnimationInterval);
                    }
                }
            }, 800);

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

                        // 完成溯源日记任务
                        try {
                            // 查找是否存在"溯源日记"相关的每日任务
                            const dailyRes = await api.getDailyTasks(window.currentUserId);
                            const dailyTasks = dailyRes.data || [];
                            const traceTask = dailyTasks.find(task => 
                                task.id === 'trace' || 
                                task.name === '溯源日记' || 
                                task.name.includes('溯源')
                            );
                
                            if (traceTask && !traceTask.completed) {
                                await api.completeDailyTask(window.currentUserId, traceTask.id, {
                                    timestamp: Date.now(),
                                    treeId: treeId
                                });
                                showToast('✅ 任务已完成！获得奖励');
                                // 刷新任务面板
                                if (typeof TaskPanel !== 'undefined') {
                                    await TaskPanel.render();
                                }
                                await loadResources();
                            }
                        } catch(taskErr) {
                            console.log('任务完成失败或任务不存在:', taskErr);
                        }
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

// 果树绘图
function drawFruitTree(canvasId, treeType, stage) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 180;
    const height = canvas.height = 160;
    
    ctx.clearRect(0, 0, width, height);
    
    // 根据类型设置颜色主题
    const treeTheme = {
        apple: { trunk: '#8B5A2B', leaf: '#4CAF50', fruit: '#FF5252', fruitInner: '#D32F2F', flower: '#FFC0CB' },
        cherry: { trunk: '#8B5A2B', leaf: '#66BB6A', fruit: '#FF4081', fruitInner: '#E91E63', flower: '#FFB7C5' },
        peach: { trunk: '#A0522D', leaf: '#81C784', fruit: '#FFB74D', fruitInner: '#F57C00', flower: '#FFE0B5' },
        banana: { trunk: '#6D4C41', leaf: '#AED581', fruit: '#FFEB3B', fruitInner: '#FDD835', flower: '#FFF9C4' },
        dragonfruit: { trunk: '#795548', leaf: '#9CCC65', fruit: '#FF7043', fruitInner: '#E64A19', flower: '#F3E5F5' },
        pear: { trunk: '#8D6E63', leaf: '#7CB342', fruit: '#FFD54F', fruitInner: '#FFC107', flower: '#FFF8E1' },
        orange: { trunk: '#8B5A2B', leaf: '#66BB6A', fruit: '#FF9800', fruitInner: '#F57C00', flower: '#FFF3E0' },
        default: { trunk: '#8B5A2B', leaf: '#4CAF50', fruit: '#FF9800', fruitInner: '#F57C00', flower: '#FFE0B5' }
    };
    
    const theme = treeTheme[treeType] || treeTheme.default;
    
    // 树干
    const trunkWidth = 12 + Math.floor(stage * 1.5);
    const trunkHeight = 45;
    const trunkX = width/2 - trunkWidth/2;
    const trunkY = height - trunkHeight - 10;
    
    ctx.fillStyle = theme.trunk;
    ctx.fillRect(trunkX, trunkY, trunkWidth, trunkHeight);
    
    ctx.fillStyle = '#6D4C41';
    for(let i = 0; i < 3; i++) {
        ctx.fillRect(trunkX + 3, trunkY + 10 + i*12, 4, 3);
    }
    
    // 树冠
    const crownSize = 38 + stage * 8;
    const crownX = width/2;
    const crownY = trunkY - 8;
    
    ctx.beginPath();
    ctx.arc(crownX, crownY - 10, crownSize, 0, Math.PI * 2);
    ctx.fillStyle = theme.leaf;
    ctx.fill();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(crownX - 10, crownY - 5, crownSize - 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(crownX + 10, crownY - 5, crownSize - 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(crownX - 5, crownY - 18, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#C8E6C9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(crownX + 8, crownY - 15, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 开花期
    if (stage >= 1) {
        const flowerCount = 6 + stage * 2;
        for(let i = 0; i < flowerCount; i++) {
            const angle = (i / flowerCount) * Math.PI * 2 + Date.now() / 800;
            const radius = crownSize - 5;
            const x = crownX + Math.cos(angle) * radius;
            const y = crownY - 8 + Math.sin(angle) * radius * 0.7;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = theme.flower;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFEB3B';
            ctx.fill();
        }
    }
    
    // 结果期
    if (stage >= 2) {
        const fruitCount = stage === 2 ? 4 : (stage === 3 ? 6 : 8);
        for(let i = 0; i < fruitCount; i++) {
            const angle = (i / fruitCount) * Math.PI * 2;
            const radius = crownSize - 8;
            const x = crownX + Math.cos(angle) * radius;
            const y = crownY - 5 + Math.sin(angle) * radius * 0.6;
            
            ctx.beginPath();
            ctx.ellipse(x, y, 6, 7, 0, 0, Math.PI * 2);
            ctx.fillStyle = theme.fruit;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
            ctx.fillStyle = theme.fruitInner;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - 2, y - 6);
            ctx.lineTo(x - 4, y - 10);
            ctx.lineTo(x, y - 8);
            ctx.fillStyle = '#5D4037';
            ctx.fill();
        }
    }
    
    // 成熟期
    if (stage >= 3) {
        ctx.beginPath();
        ctx.arc(crownX, crownY - 10, crownSize + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fill();
        
        const fruitCount = 6;
        for(let i = 0; i < fruitCount; i++) {
            const angle = (i / fruitCount) * Math.PI * 2 + 0.5;
            const radius = crownSize - 5;
            const x = crownX + Math.cos(angle) * radius;
            const y = crownY - 3 + Math.sin(angle) * radius * 0.6;
            
            ctx.beginPath();
            ctx.ellipse(x, y, 8, 9, 0, 0, Math.PI * 2);
            ctx.fillStyle = theme.fruit;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x - 2, y - 2, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
    }
    
    // 可收获
    if (stage >= 4) {
        const time = Date.now() / 400;
        for(let i = 0; i < 3; i++) {
            const angle = time + i * Math.PI * 2 / 3;
            const x = crownX + Math.cos(angle) * (crownSize + 12);
            const y = crownY - 15 + Math.sin(angle) * 10;
            
            drawStar(ctx, x, y, 5, 6, 4);
            ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(time) * 0.3})`;
            ctx.fill();
        }
    }
    
    // 草地
    ctx.fillStyle = '#8BC34A';
    ctx.beginPath();
    ctx.ellipse(width/2, height - 8, 70, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#689F38';
    ctx.beginPath();
    ctx.ellipse(width/2 - 15, height - 10, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for(let i = 0; i < spikes; i++) {
        const x1 = cx + Math.cos(rot) * outerR;
        const y1 = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x1, y1);
        rot += step;
        
        const x2 = cx + Math.cos(rot) * innerR;
        const y2 = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x2, y2);
        rot += step;
    }
    ctx.closePath();
}

function getTreeDisplayName(type) {
    const map = { apple:'苹果树', banana:'香蕉树', dragonfruit:'火龙果树', cherry:'樱桃树', peach:'桃子树', pear:'梨枣树', orange:'橙子树' };
    return map[type] || `${type}果树`;
}