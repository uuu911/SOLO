(function() {
    'use strict';

    const EQUIPMENT_DATA = {
        weapon: {
            name: '武器',
            items: [
                {
                    id: 'iron_sword',
                    name: '精钢巨剑',
                    description: '由矮人铁匠打造的双手剑',
                    stats: { strength: 5 },
                    slot: 'weapon'
                },
                {
                    id: 'short_bow',
                    name: '精灵短弓',
                    description: '来自银月森林的狩猎弓',
                    stats: { agility: 5 },
                    slot: 'weapon'
                }
            ]
        },
        armor: {
            name: '护甲',
            items: [
                {
                    id: 'plate_armor',
                    name: '重型板甲',
                    description: '全身覆盖的厚重铠甲',
                    stats: { strength: 3 },
                    slot: 'armor'
                },
                {
                    id: 'leather_armor',
                    name: '影纹皮甲',
                    description: '轻盈的盗贼专用护甲',
                    stats: { agility: 3 },
                    slot: 'armor'
                }
            ]
        },
        accessory: {
            name: '饰品',
            items: [
                {
                    id: 'wisdom_ring',
                    name: '智慧之戒',
                    description: '镶嵌蓝宝石的魔法戒指',
                    stats: { intelligence: 4 },
                    slot: 'accessory'
                },
                {
                    id: 'life_amulet',
                    name: '生命护符',
                    description: '蕴含生命能量的神秘护符',
                    stats: { strength: 2, agility: 2 },
                    slot: 'accessory'
                }
            ]
        }
    };

    let state = {
        equipped: {
            weapon: null,
            armor: null,
            accessory: null
        }
    };

    let onStateChange = null;
    let onAttributeChange = null;

    function findEquipment(equipId) {
        for (const slot of Object.values(EQUIPMENT_DATA)) {
            const item = slot.items.find(i => i.id === equipId);
            if (item) return item;
        }
        return null;
    }

    function applyStats(stats, multiplier = 1) {
        for (const [attr, value] of Object.entries(stats)) {
            if (onAttributeChange) {
                onAttributeChange(attr, value * multiplier);
            }
        }
    }

    const EquipSys = {
        init: function(config) {
            state = {
                equipped: {
                    weapon: null,
                    armor: null,
                    accessory: null
                }
            };
            
            if (config && config.onStateChange) {
                onStateChange = config.onStateChange;
            }
            if (config && config.onAttributeChange) {
                onAttributeChange = config.onAttributeChange;
            }
            
            return this.getState();
        },

        getState: function() {
            return {
                equipped: { ...state.equipped },
                equipmentData: JSON.parse(JSON.stringify(EQUIPMENT_DATA))
            };
        },

        applyChange: function(action, payload) {
            switch (action) {
                case 'EQUIP_ITEM':
                    return this.equipItem(payload.equipId);
                case 'UNEQUIP_ITEM':
                    return this.unequipItem(payload.slot);
                default:
                    return { success: false, error: 'Unknown action' };
            }
        },

        equipItem: function(equipId) {
            const equipment = findEquipment(equipId);
            
            if (!equipment) {
                return { success: false, error: '装备不存在' };
            }
            
            const slot = equipment.slot;
            
            if (state.equipped[slot]) {
                const oldEquip = findEquipment(state.equipped[slot]);
                if (oldEquip) {
                    applyStats(oldEquip.stats, -1);
                }
            }
            
            state.equipped[slot] = equipId;
            applyStats(equipment.stats, 1);
            
            if (onStateChange) onStateChange();
            
            return { 
                success: true, 
                equipment: equipment,
                slot: slot
            };
        },

        unequipItem: function(slot) {
            if (!state.equipped[slot]) {
                return { success: false, error: '该部位没有装备' };
            }
            
            const equipment = findEquipment(state.equipped[slot]);
            if (equipment) {
                applyStats(equipment.stats, -1);
            }
            
            state.equipped[slot] = null;
            
            if (onStateChange) onStateChange();
            
            return { 
                success: true,
                slot: slot
            };
        },

        getEquippedItem: function(slot) {
            if (!state.equipped[slot]) return null;
            return findEquipment(state.equipped[slot]);
        },

        isEquipped: function(equipId) {
            const equipment = findEquipment(equipId);
            if (!equipment) return false;
            return state.equipped[equipment.slot] === equipId;
        },

        getEquipmentData: function() {
            return JSON.parse(JSON.stringify(EQUIPMENT_DATA));
        },

        getStatsText: function(equipment) {
            const statsTexts = [];
            const attrNames = {
                strength: '力量',
                agility: '敏捷',
                intelligence: '智力'
            };
            
            for (const [attr, value] of Object.entries(equipment.stats)) {
                const sign = value >= 0 ? '+' : '';
                statsTexts.push(`${attrNames[attr]} ${sign}${value}`);
            }
            
            return statsTexts.join('，');
        }
    };

    window.EquipSys = EquipSys;
})();