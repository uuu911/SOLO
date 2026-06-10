const SpellData = (() => {
  const spells = {
    fire: {
      id: 'fire',
      name: '火焰冲击',
      unlocked: true,
      manaCost: 20,
      color: '#ff4500',
      template: [
        { x: 0.5, y: 0.1 },
        { x: 0.1, y: 0.9 },
        { x: 0.9, y: 0.9 },
        { x: 0.5, y: 0.1 }
      ]
    },
    ice: {
      id: 'ice',
      name: '寒冰护盾',
      unlocked: false,
      manaCost: 20,
      color: '#00bfff',
      template: (() => {
        const points = [];
        for (let i = 0; i <= 36; i++) {
          const angle = (i / 36) * Math.PI * 2;
          points.push({
            x: 0.5 + Math.cos(angle) * 0.4,
            y: 0.5 + Math.sin(angle) * 0.4
          });
        }
        return points;
      })()
    },
    heal: {
      id: 'heal',
      name: '治愈之光',
      unlocked: false,
      manaCost: 20,
      color: '#ffd700',
      template: [
        { x: 0.5, y: 0.1 },
        { x: 0.5, y: 0.9 },
        { x: 0.1, y: 0.5 },
        { x: 0.9, y: 0.5 }
      ]
    },
    lightning: {
      id: 'lightning',
      name: '闪电链',
      unlocked: false,
      manaCost: 20,
      color: '#9400d3',
      template: [
        { x: 0.1, y: 0.1 },
        { x: 0.3, y: 0.4 },
        { x: 0.5, y: 0.1 },
        { x: 0.7, y: 0.4 },
        { x: 0.9, y: 0.1 },
        { x: 0.7, y: 0.7 },
        { x: 0.5, y: 0.4 },
        { x: 0.3, y: 0.7 },
        { x: 0.1, y: 0.4 }
      ]
    }
  };

  return {
    getSpell: (id) => spells[id],
    getAllSpells: () => Object.values(spells),
    unlockSpell: (id) => {
      if (spells[id]) {
        spells[id].unlocked = true;
        return true;
      }
      return false;
    },
    isUnlocked: (id) => spells[id]?.unlocked ?? false
  };
})();
