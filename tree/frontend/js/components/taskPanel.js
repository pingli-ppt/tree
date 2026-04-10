// frontend/js/components/taskPanel.js
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
                            const quizRes = await axios.get(`/api/quiz/question?userId=${window.currentUserId}`);
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
                                        const checkRes = await axios.post('/api/quiz/check', {
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
                        return; // 重要：避免继续执行下面的prompt逻辑
                    }
                    try {
                        await api.completeDailyTask(window.currentUserId, taskId, payload);
                        showToast('任务完成，奖励已发放');
                        await TaskPanel.render();
                        await loadResources();
                    } catch(e) { showToast(e.response?.data?.error || '失败', true); }
                };
            });
            document.querySelectorAll('[data-type="growth"]').forEach(btn => {
                btn.onclick = async () => {
                    const taskId = btn.dataset.taskId;
                    try {
                        await api.completeGrowthTask(window.currentUserId, taskId);
                        showToast('成长任务完成');
                        await TaskPanel.render();
                        await loadResources();
                        if (taskId === 'profile') await BabyProfileComponent.renderModal(); // 完善档案
                    } catch(e) { showToast(e.response?.data?.error, true); }
                };
            });
        } catch(e) { container.innerHTML = '<p>任务加载失败</p>'; }
    }
};