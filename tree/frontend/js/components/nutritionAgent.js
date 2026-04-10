// frontend/js/components/nutritionAgent.js
const NutritionAgent = {
    render: async () => {
        const container = document.getElementById('nutritionPanel');
        
        // 静态营养知识数据
        const nutritionData = {
            dailyTip: "🥣 6个月宝宝第一口辅食推荐强化铁米粉，从稀到稠，每次只加一种新食物，观察3天。",
            knowledgeList: [
                { title: "🍎 辅食添加顺序", content: "米粉 → 蔬菜泥 → 水果泥 → 肉泥 → 蛋黄，每添加一种新食物观察3天。" },
                { title: "🥩 补铁食物", content: "红肉泥（猪牛羊肉）、肝泥、强化铁米粉，吸收率最高。" },
                { title: "🚫 1岁内禁食", content: "蜂蜜（肉毒杆菌风险）、整颗坚果（窒息风险）、鲜牛奶（难消化）。" },
                { title: "🥕 常见过敏食物", content: "鸡蛋清、牛奶、大豆、花生、海鲜，添加时需特别留意。" },
                { title: "💧 喝水量", content: "6个月内母乳/配方奶已含足够水分，不需额外喝水；添加辅食后可少量喝水。" }
            ]
        };
        
        let html = `
            <div class="knowledge-card">
                <h3>📖 今日辅食知识</h3>
                <p>${nutritionData.dailyTip}</p>
            </div>
            <div class="search-box">
                <input id="searchKeyword" placeholder="搜索知识，如：补铁" />
                <button id="searchBtn" class="btn">搜索</button>
            </div>
            <div id="searchResults">
                ${nutritionData.knowledgeList.map(k => `
                    <div class="knowledge-card">
                        <h4>${k.title}</h4>
                        <p>${k.content}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
        
        // 搜索功能
        document.getElementById('searchBtn').onclick = () => {
            const keyword = document.getElementById('searchKeyword').value.toLowerCase();
            const results = nutritionData.knowledgeList.filter(k => 
                k.title.toLowerCase().includes(keyword) || 
                k.content.toLowerCase().includes(keyword)
            );
            
            const resultsHtml = results.length > 0 
                ? results.map(k => `<div class="knowledge-card"><h4>${k.title}</h4><p>${k.content}</p></div>`).join('')
                : '<p>未找到相关结果</p>';
            
            document.getElementById('searchResults').innerHTML = resultsHtml;
        };
    }
};