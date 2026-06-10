const RECIPES = [
    {
        id: 'calm',
        name: '宁静蜡烛',
        emoji: '🕯️',
        mood: 'calm',
        ingredients: {
            wax: 1,
            lavenderOil: 1,
            blueDye: 1
        }
    },
    {
        id: 'energy',
        name: '活力蜡烛',
        emoji: '🕯️',
        mood: 'energy',
        ingredients: {
            wax: 1,
            mintOil: 1,
            yellowDye: 1
        }
    },
    {
        id: 'joy',
        name: '欢乐蜡烛',
        emoji: '🕯️',
        mood: 'joy',
        ingredients: {
            wax: 1,
            citrusOil: 1,
            pinkDye: 1
        }
    }
];

function hasIngredients(recipe) {
    for (const [resource, amount] of Object.entries(recipe.ingredients)) {
        if (gameState.resources[resource] < amount) {
            return false;
        }
    }
    return true;
}

function consumeIngredients(recipe) {
    for (const [resource, amount] of Object.entries(recipe.ingredients)) {
        gameState.resources[resource] -= amount;
    }
}

function startCrafting(recipeId) {
    if (gameState.isCrafting) return false;
    if (gameState.shelf.length >= getShelfMax()) return false;
    
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe || !hasIngredients(recipe)) return false;
    
    consumeIngredients(recipe);
    gameState.isCrafting = true;
    gameState.currentCraft = {
        recipe: recipe,
        startTime: Date.now(),
        totalTime: getCraftTime()
    };
    gameState.craftProgress = 0;
    
    updateUI();
    renderCraftingModal();
    return true;
}

function updateCrafting() {
    if (!gameState.isCrafting || !gameState.currentCraft) return;
    
    const elapsed = Date.now() - gameState.currentCraft.startTime;
    const total = gameState.currentCraft.totalTime;
    const progress = Math.min(100, (elapsed / total) * 100);
    
    gameState.craftProgress = progress;
    
    const progressBar = document.getElementById('craft-progress-fill');
    const progressBarContainer = document.getElementById('craft-progress');
    const statusText = document.getElementById('workstation-status');
    
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    if (progressBarContainer) {
        progressBarContainer.style.display = 'block';
    }
    if (statusText) {
        statusText.textContent = '正在制作: ' + gameState.currentCraft.recipe.name;
    }
    
    if (elapsed >= total) {
        completeCrafting();
    }
}

function completeCrafting() {
    if (!gameState.currentCraft) return;
    
    const candle = {
        id: Date.now(),
        recipe: gameState.currentCraft.recipe,
        mood: gameState.currentCraft.recipe.mood,
        name: gameState.currentCraft.recipe.name,
        emoji: gameState.currentCraft.recipe.emoji
    };
    
    gameState.shelf.push(candle);
    gameState.isCrafting = false;
    gameState.currentCraft = null;
    gameState.craftProgress = 0;
    
    const progressBarContainer = document.getElementById('craft-progress');
    const statusText = document.getElementById('workstation-status');
    
    if (progressBarContainer) {
        progressBarContainer.style.display = 'none';
    }
    if (statusText) {
        statusText.textContent = '空闲中';
    }
    
    updateUI();
    renderCraftingModal();
}

function canCraft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    return hasIngredients(recipe) && !gameState.isCrafting && gameState.shelf.length < getShelfMax();
}