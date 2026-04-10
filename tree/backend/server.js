// 1. 最先加载环境变量
require('dotenv').config();

// 2. 然后引入其他模块
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const treeRoutes = require('./routes/tree');
const taskRoutes = require('./routes/task');
const resourceRoutes = require('./routes/resource');
const redeemRoutes = require('./routes/redeem');
const traceRoutes = require('./routes/trace');
const nutritionRoutes = require('./routes/nutrition');
const customPureeRoutes = require('./routes/customPuree');
const quizRoutes = require('./routes/quiz');

// 3. 连接数据库
connectDB();

// 4. 创建 Express 实例
const app = express();

// 5. 全局中间件
app.use(cors());
app.use(express.json());

// 6. 提供前端静态文件
app.use(express.static(path.join(__dirname, '../frontend')));

// 7. API 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/redeem', redeemRoutes);
app.use('/api/trace', traceRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/redeem', customPureeRoutes);
app.use('/api/quiz', quizRoutes);

// 8. 对于所有非 API 的 GET 请求，返回 index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// 9. 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
