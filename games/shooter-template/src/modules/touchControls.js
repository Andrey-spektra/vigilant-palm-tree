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

    // зона джойстика — вся левая половина экрана (но сам джойстик закреплён)
    this.joystickZone = scene.add.zone(0, 0, w * 0.5, h).setOrigin(0, 0);
    this.joystickZone.setInteractive();

    // зона кнопки огня — правая половина снизу
    this.fireZone = scene.add.zone(w * 0.75, h * 0.8, w * 0.5, h * 0.4).setOrigin(0.5);
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
    this.fireLabel = scene.add.text(this.fireX, this.fireY, 'ОГОНЬ', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10000);

    this.isTouch = !!(scene.sys.game.device && scene.sys.game.device.input && scene.sys.game.device.input.touch);

    // На десктопе прячем визуал, зоны оставляем (не мешают)
    if (!this.isTouch) {
      this.base.setVisible(false);
      this.thumb.setVisible(false);
      this.fireBtn.setVisible(false);
      this.fireLabel.setVisible(false);
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
  getMove() {
    return { x: this.moveX, y: this.moveY };
  }

  isFiring() {
    return this.firing;
  }

  destroy() {
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
