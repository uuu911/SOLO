export const EMOTION_TYPES = {
  anger: { name: '愤怒', basePrice: 10, weight: 1, color: '#e74c3c' },
  sadness: { name: '悲伤', basePrice: 8, weight: 1, color: '#3498db' },
  anxiety: { name: '焦虑', basePrice: 12, weight: 1, color: '#f39c12' },
  fear: { name: '恐惧', basePrice: 15, weight: 1, color: '#9b59b6' },
  jealousy: { name: '嫉妒', basePrice: 11, weight: 1, color: '#27ae60' }
};

export const EQUIPMENT_CONFIG = {
  extractor: {
    name: '情绪提取炉',
    description: '提高转化效率，降低每单位原料能源消耗',
    levels: [
      { level: 1, cost: 0, efficiency: 2 },
      { level: 2, cost: 500, efficiency: 1.8 },
      { level: 3, cost: 1200, efficiency: 1.5 },
      { level: 4, cost: 2500, efficiency: 1.2 },
      { level: 5, cost: 5000, efficiency: 1 }
    ]
  },
  energyCore: {
    name: '能源核心',
    description: '增加每日能源上限',
    levels: [
      { level: 1, cost: 0, maxEnergy: 50 },
      { level: 2, cost: 400, maxEnergy: 75 },
      { level: 3, cost: 1000, maxEnergy: 100 },
      { level: 4, cost: 2000, maxEnergy: 150 },
      { level: 5, cost: 4000, maxEnergy: 200 }
    ]
  },
  warehouse: {
    name: '仓库',
    description: '提升原料与产品容量上限',
    levels: [
      { level: 1, cost: 0, maxMaterial: 100, maxProduct: 50 },
      { level: 2, cost: 600, maxMaterial: 150, maxProduct: 75 },
      { level: 3, cost: 1500, maxMaterial: 200, maxProduct: 100 },
      { level: 4, cost: 3000, maxMaterial: 300, maxProduct: 150 },
      { level: 5, cost: 6000, maxMaterial: 400, maxProduct: 200 }
    ]
  }
};

export const RANDOM_EVENTS = [
  {
    id: 'equipment_malfunction',
    name: '设备故障',
    description: '情绪提取炉发生故障，今日能源减少20%',
    probability: 0.1,
    effect: (state) => {
      const energyLoss = Math.floor(state.energy * 0.2);
      state.energy = Math.max(0, state.energy - energyLoss);
      return `设备故障！能源损失${energyLoss}点`;
    }
  },
  {
    id: 'material_spoilage',
    name: '原料腐坏',
    description: '部分情绪原料因保存不当腐坏',
    probability: 0.08,
    effect: (state) => {
      let totalLost = 0;
      Object.keys(state.materials).forEach(type => {
        const loss = Math.floor(state.materials[type] * 0.1);
        state.materials[type] = Math.max(0, state.materials[type] - loss);
        totalLost += loss;
      });
      return `原料腐坏！共损失${totalLost}单位原料`;
    }
  },
  {
    id: 'market_boom',
    name: '市场暴涨',
    description: '正能量宝石需求激增，今日售价上涨50%',
    probability: 0.07,
    effect: (state) => {
      state.marketMultiplier = 1.5;
      return '市场暴涨！今日宝石售价上涨50%';
    }
  },
  {
    id: 'market_crash',
    name: '市场低迷',
    description: '市场疲软，今日售价下降20%',
    probability: 0.07,
    effect: (state) => {
      state.marketMultiplier = 0.8;
      return '市场低迷！今日宝石售价下降20%';
    }
  },
  {
    id: 'lucky_delivery',
    name: '意外收货',
    description: '收到匿名捐赠的情绪原料',
    probability: 0.08,
    effect: (state) => {
      const types = Object.keys(state.materials);
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(Math.random() * 10) + 5;
      state.materials[type] += amount;
      return `意外收货！获得${amount}单位${EMOTION_TYPES[type].name}`;
    }
  }
];

export function createInitialState() {
  return {
    money: 1000,
    day: 1,
    energy: 50,
    maxEnergy: 50,
    marketMultiplier: 1,
    equipment: {
      extractor: 1,
      energyCore: 1,
      warehouse: 1
    },
    materials: {
      anger: 0,
      sadness: 0,
      anxiety: 0,
      fear: 0,
      jealousy: 0
    },
    products: 0,
    maxMaterial: 100,
    maxProduct: 50,
    taskQueue: [],
    dailyOrder: null,
    gamePhase: 'order',
    eventLog: [],
    triggeredEvent: null
  };
}

export function calculateMaxEnergy(level) {
  const config = EQUIPMENT_CONFIG.energyCore.levels.find(l => l.level === level);
  return config ? config.maxEnergy : 50;
}

export function calculateEfficiency(level) {
  const config = EQUIPMENT_CONFIG.extractor.levels.find(l => l.level === level);
  return config ? config.efficiency : 2;
}

export function calculateWarehouseCapacity(level) {
  const config = EQUIPMENT_CONFIG.warehouse.levels.find(l => l.level === level);
  return config ? { maxMaterial: config.maxMaterial, maxProduct: config.maxProduct } : { maxMaterial: 100, maxProduct: 50 };
}

export function saveGame(state) {
  try {
    localStorage.setItem('emotionFactory_save', JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('保存失败:', e);
    return false;
  }
}

export function loadGame() {
  try {
    const saved = localStorage.getItem('emotionFactory_save');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('读取存档失败:', e);
  }
  return null;
}

export function clearSave() {
  localStorage.removeItem('emotionFactory_save');
}

export function getTotalMaterialCount(materials) {
  return Object.values(materials).reduce((sum, count) => sum + count, 0);
}
