const UI = (() => {
  let mana = 100;
  const maxMana = 100;
  let onUndo = null;
  let onSpellSelect = null;
  let isOnCooldown = false;
  let cooldownProgress = 0;
  let spellbookOpen = false;

  function init(undoCallback, spellSelectCallback) {
    onUndo = undoCallback;
    onSpellSelect = spellSelectCallback;
    createUI();
    bindEvents();
    updateManaBar();
    updateSpellbook();
  }

  function createUI() {
    const uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    uiContainer.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
        }
        body {
          overflow: hidden;
          background: #0a0015;
          font-family: 'Segoe UI', sans-serif;
        }
        #game-canvas {
          display: block;
        }
        #ui-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          pointer-events: none;
        }
        #ui-container > * {
          pointer-events: auto;
        }
        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          background: linear-gradient(180deg, rgba(20, 0, 40, 0.9) 0%, transparent 100%);
        }
        .mana-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mana-label {
          color: #9370db;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .mana-bar {
          width: 200px;
          height: 12px;
          background: rgba(50, 30, 70, 0.8);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(147, 112, 219, 0.5);
        }
        .mana-fill {
          height: 100%;
          background: linear-gradient(90deg, #9370db, #da70d6);
          border-radius: 6px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(147, 112, 219, 0.5);
        }
        .mana-value {
          color: #fff;
          font-size: 14px;
          min-width: 50px;
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(147, 112, 219, 0.3), rgba(147, 112, 219, 0.1));
          border: 1px solid rgba(147, 112, 219, 0.5);
          border-radius: 6px;
          color: #fff;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .btn:hover {
          background: linear-gradient(135deg, rgba(147, 112, 219, 0.5), rgba(147, 112, 219, 0.3));
          box-shadow: 0 0 15px rgba(147, 112, 219, 0.3);
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .spell-indicator {
          position: relative;
          width: 60px;
          height: 60px;
        }
        .spell-icon {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: linear-gradient(135deg, rgba(255, 69, 0, 0.3), rgba(255, 69, 0, 0.1));
          border: 2px solid #ff4500;
          box-shadow: 0 0 20px rgba(255, 69, 0, 0.3);
        }
        .cooldown-ring {
          position: absolute;
          top: -3px;
          left: -3px;
          width: 66px;
          height: 66px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #fff;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cooldown-ring.active {
          opacity: 1;
          animation: spin 1s linear;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spellbook-toggle {
          position: fixed;
          right: 20px;
          top: 80px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
          border: 2px solid #ffd700;
          color: #ffd700;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          z-index: 101;
        }
        .spellbook-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
        }
        .spellbook {
          position: fixed;
          right: -320px;
          top: 0;
          width: 300px;
          height: 100vh;
          background: linear-gradient(180deg, rgba(20, 0, 40, 0.98), rgba(10, 0, 20, 0.98));
          border-left: 2px solid rgba(147, 112, 219, 0.5);
          padding: 80px 20px 20px;
          transition: right 0.4s ease;
          overflow-y: auto;
          z-index: 100;
        }
        .spellbook.open {
          right: 0;
        }
        .spellbook-title {
          color: #ffd700;
          font-size: 20px;
          text-align: center;
          margin-bottom: 25px;
          text-transform: uppercase;
          letter-spacing: 3px;
          border-bottom: 1px solid rgba(255, 215, 0, 0.3);
          padding-bottom: 15px;
        }
        .spell-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          margin-bottom: 10px;
          background: rgba(50, 30, 70, 0.5);
          border-radius: 10px;
          border: 1px solid rgba(147, 112, 219, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        .spell-item:hover:not(.locked) {
          background: rgba(70, 50, 90, 0.6);
          transform: translateX(-5px);
        }
        .spell-item.locked {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .spell-item.selected {
          border-color: #ffd700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }
        .spell-item-icon {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .spell-item-info {
          flex: 1;
        }
        .spell-item-name {
          color: #fff;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .spell-item-status {
          font-size: 12px;
        }
        .spell-item-status.unlocked {
          color: #90ee90;
        }
        .spell-item-status.locked {
          color: #ff6b6b;
        }
        .message {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          padding: 15px 30px;
          background: rgba(20, 0, 40, 0.95);
          border: 2px solid;
          border-radius: 10px;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          z-index: 200;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .message.show {
          opacity: 1;
        }
        .message.success {
          border-color: #90ee90;
          color: #90ee90;
        }
        .message.error {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }
        .message.info {
          border-color: #87ceeb;
          color: #87ceeb;
        }
      </style>
      <div class="top-bar">
        <div class="mana-container">
          <span class="mana-label">魔力</span>
          <div class="mana-bar">
            <div class="mana-fill" id="mana-fill"></div>
          </div>
          <span class="mana-value" id="mana-value">100/100</span>
        </div>
        <div class="controls">
          <button class="btn" id="undo-btn">撤销 (Ctrl+Z)</button>
          <div class="spell-indicator">
            <div class="spell-icon" id="current-spell-icon">🔥</div>
            <div class="cooldown-ring" id="cooldown-ring"></div>
          </div>
        </div>
      </div>
      <button class="spellbook-toggle" id="spellbook-toggle">📖</button>
      <div class="spellbook" id="spellbook">
        <div class="spellbook-title">法术书</div>
        <div id="spell-list"></div>
      </div>
      <div class="message" id="message"></div>
    `;
    document.body.appendChild(uiContainer);
  }

  function bindEvents() {
    document.getElementById('undo-btn').addEventListener('click', () => {
      if (onUndo) onUndo();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (onUndo) onUndo();
      }
    });

    document.getElementById('spellbook-toggle').addEventListener('click', toggleSpellbook);
  }

  function updateManaBar() {
    const fill = document.getElementById('mana-fill');
    const value = document.getElementById('mana-value');
    const percentage = (mana / maxMana) * 100;
    fill.style.width = `${percentage}%`;
    value.textContent = `${Math.floor(mana)}/${maxMana}`;
  }

  function updateSpellbook() {
    const spellList = document.getElementById('spell-list');
    const spells = SpellData.getAllSpells();
    const icons = { fire: '🔥', ice: '❄️', heal: '✨', lightning: '⚡' };

    spellList.innerHTML = spells.map(spell => `
      <div class="spell-item ${spell.unlocked ? '' : 'locked'}" data-spell="${spell.id}">
        <div class="spell-item-icon" style="background: ${spell.unlocked ? `linear-gradient(135deg, ${spell.color}40, ${spell.color}20)` : 'rgba(50, 50, 50, 0.5)'}; border: 2px solid ${spell.unlocked ? spell.color : '#666'};">
          ${icons[spell.id] || '?'}
        </div>
        <div class="spell-item-info">
          <div class="spell-item-name">${spell.name}</div>
          <div class="spell-item-status ${spell.unlocked ? 'unlocked' : 'locked'}">
            ${spell.unlocked ? '已解锁' : '未解锁'}
          </div>
        </div>
      </div>
    `).join('');

    spellList.querySelectorAll('.spell-item:not(.locked)').forEach(item => {
      item.addEventListener('click', () => {
        const spellId = item.dataset.spell;
        selectSpell(spellId);
      });
    });
  }

  function selectSpell(spellId) {
    if (!SpellData.isUnlocked(spellId)) return;

    const spell = SpellData.getSpell(spellId);
    const icons = { fire: '🔥', ice: '❄️', heal: '✨', lightning: '⚡' };

    document.getElementById('current-spell-icon').textContent = icons[spellId] || '?';
    document.getElementById('current-spell-icon').style.background = `linear-gradient(135deg, ${spell.color}40, ${spell.color}20)`;
    document.getElementById('current-spell-icon').style.borderColor = spell.color;
    document.getElementById('current-spell-icon').style.boxShadow = `0 0 20px ${spell.color}30`;

    document.querySelectorAll('.spell-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.spell === spellId);
    });

    if (onSpellSelect) onSpellSelect(spellId);
    if (spellbookOpen) toggleSpellbook();
  }

  function toggleSpellbook() {
    spellbookOpen = !spellbookOpen;
    document.getElementById('spellbook').classList.toggle('open', spellbookOpen);
  }

  function consumeMana(amount) {
    mana = Math.max(0, mana - amount);
    updateManaBar();
  }

  function restoreMana(amount) {
    mana = Math.min(maxMana, mana + amount);
    updateManaBar();
  }

  function getMana() {
    return mana;
  }

  function startCooldown() {
    isOnCooldown = true;
    const ring = document.getElementById('cooldown-ring');
    ring.classList.add('active');
    setTimeout(() => {
      isOnCooldown = false;
      ring.classList.remove('active');
    }, 1000);
  }

  function showMessage(text, type = 'info', duration = 2000) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message show ${type}`;
    setTimeout(() => {
      msg.classList.remove('show');
    }, duration);
  }

  function setUndoEnabled(enabled) {
    document.getElementById('undo-btn').disabled = !enabled;
  }

  return {
    init,
    consumeMana,
    restoreMana,
    getMana,
    startCooldown,
    showMessage,
    setUndoEnabled,
    selectSpell,
    updateSpellbook
  };
})();
