(function() {
    'use strict';

    const ATTR_NAMES = {
        strength: '力量',
        agility: '敏捷',
        intelligence: '智力'
    };

    let debounceTimers = {};

    function debounce(func, wait, key) {
        if (debounceTimers[key]) {
            clearTimeout(debounceTimers[key]);
        }
        debounceTimers[key] = setTimeout(func, wait);
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function renderAttributes() {
        const attrState = window.AttrSys.getState();
        const container = document.getElementById('attributes-list');
        
        container.innerHTML = '';
        
        for (const [attr, value] of Object.entries(attrState.totals)) {
            const item = document.createElement('div');
            item.className = 'attribute-item';
            
            const canAdd = attrState.freePoints > 0 && value < 100;
            const canRemove = attrState.allocated[attr] > 0 && value > 1;
            
            item.innerHTML = `
                <div class="attr-name">${ATTR_NAMES[attr]}</div>
                <div>
                    <div class="attr-value">${value}</div>
                    <div class="attr-breakdown">
                        基础: ${attrState.base[attr]} + 
                        分配: ${attrState.allocated[attr]} + 
                        加成: ${attrState.bonuses[attr]}
                    </div>
                </div>
                <div class="attr-buttons">
                    <button class="btn-attr btn-minus" data-attr="${attr}" ${!canRemove ? 'disabled' : ''}>-</button>
                    <button class="btn-attr btn-plus" data-attr="${attr}" ${!canAdd ? 'disabled' : ''}>+</button>
                </div>
            `;
            
            container.appendChild(item);
        }
        
        document.getElementById('level-display').textContent = attrState.level;
        document.getElementById('free-points-value').textContent = attrState.freePoints;
        
        const upgradeBtn = document.getElementById('btn-upgrade');
        upgradeBtn.disabled = !attrState.canUpgrade;
        if (attrState.level >= 10) {
            upgradeBtn.textContent = '已满级';
        }
    }

    function renderSkillTree() {
        const skillState = window.SkillSys.getState();
        const attrState = window.AttrSys.getState();
        const container = document.getElementById('skill-tree');
        
        document.getElementById('skill-points-value').textContent = skillState.skillPoints;
        
        container.innerHTML = '';
        
        for (const [branchKey, branch] of Object.entries(skillState.skillTree)) {
            const branchElement = document.createElement('div');
            branchElement.className = `skill-branch ${branchKey}`;
            
            const title = document.createElement('div');
            title.className = 'skill-branch-title';
            title.textContent = branch.name;
            branchElement.appendChild(title);
            
            for (const skill of branch.skills) {
                const canLearn = window.SkillSys.canLearnSkill(skill.id, attrState.totals);
                const isLearned = skillState.learnedSkills.includes(skill.id);
                
                const skillElement = document.createElement('div');
                skillElement.className = `skill-item skill-depth-${skill.depth} ${isLearned ? 'learned' : ''} ${canLearn.canLearn ? 'available' : 'locked'}`;
                
                const reqText = window.SkillSys.getRequirementsText(skill);
                const reqSatisfied = isLearned || canLearn.canLearn;
                
                skillElement.innerHTML = `
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-desc">${skill.description}</div>
                    <div class="skill-req ${reqSatisfied ? 'satisfied' : ''}">需求: ${reqText}</div>
                    ${!isLearned ? `
                        <button class="btn btn-learn" data-skill="${skill.id}" ${!canLearn.canLearn ? 'disabled' : ''} title="${canLearn.reason || ''}">
                            学习 (${skill.cost}点)
                        </button>
                    ` : '<span style="color: #2ecc71;">✓ 已学习</span>'}
                `;
                
                branchElement.appendChild(skillElement);
            }
            
            container.appendChild(branchElement);
        }
    }

    function renderEquipment() {
        const equipState = window.EquipSys.getState();
        const container = document.getElementById('equipment-slots');
        
        container.innerHTML = '';
        
        for (const [slotKey, slot] of Object.entries(equipState.equipmentData)) {
            const slotElement = document.createElement('div');
            slotElement.className = 'equipment-slot';
            
            const title = document.createElement('div');
            title.className = 'slot-title';
            title.textContent = slot.name;
            slotElement.appendChild(title);
            
            const equippedItem = equipState.equipped[slotKey];
            
            if (equippedItem) {
                const equipped = window.EquipSys.getEquippedItem(slotKey);
                const equippedElement = document.createElement('div');
                equippedElement.className = 'equipped-item';
                equippedElement.innerHTML = `
                    <div class="equipped-name">已装备: ${equipped.name}</div>
                    <div class="equip-stats">${window.EquipSys.getStatsText(equipped)}</div>
                    <button class="btn btn-unequip" data-slot="${slotKey}">卸下</button>
                `;
                slotElement.appendChild(equippedElement);
            }
            
            const listElement = document.createElement('div');
            listElement.className = 'equipment-list';
            
            for (const item of slot.items) {
                if (item.id === equippedItem) continue;
                
                const itemElement = document.createElement('div');
                itemElement.className = 'equipment-item';
                itemElement.dataset.equip = item.id;
                itemElement.innerHTML = `
                    <div class="equip-name">${item.name}</div>
                    <div class="equip-stats">${window.EquipSys.getStatsText(item)}</div>
                `;
                listElement.appendChild(itemElement);
            }
            
            slotElement.appendChild(listElement);
            container.appendChild(slotElement);
        }
    }

    function renderAll() {
        renderAttributes();
        renderSkillTree();
        renderEquipment();
    }

    function setupEventListeners() {
        document.getElementById('btn-upgrade').addEventListener('click', function() {
            const result = window.AttrSys.applyChange('UPGRADE_LEVEL', {});
            if (result.success) {
                showNotification(`升级成功！达到 ${result.newLevel} 级，获得 ${result.pointsGained} 点属性点`, 'success');
                renderAll();
            } else {
                showNotification(result.error, 'error');
            }
        });

        document.getElementById('attributes-list').addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-plus')) {
                const attr = e.target.dataset.attr;
                debounce(() => {
                    const result = window.AttrSys.applyChange('ALLOCATE_POINT', { attribute: attr });
                    if (result.success) {
                        renderAll();
                    } else {
                        showNotification(result.error, 'warning');
                    }
                }, 100, `attr_plus_${attr}`);
            } else if (e.target.classList.contains('btn-minus')) {
                const attr = e.target.dataset.attr;
                debounce(() => {
                    const result = window.AttrSys.applyChange('DEALLOCATE_POINT', { attribute: attr });
                    if (result.success) {
                        renderAll();
                    } else {
                        showNotification(result.error, 'warning');
                    }
                }, 100, `attr_minus_${attr}`);
            }
        });

        document.getElementById('skill-tree').addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-learn')) {
                const skillId = e.target.dataset.skill;
                const attrState = window.AttrSys.getState();
                const result = window.SkillSys.applyChange('LEARN_SKILL', { 
                    skillId: skillId, 
                    attrTotals: attrState.totals 
                });
                if (result.success) {
                    showNotification(`学习技能成功: ${result.skill.name}`, 'success');
                    renderAll();
                } else {
                    showNotification(result.error, 'warning');
                }
            }
        });

        document.getElementById('equipment-slots').addEventListener('click', function(e) {
            if (e.target.closest('.equipment-item')) {
                const equipId = e.target.closest('.equipment-item').dataset.equip;
                if (equipId) {
                    const result = window.EquipSys.applyChange('EQUIP_ITEM', { equipId: equipId });
                    if (result.success) {
                        showNotification(`装备成功: ${result.equipment.name}`, 'success');
                        renderAll();
                    } else {
                        showNotification(result.error, 'error');
                    }
                }
            } else if (e.target.classList.contains('btn-unequip')) {
                const slot = e.target.dataset.slot;
                const result = window.EquipSys.applyChange('UNEQUIP_ITEM', { slot: slot });
                if (result.success) {
                    showNotification('装备已卸下', 'info');
                    renderAll();
                } else {
                    showNotification(result.error, 'error');
                }
            }
        });
    }

    function handleSkillAttributeChange(attribute, value) {
        window.AttrSys.applyChange('ADD_BONUS', { attribute: attribute, value: value });
    }

    function handleEquipAttributeChange(attribute, value) {
        window.AttrSys.applyChange('ADD_BONUS', { attribute: attribute, value: value });
    }

    function init() {
        window.AttrSys.init({
            onStateChange: renderAll
        });

        window.SkillSys.init({
            onStateChange: renderAll,
            onAttributeChange: handleSkillAttributeChange
        });

        window.EquipSys.init({
            onStateChange: renderAll,
            onAttributeChange: handleEquipAttributeChange
        });

        renderAll();
        setupEventListeners();
        
        console.log('RPG角色成长系统已初始化完成！');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();