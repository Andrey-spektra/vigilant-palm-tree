/* eslint-disable no-undef */

// Виртуальный джойстик (левая половина экрана) + кнопка огня (правая).
// Работает только на тач-устройствах; на десктопе не мешает клавиатуре.
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

    const w = scene.game.config.width;
    const h = scene.game.config.height;

    // зона джойстика — левая половина
    this.joystickZone = scene.add.zone(0, 0, w * 0.5, h).setOrigin(0, 0);
    this.joystickZone.setInteractive();

    // кнопка огня — правый нижний угол
    this.fireZone = scene.add.zone(w * 0.75, h * 0.8, w * 0.5, h * 0.4).setOrigin(0.5);
    this.fireZone.setInteractive();

    // визуал джойстика
    this.base = scene.add.circle(0, 0, this.radius, 0xffffff, 0.15).setDepth(50).setVisible(false);
    this.thumb = scene.add.circle(0, 0, 28, 0xffffff, 0.4).setDepth(51).setVisible(false);

    // визуал кнопки огня
    this.fireBtn = scene.add.circle(w * 0.75, h * 0.8, 60, 0xff4444, 0.35).setDepth(50).setVisible(false);
    this.fireLabel = scene.add.text(w * 0.75, h * 0.8, 'ОГОНЬ', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51).setVisible(false);

    this.joystickZone.on('pointerdown', (pointer) => {
      this.active = true;
      this.joystickActive = true;
      this.originX = pointer.x;
      this.originY = pointer.y;
      this.base.setPosition(pointer.x, pointer.y).setVisible(true);
      this.thumb.setPosition(pointer.x, pointer.y).setVisible(true);
      this.updateMove(pointer);
    });

    this.joystickZone.on('pointermove', (pointer) => {
      if (this.joystickActive) this.updateMove(pointer);
    });

    this.joystickZone.on('pointerup', () => {
      this.joystickActive = false;
      this.moveX = 0;
      this.moveY = 0;
      this.base.setVisible(false);
      this.thumb.setVisible(false);
    });

    this.fireZone.on('pointerdown', () => {
      this.firing = true;
      this.fireBtn.setFillStyle(0xff4444, 0.6);
    });

    this.fireZone.on('pointerup', () => {
      this.firing = false;
      this.fireBtn.setFillStyle(0xff4444, 0.35);
    });

    this.fireZone.on('pointerout', () => {
      this.firing = false;
      this.fireBtn.setFillStyle(0xff4444, 0.35);
    });

    // показываем контролы только на тач-устройствах
    if (scene.sys.game.device.input.touch) {
      this.fireBtn.setVisible(true);
      this.fireLabel.setVisible(true);
    }
  }

  updateMove(pointer) {
    let dx = pointer.x - this.originX;
    let dy = pointer.y - this.originY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.radius) {
      dx = (dx / dist) * this.radius;
      dy = (dy / dist) * this.radius;
    }
    this.moveX = dx / this.radius;
    this.moveY = dy / this.radius;
    this.thumb.setPosition(this.originX + dx, this.originY + dy);
  }

  // возвращает направление движения: {x, y} в диапазоне -1..1
  getMove() {
    return { x: this.moveX, y: this.moveY };
  }

  isFiring() {
    return this.firing;
  }

  destroy() {
    this.joystickZone.destroy();
    this.fireZone.destroy();
    this.base.destroy();
    this.thumb.destroy();
    this.fireBtn.destroy();
    this.fireLabel.destroy();
  }
}
