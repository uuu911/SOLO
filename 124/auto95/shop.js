const SHOP_ITEMS = [
    { id: 'wax', name: '基础蜡', emoji: '🕯️', price: 5, amount: 5 },
    { id: 'lavenderOil', name: '薰衣草精油', emoji: '💜', price: 8, amount: 3 },
    { id: 'mintOil', name: '薄荷精油', emoji: '💚', price: 8, amount: 3 },
    { id: 'citrusOil', name: '柑橘精油', emoji: '🧡', price: 8, amount: 3 },
    { id: 'blueDye', name: '蓝色色素', emoji: '🔵', price: 6, amount: 2 },
    { id: 'yellowDye', name: '黄色色素', emoji: '🟡', price: 6, amount: 2 },
    { id: 'pinkDye', name: '粉色色素', emoji: '🔴', price: 6, amount: 2 }
];

function purchaseItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    
    if (gameState.gold < item.price) return false;
    
    gameState.gold -= item.price;
    gameState.resources[itemId] += item.amount;
    
    updateUI();
    renderShopModal();
    return true;
}

const EVENT_TYPES = [
    { type: 'trend', name: '流行趋势' },
    { type: 'vip', name: '大客户' }
];

function triggerRandomEvent() {
    const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    
    if (eventType.type === 'trend') {
        const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
        gameState.currentEvent = {
            type: 'trend',
            moodId: mood.id,
            moodName: mood.name,
            duration: 30000,
            startTime: Date.now(),
            completed: false
        };
    } else if (eventType.type === 'vip') {
        gameState.currentEvent = {
            type: 'vip',
            duration: 45000,
            startTime: Date.now(),
            completed: false
        };
    }
    
    startEventTimer();
    renderEventBanner();
}

function startEventTimer() {
    if (gameState.eventTimer) clearInterval(gameState.eventTimer);
    
    gameState.eventTimer = setInterval(() => {
        if (!gameState.currentEvent) return;
        
        const elapsed = Date.now() - gameState.currentEvent.startTime;
        const remaining = gameState.currentEvent.duration - elapsed;
        
        if (remaining <= 0) {
            if (!gameState.currentEvent.completed) {
                gameState.reputation -= 5;
            }
            endEvent();
        } else {
            renderEventBanner();
        }
    }, 100);
}

function completeEvent() {
    if (!gameState.currentEvent) return;
    
    if (gameState.currentEvent.type === 'vip') {
        gameState.gold += 100;
        gameState.reputation += 5;
    } else if (gameState.currentEvent.type === 'trend') {
        gameState.gold += 50;
        gameState.reputation += 3;
    }
    
    gameState.currentEvent.completed = true;
    updateUI();
}

function endEvent() {
    if (gameState.eventTimer) {
        clearInterval(gameState.eventTimer);
        gameState.eventTimer = null;
    }
    gameState.currentEvent = null;
    hideEventBanner();
    updateUI();
}

function getEventRemainingTime() {
    if (!gameState.currentEvent) return 0;
    const elapsed = Date.now() - gameState.currentEvent.startTime;
    return Math.max(0, gameState.currentEvent.duration - elapsed);
}