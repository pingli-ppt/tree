const express = require('express');
const router = express.Router();
const axios = require('axios');

const COZE_API = 'https://api.coze.cn/v3/chat';
const API_KEY = process.env.COZE_API_KEY;
const BOT_ID = process.env.COZE_BOT_ID;

console.log('Quiz路由加载成功');
console.log('COZE_API_KEY:', API_KEY ? '已配置' : '未配置');
console.log('COZE_BOT_ID:', BOT_ID ? '已配置' : '未配置');

async function callCoze(query, userId) {
    console.log('调用扣子API, query:', query);
    try {
        const response = await axios.post(COZE_API, {
            bot_id: BOT_ID,
            user_id: userId,
            stream: true,
            auto_save_history: false,
            additional_messages: [
                {
                    role: "user",
                    content: query,
                    content_type: "text"
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('扣子API响应成功');
        
        const rawData = response.data;
        let fullContent = '';
        
        const lines = rawData.split('\n');
        for (const line of lines) {
            if (line.startsWith('data:')) {
                try {
                    const jsonStr = line.substring(5).trim();
                    if (jsonStr && jsonStr !== '[DONE]') {
                        const data = JSON.parse(jsonStr);
                        if (data.content) {
                            fullContent += data.content;
                        }
                    }
                } catch (e) {}
            }
        }
        
        if (!fullContent) {
            const completedMatch = rawData.match(/event:conversation.message.completed\ndata:({.*?})\n\n/s);
            if (completedMatch) {
                try {
                    const completedData = JSON.parse(completedMatch[1]);
                    if (completedData.content) {
                        fullContent = completedData.content;
                    }
                } catch (e) {}
            }
        }
        
        if (fullContent) {
            // 清理重复和追问
            // 只移除JSON部分和追问，保留完整解析
            let cleaned = fullContent;
    
            // 1. 移除JSON部分
            cleaned = cleaned.split('{"msg_type"')[0];
    
            // 2. 移除追问（以"宝宝"开头的句子）
            const lines = cleaned.split('\n');
            const validLines = [];
            for (const line of lines) {
                // 保留以✅、❌、对、错开头的行，以及解析内容
                if (line.trim().startsWith('✅') || 
                    line.trim().startsWith('❌') ||
                    line.trim().startsWith('对，') ||
                    line.trim().startsWith('错，') ||
                    line.includes('解析：')) {
                    validLines.push(line);
                } else if (!line.trim().startsWith('宝宝')) {
                    // 不是追问的也保留
                    validLines.push(line);
                }
            }
    
            cleaned = validLines.join('\n');
            
            // 3. 如果还有重复（比如两遍相同的内容），只取第一次出现
            const halfLength = Math.floor(cleaned.length / 2);
            const firstHalf = cleaned.substring(0, halfLength);
            const secondHalf = cleaned.substring(halfLength);
            if (firstHalf === secondHalf) {
                cleaned = firstHalf;
            }

            const correctMatch = cleaned.match(/正确答案是\s*([A-D])/i);
            if (correctMatch && cleaned.includes('❌ 错')) {
                // 把开头的"❌ 错"改成"✅ 对"
                cleaned = cleaned.replace(/^❌\s*错[，,]\s*/, '');
                cleaned = cleaned.replace(/^❌\s*错/, '✅ 对');
            }
            
            console.log('清理后的内容:', cleaned);
            return cleaned;
        }
        
        console.error('无法从响应中提取内容:', rawData);
        throw new Error('响应格式异常');
    } catch (err) {
        console.error('扣子API调用失败:', err.response?.data || err.message);
        throw new Error('智能体服务异常');
    }
}

function parseQuestion(text) {
    console.log('原始文本:', text);
    
    // 清理文本：只取第一个"问题："到第四个选项之后的内容
    let content = text;
    
    // 如果包含重复的"问题："，只取第一次出现的内容
    const firstQuestionIndex = content.indexOf('问题：');
    const secondQuestionIndex = content.indexOf('问题：', firstQuestionIndex + 1);
    if (secondQuestionIndex > 0) {
        content = content.substring(0, secondQuestionIndex);
    }
    
    // 按行分割
    const lines = content.split('\n');
    let question = '';
    const options = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('问题：') && !question) {
            question = trimmed.replace('问题：', '').trim();
        } else if (trimmed.match(/^[A-D][\.\s]/) && options.length < 4) {
            // 清理选项中的多余内容
            let cleanOption = trimmed.split('问题：')[0].trim();
            options.push(cleanOption);
        }
        // 如果已经收集完4个选项，停止
        if (options.length === 4) break;
    }
    
    // 如果没找到问题，尝试用正则
    if (!question) {
        const questionMatch = content.match(/问题：([^\n]+)/);
        if (questionMatch) question = questionMatch[1].trim();
    }
    
    // 如果选项不足，使用默认题目
    if (options.length < 4) {
        console.warn('选项不足，使用默认题目');
        return {
            question: '宝宝几个月可以开始添加辅食？',
            options: ['A.3个月', 'B.4个月', 'C.6个月', 'D.8个月']
        };
    }
    
    const result = { question, options };
    console.log('解析结果:', result);
    return result;
}

router.get('/question', async (req, res) => {
    console.log('收到出题请求, userId:', req.query.userId);
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId不能为空' });
        }
        
        const rawText = await callCoze('出题', userId);
        console.log('智能体返回:', rawText);
        
        const { question, options } = parseQuestion(rawText);
        res.json({ success: true, question, options });
    } catch (err) {
        console.error('出题失败:', err.message);
        res.status(500).json({ error: err.message || '获取题目失败' });
    }
});

router.post('/check', async (req, res) => {
    console.log('收到判题请求');
    try {
        const { userId, question, userAnswer, options } = req.body;
        
        const fullQuestion = `${question}\nA.${options[0]}\nB.${options[1]}\nC.${options[2]}\nD.${options[3]}\n用户答案：${userAnswer}`;
        
        const query = `请判断：${fullQuestion}`;
        const result = await callCoze(query, userId);
        
        // ========== 修复：优先从"正确答案是"提取 ==========
        let isCorrect = false;
        
        // 1. 优先：从"正确答案是 X"提取（最可靠）
        const correctMatch = result.match(/正确答案是\s*([A-D])/i);
        if (correctMatch) {
            const correctAnswer = correctMatch[1];
            isCorrect = (correctAnswer === userAnswer);
        } 
        // 2. 如果没有"正确答案是"，再根据✅/❌判断
        else {
            if (result.includes('❌ 错') || result.includes('错误')) {
                isCorrect = false;
            } else if (result.includes('✅ 对') || result.includes('对，') || result.includes('正确')) {
                isCorrect = true;
            }
        }
        
        console.log('判题结果:', { userAnswer, isCorrect, result });
        res.json({ success: true, correct: isCorrect, explanation: result });
    } catch (err) {
        console.error('判题失败:', err.message);
        res.status(500).json({ error: err.message || '判断答案失败' });
    }
});

module.exports = router;