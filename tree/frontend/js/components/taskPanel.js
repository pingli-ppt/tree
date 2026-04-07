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
                        // 获取随机题目弹窗
                        const quizRes = await api.getQuizQuestion();
                        const q = quizRes.data;
                        const answer = prompt(`答题: ${q.question}\n选项: A 正确 B 错误 C 不确定 (请输入答案字母)`);
                        payload = { answer: answer?.toUpperCase(), questionId: q.id };
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