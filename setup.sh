#!/bin/bash

# 创建项目目录结构
mkdir -p baby-fruit-game/{models,routes,public/{css,js},views}

# 创建后端文件
cat > baby-fruit-game/package.json << 'EOF'
{
  "name": "baby-fruit-game",
  "version": "1.0.0",
  "description": "婴幼儿溯源果泥种植游戏+宝妈营养攻略Agent",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

cat > baby-fruit-game/.env << 'EOF'
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI=mongodb://localhost:27017/baby_fruit_game
PORT=3000
EOF

cat > baby-fruit-game/server.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 引入模型
const User = require('./models/User');
const FruitTree = require('./models/FruitTree');
const Voucher = require('./models/Voucher');
const TaskProgress = require('./models/TaskProgress');

// 引入路由
const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);

// 前端路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
EOF

cat > baby-fruit-game/models/User.js << 'EOF'
const mongoose = require('mongoose');

const babyProfileSchema = new mongoose.Schema({
  monthAge: { type: Number, default: 6 },
  allergies: { type: String, default: '' },
  dietaryPreference: { type: String, default: '' },
  hasConstipation: { type: Boolean, default: false },
  hasWeakStomach: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  babyProfile: babyProfileSchema,
  // 道具数量
  fertilizer: { type: Number, default: 3 },
  water: { type: Number, default: 3 },
  shards: { type: Number, default: 0 },
  // 成长任务完成标志
  completedTasks: {
    type: Map,
    of: Boolean,
    default: {
      completeBabyProfile: false,
      watchVideo: false,
      firstOrder: false,
      shareFeedback: false
    }
  },
  // 每日任务状态
  dailySignDate: { type: String, default: '' },
  dailyAnswerDate: { type: String, default: '' },
  dailyViewTraceDate: { type: String, default: '' },
  dailyShareDate: { type: String, default: '' },
  // 季节任务
  seasonTreeUnlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
EOF

cat > baby-fruit-game/models/FruitTree.js << 'EOF'
const mongoose = require('mongoose');

const fruitTreeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  treeType: { type: String, required: true }, // 'basic', 'custom', 'season'
  treeSubType: { type: String, required: true }, // 'apple', 'banana', 'dragonfruit', 'peach', 'cherry' etc.
  stage: { type: Number, default: 0 }, // 0:幼苗,1:开花,2:结果,3:成熟,4:可收获
  plantedAt: { type: Date, default: Date.now },
  acceleratedSeconds: { type: Number, default: 0 }, // 累计加速秒数
  isHarvested: { type: Boolean, default: false },
  // 溯源关联数据（模拟区块链存证）
  blockchainTxId: { type: String, default: () => '0x' + Math.random().toString(36).substr(2, 16) },
  season: { type: String, default: '' }
});

// 阶段所需秒数: 幼苗1天,开花2天,结果3天,成熟1天 (单位:秒)
const STAGE_DURATIONS = [86400, 172800, 259200, 86400]; // 总计约7天

fruitTreeSchema.methods.getCurrentStage = function() {
  if (this.isHarvested) return 4;
  const elapsed = (Date.now() - this.plantedAt) / 1000 + this.acceleratedSeconds;
  let total = 0;
  for (let i = 0; i < STAGE_DURATIONS.length; i++) {
    if (elapsed < total + STAGE_DURATIONS[i]) {
      return i;
    }
    total += STAGE_DURATIONS[i];
  }
  return 4; // 成熟可收获
};

fruitTreeSchema.methods.getProgress = function() {
  const currentStage = this.getCurrentStage();
  if (currentStage >= 4) return 1;
  const elapsed = (Date.now() - this.plantedAt) / 1000 + this.acceleratedSeconds;
  let stageStart = 0;
  for (let i = 0; i < currentStage; i++) {
    stageStart += STAGE_DURATIONS[i];
  }
  const stageElapsed = elapsed - stageStart;
  const stageDuration = STAGE_DURATIONS[currentStage];
  return Math.min(0.99, stageElapsed / stageDuration);
};

