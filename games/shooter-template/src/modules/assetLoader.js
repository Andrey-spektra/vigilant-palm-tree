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

function decodeAudio(bytes) {
  const Ctx = window.OfflineAudioContext
    || window.webkitOfflineAudioContext
    || window.AudioContext
    || window.webkitAudioContext;
  const ctx = new Ctx(2, 44100, 44100);
  // decodeAudioData требует не-detached ArrayBuffer
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return ctx.decodeAudioData(copy);
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
        try {
          out[key] = { type: 'audio', buffer: await decodeAudio(bytes) };
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
  let unlocked = false;
  function ensureUnlock(game) {
    if (unlocked || !game || !game.sound) return;
    try {
      const unlock = () => {
        try {
          if (game.sound.unlock) game.sound.unlock();
        } catch (e) { /* ignore */ }
        unlocked = true;
        document.removeEventListener('pointerdown', unlock);
        document.removeEventListener('keydown', unlock);
      };
      document.addEventListener('pointerdown', unlock);
      document.addEventListener('keydown', unlock);
    } catch (e) { /* ignore */ }
  }
  return {
    ensureUnlock,
    play(game, key, volume) {
      try {
        if (!game || !game.sound || !game.sound.add) return; // NoAudio manager
        if (!game.cache.audio.exists(key)) return;
        const s = game.sound.add(key, { volume: volume === undefined ? 0.5 : volume });
        s.play();
      } catch (e) {
        console.warn('SFX play failed:', key, e);
      }
    },
  };
})();
