const INITIAL_GOLD = 100;
const INITIAL_REPUTATION = 20;
const WIN_GOLD = 1000;
const LOSE_REPUTATION = 0;

const INITIAL_CUSTOMER_INTERVAL = 5000;
const MIN_CUSTOMER_INTERVAL = 3000;

const INITIAL_CRAFT_TIME = 5000;
const MIN_CRAFT_TIME = 2000;

const INITIAL_SHELF_MAX = 3;
const MAX_SHELF_MAX = 6;

const INITIAL_PATIENCE_TIME = 12000;
const MAX_PATIENCE_TIME = 20000;

const CORRECT_MATCH_GOLD = 15;
const CORRECT_MATCH_REP = 1;
const WRONG_MATCH_REP = -2;
const PATIENCE_LOSE_REP = -3;

let gameState = {
    gold: INITIAL_GOLD,
    reputation: INITIAL_REPUTATION,
    resources: {
        wax: 20,
        lavenderOil: 10,
        mintOil: 10,
        citrusOil: 10,
        blueDye: 5,
        yellowDye: 5,
        pinkDye: 5
    },
    upgrades: {
        workstation: 0,
        shelf: 0,
        decoration: 0
    },
    shelf: [],
    customers: [],
    isCrafting: false,
    currentCraft: null,
    craftProgress: 0,
    selectedCandle: null,
    currentEvent: null,
    eventTimer: null,
    gameOver: false,
    totalServed: 0,
    totalEarned: 0
};

const UPGRADE_COSTS = {
    workstation: [50, 100, 200],
    shelf: [80, 150, 250],
    decoration: [60, 120, 200]
};

function getCraftTime() {
    const reduction = gameState.upgrades.workstation * 1000;
    return Math.max(MIN_CRAFT_TIME, INITIAL_CRAFT_TIME - reduction);
}

function getShelfMax() {
    return Math.min(MAX_SHELF_MAX, INITIAL_SHELF_MAX + gameState.upgrades.shelf);
}

function getPatienceTime() {
    const increase = gameState.upgrades.decoration * 2000;
    return Math.min(MAX_PATIENCE_TIME, INITIAL_PATIENCE_TIME + increase);
}

function getCustomerInterval() {
    const reduction = gameState.upgrades.decoration * 500;
    return Math.max(MIN_CUSTOMER_INTERVAL, INITIAL_CUSTOMER_INTERVAL - reduction);
}

function getUpgradeCost(type) {
    const level = gameState.upgrades[type];
    if (level >= UPGRADE_COSTS[type].length) {
        return null;
    }
    return UPGRADE_COSTS[type][level];
}

function canAffordUpgrade(type) {
    const cost = getUpgradeCost(type);
    return cost !== null && gameState.gold >= cost;
}

function purchaseUpgrade(type) {
    const cost = getUpgradeCost(type);
    if (cost === null || gameState.gold < cost) {
        return false;
    }
    gameState.gold -= cost;
    gameState.upgrades[type]++;
    updateUI();
    return true;
}

function checkWinLose() {
    if (gameState.gameOver) return;
    
    if (gameState.gold >= WIN_GOLD) {
        gameState.gameOver = true;
        showGameOver(true);
    } else if (gameState.reputation <= LOSE_REPUTATION) {
        gameState.gameOver = true;
        showGameOver(false);
    }
}

function restartGame() {
    gameState = {
        gold: INITIAL_GOLD,
        reputation: INITIAL_REPUTATION,
        resources: {
            wax: 20,
            lavenderOil: 10,
            mintOil: 10,
            citrusOil: 10,
            blueDye: 5,
            yellowDye: 5,
            pinkDye: 5
        },
        upgrades: {
            workstation: 0,
            shelf: 0,
            decoration: 0
        },
        shelf: [],
        customers: [],
        isCrafting: false,
        currentCraft: null,
        craftProgress: 0,
        selectedCandle: null,
        currentEvent: null,
        eventTimer: null,
        gameOver: false,
        totalServed: 0,
        totalEarned: 0
    };
    
    closeModal('game-over-modal');
    initGame();
}

let gameLoop;
let customerSpawnTimer;
let eventCheckTimer;

function initGame() {
    updateUI();
    startGameLoop();
    startCustomerSpawner();
    startEventChecker();
}

function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        if (gameState.gameOver) return;
        updateCustomers();
        updateCrafting();
        checkWinLose();
    }, 100);
}

function startCustomerSpawner() {
    if (customerSpawnTimer) clearTimeout(customerSpawnTimer);
    const spawnCustomer = () => {
        if (!gameState.gameOver) {
            addCustomer();
            customerSpawnTimer = setTimeout(spawnCustomer, getCustomerInterval());
        }
    };
    customerSpawnTimer = setTimeout(spawnCustomer, getCustomerInterval());
}

function startEventChecker() {
    if (eventCheckTimer) clearTimeout(eventCheckTimer);
    const checkEvent = () => {
        if (!gameState.gameOver && !gameState.currentEvent && Math.random() < 0.15) {
            triggerRandomEvent();
        }
        eventCheckTimer = setTimeout(checkEvent, 10000);
    };
    eventCheckTimer = setTimeout(checkEvent, 15000);
}