module.exports = mongoose.model('FruitTree', fruitTreeSchema);
EOF

cat > baby-fruit-game/models/Voucher.js << 'EOF'
const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fruitTreeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FruitTree' },
  productName: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expireDate: { type: Date },
  orderId: { type: String }
});

module.exports = mongoose.model('Voucher', voucherSchema);
EOF

cat > baby-fruit-game/models/TaskProgress.js << 'EOF'
const mongoose = require('mongoose');

const taskProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastAnswerQuestion: { type: String, default: '' },
  answerCorrectToday: { type: Boolean, default: false }
});

module.exports = mongoose.model('TaskProgress', taskProgressSchema);
EOF

cat > baby-fruit-game/routes/api.js << 'EOF'
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FruitTree = require('../models/FruitTree');
const Voucher = require('../models/Voucher');
const TaskProgress = require('../models/TaskProgress');

const router = express.Router();

// 认证中间件
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();
    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    res.status(401).json({ error: '请先登录' });
  }
};

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    
    // 创建初始果树（根据月龄6月龄默认苹果树）
    const tree = new FruitTree({
      userId: user._id,
      treeType: 'basic',
      treeSubType: 'apple'
    });
    await tree.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('用户名或密码错误');
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// 获取用户信息
router.get('/user/profile', auth, async (req, res) => {
  res.json({ user: req.user, babyProfile: req.user.babyProfile });
});

// 更新宝宝档案
router.put('/user/profile', auth, async (req, res) => {
  req.user.babyProfile = { ...req.user.babyProfile, ...req.body };
  // 完成成长任务
  if (!req.user.completedTasks.get('completeBabyProfile')) {
    req.user.completedTasks.set('completeBabyProfile', true);
    // 奖励: 解锁定制果树
    const customTree = new FruitTree({
      userId: req.userId,
      treeType: 'custom',
      treeSubType: req.user.babyProfile.hasConstipation ? 'dragonfruit' : 'yam'
    });
    await customTree.save();
    req.user.fertilizer += 2;
    await req.user.save();
  }
  await req.user.save();
  res.json({ success: true, babyProfile: req.user.babyProfile });
});

// 获取用户果树列表
router.get('/trees', auth, async (req, res) => {
  const trees = await FruitTree.find({ userId: req.userId });
  const treesWithStage = trees.map(tree => ({
    ...tree.toObject(),
    currentStage: tree.getCurrentStage(),
    progress: tree.getProgress()
  }));
  res.json(treesWithStage);
});

// 加速果树
router.post('/trees/:treeId/accelerate', auth, async (req, res) => {
  const { type } = req.body; // 'fertilizer' or 'water'
  const tree = await FruitTree.findOne({ _id: req.params.treeId, userId: req.userId });
  if (!tree) return res.status(404).json({ error: '果树不存在' });
  if (tree.getCurrentStage() >= 4) return res.json({ error: '果树已成熟' });
  
  let costAmount = 1;
  let accelerateSecs = 86400; // 加速一天
  if (type === 'fertilizer' && req.user.fertilizer >= costAmount) {
    req.user.fertilizer -= costAmount;
    tree.acceleratedSeconds += accelerateSecs;
    await tree.save();
    await req.user.save();
    res.json({ success: true, remainingFertilizer: req.user.fertilizer });
  } else if (type === 'water' && req.user.water >= costAmount) {
    req.user.water -= costAmount;
    tree.acceleratedSeconds += accelerateSecs/2; // 水滴加速半天
    await tree.save();
    await req.user.save();
    res.json({ success: true, remainingWater: req.user.water });
  } else {
    res.status(400).json({ error: '道具不足' });
  }
});

