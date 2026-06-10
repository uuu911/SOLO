const MOODS = [
    { id: 'anxious', name: '焦虑', emoji: '😰', candle: 'calm' },
    { id: 'tired', name: '疲惫', emoji: '😫', candle: 'energy' },
    { id: 'sad', name: '悲伤', emoji: '😢', candle: 'joy' },
    { id: 'irritated', name: '烦躁', emoji: '😤', candle: 'calm' }
];

function getRandomMood() {
    if (gameState.currentEvent && gameState.currentEvent.type === 'trend') {
        const mood = MOODS.find(m => m.id === gameState.currentEvent.moodId);
        if (mood && Math.random() < 0.6) {
            return mood;
        }
    }
    return MOODS[Math.floor(Math.random() * MOODS.length)];
}

function createCustomer(isVIP = false) {
    const mood = getRandomMood();
    const patience = getPatienceTime();
    const customer = {
        id: Date.now() + Math.random(),
        mood: mood,
        maxPatience: patience,
        currentPatience: patience,
        isVIP: isVIP,
        candlesNeeded: isVIP ? 3 : 1,
        candlesReceived: 0
    };
    return customer;
}

function addCustomer() {
    if (gameState.customers.length >= 5) return;
    
    const isVIP = gameState.currentEvent && 
                   gameState.currentEvent.type === 'vip' && 
                   gameState.customers.length === 0;
    
    const customer = createCustomer(isVIP);
    gameState.customers.push(customer);
    renderCustomers();
}

function updateCustomers() {
    const now = Date.now();
    const customersToRemove = [];

    gameState.customers.forEach(customer => {
        customer.currentPatience -= 100;
        
        if (customer.currentPatience <= 0) {
            customersToRemove.push(customer.id);
            gameState.reputation += PATIENCE_LOSE_REP;
        }
    });

    if (customersToRemove.length > 0) {
        gameState.customers = gameState.customers.filter(
            c => !customersToRemove.includes(c.id)
        );
        updateUI();
    }
    
    renderCustomers();
}

function serveCustomer(customerId, candleIndex) {
    const customerIndex = gameState.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return false;
    
    const customer = gameState.customers[customerIndex];
    const candle = gameState.shelf[candleIndex];
    
    if (!candle) return false;
    
    const isCorrect = candle.mood === customer.mood.candle;
    
    if (isCorrect) {
        let goldReward = CORRECT_MATCH_GOLD;
        let repReward = CORRECT_MATCH_REP;
        
        if (customer.isVIP) {
            goldReward *= 3;
            repReward *= 2;
        }
        
        if (gameState.currentEvent && gameState.currentEvent.type === 'trend' && 
            customer.mood.id === gameState.currentEvent.moodId) {
            goldReward *= 2;
            repReward += 1;
        }
        
        gameState.gold += goldReward;
        gameState.reputation += repReward;
        gameState.totalEarned += goldReward;
        customer.candlesReceived++;
        
        gameState.shelf.splice(candleIndex, 1);
        gameState.selectedCandle = null;
        
        if (customer.candlesReceived >= customer.candlesNeeded) {
            gameState.customers.splice(customerIndex, 1);
            gameState.totalServed++;
        }
        
        if (gameState.currentEvent && gameState.currentEvent.type === 'vip' && customer.isVIP) {
            gameState.currentEvent.completed = true;
            completeEvent();
        }
        
        updateUI();
        return true;
    } else {
        gameState.reputation += WRONG_MATCH_REP;
        gameState.shelf.splice(candleIndex, 1);
        gameState.selectedCandle = null;
        
        updateUI();
        return false;
    }
}

function selectCandle(index) {
    if (gameState.selectedCandle === index) {
        gameState.selectedCandle = null;
    } else {
        gameState.selectedCandle = index;
    }
    renderShelf();
}

function onCustomerClick(customerId) {
    if (gameState.selectedCandle === null) return;
    serveCustomer(customerId, gameState.selectedCandle);
}