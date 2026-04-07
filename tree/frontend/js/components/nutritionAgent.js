// frontend/js/components/nutritionAgent.js
const NutritionAgent = {
    render: async () => {
        const container = document.getElementById('nutritionPanel');
        container.innerHTML = '<div>加载营养知识中...</div>';
        try {
            const tipRes = await api.getDailyTip();
            const tip = tipRes.data;
            let html = `<div class="knowledge-card"><h3>📖 今日辅食知识</h3><p>${tip?.content || '均衡辅食，呵护宝宝肠胃'}</p></div>
            <div class="search-box"><input id="searchKeyword" placeholder="搜索知识, 如: 便秘"/><button id="searchBtn" class="btn">搜索</button></div>
            <div id="searchResults"></div>`;
            container.innerHTML = html;
            document.getElementById('searchBtn').onclick = async () => {
                const keyword = document.getElementById('searchKeyword').value;
                const res = await api.searchKnowledge(keyword);
                const results = res.data;
                const resultHtml = results.map(k => `<div class="knowledge-card"><h4>${k.title}</h4><p>${k.content}</p></div>`).join('');
                document.getElementById('searchResults').innerHTML = resultHtml || '无结果';
            };
        } catch(e) { container.innerHTML = '<p>营养知识加载失败</p>'; }
    }
};