// 收获果树
router.post('/trees/:treeId/harvest', auth, async (req, res) => {
  const tree = await FruitTree.findOne({ _id: req.params.treeId, userId: req.userId });
  if (!tree) return res.status(404).json({ error: '果树不存在' });
  if (tree.getCurrentStage() < 4 || tree.isHarvested) {
    return res.status(400).json({ error: '果树尚未成熟或已收获' });
  }
  
  tree.isHarvested = true;
  let productName = '';
  if (tree.treeType === 'basic') {
    productName = tree.treeSubType === 'apple' ? '苹果泥' : '香蕉混合泥';
  } else if (tree.treeType === 'custom') {
    productName = tree.treeSubType === 'dragonfruit' ? '火龙果山药泥' : '山药泥';
  } else {
    productName = '季节限定果泥';
  }
  
  const voucher = new Voucher({
    userId: req.userId,
    fruitTreeId: tree._id,
    productName,
    expireDate: new Date(Date.now() + 90 * 86400000)
  });
  await voucher.save();
  await tree.save();
  res.json({ success: true, voucher });
});

// 每日任务: 签到
router.post('/tasks/daily/sign', auth, async (req, res) => {
  const today = new Date().toDateString();
  if (req.user.dailySignDate === today) {
    return res.status(400).json({ error: '今日已签到' });
  }
  req.user.dailySignDate = today;
  req.user.water += 1;
  await req.user.save();
  res.json({ success: true, water: req.user.water });
});

// 辅食知识答题 (题库)
const questions = [
  { question: '6月龄宝宝适合吃哪种果泥？', options: ['苹果泥', '芒果泥', '菠萝泥'], answer: 0 },
  { question: '便秘宝宝适合吃哪种水果？', options: ['香蕉', '火龙果', '苹果'], answer: 1 },
  { question: '我们的果泥原材料采用什么技术保证可信追溯？', options: ['区块链', '二维码', 'RFID'], answer: 0 }
];
router.post('/tasks/daily/answer', auth, async (req, res) => {
  const { questionIndex, answerIndex } = req.body;
  const today = new Date().toDateString();
  if (req.user.dailyAnswerDate === today) {
    return res.status(400).json({ error: '今日已完成答题' });
  }
  const q = questions[questionIndex];
  if (!q || q.answer !== answerIndex) {
    return res.status(400).json({ error: '答案错误' });
  }
  req.user.dailyAnswerDate = today;
  req.user.fertilizer += 1;
  await req.user.save();
  res.json({ success: true, fertilizer: req.user.fertilizer, correct: true });
});

// 每日任务: 查看溯源内容
router.post('/tasks/daily/viewTrace', auth, async (req, res) => {
  const today = new Date().toDateString();
  if (req.user.dailyViewTraceDate === today) {
    return res.status(400).json({ error: '今日已完成' });
  }
  req.user.dailyViewTraceDate = today;
  req.user.water += 1;
  await req.user.save();
  res.json({ success: true, water: req.user.water });
});

// 每日任务: 分享
router.post('/tasks/daily/share', auth, async (req, res) => {
  const today = new Date().toDateString();
  if (req.user.dailyShareDate === today) {
    return res.status(400).json({ error: '今日已分享' });
  }
  req.user.dailyShareDate = today;
  req.user.fertilizer += 1;
  await req.user.save();
  res.json({ success: true, fertilizer: req.user.fertilizer });
});

// 成长任务: 观看视频
router.post('/tasks/growth/watchVideo', auth, async (req, res) => {
  if (req.user.completedTasks.get('watchVideo')) {
    return res.status(400).json({ error: '已完成' });
  }
  req.user.completedTasks.set('watchVideo', true);
  req.user.shards += 10;
  await req.user.save();
  res.json({ success: true, shards: req.user.shards });
});

// 成长任务: 模拟首次下单
router.post('/tasks/growth/firstOrder', auth, async (req, res) => {
  if (req.user.completedTasks.get('firstOrder')) {
    return res.status(400).json({ error: '已完成' });
  }
  req.user.completedTasks.set('firstOrder', true);
  // 解锁季节限定果树
  const seasonTree = new FruitTree({
    userId: req.userId,
    treeType: 'season',
    treeSubType: 'cherry',
    season: 'spring'
  });
  await seasonTree.save();
  req.user.fertilizer += 2;
  await req.user.save();
  res.json({ success: true, message: '已解锁季节果树' });
});

