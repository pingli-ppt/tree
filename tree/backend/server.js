const express = require('express');
const cors = require('cors');
const path = require('path');        // 提供静态文件所需
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const treeRoutes = require('./routes/tree');
const taskRoutes = require('./routes/task');
const resourceRoutes = require('./routes/resource');
const redeemRoutes = require('./routes/redeem');
const traceRoutes = require('./routes/trace');
const nutritionRoutes = require('./routes/nutrition');

require('dotenv').config();

// 1. 连接数据库
connectDB();

// 2. 创建 Express 实例
const app = express();

// 3. 全局中间件
app.use(cors());
app.use(express.json());

// 4. 提供前端静态文件（关键：必须在路由之前，但要在 app 定义之后）
//    假设前端目录位于 backend 的上一级目录下的 frontend 文件夹
app.use(express.static(path.join(__dirname, '../frontend')));

// 5. API 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/redeem', redeemRoutes);
app.use('/api/trace', traceRoutes);
app.use('/api/nutrition', nutritionRoutes);

// 6. 对于所有非 API 的 GET 请求，返回 index.html（支持前端路由）
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// 7. 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));