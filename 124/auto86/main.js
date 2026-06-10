const Main = (() => {
  let canvas;
  let isProcessing = false;
  let effectEndTime = 0;

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    document.body.appendChild(canvas);

    Drawing.init(canvas, handleStrokeComplete);
    Effects.init(canvas);
    UI.init(handleUndo, handleSpellSelect);

    gameLoop();
  }

  function handleStrokeComplete(points) {
    if (isProcessing) return;

    const canvas = Drawing.getCanvas();
    const unlockResults = SoulUnlock.checkUnlockConditions(points, canvas);
    unlockResults.forEach(result => {
      const unlockResult = SoulUnlock.attemptUnlock(result.spellId);
      if (unlockResult.success) {
        UI.showMessage(unlockResult.message, 'success', 3000);
        UI.updateSpellbook();
      }
    });

    const recognition = Recognizer.recognize(points, canvas);

    if (recognition.match) {
      const spell = recognition.match;
      const manaCost = spell.manaCost;

      if (UI.getMana() < manaCost) {
        UI.showMessage('魔力不足！', 'error');
        Drawing.clearStrokes();
        return;
      }

      isProcessing = true;
      Drawing.setCanUndo(false);
      UI.setUndoEnabled(false);

      UI.consumeMana(manaCost);
      UI.showMessage(`${spell.name}！相似度: ${Math.round(recognition.similarity * 100)}%`, 'success');

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      Effects.playEffect(spell.id, cx, cy);

      effectEndTime = Date.now() + 1500;
      Drawing.clearStrokes();
    } else {
      UI.startCooldown();
      UI.consumeMana(5);
      UI.showMessage('施法失败，扣除5点魔力', 'error');
      Drawing.clearStrokes();
    }
  }

  function handleUndo() {
    if (isProcessing) return;
    const success = Drawing.undo();
    if (success) {
      UI.showMessage('已撤销', 'info', 1000);
    }
  }

  function handleSpellSelect(spellId) {
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (isProcessing && Date.now() > effectEndTime && !Effects.isActive()) {
      isProcessing = false;
      Drawing.setCanUndo(true);
      UI.setUndoEnabled(true);
    }

    Effects.update();
    Drawing.render();
    Effects.render();
  }

  return {
    init
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Main.init();
});
