import {
  EMOTION_TYPES,
  EQUIPMENT_CONFIG,
  RANDOM_EVENTS,
  createInitialState,
  calculateMaxEnergy,
  calculateEfficiency,
  calculateWarehouseCapacity,
  saveGame,
  loadGame,
  clearSave,
  getTotalMaterialCount
} from './data.js';

import { initUI, render, showToast, updateState } from './ui.js';

let gameState = null;

function initGame() {
  const savedState = loadGame();
  if (savedState) {
    gameState = savedState;
    showToast('存档已加载', 'success');
  } else {
    gameState = createInitialState();
    showToast('欢迎来到情绪回收站！', 'success');
  }
  
  updateCapacityValues();
  
  if (gameState.gamePhase === 'order' && !gameState.dailyOrder) {
    generateDailyOrder();
  }
  
  initUI(gameState, {
    onAcceptOrder: handleAcceptOrder,
    onRejectOrder: handleRejectOrder,
    onStartProcessing: handleStartProcessing,
    onNextPhase: handleNextPhase,
    onSellProducts: handleSellProducts,
    onEndDay: handleEndDay,
    onUpgrade: handleUpgrade,
    onResetGame: handleResetGame,
    getEfficiency: () => calculateEfficiency(gameState.equipment.extractor)
  });
}

function updateCapacityValues() {
  const energyConfig = calculateMaxEnergy(gameState.equipment.energyCore);
  gameState.maxEnergy = energyConfig;
  
  const warehouseConfig = calculateWarehouseCapacity(gameState.equipment.warehouse);
  gameState.maxMaterial = warehouseConfig.maxMaterial;
  gameState.maxProduct = warehouseConfig.maxProduct;
}

function generateDailyOrder() {
  const emotionTypes = Object.keys(EMOTION_TYPES);
  const randomType = emotionTypes[Math.floor(Math.random() * emotionTypes.length)];
  const emotion = EMOTION_TYPES[randomType];
  
  const quantity = Math.floor(Math.random() * 20) + 5;
  const priceVariation = 0.8 + Math.random() * 0.4;
  const price = Math.floor(emotion.basePrice * priceVariation);
  
  gameState.dailyOrder = {
    type: randomType,
    quantity,
    price
  };
}

function handleAcceptOrder() {
  if (!gameState.dailyOrder) return;
  
  const order = gameState.dailyOrder;
  const totalCost = order.quantity * order.price;
  
  if (gameState.money < totalCost) {
    showToast('资金不足，无法接受订单', 'error');
    return;
  }
  
  const currentTotal = getTotalMaterialCount(gameState.materials);
  const newTotal = currentTotal + order.quantity;
  
  gameState.money -= totalCost;
  gameState.materials[order.type] += order.quantity;
  
  let discarded = 0;
  if (newTotal > gameState.maxMaterial) {
    discarded = newTotal - gameState.maxMaterial;
    gameState.materials[order.type] -= discarded;
    addLog(`仓库容量不足，${discarded}单位${EMOTION_TYPES[order.type].name}被丢弃`, 'warning');
  }
  
  addLog(`接受订单：${order.quantity}单位${EMOTION_TYPES[order.type].name}，花费${totalCost}金币`, 'success');
  gameState.gamePhase = 'processing';
  gameState.dailyOrder = null;
  
  updateState(gameState);
  render();
  autoSave();
}

function handleRejectOrder() {
  addLog('拒绝了今日原料订单', 'info');
  gameState.gamePhase = 'processing';
  gameState.dailyOrder = null;
  
  updateState(gameState);
  render();
  autoSave();
}

function handleStartProcessing(materialType, amount) {
  if (gameState.taskQueue.length >= 3) {
    showToast('任务队列已满（最多3个），请等待任务完成', 'warning');
    return;
  }
  
  if (amount <= 0 || amount > gameState.materials[materialType]) {
    showToast('原料数量不足', 'error');
    return;
  }
  
  const efficiency = calculateEfficiency(gameState.equipment.extractor);
  const energyCost = Math.ceil(amount * efficiency);
  
  if (gameState.energy < energyCost) {
    showToast(`能源不足，需要${energyCost}点能源`, 'error');
    return;
  }
  
  gameState.energy -= energyCost;
  gameState.materials[materialType] -= amount;
  
  gameState.taskQueue.push({
    type: materialType,
    amount,
    remainingTime: 2,
    productsProduced: amount
  });
  
  addLog(`开始加工${amount}单位${EMOTION_TYPES[materialType].name}，消耗${energyCost}能源`, 'info');
  
  updateState(gameState);
  render();
  autoSave();
}

