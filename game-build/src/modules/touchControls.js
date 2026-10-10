/* eslint-disable no-undef */

// Виртуальный джойстик (левый нижний угол, закреплён) + кнопка огня (правый нижний угол).
// Работает только на тач-устройствах; на десктопе не мешает клавиатуре.
// Контролы всегда видны и закреплены в одном месте независимо от прокрутки камеры.
export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.moveX = 0;
    this.moveY = 0;
    this.firing = false;
    this.active = false;
    this.joystickActive = false;
    this.originX = 0;
    this.originY = 0;
    this.radius = 50;
    this.pointerId = null;

    const w = scene.game.config.width;
    const h = scene.game.config.height;

    // Фиксированные позиции: джойстик — левый нижний угол, огонь — правый.
    this.joyHomeX = 130;
    this.joyHomeY = h - 130;
    this.fireX = w - 130;
    this.fireY = h - 130;

    // Зона джойстика — ТОЛЬКО область вокруг закреплённого джойстика.
    // Раньше это была вся левая половина экрана: на десктопе клик мышью
    // «хватался» джойстиком, ручка уезжала к курсору и getMove() возвращал
    // ненулевое смещение. В update() джойстик имеет приоритет над клавиатурой,
    // поэтому WASD/стрелки переставали работать — управление seemed полностью
    // отсутствующим. Теперь мышь на зону не попадает, клавиатура живёт своей
    // жизнью, а на телефоне попасть по крупному квадрату 260x260 легко.
    const zoneSize = 260;
    this.joystickZone = scene.add.zone(this.joyHomeX, this.joyHomeY, zoneSize, zoneSize);
    this.joystickZone.setInteractive();

    // зона кнопки огня — только район самой кнопки
    this.fireZone = scene.add.zone(this.fireX, this.fireY, 170, 170);
    this.fireZone.setInteractive();

    // визуал джойстика: видим всегда (на тач), глубина выше игры, не зависит от камеры
    this.base = scene.add.circle(this.joyHomeX, this.joyHomeY, this.radius + 8, 0xffffff, 0.22)
      .setStrokeStyle(3, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(9999);
    this.thumb = scene.add.circle(this.joyHomeX, this.joyHomeY, 28, 0xffffff, 0.6)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setScrollFactor(0)
      .setDepth(10000);

    // визуал кнопки огня
    this.fireBtn = scene.add.circle(this.fireX, this.fireY, 60, 0xff4444, 0.45)
      .setStrokeStyle(3, 0xffffff, 0.6)
      .setScrollFactor(0)
      .setDepth(9999);
    this.fireLabel = scene.add.text(this.fireX, this.fireY, 'СЛОВО', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10000);

    // Учитываем и одно касание: на некоторых планшетах multiTouch и PointerEvent
    // недоступны, из-за чего контролы прежде показывались только после первого касания.
    const deviceInput = scene.sys.game.device && scene.sys.game.device.input;
    const devTouch = !!(deviceInput && (deviceInput.touch || deviceInput.multiTouch))
      || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
      || (typeof window !== 'undefined' && 'ontouchstart' in window);
    let moveTypeTouch = false;
    try {
      moveTypeTouch = typeof PointerEvent !== 'undefined'
        && PointerEvent.MOVE_TYPE_TOUCH === 2;
    } catch (e) { /* older browsers */ }
    this.isTouch = devTouch || moveTypeTouch || !!window.__TOUCH_MODE__;

    if (this.isTouch) window.__TOUCH_MODE__ = true;

    // Если устройство определилось как «не тач», но пользователь всё-таки
    // касается экрана — подтверждаем тач-режим глобально и пересоздаём сцену,
    // чтобы стрельба по клику больше никогда не активировалась на телефоне.
    if (!this.isTouch) {
      this._onFirstTouch = (e) => {
        const pt = e && e.pointerType;
        if (pt === 'touch' || pt === 'pen') {
          window.__TOUCH_MODE__ = true;
          window.removeEventListener('pointerdown', this._onFirstTouch, true);
          this._onFirstTouch = null;
          try { scene.scene.restart(); } catch (err) { /* noop */ }
        }
      };
      window.addEventListener('pointerdown', this._onFirstTouch, true);
    }

    // На десктопе прячем визуал и полностью отключаем тач-зоны: интерактивные
    // зоны перехватывали события указателя и могли «съедать» фокус/движение.
    if (!this.isTouch) {
      this.base.setVisible(false);
      this.thumb.setVisible(false);
      this.fireBtn.setVisible(false);
      this.fireLabel.setVisible(false);
      this.joystickZone.disableInteractive();
      this.fireZone.disableInteractive();
    }

    // указатель джойстика: привязываемся к pointerId, чтобы второй палец (огонь)
    // не сбрасывал джойстик
    this.joystickZone.on('pointerdown', (pointer) => {
      if (this.joystickActive) return;
      this.joystickActive = true;
      this.active = true;
      this.pointerId = pointer.id;
      this.updateMove(pointer);
    });

    this._onJoyMove = (pointer) => {
      if (this.joystickActive && pointer.id === this.pointerId) {
        this.updateMove(pointer);
      }
    };
    this._onJoyUp = (pointer) => {
      if (this.joystickActive && pointer.id === this.pointerId) {
        this.releaseJoystick();
      }
    };
    scene.input.on('pointermove', this._onJoyMove);
    scene.input.on('pointerup', this._onJoyUp);
    scene.input.on('pointerupoutside', this._onJoyUp);

    this.fireZone.on('pointerdown', () => {
      this.firing = true;
      this.fireBtn.setFillStyle(0xff4444, 0.75);
    });

    this.fireZone.on('pointerup', () => {
      this.firing = false;
      this.fireBtn.setFillStyle(0xff4444, 0.45);
    });

    this.fireZone.on('pointerout', () => {
      this.firing = false;
      this.fireBtn.setFillStyle(0xff4444, 0.45);
    });

    // если сцена останавливается во время движения — сброс состояния
    scene.events.once('shutdown', () => this.destroy());
  }

  releaseJoystick() {
    this.joystickActive = false;
    this.active = false;
    this.pointerId = null;
    this.moveX = 0;
    this.moveY = 0;
    // ручка возвращается на закреплённое место
    this.thumb.setPosition(this.joyHomeX, this.joyHomeY);
  }

  updateMove(pointer) {
    // экранные координаты пальца (учитывают масштаб FIT)
    const sx = pointer.x;
    const sy = pointer.y;
    // джойстик закреплён: центр = домашняя позиция, смещение считаем от неё
    let dx = sx - this.joyHomeX;
    let dy = sy - this.joyHomeY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.radius) {
      dx = (dx / dist) * this.radius;
      dy = (dy / dist) * this.radius;
    }
    this.moveX = dx / this.radius;
    this.moveY = dy / this.radius;
    this.thumb.setPosition(this.joyHomeX + dx, this.joyHomeY + dy);
  }

  // возвращает направление движения: {x, y} в диапазоне -1..1
  // на десктопе джойстик отключён — всегда ноль, чтобы не перекрывать клавиатуру
  getMove() {
    if (!this.isTouch) return { x: 0, y: 0 };
    return { x: this.moveX, y: this.moveY };
  }

  isFiring() {
    if (!this.isTouch) return false;
    return this.firing;
  }

  destroy() {
    if (this._onFirstTouch) {
      window.removeEventListener('pointerdown', this._onFirstTouch, true);
      this._onFirstTouch = null;
    }
    if (this.scene && this.scene.input) {
      this.scene.input.off('pointermove', this._onJoyMove);
      this.scene.input.off('pointerup', this._onJoyUp);
      this.scene.input.off('pointerupoutside', this._onJoyUp);
    }
    if (this.joystickZone) this.joystickZone.destroy();
    if (this.fireZone) this.fireZone.destroy();
    if (this.base) this.base.destroy();
    if (this.thumb) this.thumb.destroy();
    if (this.fireBtn) this.fireBtn.destroy();
    if (this.fireLabel) this.fireLabel.destroy();
  }
}
