import { EMOTION_TYPES, EQUIPMENT_CONFIG, getTotalMaterialCount } from './data.js';

let gameState = null;
let callbacks = {};

export function initUI(state, eventHandlers) {
  gameState = state;
  callbacks = eventHandlers;
  render();
  bindEvents();
}

export function render() {
  renderDashboard();
  renderPhaseContent();
  renderInventory();
  renderMarket();
  renderEquipment();
  renderEventLog();
}

function renderDashboard() {
  const totalMaterial = getTotalMaterialCount(gameState.materials);
  const materialPercent = Math.floor((totalMaterial / gameState.maxMaterial) * 100);
  const productPercent = Math.floor((gameState.products / gameState.maxProduct) * 100);
  
  document.getElementById('money').textContent = gameState.money;
  document.getElementById('day').textContent = gameState.day;
  document.getElementById('energy').textContent = gameState.energy;
  document.getElementById('max-energy').textContent = gameState.maxEnergy;
  document.getElementById('material-storage').textContent = `${totalMaterial}/${gameState.maxMaterial} (${materialPercent}%)`;
  document.getElementById('product-storage').textContent = `${gameState.products}/${gameState.maxProduct} (${productPercent}%)`;
}

function renderPhaseContent() {
  const content = document.getElementById('phase-content');
  const phaseTitle = document.getElementById('phase-title');
  
  switch (gameState.gamePhase) {
    case 'order':
      phaseTitle.textContent = '📦 原料订单';
      content.innerHTML = renderOrderPhase();
      break;
    case 'processing':
      phaseTitle.textContent = '⚙️ 加工环节';
      content.innerHTML = renderProcessingPhase();
      break;
    case 'selling':
      phaseTitle.textContent = '💰 销售环节';
      content.innerHTML = renderSellingPhase();
      break;
  }
}

function renderOrderPhase() {
  if (!gameState.dailyOrder) return '<p>正在生成订单...</p>';
  
  const order = gameState.dailyOrder;
  const emotion = EMOTION_TYPES[order.type];
  
  return `
    <div class="order-card">
      <div class="order-emotion" style="background: ${emotion.color}">${emotion.name}</div>
      <div class="order-details">
        <p><strong>数量：</strong>${order.quantity} 单位</p>
        <p><strong>单价：</strong>${order.price} 金币</p>
        <p><strong>总价：</strong>${order.quantity * order.price} 金币</p>
      </div>
    </div>
    <div class="order-buttons">
      <button class="btn btn-accept" id="accept-order">接受订单</button>
      <button class="btn btn-reject" id="reject-order">拒绝订单</button>
    </div>
  `;
}