// 兑换优惠券 (溯源碎片)
router.post('/exchange/coupon', auth, async (req, res) => {
  if (req.user.shards >= 10) {
    req.user.shards -= 10;
    await req.user.save();
    res.json({ success: true, coupon: '满30减5优惠券', shards: req.user.shards });
  } else {
    res.status(400).json({ error: '碎片不足' });
  }
});

// 获取溯源数据 (区块链模拟)
router.get('/trace/:treeId', auth, async (req, res) => {
  const tree = await FruitTree.findOne({ _id: req.params.treeId, userId: req.userId });
  if (!tree) return res.status(404).json({ error: '果树不存在' });
  res.json({
    blockchainTxId: tree.blockchainTxId,
    baseInfo: '云南高山种植基地',
    soilData: 'pH 6.5, 湿度65%',
    fertilizerRecord: '有机肥, 2024年3月施用',
    reportUrl: 'https://example.com/report',
    timestamp: new Date().toISOString()
  });
});

// 营养攻略Agent
router.post('/agent/chat', auth, async (req, res) => {
  const { message } = req.body;
  const age = req.user.babyProfile.monthAge;
  let reply = '';
  if (message.includes('便秘')) {
    reply = `根据宝宝${age}月龄，建议食用火龙果泥或西梅泥，富含膳食纤维，促进排便。`;
  } else if (message.includes('过敏')) {
    reply = `请避开已知过敏原，建议从单一果泥开始尝试，观察3天无反应再添加新品种。`;
  } else if (message.includes('辅食')) {
    reply = `${age}月龄宝宝每日可添加1-2次果泥，每次20-30g，注意从稀到稠。`;
  } else {
    reply = `您好！我是您的专属营养顾问。宝宝${age}月龄，可以尝试苹果泥、香蕉泥。有任何辅食问题请随时提问~`;
  }
  res.json({ reply });
});

module.exports = router;
EOF

# 前端文件
cat > baby-fruit-game/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>宝宝专属果园 - 溯源果泥种植乐园</title>
    <link rel="stylesheet" href="/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- 登录注册界面 -->
        <div id="authPanel" class="auth-panel">
            <h2>🌱 宝宝果园</h2>
            <div class="tab-buttons">
                <button class="tab-btn active" onclick="showLogin(true)">登录</button>
                <button class="tab-btn" onclick="showLogin(false)">注册</button>
            </div>
            <div id="loginForm">
                <input type="text" id="loginUsername" placeholder="用户名" />
                <input type="password" id="loginPassword" placeholder="密码" />
                <button onclick="handleLogin()">登录</button>
            </div>
            <div id="registerForm" style="display:none">
                <input type="text" id="regUsername" placeholder="用户名" />
                <input type="password" id="regPassword" placeholder="密码" />
                <button onclick="handleRegister()">注册</button>
            </div>
        </div>

        <!-- 主游戏界面 -->
        <div id="mainGame" style="display:none">
            <header>
                <h2>🍎 我的果树庄园</h2>
                <div class="resources">
                    💧 水滴: <span id="waterCount">0</span> &nbsp;| 🌿 肥料: <span id="fertilizerCount">0</span> &nbsp;| 🧩 溯源碎片: <span id="shardCount">0</span>
                </div>
            </header>

            <!-- 宝宝档案简表 -->
            <div class="baby-card" onclick="openBabyProfile()">
                👶 宝宝档案 (点击完善) | 月龄: <span id="babyAge">6</span>个月
            </div>

            <!-- 果树展示区 -->
            <div class="trees-container" id="treesList"></div>

            <!-- 任务面板 -->
            <div class="task-panel">
                <h3>📋 每日任务</h3>
                <div class="task-item" onclick="dailySign()">✅ 签到领水滴</div>
                <div class="task-item" onclick="dailyAnswer()">🧠 辅食答题得肥料</div>
                <div class="task-item" onclick="dailyViewTrace()">🔍 查看溯源内容</div>
                <div class="task-item" onclick="dailyShare()">📤 分享得肥料</div>
                <h3>🌟 成长任务</h3>
                <div class="task-item" onclick="watchVideoTask()">🎥 观看区块链溯源视频 (+10碎片)</div>
                <div class="task-item" onclick="mockFirstOrder()">🛒 模拟首次下单 (解锁季节果树)</div>
                <h3>🌸 季节限定</h3>
                <div class="task-item" onclick="claimSeasonTree()">🌳 领取季节果树 (春季樱桃)</div>
            </div>

            <!-- 兑换区 -->
            <div class="exchange-panel">
                <button onclick="exchangeCoupon()">🔄 10碎片兑换优惠券</button>
                <button onclick="viewMyVouchers()">🎫 我的兑换券</button>
            </div>

            <!-- 营养攻略Agent -->
            <div class="agent-panel">
                <h3>🤖 宝妈营养攻略Agent</h3>
                <div class="chat-box" id="chatBox">
                    <div class="msg bot">您好！我是您的专属营养顾问，可以问我辅食问题~</div>
                </div>
                <div class="chat-input">
                    <input type="text" id="chatInput" placeholder="例如：便秘吃什么？" />
                    <button onclick="sendChat()">发送</button>
                </div>
            </div>
        </div>
    </div>

    <script src="/js/app.js"></script>
