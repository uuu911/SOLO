function updateUI() {
    renderStats();
    renderResources();
    renderShelf();
    renderCustomers();
}

function renderStats() {
    const goldEl = document.getElementById('gold');
    const repEl = document.getElementById('reputation');
    const shelfCountEl = document.getElementById('shelf-count');
    const shelfMaxEl = document.getElementById('shelf-max');
    
    if (goldEl) goldEl.textContent = gameState.gold;
    if (repEl) repEl.textContent = gameState.reputation;
    if (shelfCountEl) shelfCountEl.textContent = gameState.shelf.length;
    if (shelfMaxEl) shelfMaxEl.textContent = getShelfMax();
}

function renderResources() {
    const container = document.getElementById('resources');
    if (!container) return;
    
    const resourceNames = {
        wax: { name: '基础蜡', emoji: '🕯️' },
        lavenderOil: { name: '薰衣草', emoji: '💜' },
        mintOil: { name: '薄荷', emoji: '💚' },
        citrusOil: { name: '柑橘', emoji: '🧡' },
        blueDye: { name: '蓝色', emoji: '🔵' },
        yellowDye: { name: '黄色', emoji: '🟡' },
        pinkDye: { name: '粉色', emoji: '🔴' }
    };
    
    let html = '';
    for (const [key, value] of Object.entries(gameState.resources)) {
        const info = resourceNames[key];
        html += `
            <div class="resource-item">
                <span>${info.emoji}</span>
                <span>${info.name}: ${value}</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderShelf() {
    const container = document.getElementById('shelf');
    if (!container) return;
    
    const shelfMax = getShelfMax();
    let html = '';
    
    for (let i = 0; i < shelfMax; i++) {
        const candle = gameState.shelf[i];
        const isSelected = gameState.selectedCandle === i;
        
        if (candle) {
            html += `
                <div class="shelf-slot filled ${isSelected ? 'selected' : ''}" 
                     onclick="selectCandle(${i})">
                    <div class="candle-emoji">${candle.emoji}</div>
                    <div class="candle-name">${candle.name}</div>
                </div>
            `;
        } else {
            html += `
                <div class="shelf-slot">
                    <div style="color: #9ca3af; font-size: 12px;">空位</div>
                </div>
            `;
        }
    }
    container.innerHTML = html;
}

function renderCustomers() {
    const container = document.getElementById('customer-queue');
    if (!container) return;
    
    let html = '';
    gameState.customers.forEach(customer => {
        const patiencePercent = (customer.currentPatience / customer.maxPatience) * 100;
        let patienceClass = '';
        if (patiencePercent < 30) patienceClass = 'danger';
        else if (patiencePercent < 60) patienceClass = 'warning';
        
        const vipBadge = customer.isVIP ? '<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">VIP</span>' : '';
        const candlesInfo = customer.isVIP ? `<div style="font-size: 12px; color: #6b7280;">蜡烛: ${customer.candlesReceived}/${customer.candlesNeeded}</div>` : '';
        
        html += `
            <div class="customer" onclick="onCustomerClick(${customer.id})">
                <div class="customer-emoji">${customer.mood.emoji}</div>
                <div class="customer-info">
                    <div class="customer-mood">${customer.mood.name} ${vipBadge}</div>
                    ${candlesInfo}
                    <div class="patience-bar">
                        <div class="patience-fill ${patienceClass}" style="width: ${patiencePercent}%"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (gameState.customers.length === 0) {
        html = '<div style="text-align: center; color: #9ca3af; padding: 20px;">暂无顾客</div>';
    }
    
    container.innerHTML = html;
}

function renderEventBanner() {
    const banner = document.getElementById('event-banner');
    const titleEl = document.getElementById('event-title');
    const timerEl = document.getElementById('event-timer');
    
    if (!banner || !gameState.currentEvent) return;
    
    banner.style.display = 'block';
    
    const remainingSeconds = Math.ceil(getEventRemainingTime() / 1000);
    
    if (gameState.currentEvent.type === 'trend') {
        titleEl.textContent = `🔥 流行趋势: ${gameState.currentEvent.moodName}情绪蜡烛需求暴增!`;
    } else if (gameState.currentEvent.type === 'vip') {
        titleEl.textContent = '👑 大客户即将到来! 准备好3个相同类型的蜡烛!';
    }
    
    timerEl.textContent = `剩余时间: ${remainingSeconds}秒`;
}

function hideEventBanner() {
    const banner = document.getElementById('event-banner');
    if (banner) {
        banner.style.display = 'none';
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function openCrafting() {
    renderCraftingModal();
    openModal('crafting-modal');
}

function renderCraftingModal() {
    const container = document.getElementById('recipe-list');
    if (!container) return;
    
    let html = '';
    RECIPES.forEach(recipe => {
        const canMake = canCraft(recipe.id);
        const isCurrentCraft = gameState.currentCraft && gameState.currentCraft.recipe.id === recipe.id;
        
        let ingredientsHtml = '';
        for (const [resource, amount] of Object.entries(recipe.ingredients)) {
            const resourceNames = {
                wax: '蜡',
                lavenderOil: '薰衣草',
                mintOil: '薄荷',
                citrusOil: '柑橘',
                blueDye: '蓝色',
                yellowDye: '黄色',
                pinkDye: '粉色'
            };
            const hasEnough = gameState.resources[resource] >= amount;
            ingredientsHtml += `<span class="ingredient" style="opacity: ${hasEnough ? 1 : 0.5}">${resourceNames[resource]} x${amount}</span>`;
        }
        
        const craftProgressHtml = isCurrentCraft ? `
            <div class="craft-progress" style="display: block;">
                <div class="craft-progress-fill" style="width: ${gameState.craftProgress}%"></div>
            </div>
        ` : '';
        
        const buttonHtml = !isCurrentCraft ? `
            <button class="btn btn-primary" style="margin-top: 10px; width: 100%;" 
                    onclick="startCrafting('${recipe.id}')" ${!canMake ? 'disabled' : ''}>
                ${canMake ? '开始制作' : '无法制作'}
            </button>
        ` : '';
        
        html += `
            <div class="recipe-card ${isCurrentCraft ? 'crafting' : ''}">
                <div class="recipe-header">
                    <span class="recipe-emoji">${recipe.emoji}</span>
                    <div>
                        <div class="recipe-name">${recipe.name}</div>
                        <div class="recipe-mood">对应情绪: ${MOODS.filter(m => m.candle === recipe.id).map(m => m.name).join('/')}</div>
                    </div>
                </div>
                <div class="recipe-ingredients">
                    ${ingredientsHtml}
                </div>
                ${craftProgressHtml}
                ${buttonHtml}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function openShop() {
    renderShopModal();
    openModal('shop-modal');
}

function renderShopModal() {
    const container = document.getElementById('shop-items');
    if (!container) return;
    
    let html = '';
    SHOP_ITEMS.forEach(item => {
        const canBuy = gameState.gold >= item.price;
        html += `
            <div class="shop-item" onclick="${canBuy ? `purchaseItem('${item.id}')` : ''}" 
                 style="opacity: ${canBuy ? 1 : 0.5}; cursor: ${canBuy ? 'pointer' : 'not-allowed'}">
                <div class="shop-item-emoji">${item.emoji}</div>
                <div class="shop-item-name">${item.name} x${item.amount}</div>
                <div class="shop-item-price">💰 ${item.price}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function openUpgrades() {
    renderUpgradeModal();
    openModal('upgrade-modal');
}

function renderUpgradeModal() {
    const container = document.getElementById('upgrade-list');
    if (!container) return;
    
    const upgradeInfo = {
        workstation: {
            name: '工作台升级',
            emoji: '🔨',
            effect: '制作时间减少1秒',
            current: `当前: ${getCraftTime()/1000}秒`,
            max: '最快: 2秒'
        },
        shelf: {
            name: '货架扩容',
            emoji: '📦',
            effect: '货架容量+1',
            current: `当前: ${getShelfMax()}格`,
            max: '最大: 6格'
        },
        decoration: {
            name: '店面装饰',
            emoji: '✨',
            effect: '顾客耐心+2秒，到店间隔减少',
            current: `当前耐心: ${getPatienceTime()/1000}秒`,
            max: '最长: 20秒'
        }
    };
    
    let html = '';
    for (const [type, info] of Object.entries(upgradeInfo)) {
        const level = gameState.upgrades[type];
        const cost = getUpgradeCost(type);
        const canBuy = cost !== null && gameState.gold >= cost;
        const isMaxLevel = cost === null;
        
        html += `
            <div class="upgrade-card">
                <div class="upgrade-header">
                    <div class="upgrade-name">
                        <span>${info.emoji}</span>
                        <span>${info.name}</span>
                    </div>
                    <div class="upgrade-level">等级 ${level}/3</div>
                </div>
                <div class="upgrade-effect">
                    ${info.effect}<br>
                    ${info.current}
                </div>
                <button class="btn btn-warning upgrade-btn" 
                        onclick="purchaseUpgrade('${type}')" 
                        ${!canBuy ? 'disabled' : ''}>
                    ${isMaxLevel ? '已满级' : `💰 ${cost} 升级`}
                </button>
            </div>
        `;
    }
    container.innerHTML = html;
}

function showGameOver(isWin) {
    const modal = document.getElementById('game-over-modal');
    const titleEl = document.getElementById('game-over-title');
    const statsEl = document.getElementById('game-over-stats');
    
    if (!modal || !titleEl || !statsEl) return;
    
    titleEl.textContent = isWin ? '🎉 恭喜胜利!' : '😢 游戏结束';
    titleEl.className = 'game-over-title ' + (isWin ? 'win' : 'lose');
    
    statsEl.innerHTML = `
        <div class="game-over-stat">
            <span>最终金币</span>
            <span>💰 ${gameState.gold}</span>
        </div>
        <div class="game-over-stat">
            <span>最终声誉</span>
            <span>⭐ ${gameState.reputation}</span>
        </div>
        <div class="game-over-stat">
            <span>服务顾客</span>
            <span>👥 ${gameState.totalServed}</span>
        </div>
        <div class="game-over-stat">
            <span>总收益</span>
            <span>💰 ${gameState.totalEarned}</span>
        </div>
    `;
    
    modal.classList.add('active');
}