function handleNextPhase() {
  processTaskQueue();
  gameState.gamePhase = 'selling';
  
  updateState(gameState);
  render();
  autoSave();
}

function processTaskQueue() {
  const completedTasks = [];
  
  gameState.taskQueue = gameState.taskQueue.filter(task => {
    task.remainingTime--;
    if (task.remainingTime <= 0) {
      completedTasks.push(task);
      return false;
    }
    return true;
  });
  
  let totalProduced = 0;
  completedTasks.forEach(task => {
    totalProduced += task.productsProduced;
    addLog(`${task.amount}单位${EMOTION_TYPES[task.type].name}加工完成，获得${task.productsProduced}颗宝石`, 'success');
  });
  
  if (totalProduced > 0) {
    const newProductTotal = gameState.products + totalProduced;
    if (newProductTotal > gameState.maxProduct) {
      const discarded = newProductTotal - gameState.maxProduct;
      gameState.products = gameState.maxProduct;
      addLog(`产品仓库容量不足，${discarded}颗宝石被丢弃`, 'warning');
    } else {
      gameState.products = newProductTotal;
    }
  }
}

function handleSellProducts(amount) {
  if (amount <= 0 || amount > gameState.products) {
    showToast('产品数量不足', 'error');
    return;
  }
  
  const basePrice = 20;
  const actualPrice = Math.floor(basePrice * gameState.marketMultiplier);
  const totalRevenue = amount * actualPrice;
  
  gameState.products -= amount;
  gameState.money += totalRevenue;
  
  addLog(`出售${amount}颗正能量宝石，收入${totalRevenue}金币`, 'success');
  
  updateState(gameState);
  render();
  autoSave();
}

function handleEndDay() {
  processTaskQueue();
  gameState.day++;
  
  triggerRandomEvent();
  gameState.marketMultiplier = 1;
  
  gameState.maxEnergy = calculateMaxEnergy(gameState.equipment.energyCore);
  gameState.energy = gameState.maxEnergy;
  
  const warehouseConfig = calculateWarehouseCapacity(gameState.equipment.warehouse);
  gameState.maxMaterial = warehouseConfig.maxMaterial;
  gameState.maxProduct = warehouseConfig.maxProduct;
  
  gameState.gamePhase = 'order';
  generateDailyOrder();
  
  addLog(`第${gameState.day}天开始！能源已恢复至${gameState.maxEnergy}`, 'info');
  
  updateState(gameState);
  render();
  autoSave();
}

function triggerRandomEvent() {
  for (const event of RANDOM_EVENTS) {
    if (Math.random() < event.probability) {
      const message = event.effect(gameState);
      addLog(`【${event.name}】${message}`, 'event');
      showToast(message, 'event');
      return;
    }
  }
}

function handleUpgrade(equipmentKey) {
  const currentLevel = gameState.equipment[equipmentKey];
  const nextLevelConfig = EQUIPMENT_CONFIG[equipmentKey].levels.find(l => l.level === currentLevel + 1);
  
  if (!nextLevelConfig) {
    showToast('已达最高等级', 'info');
    return;
  }
  
  if (gameState.money < nextLevelConfig.cost) {
    showToast('资金不足', 'error');
    return;
  }
  
  gameState.money -= nextLevelConfig.cost;
  gameState.equipment[equipmentKey] = currentLevel + 1;
  
  updateCapacityValues();
  
  addLog(`${EQUIPMENT_CONFIG[equipmentKey].name}升级至Lv.${currentLevel + 1}`, 'success');
  showToast(`${EQUIPMENT_CONFIG[equipmentKey].name}升级成功！`, 'success');
  
  updateState(gameState);
  render();
  autoSave();
}

function handleResetGame() {
  clearSave();
  gameState = createInitialState();
  generateDailyOrder();
  
  updateState(gameState);
  render();
  showToast('游戏已重置', 'success');
}

function addLog(message, type = 'info') {
  gameState.eventLog.push({
    day: gameState.day,
    message,
    type,
    timestamp: Date.now()
  });
}

function autoSave() {
  saveGame(gameState);
}

document.addEventListener('DOMContentLoaded', initGame);
