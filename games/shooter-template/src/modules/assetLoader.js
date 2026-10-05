/* eslint-disable no-undef */

// НЕ используем Phaser.Loader: на file:// его XHR к data-URI/локальным файлам
// ненадёжен и подвешивает сцену (чёрный экран). Вместо этого декодируем все
// ассеты обычными browser API (Image + AudioContext) ДО запуска игры,
// а затем регистрируем их в глобальные менеджеры Phaser синхронно.
// Так работает и на dev-сервере (HTTP), и оффлайн по двойному клику.

function b64ToU8(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function loadImage(bytes, mime) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image decode: ' + mime)); };
    img.src = url;
  });
}

// Единый «живой» контекст для декодирования и воспроизведения всех звуков.
// Раньше каждый WAV декодировался в отдельном OfflineAudioContext, который
// тут же умирал — такие «сиротские» AudioBuffer при play() подвешивали
// вкладку (игрок видел: выстрел -> зависание). Теперь один контекст на игру.
let sharedCtx = null;
function getSharedCtx() {
  if (sharedCtx) return sharedCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    sharedCtx = new AC();
  } catch (e) {
    try { sharedCtx = new AC({ latencyHint: 'interactive' }); } catch (e2) { sharedCtx = null; }
  }
  return sharedCtx;
}

function decodeAudioLive(bytes) {
  const ctx = getSharedCtx();
  if (!ctx) return Promise.reject(new Error('no AudioContext'));
  // decodeAudioData требует не-detached ArrayBuffer
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Promise((resolve, reject) => {
    try {
      const p = ctx.decodeAudioData(copy, resolve, reject);
      // старые браузеры возвращают promise и вызывают коллбэки тоже — защита
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    } catch (e) { reject(e); }
  });
}

function decodeAudio(bytes) {
  return decodeAudioLive(bytes);
}

// Генерируем простой тон на случай, если WAV не декодировался —
// игра никогда не падает из-за звука, а проигрыватель всегда получает буфер.
function makeFallbackBuffer(seconds, freq) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(sr * seconds)), sr);
  const ch = buffer.getChannelData(0);
  for (let i = 0; i < ch.length; i++) {
    const t = i / sr;
    const env = Math.exp(-6 * t); // затухание
    ch[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.5;
  }
  return buffer;
}

export default {
  decoded: {},

  async decodeAll() {
    const man = window.__GAME_ASSETS_MANIFEST__ || {};
    const out = {};
    const keys = Object.keys(man);
    // декодируем последовательно, чтобы не упереться в лимиты параллельных Image
    for (const key of keys) {
      const e = man[key];
      // Алиасы: один и тот же файл, зарегистрированный под другим именем
      // (например, фоны разных сцен). Декодируем один раз, переиспользуем.
      if (e.alias) {
        if (out[e.alias]) out[key] = out[e.alias];
        continue;
      }
      let bytes;
      try {
        if (e.base64) {
          bytes = b64ToU8(e.base64);
        } else {
          const resp = await fetch(e.file);
          if (!resp.ok) throw new Error('fetch fail: ' + e.file);
          bytes = new Uint8Array(await resp.arrayBuffer());
        }
      } catch (err) {
        console.warn('Asset fetch failed:', e.file, err);
        continue;
      }

      if (e.type === 'audio') {
        // Декодируем в ОБЫЧном AudioContext, а не в OfflineAudioContext:
        // буфер должен принадлежать живому (не closed) контексту — иначе
        // при воспроизведении часть браузеров подвешивает вкладку.
        // Контекст после декодирования не закрываем и переиспользуем для
        // всех звуков (его же читает window.SFX).
        try {
          out[key] = { type: 'audio', buffer: await decodeAudioLive(bytes) };
        } catch (err) {
          console.warn('Audio decode failed:', e.file, err);
          const fb = makeFallbackBuffer(0.25, key === 'sndLaser' ? 880 : 180);
          if (fb) out[key] = { type: 'audio', buffer: fb };
        }
      } else if (e.type === 'spritesheet') {
        try {
          const img = await loadImage(bytes, 'image/png');
          out[key] = {
            type: 'spritesheet',
            img,
            frameWidth: e.frameWidth,
            frameHeight: e.frameHeight,
          };
        } catch (err) {
          console.warn('Image decode failed:', e.file, err);
        }
      } else {
        try {
          const img = await loadImage(bytes, 'image/png');
          out[key] = { type: 'image', img };
        } catch (err) {
          console.warn('Image decode failed:', e.file, err);
        }
      }
    }
    this.decoded = out;
    return out;
  },

  registerToGame(game) {
    const keys = Object.keys(this.decoded);
    for (const key of keys) {
      const d = this.decoded[key];
      if (d.type === 'audio') {
        // ВАЖНО: Phaser 3 ждёт в cache.audio сам AudioBuffer,
        // а не объект-обёртку { data }. Иначе WebAudioSound падает.
        game.cache.audio.add(key, d.buffer);
      } else if (d.type === 'spritesheet') {
        game.textures.addSpriteSheet(key, d.img, {
          frameWidth: d.frameWidth,
          frameHeight: d.frameHeight,
        });
      } else {
        game.textures.addImage(key, d.img);
      }
    }
  },
};

