const TaskPanel = {
    render: async () => {
        const container = document.getElementById('tasksPanel');
        container.innerHTML = '<div>加载每日任务...</div>';
        try {
            const dailyRes = await api.getDailyTasks(window.currentUserId);
            const dailyTasks = dailyRes.data;
            let dailyHtml = '<h3>🌞 每日任务</h3><div class="task-list">';
            for (const task of dailyTasks) {
                dailyHtml += `
                    <div class="task-item">
                        <div><strong>${task.name}</strong><br><span class="task-reward">奖励: ${task.reward.water ? `💧+${task.reward.water}` : ''} ${task.reward.fertilizer ? `🌿+${task.reward.fertilizer}` : ''}</span></div>
                        ${!task.completed ? `<button class="btn btn-sm" data-task-id="${task.id}" data-type="daily">完成</button>` : '<span>✅已完成</span>'}
                    </div>
                `;
            }
            dailyHtml += '</div>';
            // 成长任务
            const growthRes = await api.getGrowthTasks(window.currentUserId);
            const growthTasks = growthRes.data;
            let growthHtml = '<h3>🌟 成长任务</h3><div class="task-list">';
            for (const task of growthTasks) {
                growthHtml += `
                    <div class="task-item">
                        <div><strong>${task.name}</strong><br><span class="task-reward">奖励: ${task.reward.fertilizer ? `🌿+${task.reward.fertilizer}` : ''} ${task.reward.traceShards ? `🧩+${task.reward.traceShards}` : ''} ${task.reward.seasonalSeed ? '🌱季节种子' : ''}</span></div>
                        ${!task.completed ? `<button class="btn btn-sm" data-task-id="${task.id}" data-type="growth">完成</button>` : '<span>✅已完成</span>'}
                    </div>
                `;
            }
            growthHtml += '</div>';
            container.innerHTML = dailyHtml + growthHtml;
            
            // 绑定每日任务
            document.querySelectorAll('[data-type="daily"]').forEach(btn => {
                btn.onclick = async () => {
                    const taskId = btn.dataset.taskId;
                    let payload = {};

                    if (taskId === 'quiz') {
                        try {
                            // 获取题目
                            const quizRes = await axios.get(`http://localhost:3000/api/quiz/question?userId=${window.currentUserId}`);
                            const { question, options } = quizRes.data;
        
                            // 构建选项HTML
                            const optionsHtml = options.map(opt => 
                                `<button class="quiz-option" data-answer="${opt[0]}">${opt}</button>`
                            ).join('');
        
                            // 显示弹窗
                            showModal('🥣 辅食知识答题', `
                                <div class="quiz-container">
                                    <p style="font-weight:bold; margin-bottom:15px;">${question}</p>
                                    <div style="display:flex; flex-direction:column; gap:10px;">
                                        ${optionsHtml}
                                    </div>
                                </div>
                            `);
        
                            // 绑定选项点击
                            document.querySelectorAll('.quiz-option').forEach(btn => {
                                btn.onclick = async () => {
                                    const userAnswer = btn.dataset.answer;
                                    btn.innerText = '提交中...';
                                    btn.disabled = true;
                
                                    try {
                                        const checkRes = await axios.post(`http://localhost:3000/api/quiz/check`, {
                                            userId: window.currentUserId,
                                            question: question,
                                            options: options,
                                            userAnswer: userAnswer
                                        });
                    
                                        if (checkRes.data.correct) {
                                            showToast(checkRes.data.explanation);
                                            await api.completeDailyTask(window.currentUserId, taskId, {
                                                answer: userAnswer,
                                                timestamp: Date.now()
                                            });
                                            closeModal();
                                            await TaskPanel.render();
                                            await loadResources();
                                        } else {
                                            showToast(checkRes.data.explanation, true);
                                            closeModal();
                                        }
                                    } catch (err) {
                                        showToast('判题失败', true);
                                        closeModal();
                                    }
                                };
                            });
                        } catch (err) {
                            showToast('获取题目失败', true);
                        }
                        return;
                    }
                    
                    if (taskId === 'share') {
                        const shareText = '我在宝宝溯源果园种了一棵果树，收获了安全健康的果泥！快来一起种植吧~';
                        const shareUrl = window.location.href;
    
                        try {
                            await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                            showToast('📋 链接已复制！分享给好友后点击确认');
        
                            showModal('分享果树', `
                                <div style="text-align:center; padding:15px;">
                                    <div style="font-size:50px; margin-bottom:10px;">🌳</div>
                                    <p style="margin-bottom:15px;">📋 链接已复制到剪贴板！</p>
                                    <p style="margin-bottom:20px; color:#666; font-size:14px;">分享给好友后，点击下方按钮完成任务</p>
                                    <button id="confirmShareBtn" class="btn-primary" style="padding:12px 24px;">✅ 我已分享</button>
                                </div>
                            `);
        
                            document.getElementById('confirmShareBtn').onclick = async () => {
                                closeModal();
                                await api.completeDailyTask(window.currentUserId, taskId, {
                                    timestamp: Date.now(),
                                    sharedAt: new Date().toISOString()
                                });
                                showToast('分享任务完成！获得奖励');
                                await TaskPanel.render();
                                await loadResources();
                            };
                        } catch(err) {
                            showToast('复制失败，请手动复制链接', true);
                        }
                        return;
                    }
                    
                    try {
                        await api.completeDailyTask(window.currentUserId, taskId, payload);
                        showToast('任务完成，奖励已发放');
                        await TaskPanel.render();
                        await loadResources();
                    } catch(e) { 
                        showToast(e.response?.data?.error || '失败', true); 
                    }
                };
            });
            
            // 绑定成长任务
            document.querySelectorAll('[data-type="growth"]').forEach(btn => {
                btn.onclick = async () => {
                    const taskId = btn.dataset.taskId;

                    // 视频任务特殊处理
                    if (taskId === 'video') {
                        const videoContainerId = `video_${Date.now()}`;
                        
                        showModal('🎬 区块链溯源视频', `
                            <div style="padding:10px;">
                                <canvas id="${videoContainerId}" width="400" height="300" style="width:100%; height:auto; border-radius:12px; background:#1a1a2e; margin-bottom:15px;"></canvas>
                                <div style="display:flex; gap:10px; margin-bottom:15px;">
                                    <button id="playVideoBtn" class="btn" style="flex:1;">▶ 播放</button>
                                    <button id="replayVideoBtn" class="btn" style="flex:1;">🔄 重播</button>
                                </div>
                                <button id="videoCompleteBtn" class="btn-primary" style="width:100%; padding:12px;">✅ 观看完成，领取奖励</button>
                                <p style="font-size:11px; color:#999; text-align:center; margin-top:10px;">播放完整视频后即可领取奖励</p>
                            </div>
                        `);
                        
                        let animationId = null;
                        let isPlaying = false;
                        
                        const canvas = document.getElementById(videoContainerId);
                        const ctx = canvas.getContext('2d');
                        canvas.width = 400;
                        canvas.height = 300;
                        
                        // 绘制帧函数
                        function drawFrame(progress) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            
                            // 背景渐变
                            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                            gradient.addColorStop(0, '#0f0c29');
                            gradient.addColorStop(0.5, '#302b63');
                            gradient.addColorStop(1, '#24243e');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            // 网格线
                            ctx.strokeStyle = 'rgba(46, 204, 113, 0.2)';
                            ctx.lineWidth = 1;
                            for(let i = 0; i < canvas.width; i += 30) {
                                ctx.beginPath();
                                ctx.moveTo(i, 0);
                                ctx.lineTo(i, canvas.height);
                                ctx.stroke();
                                ctx.beginPath();
                                ctx.moveTo(0, i);
                                ctx.lineTo(canvas.width, i);
                                ctx.stroke();
                            }
                            
                            // 标题
                            ctx.fillStyle = '#2ecc71';
                            ctx.font = 'bold 18px "Segoe UI"';
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = '#2ecc71';
                            ctx.fillText('🔗 区块链溯源', canvas.width/2 - 80, 40);
                            ctx.shadowBlur = 0;
                            
                            // 土地
                            ctx.fillStyle = '#8B5A2B';
                            ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
                            
                            // 树（随进度生长）
                            const trunkX = canvas.width/2;
                            const trunkY = canvas.height - 80 - 20 * Math.min(1, progress * 2);
                            ctx.fillStyle = '#6D4C41';
                            ctx.fillRect(trunkX - 5, trunkY, 10, 20 + 20 * Math.min(1, progress * 2));
                            
                            const treeSize = 12 + 40 * Math.min(1, progress);
                            ctx.fillStyle = '#66BB6A';
                            ctx.beginPath();
                            ctx.arc(trunkX, trunkY - 5, treeSize, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // 文字提示
                            if (progress < 0.33) {
                                ctx.fillStyle = '#FFD700';
                                ctx.font = '12px "Segoe UI"';
                                ctx.fillText('🌱 果树种植上链', canvas.width/2 - 60, 80);
                            } else if (progress < 0.66) {
                                ctx.fillStyle = '#FFD700';
                                ctx.font = '12px "Segoe UI"';
                                ctx.fillText('📊 成长数据写入区块链', canvas.width/2 - 85, 80);
                                ctx.fillStyle = '#2ecc71';
                                ctx.font = '10px monospace';
                                ctx.fillText('Block #' + Math.floor(Date.now() / 1000) % 10000, canvas.width/2 - 60, 100);
                            } else {
                                ctx.fillStyle = '#FFD700';
                                ctx.font = '12px "Segoe UI"';
                                ctx.fillText('🍎 收获信息上链 | 溯源可查', canvas.width/2 - 100, 80);
                                ctx.fillStyle = '#aaa';
                                ctx.font = '9px monospace';
                                ctx.fillText('✓ 已存入IPFS', canvas.width/2 - 45, 160);
                                ctx.fillText('✓ 智能合约验证', canvas.width/2 - 45, 175);
                            }
                            
                            // 果实（成熟后出现）
                            if (progress > 0.6) {
                                for(let i = 0; i < 5; i++) {
                                    const angle = i * Math.PI * 2 / 5 + Date.now() / 500;
                                    const x = trunkX + Math.cos(angle) * (treeSize - 5);
                                    const y = trunkY - 10 + Math.sin(angle) * (treeSize - 8);
                                    ctx.fillStyle = '#FF5252';
                                    ctx.beginPath();
                                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.fillStyle = '#D32F2F';
                                    ctx.beginPath();
                                    ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                            
                            // 进度条
                            const barWidth = canvas.width - 40;
                            ctx.fillStyle = 'rgba(255,255,255,0.2)';
                            ctx.fillRect(20, canvas.height - 30, barWidth, 6);
                            ctx.fillStyle = '#2ecc71';
                            ctx.fillRect(20, canvas.height - 30, barWidth * progress, 6);
                            ctx.fillStyle = 'white';
                            ctx.font = '10px monospace';
                            ctx.fillText(`${Math.floor(progress * 100)}%`, canvas.width - 50, canvas.height - 22);
                        }
                        
                        let startTime = null;
                        let videoProgress = 0;
                        let videoComplete = false;
                        
                        function animateVideo(timestamp) {
                            if (!isPlaying) return;
                            if (!startTime) startTime = timestamp;
                            const elapsed = (timestamp - startTime) / 1000;
                            videoProgress = Math.min(1, elapsed / 5);
                            drawFrame(videoProgress);
                            if (videoProgress < 1) {
                                animationId = requestAnimationFrame(animateVideo);
                            } else {
                                videoComplete = true;
                                isPlaying = false;
                                showToast('✅ 视频播放完成，点击领取奖励');
                            }
                        }
                        
                        // 播放按钮
                        document.getElementById('playVideoBtn').onclick = () => {
                            if (isPlaying) return;
                            if (videoComplete) {
                                startTime = null;
                                videoProgress = 0;
                                videoComplete = false;
                            }
                            isPlaying = true;
                            animationId = requestAnimationFrame(animateVideo);
                        };
                        
                        // 重播按钮
                        document.getElementById('replayVideoBtn').onclick = () => {
                            if (animationId) cancelAnimationFrame(animationId);
                            startTime = null;
                            videoProgress = 0;
                            videoComplete = false;
                            isPlaying = true;
                            drawFrame(0);
                            animationId = requestAnimationFrame(animateVideo);
                        };
                        
                        // 初始绘制
                        drawFrame(0);
                        
                        // 完成任务按钮
                        document.getElementById('videoCompleteBtn').onclick = async () => {
                            if (!videoComplete) {
                                showToast('请先完整观看视频！', true);
                                return;
                            }
                            closeModal();
                            if (animationId) cancelAnimationFrame(animationId);
                            await api.completeGrowthTask(window.currentUserId, taskId);
                            showToast('🎉 观看完成！+10 溯源碎片');
                            await TaskPanel.render();
                            await loadResources();
                        };
                        return;
                    }
                    
                    // 其他成长任务
                    try {
                        await api.completeGrowthTask(window.currentUserId, taskId);
                        showToast('成长任务完成');
                        await TaskPanel.render();
                        await loadResources();
                        if (taskId === 'profile') await BabyProfileComponent.renderModal();
                    } catch(e) { 
                        showToast(e.response?.data?.error, true); 
                    }
                };
            });
        } catch(e) { 
            container.innerHTML = '<p>任务加载失败</p>'; 
        }
    }
};