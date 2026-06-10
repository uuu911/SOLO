(function() {
    'use strict';

    const SKILL_TREE = {
        strength: {
            name: '力量系',
            skills: [
                {
                    id: 'str1',
                    name: '铁骨锻体',
                    description: '被动：强健的体魄使你力量永久+2',
                    depth: 1,
                    prerequisites: [],
                    requirements: { strength: 10 },
                    effects: { type: 'passive', attribute: 'strength', value: 2 },
                    cost: 1
                },
                {
                    id: 'str2',
                    name: '破甲攻击',
                    description: '主动：下次攻击忽略目标5点护甲',
                    depth: 2,
                    prerequisites: ['str1'],
                    requirements: { strength: 15 },
                    effects: { type: 'active', description: '破甲' },
                    cost: 1
                },
                {
                    id: 'str3',
                    name: '泰坦之力',
                    description: '被动：泰坦血脉觉醒，力量永久+4',
                    depth: 3,
                    prerequisites: ['str2'],
                    requirements: { strength: 20 },
                    effects: { type: 'passive', attribute: 'strength', value: 4 },
                    cost: 1
                }
            ]
        },
        agility: {
            name: '敏捷系',
            skills: [
                {
                    id: 'agi1',
                    name: '疾风步',
                    description: '被动：身法轻盈，敏捷永久+2',
                    depth: 1,
                    prerequisites: [],
                    requirements: { agility: 10 },
                    effects: { type: 'passive', attribute: 'agility', value: 2 },
                    cost: 1
                },
                {
                    id: 'agi2',
                    name: '致命一击',
                    description: '主动：临时增加5秒内敏捷+5',
                    depth: 2,
                    prerequisites: ['agi1'],
                    requirements: { agility: 15 },
                    effects: { type: 'active', description: '疾风' },
                    cost: 1
                },
                {
                    id: 'agi3',
                    name: '影舞者',
                    description: '被动：如影随形，敏捷永久+4',
                    depth: 3,
                    prerequisites: ['agi2'],
                    requirements: { agility: 20 },
                    effects: { type: 'passive', attribute: 'agility', value: 4 },
                    cost: 1
                }
            ]
        },
        intelligence: {
            name: '智力系',
            skills: [
                {
                    id: 'int1',
                    name: '奥术亲和',
                    description: '被动：对魔法亲和力提升，智力永久+2',
                    depth: 1,
                    prerequisites: [],
                    requirements: { intelligence: 10 },
                    effects: { type: 'passive', attribute: 'intelligence', value: 2 },
                    cost: 1
                },
                {
                    id: 'int2',
                    name: '魔法护盾',
                    description: '主动：制造吸收20点伤害',
                    depth: 2,
                    prerequisites: ['int1'],
                    requirements: { intelligence: 15 },
                    effects: { type: 'active', description: '护盾' },
                    cost: 1
                },
                {
                    id: 'int3',
                    name: '秘法大师',
                    description: '被动：领悟秘法知识渊博，智力永久+4',
                    depth: 3,
                    prerequisites: ['int2'],
                    requirements: { intelligence: 20 },
                    effects: { type: 'passive', attribute: 'intelligence', value: 4 },
                    cost: 1
                }
            ]
        }
    };

    const INITIAL_SKILL_POINTS = 3;

    let state = {
        skillPoints: INITIAL_SKILL_POINTS,
        learnedSkills: [],
        activeSkills: []
    };

    let onStateChange = null;
    let onAttributeChange = null;

    function getAllSkills() {
        const allSkills = [];
        Object.values(SKILL_TREE).forEach(branch => {
            allSkills.push(...branch.skills);
        });
        return allSkills.flat();
    }

    function findSkill(skillId) {
        for (const branch of Object.values(SKILL_TREE)) {
            const skill = branch.skills.find(s => s.id === skillId);
            if (skill) return skill;
        }
        return null;
    }

    function checkPrerequisites(skill) {
        return skill.prerequisites.every(prereqId => 
            state.learnedSkills.includes(prereqId)
        );
    }

    function checkRequirements(skill, attrTotals) {
        for (const [attr, value] of Object.entries(skill.requirements)) {
            if (attrTotals[attr] < value) {
                return false;
            }
        }
        return true;
    }

    const SkillSys = {
        init: function(config) {
            state = {
                skillPoints: INITIAL_SKILL_POINTS,
                learnedSkills: [],
                activeSkills: []
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
                skillPoints: state.skillPoints,
                learnedSkills: [...state.learnedSkills],
                activeSkills: [...state.activeSkills],
                skillTree: JSON.parse(JSON.stringify(SKILL_TREE))
            };
        },

        applyChange: function(action, payload) {
            switch (action) {
                case 'LEARN_SKILL':
                    return this.learnSkill(payload.skillId, payload.attrTotals);
                case 'USE_SKILL':
                    return this.useSkill(payload.skillId);
                default:
                    return { success: false, error: 'Unknown action' };
            }
        },

        learnSkill: function(skillId, attrTotals) {
            const skill = findSkill(skillId);
            
            if (!skill) {
                return { success: false, error: '技能不存在' };
            }
            
            if (state.learnedSkills.includes(skillId)) {
                return { success: false, error: '已学习该技能' };
            }
            
            if (state.skillPoints < skill.cost) {
                return { success: false, error: '技能点不足' };
            }
            
            if (!checkPrerequisites(skill)) {
                return { success: false, error: '前置技能未学习' };
            }
            
            if (!checkRequirements(skill, attrTotals)) {
                return { success: false, error: '属性要求不满足' };
            }
            
            state.skillPoints -= skill.cost;
            state.learnedSkills.push(skillId);
            
            if (skill.effects.type === 'passive' && skill.effects.attribute) {
                if (onAttributeChange) {
                    onAttributeChange(skill.effects.attribute, skill.effects.value);
                }
            }
            
            if (onStateChange) onStateChange();
            
            return { 
                success: true, 
                skill: skill,
                effects: skill.effects
            };
        },

        useSkill: function(skillId) {
            const skill = findSkill(skillId);
            
            if (!skill) {
                return { success: false, error: '技能不存在' };
            }
            
            if (!state.learnedSkills.includes(skillId)) {
                return { success: false, error: '未学习该技能' };
            }
            
            if (skill.effects.type !== 'active') {
                return { success: false, error: '不是主动技能' };
            }
            
            return { 
                success: true, 
                skill: skill,
                effects: skill.effects
            };
        },

        canLearnSkill: function(skillId, attrTotals) {
            const skill = findSkill(skillId);
            if (!skill) return { canLearn: false, reason: '技能不存在' };
            
            if (state.learnedSkills.includes(skillId)) {
                return { canLearn: false, reason: '已学习' };
            }
            
            if (state.skillPoints < skill.cost) {
                return { canLearn: false, reason: '技能点不足' };
            }
            
            if (!checkPrerequisites(skill)) {
                return { canLearn: false, reason: '前置技能未学习' };
            }
            
            if (!checkRequirements(skill, attrTotals)) {
                return { canLearn: false, reason: '属性要求不满足' };
            }
            
            return { canLearn: true };
        },

        getSkillInfo: function(skillId) {
            return findSkill(skillId);
        },

        getSkillTree: function() {
            return JSON.parse(JSON.stringify(SKILL_TREE));
        },

        getRequirementsText: function(skill) {
            const reqs = [];
            for (const [attr, value] of Object.entries(skill.requirements)) {
                const attrNames = {
                    strength: '力量',
                    agility: '敏捷',
                    intelligence: '智力'
                };
                reqs.push(`${attrNames[attr]} ${value}`);
            }
            return reqs.join('、');
        }
    };

    window.SkillSys = SkillSys;
})();