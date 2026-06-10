const SoulUnlock = (() => {
  let unlockHooks = [];

  function addUnlockHook(hook) {
    if (typeof hook === 'function') {
      unlockHooks.push(hook);
    }
  }

  function removeUnlockHook(hook) {
    const index = unlockHooks.indexOf(hook);
    if (index > -1) {
      unlockHooks.splice(index, 1);
    }
  }

  function checkUnlockConditions(points, canvas) {
    const results = [];
    unlockHooks.forEach(hook => {
      try {
        const result = hook(points, canvas);
        if (result && result.spellId) {
          results.push(result);
        }
      } catch (e) {
        console.error('Unlock hook error:', e);
      }
    });
    return results;
  }

  function attemptUnlock(spellId) {
    if (SpellData.isUnlocked(spellId)) {
      return { success: false, message: '该法术已解锁' };
    }
    const spell = SpellData.getSpell(spellId);
    if (!spell) {
      return { success: false, message: '法术不存在' };
    }
    SpellData.unlockSpell(spellId);
    return { success: true, message: `已解锁: ${spell.name}` };
  }

  function getAvailableSpells() {
    return SpellData.getAllSpells().filter(s => s.unlocked);
  }

  function getLockedSpells() {
    return SpellData.getAllSpells().filter(s => !s.unlocked);
  }

  addUnlockHook((points, canvas) => {
    return null;
  });

  return {
    addUnlockHook,
    removeUnlockHook,
    checkUnlockConditions,
    attemptUnlock,
    getAvailableSpells,
    getLockedSpells
  };
})();
