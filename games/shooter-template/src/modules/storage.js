const Storage = (() => {
  // На file:// (оффлайн-запуск без сервера) некоторые браузеры блокируют
  // localStorage и кидают SecurityError при любом обращении. Не даём ему
  // ронять сцену — любой сбой возвращаем безопасным значением.
  function safeStoreGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function safeStoreSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* молча пропускаем — оффлайн без localStorage игра работает, только не запоминает счёт */
    }
  }

  function currentScore(score) {
    safeStoreSet('currentScore', score);
  }

  function getCurrentScore() {
    const v = safeStoreGet('currentScore');
    return v === null ? 0 : v;
  }

  function setAmmo(ammo) {
    // Infinity через JSON.stringify превращается в null — сохраняем как строку-маркер.
    safeStoreSet('Ammunition', ammo === Infinity ? '∞' : ammo);
  }

  function currentAmmo() {
    const v = safeStoreGet('Ammunition');
    if (v === null || v === '∞') return Infinity; // слова бесконечны
    return v;
  }

  function setGameFinished(value) {
    safeStoreSet('gameFinished', Boolean(value));
  }

  function isGameFinished() {
    return safeStoreGet('gameFinished') === true;
  }

  // Пол автора-персонажа: 'male' | 'female'. null — выбор ещё не сделан.
  function getAuthorGender() {
    const v = safeStoreGet('authorGender');
    return v === 'male' || v === 'female' ? v : null;
  }

  function setAuthorGender(g) {
    if (g === 'male' || g === 'female') safeStoreSet('authorGender', g);
  }

  return {
    currentScore,
    getCurrentScore,
    setAmmo,
    currentAmmo,
    setGameFinished,
    isGameFinished,
    getAuthorGender,
    setAuthorGender,
  };
})();


module.exports = Storage;