function renderProcessingPhase() {
  const totalMaterial = getTotalMaterialCount(gameState.materials);
  const efficiency = callbacks.getEfficiency ? callbacks.getEfficiency() : 2;
  
  return `
    <div class="processing-section">
      <h4>选择原料进行加工</h4>
      <div class="material-selector">
        ${Object.entries(EMOTION_TYPES).map(([type, info]) => `
          <div class="material-item ${gameState.materials[type] === 0 ? 'disabled' : ''}" 
               data-type="${type}">
            <div class="material-color" style="background: ${info.color}"></div>
            <span class="material-name">${info.name}</span>
            <span class="material-count">${gameState.materials[type]}</span>
          </div>
        `).join('')}
      </div>
      <div class="processing-controls">
        <input type="number" id="process-amount" min="1" value="1" max="${totalMaterial}">
        <button class="btn btn-process" id="start-processing">
          开始加工 (消耗 ${efficiency} 能源/单位)
        </button>
      </div>
      <div class="queue-info">
        <p>任务队列：${gameState.taskQueue.length}/3</p>
      </div>
    </div>
    <div class="task-queue-section">
      <h4>加工队列</h4>
      <div class="task-queue">
        ${gameState.taskQueue.length === 0 ? '<p class="empty-queue">队列为空</p>' : ''}
        ${gameState.taskQueue.map((task, index) => `
          <div class="task-item">
            <div class="task-emotion" style="background: ${EMOTION_TYPES[task.type].color}">
              ${EMOTION_TYPES[task.type].name}
            </div>
            <div class="task-info">
              <span>数量: ${task.amount}</span>
              <span>剩余: ${task.remainingTime}回合</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="phase-navigation">
      <button class="btn btn-next" id="next-phase">进入销售环节</button>
    </div>
  `;
}

function renderSellingPhase() {
  const basePrice = 20;
  const actualPrice = Math.floor(basePrice * gameState.marketMultiplier);
  
  return `
    <div class="selling-section">
      <div class="price-display">
        <p>今日宝石报价：<span class="price">${actualPrice}</span> 金币/颗</p>
        <p class="price-multiplier">${gameState.marketMultiplier !== 1 ? 
          (gameState.marketMultiplier > 1 ? '📈 市场暴涨' : '📉 市场低迷') : '正常行情'}</p>
      </div>
      <div class="selling-controls">
        <p>当前库存：${gameState.products} 颗正能量宝石</p>
        <div class="sell-input">
          <input type="number" id="sell-amount" min="0" max="${gameState.products}" value="${gameState.products}">
          <button class="btn btn-sell" id="sell-products">出售</button>
        </div>
        <p class="sell-preview">预计收入：<span id="sell-preview">${actualPrice * gameState.products}</span> 金币</p>
      </div>
    </div>
    <div class="phase-navigation">
      <button class="btn btn-next" id="end-day">结束今天</button>
    </div>
  `;
}

function renderInventory() {
  const container = document.getElementById('inventory-panel');
  
  container.innerHTML = `
    <div class="inventory-section">
      <h4>原料库存</h4>
      <div class="inventory-list">
        ${Object.entries(EMOTION_TYPES).map(([type, info]) => `
          <div class="inventory-item">
            <div class="inventory-color" style="background: ${info.color}"></div>
            <span class="inventory-name">${info.name}</span>
            <span class="inventory-count">${gameState.materials[type]}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="inventory-section">
      <h4>产品库存</h4>
      <div class="inventory-item product-item">
        <div class="inventory-color" style="background: linear-gradient(135deg, #f1c40f, #e74c3c)"></div>
        <span class="inventory-name">正能量宝石</span>
        <span class="inventory-count">${gameState.products}</span>
      </div>
    </div>
  `;
}

function renderMarket() {
  const container = document.getElementById('market-panel');
  const basePrice = 20;
  const actualPrice = Math.floor(basePrice * gameState.marketMultiplier);
  
  container.innerHTML = `
    <div class="market-price">
      <span class="market-label">今日宝石价</span>
      <span class="market-value">${actualPrice} 金币</span>
    </div>
    <div class="market-trend">
      ${gameState.marketMultiplier > 1 ? '<span class="trend-up">↑ 上涨</span>' : 
        gameState.marketMultiplier < 1 ? '<span class="trend-down">↓ 下跌</span>' : 
        '<span class="trend-stable">→ 稳定</span>'}
    </div>
  `;
}

function renderEquipment() {
  const container = document.getElementById('equipment-panel');
  
  container.innerHTML = Object.entries(EQUIPMENT_CONFIG).map(([key, config]) => {
    const currentLevel = gameState.equipment[key];
    const nextLevel = config.levels.find(l => l.level === currentLevel + 1);
    const currentConfig = config.levels.find(l => l.level === currentLevel);
    const canUpgrade = nextLevel && gameState.money >= nextLevel.cost;
    
    return `
      <div class="equipment-item">
        <div class="equipment-header">
          <span class="equipment-name">${config.name}</span>
          <span class="equipment-level">Lv.${currentLevel}</span>
        </div>
        <p class="equipment-desc">${config.description}</p>
        <p class="equipment-effect">当前效果：${getEquipmentEffect(key, currentConfig)}</p>
        ${nextLevel ? `
          <button class="btn btn-upgrade ${canUpgrade ? '' : 'disabled'}" 
                  data-equipment="${key}" 
                  ${canUpgrade ? '' : 'disabled'}>
            升级 (${nextLevel.cost} 金币)
          </button>
          <p class="upgrade-effect">下一级：${getEquipmentEffect(key, nextLevel)}</p>
        ` : '<p class="max-level">已达最高等级</p>'}
      </div>
    `;
  }).join('');
}

function getEquipmentEffect(key, config) {
  switch (key) {
    case 'extractor':
      return `能源消耗 ${config.efficiency}/单位`;
    case 'energyCore':
      return `每日能源 ${config.maxEnergy}`;
    case 'warehouse':
      return `原料${config.maxMaterial}/产品${config.maxProduct}`;
    default:
      return '';
  }
}

function renderEventLog() {
  const container = document.getElementById('event-log');
  const recentLogs = gameState.eventLog.slice(-10).reverse();
  
  container.innerHTML = recentLogs.map(log => `
    <div class="log-item ${log.type || 'info'}">
      <span class="log-day">第${log.day}天</span>
      <span class="log-message">${log.message}</span>
    </div>
  `).join('');
}

function bindEvents() {
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.id === 'accept-order') {
      callbacks.onAcceptOrder && callbacks.onAcceptOrder();
    }
    
    if (target.id === 'reject-order') {
      callbacks.onRejectOrder && callbacks.onRejectOrder();
    }
    
    if (target.closest('.material-item') && gameState.gamePhase === 'processing') {
      const item = target.closest('.material-item');
      if (!item.classList.contains('disabled')) {
        document.querySelectorAll('.material-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      }
    }
    
    if (target.id === 'start-processing') {
      const selectedMaterial = document.querySelector('.material-item.selected');
      const amount = parseInt(document.getElementById('process-amount').value);
      
      if (!selectedMaterial) {
        showToast('请先选择一种原料');
        return;
      }
      
      const materialType = selectedMaterial.dataset.type;
      callbacks.onStartProcessing && callbacks.onStartProcessing(materialType, amount);
    }
    
    if (target.id === 'next-phase') {
      callbacks.onNextPhase && callbacks.onNextPhase();
    }
    
    if (target.id === 'sell-products') {
      const amount = parseInt(document.getElementById('sell-amount').value);
      callbacks.onSellProducts && callbacks.onSellProducts(amount);
    }
    
    if (target.id === 'end-day') {
      callbacks.onEndDay && callbacks.onEndDay();
    }
    
    if (target.classList.contains('btn-upgrade') && !target.classList.contains('disabled')) {
      const equipmentKey = target.dataset.equipment;
      callbacks.onUpgrade && callbacks.onUpgrade(equipmentKey);
    }
    
    if (target.id === 'reset-game') {
      if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        callbacks.onResetGame && callbacks.onResetGame();
      }
    }
  });
  
  document.addEventListener('input', (e) => {
    if (e.target.id === 'sell-amount') {
      const amount = parseInt(e.target.value) || 0;
      const basePrice = 20;
      const actualPrice = Math.floor(basePrice * gameState.marketMultiplier);
      document.getElementById('sell-preview').textContent = actualPrice * amount;
    }
  });
}

export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function updateState(newState) {
  gameState = newState;
}
