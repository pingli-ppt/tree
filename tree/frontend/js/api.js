// frontend/js/api.js
const API_BASE = 'http://localhost:3000/api';

const api = {
    // 认证
    register: (data) => axios.post(`${API_BASE}/auth/register`, data),
    login: (data) => axios.post(`${API_BASE}/auth/login`, data),
    
    // 用户资源
    getResources: (userId) => axios.get(`${API_BASE}/resource`, { params: { userId } }),
    
    // 果树
    getTrees: (userId) => axios.get(`${API_BASE}/tree`, { params: { userId } }),
    accelerateTree: (userId, treeId, type) => axios.post(`${API_BASE}/tree/accelerate`, { userId, treeId, type }),
    harvestTree: (userId, treeId) => axios.post(`${API_BASE}/tree/harvest`, { userId, treeId }),
    plantCustomTree: (userId, treeType, customFormula) => axios.post(`${API_BASE}/tree/plantCustom`, { userId, treeType, customFormula }),
    plantSeasonalTree: (userId) => axios.post(`${API_BASE}/tree/plantSeasonal`, { userId }),
    
    // 任务
    getDailyTasks: (userId) => axios.get(`${API_BASE}/task/daily`, { params: { userId } }),
    completeDailyTask: (userId, taskId, payload = {}) => axios.post(`${API_BASE}/task/completeDaily`, { userId, taskId, ...payload }),
    getGrowthTasks: (userId) => axios.get(`${API_BASE}/task/growth`, { params: { userId } }),
    completeGrowthTask: (userId, taskId) => axios.post(`${API_BASE}/task/completeGrowth`, { userId, taskId }),
    
    // 兑换
    getUserCoupons: (userId) => axios.get(`${API_BASE}/redeem/coupons`, { params: { userId } }),
    redeemProduct: (userId, couponCode, address, customOptions) => axios.post(`${API_BASE}/redeem/redeem`, { userId, couponCode, address, customOptions }),
    exchangeCouponWithShards: (userId) => axios.post(`${API_BASE}/redeem/exchangeShards`, { userId }),
    
    // 溯源
    getTreeTrace: (treeId) => axios.get(`${API_BASE}/trace/tree/${treeId}`),
    
    // 营养知识
    getDailyTip: () => axios.get(`${API_BASE}/nutrition/tip`),
    searchKnowledge: (keyword, monthAge) => axios.get(`${API_BASE}/nutrition/search`, { params: { keyword, monthAge } }),
    getQuizQuestion: () => axios.get(`${API_BASE}/nutrition/quiz`),
    
    // 宝宝档案
    getBabyProfile: (userId) => axios.get(`${API_BASE}/user/profile`, { params: { userId } }),
    updateBabyProfile: (userId, data) => axios.put(`${API_BASE}/user/profile`, { userId, ...data }),
};

// 全局存储当前用户id
window.currentUserId = null;
window.authToken = null;

axios.interceptors.request.use(config => {
    if (window.authToken) {
        config.headers.Authorization = `Bearer ${window.authToken}`;
    }
    return config;
});