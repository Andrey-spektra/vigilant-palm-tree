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
    safeStoreSet('Ammunition', ammo);
  }

  function currentAmmo() {
    const v = safeStoreGet('Ammunition');
    return v === null ? 100 : v;
  }

  function setGameFinished(value) {
    safeStoreSet('gameFinished', Boolean(value));
  }

  function isGameFinished() {
    return safeStoreGet('gameFinished') === true;
  }
  return {
    currentScore,
    getCurrentScore,
    setAmmo,
    currentAmmo,
    setGameFinished,
    isGameFinished,
  };
})();


module.exports = Storage;
