(function() {
    'use strict';

    const ATTR_CONFIG = {
        minValue: 1,
        maxValue: 100,
        baseValues: {
            strength: 10,
            agility: 10,
            intelligence: 10
        },
        initialFreePoints: 5,
        pointsPerLevel: 2,
        maxLevel: 10
    };

    let state = {
        level: 1,
        base: {
            strength: 10,
            agility: 10,
            intelligence: 10
        },
        allocated: {
            strength: 0,
            agility: 0,
            intelligence: 0
        },
        bonuses: {
            strength: 0,
            agility: 0,
            intelligence: 0
        },
        freePoints: 5
    };

    let onStateChange = null;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function calculateTotal(attrName) {
        return state.base[attrName] + state.allocated[attrName] + state.bonuses[attrName];
    }

    const AttrSys = {
        init: function(config) {
            state = {
                level: 1,
                base: { ...ATTR_CONFIG.baseValues },
                allocated: { strength: 0, agility: 0, intelligence: 0 },
                bonuses: { strength: 0, agility: 0, intelligence: 0 },
                freePoints: ATTR_CONFIG.initialFreePoints
            };
            
            if (config && config.onStateChange) {
                onStateChange = config.onStateChange;
            }
            
            return this.getState();
        },

        getState: function() {
            return {
                level: state.level,
                base: { ...state.base },
                allocated: { ...state.allocated },
                bonuses: { ...state.bonuses },
                freePoints: state.freePoints,
                totals: {
                    strength: calculateTotal('strength'),
                    agility: calculateTotal('agility'),
                    intelligence: calculateTotal('intelligence')
                },
                canUpgrade: state.level < ATTR_CONFIG.maxLevel
            };
        },

        applyChange: function(action, payload) {
            switch (action) {
                case 'UPGRADE_LEVEL':
                    return this.upgradeLevel();
                case 'ALLOCATE_POINT':
                    return this.allocatePoint(payload.attribute);
                case 'DEALLOCATE_POINT':
                    return this.deallocatePoint(payload.attribute);
                case 'ADD_BONUS':
                    return this.addBonus(payload.attribute, payload.value);
                case 'REMOVE_BONUS':
                    return this.removeBonus(payload.attribute, payload.value);
                default:
                    return { success: false, error: 'Unknown action' };
            }
        },

        upgradeLevel: function() {
            if (state.level >= ATTR_CONFIG.maxLevel) {
                return { success: false, error: '已达到最高等级' };
            }
            
            state.level++;
            state.freePoints += ATTR_CONFIG.pointsPerLevel;
            
            if (onStateChange) onStateChange();
            
            return { 
                success: true, 
                pointsGained: ATTR_CONFIG.pointsPerLevel,
                newLevel: state.level
            };
        },

        allocatePoint: function(attrName) {
            if (state.freePoints <= 0) {
                return { success: false, error: '没有可用的自由属性点' };
            }
            
            if (!state.base.hasOwnProperty(attrName)) {
                return { success: false, error: '无效的属性名称' };
            }
            
            const newTotal = calculateTotal(attrName) + 1;
            if (newTotal > ATTR_CONFIG.maxValue) {
                return { success: false, error: `属性值不能超过${ATTR_CONFIG.maxValue}` };
            }
            
            state.allocated[attrName]++;
            state.freePoints--;
            
            if (onStateChange) onStateChange();
            
            return { success: true };
        },

        deallocatePoint: function(attrName) {
            if (!state.base.hasOwnProperty(attrName)) {
                return { success: false, error: '无效的属性名称' };
            }
            
            if (state.allocated[attrName] <= 0) {
                return { success: false, error: '没有可收回的分配点' };
            }
            
            const newTotal = calculateTotal(attrName) - 1;
            if (newTotal < ATTR_CONFIG.minValue) {
                return { success: false, error: `属性值不能低于${ATTR_CONFIG.minValue}` };
            }
            
            state.allocated[attrName]--;
            state.freePoints++;
            
            if (onStateChange) onStateChange();
            
            return { success: true };
        },

        addBonus: function(attrName, value) {
            if (!state.bonuses.hasOwnProperty(attrName)) {
                return { success: false, error: '无效的属性名称' };
            }
            
            state.bonuses[attrName] += value;
            
            Object.keys(state.bonuses).forEach(attr => {
                state.bonuses[attr] = clamp(
                    state.bonuses[attr],
                    ATTR_CONFIG.minValue - (state.base[attr] + state.allocated[attr]),
                    ATTR_CONFIG.maxValue - (state.base[attr] + state.allocated[attr])
                );
            });
            
            if (onStateChange) onStateChange();
            
            return { success: true };
        },

        removeBonus: function(attrName, value) {
            return this.addBonus(attrName, -value);
        },

        getAttributeTotal: function(attrName) {
            return calculateTotal(attrName);
        },

        getConfig: function() {
            return { ...ATTR_CONFIG };
        }
    };

    window.AttrSys = AttrSys;
})();