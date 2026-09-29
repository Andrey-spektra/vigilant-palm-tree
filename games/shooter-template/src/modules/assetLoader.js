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
      if (e.base64) {
        bytes = b64ToU8(e.base64);
      } else {
        const resp = await fetch(e.file);
        if (!resp.ok) throw new Error('fetch fail: ' + e.file);
        bytes = new Uint8Array(await resp.arrayBuffer());
      }

      if (e.type === 'audio') {
        out[key] = { type: 'audio', buffer: await decodeAudio(bytes) };
      } else if (e.type === 'spritesheet') {
        const img = await loadImage(bytes, 'image/png');
        out[key] = {
          type: 'spritesheet',
          img,
          frameWidth: e.frameWidth,
          frameHeight: e.frameHeight,
        };
      } else {
        const img = await loadImage(bytes, 'image/png');
        out[key] = { type: 'image', img };
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
        game.cache.audio.add(key, { data: d.buffer });
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
