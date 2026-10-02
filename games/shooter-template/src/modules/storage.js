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

  // Выбранный в меню персонаж: 'male' (Автор-мужчина, спрайт sprPlayer)
  // или 'female' (Автор-женщина, спрайт sprAuthorFemale).
  // Значение живёт и в localStorage (переживает перезагрузку страницы),
  // и в window.__GAME_CHARACTER__ — его читает SceneMain напрямую.
  // Сюжетная глава 2 играет поклонницей ('fan') — она не выбирается в меню
  // и не сохраняется, поэтому её в Storage быть не может.
  function isPlayableCharacter(id) {
    return id === 'male' || id === 'female';
  }

  function setCharacter(id) {
    const value = id === 'female' ? 'female' : 'male';
    safeStoreSet('selectedCharacter', value);
    try { window.__GAME_CHARACTER__ = value; } catch (e) { /* ignore */ }
    return value;
  }

  function getCharacter() {
    let v = null;
    try { v = window.__GAME_CHARACTER__; } catch (e) { /* ignore */ }
    if (!isPlayableCharacter(v)) v = safeStoreGet('selectedCharacter');
    return isPlayableCharacter(v) ? v : 'male';
  }

  // Ключ спрайт-листа игрока: 'male' -> sprPlayer, 'female' -> sprAuthorFemale,
  // 'fan' -> sprFan (поклонница второй главы).
  function characterKey(id) {
    const v = id || getCharacter();
    if (v === 'fan') return 'sprFan';
    return v === 'female' ? 'sprAuthorFemale' : 'sprPlayer';
  }

  return {
    currentScore,
    getCurrentScore,
    setAmmo,
    currentAmmo,
    setGameFinished,
    isGameFinished,
    setCharacter,
    getCharacter,
    characterKey,
    isPlayableCharacter,
  };
})();


module.exports = Storage;