// Безопасная речь (Web Speech API): произносит фразы по-русски, если браузер
// это умеет. Любая ошибка молча игнорируется — игра не падает из-за звука.
window.Speech = (() => {
  let voice = null;
  function pickVoice() {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const vs = synth.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('ru'));
      voice = vs.length ? vs[0] : null;
    } catch (e) { /* ignore */ }
  }
  try {
    if (window.speechSynthesis) {
      pickVoice();
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }
  } catch (e) { /* ignore */ }
  return {
    say(text) {
      try {
        const synth = window.speechSynthesis;
        if (!synth || !window.SpeechSynthesisUtterance) return;
        const u = new window.SpeechSynthesisUtterance(String(text));
        u.lang = 'ru-RU';
        if (voice) u.voice = voice;
        u.volume = 0.5;
        u.rate = 1.05;
        synth.cancel(); // не наслаивать реплики
        synth.speak(u);
      } catch (e) {
        console.warn('Speech failed:', e);
      }
    },
  };
})();

// Безопасный проигрыватель звуков: никогда не бросает исключений.
// Раньше игра падала, потому что this.sound.add(...) кидал ошибку, если
// ключа нет в аудио-кэше (или AudioManager недоступен). Здесь всё обёрнуто
// в try/catch, так что звук — строго «по желанию», а не причина краша.
window.SFX = (() => {
  // Все звуки игры идут через ОДИН собственный AudioContext, а не через
  // звуковой движок Phaser. Раньше каждый выстрел создавал новый
  // WebAudioSound в глобальном менеджере Phaser — на слабых устройствах
  // это подвешивало вкладку («игра виснет при выстреле, должен быть звук»).
  // Теперь: один контекст, переиспользуемые буферы, лимит одновременно
  // играющих звуков, троттлинг повторов и полная защита try/catch —
  // звук физически не может уронить игру.
  let ctx = null;         // наш AudioContext
  let phaserCtx = null;   // контекст Phaser (буферы декодированы в нём)
  let phaserCtxChecked = false;
  let lastResumeAt = 0;
  const buffers = {};     // key -> AudioBuffer (из кэша Phaser, читается один раз)
  const lastPlayAt = {};  // key -> время последнего запуска (троттлинг)
  const playing = [];     // активные BufferSource (для лимита)
  const MAX_SIMULTANEOUS = 6;
  const MIN_GAP_MS = 70;  // не запускать один и тот же звук чаще

  function getCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
    } catch (e) {
      try { ctx = new AC(); } catch (e2) { ctx = null; }
    }
    return ctx;
  }

  function resumeSoon() {
    const c = getCtx();
    if (!c) return;
    const now = (window.performance && performance.now) ? performance.now() : Date.now();
    if (now - lastResumeAt < 400) return; // не дёргать браузер слишком часто
    lastResumeAt = now;
    try {
      if (c.state === 'suspended' && c.resume) {
        const p = c.resume();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* ignore */ }
  }

  function takeBuffer(key) {
    // берём готовый AudioBuffer из кэша Phaser (он лежит там как есть)
    if (buffers[key]) return buffers[key];
    try {
      const b = phaserCacheGet(key);
      if (b && typeof b.duration === 'number') {
        buffers[key] = b;
        return b;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function phaserCacheGet(key) {
    // читаем напрямую из кэша — без вызовов методов Phaser, чтобы ничего
    // не могло бросить исключение наружу
    try {
      const g = window.game;
      if (!g || !g.cache || !g.cache.audio) return null;
      if (g.cache.audio.exists && !g.cache.audio.exists(key)) return null;
      const v = g.cache.audio.get(key);
      if (v && v.data && typeof v.data.duration === 'number') return v.data;
      if (v && typeof v.duration === 'number') return v;
    } catch (e) { /* ignore */ }
    return null;
  }

  function ensurePhaserCtx() {
    if (phaserCtxChecked) return;
    phaserCtxChecked = true;
    try {
      const g = window.game;
      if (g && g.sound && g.sound.context) phaserCtx = g.sound.context;
    } catch (e) { /* ignore */ }
  }

  function prunePlaying() {
    const now = (window.performance && performance.now) ? performance.now() : Date.now();
    for (let i = playing.length - 1; i >= 0; i--) {
      const p = playing[i];
      if (p.endAt <= now) playing.splice(i, 1);
    }
    while (playing.length > MAX_SIMULTANEOUS) {
      const oldest = playing.shift();
      try { if (oldest.node.stop) oldest.node.stop(0); } catch (e) { /* ignore */ }
    }
  }

  // «разблокировка» аудио первым жестом пользователя (требование браузеров)
  function armUnlock() {
    const unlock = () => {
      try {
        const c = getCtx();
        if (c && c.state === 'suspended' && c.resume) {
          const p = c.resume();
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) { /* ignore */ }
      try {
        if (phaserCtx && phaserCtx.state === 'suspended' && phaserCtx.resume) {
          const p2 = phaserCtx.resume();
          if (p2 && p2.catch) p2.catch(() => {});
        }
      } catch (e) { /* ignore */ }
      // прогрев: один тихий буфер за пределами слышимости — многие браузеры
      // считают канал «разогнанным» только после реального play()
      try {
        const c = getCtx();
        if (c && Object.keys(buffers).length) {
          const k = Object.keys(buffers)[0];
          const src = c.createBufferSource();
          src.buffer = buffers[k];
          const gain = c.createGain();
          gain.gain.value = 0.0001;
          src.connect(gain);
          gain.connect(c.destination);
          if (src.start) src.start(0);
        }
      } catch (e) { /* ignore */ }
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
  }
  try { armUnlock(); } catch (e) { /* ignore */ }

  return {
    ensureUnlock() { resumeSoon(); },
    play(game, key, volume) {
      try {
        ensurePhaserCtx();
        const buf = takeBuffer(key);
        if (!buf) return; // звука просто нет — молча пропускаем
        const c = getCtx();
        if (!c) return;
        const now = (window.performance && performance.now) ? performance.now() : Date.now();
        if (lastPlayAt[key] && now - lastPlayAt[key] < MIN_GAP_MS) return;
        lastPlayAt[key] = now;
        if (c.state !== 'running') { resumeSoon(); return; }
        prunePlaying();
        const src = c.createBufferSource();
        src.buffer = buf;
        const gain = c.createGain();
        gain.gain.value = volume === undefined ? 0.5 : volume;
        src.connect(gain);
        gain.connect(c.destination);
        const endAt = now + buf.duration * 1000 + 30;
        playing.push({ node: src, endAt });
        src.onended = () => {
          for (let i = playing.length - 1; i >= 0; i--) {
            if (playing[i].node === src) playing.splice(i, 1);
          }
          try { src.disconnect(); gain.disconnect(); } catch (e) { /* ignore */ }
        };
        if (src.start) src.start(0); else src.noteOn(0);
      } catch (e) {
        console.warn('SFX play failed:', key, e);
      }
    },
  };
})();