</body>
</html>
EOF

cat > baby-fruit-game/public/css/style.css << 'EOF'
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
body {
    background: #f0f7e8;
    font-family: system-ui, 'Segoe UI', 'PingFang SC', Roboto, sans-serif;
    padding: 16px;
}
.app-container {
    max-width: 500px;
    margin: 0 auto;
}
.auth-panel {
    background: white;
    border-radius: 32px;
    padding: 24px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    text-align: center;
}
.auth-panel input {
    width: 100%;
    padding: 12px;
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 24px;
}
.auth-panel button {
    background: #6ba539;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 40px;
    font-size: 16px;
    margin-top: 10px;
    cursor: pointer;
}
.tab-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}
.tab-btn {
    flex:1;
    background: #e9ecef;
    color: #2c3e2f;
}
.active {
    background: #6ba539;
    color: white;
}
#mainGame header {
    background: white;
    border-radius: 28px;
    padding: 12px 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.resources {
    font-size: 14px;
    background: #fef9e3;
    padding: 8px;
    border-radius: 40px;
    text-align: center;
    margin-top: 8px;
}
.baby-card {
    background: #ffe6c7;
    padding: 12px;
    border-radius: 28px;
    margin-bottom: 16px;
    text-align: center;
    font-weight: bold;
    cursor: pointer;
}
.tree-card {
    background: white;
    border-radius: 28px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.tree-name {
    font-size: 20px;
    font-weight: bold;
}
.progress-bar {
    background: #e0e0e0;
    border-radius: 20px;
    height: 10px;
    margin: 12px 0;
    overflow: hidden;
}
.progress-fill {
    background: #6ba539;
    width: 0%;
    height: 100%;
    border-radius: 20px;
}
.tree-actions button {
    background: #ffb347;
    border: none;
    padding: 8px 16px;
    border-radius: 40px;
    margin-right: 10px;
    cursor: pointer;
}
.task-panel, .exchange-panel, .agent-panel {
    background: white;
    border-radius: 28px;
    padding: 16px;
    margin-top: 16px;
}
.task-item {
    background: #f2f9ec;
    padding: 10px;
    border-radius: 40px;
    margin: 8px 0;
    cursor: pointer;
    transition: 0.2s;
}
.task-item:active { background: #d9e8cf; }
.chat-box {
    background: #f8f9fa;
    border-radius: 20px;
    height: 180px;
    overflow-y: auto;
    padding: 12px;
    margin-bottom: 8px;
}
.msg {
    margin: 8px 0;
    padding: 6px 12px;
    border-radius: 20px;
}
.msg.user { background: #d1e7dd; text-align: right; }
.msg.bot { background: #e2e3e5; }
.chat-input {
    display: flex;
    gap: 8px;
}
.chat-input input {
    flex: 1;
    padding: 10px;
    border-radius: 40px;
    border: 1px solid #ccc;
}
.chat-input button {
    background: #6ba539;
    border: none;
    border-radius: 40px;
    padding: 0 20px;
    color: white;
}
button {
    background: #6ba539;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 40px;
    cursor: pointer;
}
EOF

cat > baby-fruit-game/public/js/app.js << 'EOF'
let token = null;
let userId = null;
let currentTrees = [];

// 通用请求封装
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

function showLogin(isLogin) {
    document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
    document.getElementById('registerForm').style.display = isLogin ? 'none' : 'block';
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach((btn, idx) => {
        if ((isLogin && idx===0) || (!isLogin && idx===1)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const res = await api.post('/login', { username, password });
        token = res.data.token;
        userId = res.data.user.id;
        localStorage.setItem('token', token);
        initMainApp();
    } catch(err) {
        alert('登录失败：' + (err.response?.data?.error || '网络错误'));
    }
}
async function handleRegister() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    try {
        const res = await api.post('/register', { username, password });
        token = res.data.token;
        userId = res.data.user.id;
        localStorage.setItem('token', token);
        initMainApp();
    } catch(err) {
        alert('注册失败');
    }
}
async function initMainApp() {
    document.getElementById('authPanel').style.display = 'none';
    document.getElementById('mainGame').style.display = 'block';
    await loadUserData();
    await loadTrees();
    loadResources();
}
async function loadUserData() {
    const res = await api.get('/user/profile');
    const age = res.data.babyProfile.monthAge || 6;
    document.getElementById('babyAge').innerText = age;
    document.getElementById('waterCount').innerText = res.data.user.water;
    document.getElementById('fertilizerCount').innerText = res.data.user.fertilizer;
    document.getElementById('shardCount').innerText = res.data.user.shards;
}
async function loadResources() {
    const res = await api.get('/user/profile');
    document.getElementById('waterCount').innerText = res.data.user.water;
    document.getElementById('fertilizerCount').innerText = res.data.user.fertilizer;
    document.getElementById('shardCount').innerText = res.data.user.shards;
}
async function loadTrees() {
    const res = await api.get('/trees');
    currentTrees = res.data;
    renderTrees();
}
function renderTrees() {
    const container = document.getElementById('treesList');
    container.innerHTML = '';
    currentTrees.forEach(tree => {
        const stageNames = ['🌱 幼苗期', '🌸 开花期', '🍊 结果期', '🍎 成熟期', '🎁 可收获'];
        const stageIdx = tree.currentStage;
        const progressPercent = tree.progress * 100;
        const card = document.createElement('div');
        card.className = 'tree-card';
        card.innerHTML = `
            <div class="tree-name">${getTreeDisplayName(tree)}</div>
            <div>${stageNames[stageIdx]} ${stageIdx>=4 ? '✅' : ''}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${progressPercent}%"></div></div>
            <div class="tree-actions">
                ${stageIdx < 4 ? `<button onclick="accelerateTree('${tree._id}', 'fertilizer')">🌿 施肥加速</button>
                <button onclick="accelerateTree('${tree._id}', 'water')">💧 浇水加速</button>` : ''}
                ${stageIdx >=4 && !tree.isHarvested ? `<button onclick="harvestTree('${tree._id}')">🎁 收获果实</button>` : ''}
                <button onclick="viewTrace('${tree._id}')">🔗 区块链溯源</button>
            </div>
        `;
        container.appendChild(card);
    });
}
function getTreeDisplayName(tree) {
    const map = { apple:'苹果树', banana:'香蕉树', dragonfruit:'火龙果树', yam:'山药树', cherry:'樱桃树' };
    return map[tree.treeSubType] || '神奇果树';
}
async function accelerateTree(treeId, type) {
    try {
        await api.post(`/trees/${treeId}/accelerate`, { type });
        await loadTrees();
        await loadResources();
        alert('加速成功！');
    } catch(err) {
        alert(err.response?.data?.error || '加速失败');
    }
}
async function harvestTree(treeId) {
    try {
        const res = await api.post(`/trees/${treeId}/harvest`);
        alert(`收获成功！获得${res.data.voucher.productName}兑换券`);
        await loadTrees();
        await loadResources();
    } catch(err) {
        alert('收获失败');
    }
}
async function viewTrace(treeId) {
    const res = await api.get(`/trace/${treeId}`);
    alert(`🌱 区块链溯源信息\n存证ID: ${res.data.blockchainTxId}\n种植基地: ${res.data.baseInfo}\n土壤数据: ${res.data.soilData}\n施肥记录: ${res.data.fertilizerRecord}\n数据已上链不可篡改`);
}
async function dailySign() {
    try {
        await api.post('/tasks/daily/sign');
        await loadResources();
        alert('签到成功 +1水滴');
    } catch(e) { alert('今日已签到或失败'); }
}
async function dailyAnswer() {
    const idx = prompt('请答题：6月龄宝宝适合吃哪种果泥？\n0:苹果泥 1:芒果泥 2:菠萝泥', '0');
    if (idx !== null) {
        try {
            await api.post('/tasks/daily/answer', { questionIndex: 0, answerIndex: parseInt(idx) });
            await loadResources();
            alert('答题正确 +1肥料');
        } catch(e) { alert('答题错误或今日已完成'); }
    }
}
async function dailyViewTrace() {
    try {
        await api.post('/tasks/daily/viewTrace');
        await loadResources();
        alert('查看溯源 +1水滴');
    } catch(e) { alert('操作失败'); }
}
async function dailyShare() {
    try {
        await api.post('/tasks/daily/share');
        await loadResources();
        alert('分享成功 +1肥料');
    } catch(e) { alert('分享失败'); }
}
async function watchVideoTask() {
    try {
        await api.post('/tasks/growth/watchVideo');
        await loadResources();
        alert('观看视频 +10溯源碎片');
    } catch(e) { alert('已完成或失败'); }
}
async function mockFirstOrder() {
    try {
        await api.post('/tasks/growth/firstOrder');
        await loadTrees();
        await loadResources();
        alert('首次下单成功，已解锁季节果树！');
    } catch(e) { alert('任务已完成'); }
}
async function claimSeasonTree() {
    alert('请先完成首次下单任务自动领取季节果树，或等待季节活动开放');
}
async function exchangeCoupon() {
    try {
        const res = await api.post('/exchange/coupon');
        alert('兑换成功！获得满30减5优惠券');
        await loadResources();
    } catch(e) { alert('碎片不足'); }
}
async function viewMyVouchers() {
    alert('兑换券功能可在订单中心查看，收获果树时已自动生成');
}
async function sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML += `<div class="msg user">${msg}</div>`;
    input.value = '';
    const res = await api.post('/agent/chat', { message: msg });
    chatBox.innerHTML += `<div class="msg bot">${res.data.reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}
function openBabyProfile() {
    const age = prompt('请输入宝宝月龄(数字):', '6');
    if (age) {
        api.put('/user/profile', { monthAge: parseInt(age) }).then(() => {
            alert('宝宝档案已更新，解锁定制果树(如有便秘特征可获火龙果树)');
            loadUserData();
            loadTrees();
        });
    }
}
// 自动恢复token
const storedToken = localStorage.getItem('token');
if (storedToken) {
    token = storedToken;
    api.get('/user/profile').then(() => {
        initMainApp();
    }).catch(()=>{
        localStorage.removeItem('token');
        location.reload();
    });
}
EOF

echo "项目创建完成！请进入 baby-fruit-game 目录，执行 npm install 并确保 MongoDB 运行，然后 npm start"