import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

export default class Drimo {
  constructor(scene) {
    this.scene = scene;

    this.speed = GAME_SETTINGS.playerSpeed;

    this.createAnimations();
    this.createSprite();
    this.createHitboxGraphics();
  }

  createAnimations() {
    const frames = [];

    for (let i = 1; i <= 8; i++) {
      const frame = String(i).padStart(2, "0");

      frames.push({
        key: `drimo-run-${frame}`
      });
    }

    if (!this.scene.anims.exists("drimo-run")) {
      this.scene.anims.create({
        key: "drimo-run",
        frames,
        frameRate: 10,
        repeat: -1
      });
    }
  }

  createSprite() {
    this.sprite = this.scene.add.sprite(
      GAME_SETTINGS.width * GAME_SETTINGS.playerX,
      GAME_SETTINGS.height * GAME_SETTINGS.playerY,
      "drimo-run-01"
    );

    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(GAME_SETTINGS.playerScale);
    this.sprite.setDepth(10);

    this.sprite.play("drimo-run");
  }

  createHitboxGraphics() {
    this.hitboxGraphics = this.scene.add.graphics();
    this.hitboxGraphics.setDepth(20);
  }

  update(deltaSeconds, keys, cursors) {
    const up = keys.up.isDown || cursors.up.isDown;
    const down = keys.down.isDown || cursors.down.isDown;

    // Opposite keys cancel out (previously "down" always won)
    const moveY = (down ? 1 : 0) - (up ? 1 : 0);

    this.sprite.y += moveY * this.speed * deltaSeconds;

    const playerHeight = this.sprite.displayHeight;

    const minY =
      GAME_SETTINGS.height * GAME_SETTINGS.drimoTop +
      playerHeight;

    const maxY =
      GAME_SETTINGS.height * GAME_SETTINGS.drimoBottom;

    this.sprite.y = Phaser.Math.Clamp(
      this.sprite.y,
      minY,
      maxY
    );

    this.drawHitboxes();
  }

  // =================================
  // THREE PLAYER HITBOXES
  // =================================

  getHitboxes() {
    const bounds = this.sprite.getBounds();

    // HEAD: TOP 25%
    const head = new Phaser.Geom.Rectangle(
      bounds.x + bounds.width * 0.275,
      bounds.y,
      bounds.width * 0.45,
      bounds.height * 0.25
    );

    // BODY: 25% TO 78%
    const body = new Phaser.Geom.Rectangle(
      bounds.x + bounds.width * 0.175,
      bounds.y + bounds.height * 0.25,
      bounds.width * 0.65,
      bounds.height * 0.53
    );

    // FEET: BOTTOM 22%
    const foot = new Phaser.Geom.Rectangle(
      bounds.x + bounds.width * 0.25,
      bounds.y + bounds.height * 0.78,
      bounds.width * 0.50,
      bounds.height * 0.22
    );

    return {
      head,
      body,
      foot
    };
  }

  drawHitboxes() {
    this.hitboxGraphics.clear();

    if (!GAME_SETTINGS.showHitboxes) {
      return;
    }

    const hitboxes = this.getHitboxes();

    // HEAD - BLUE
    this.hitboxGraphics.lineStyle(3, 0x00aaff, 1);
    this.hitboxGraphics.strokeRect(
      hitboxes.head.x,
      hitboxes.head.y,
      hitboxes.head.width,
      hitboxes.head.height
    );

    // BODY - YELLOW
    this.hitboxGraphics.lineStyle(3, 0xffff00, 1);
    this.hitboxGraphics.strokeRect(
      hitboxes.body.x,
      hitboxes.body.y,
      hitboxes.body.width,
      hitboxes.body.height
    );

    // FEET - GREEN
    this.hitboxGraphics.lineStyle(3, 0x00ff00, 1);
    this.hitboxGraphics.strokeRect(
      hitboxes.foot.x,
      hitboxes.foot.y,
      hitboxes.foot.width,
      hitboxes.foot.height
    );
  }

  getSprite() {
    return this.sprite;
  }

  destroy() {
    this.sprite.destroy();
    this.hitboxGraphics.destroy();
  }
}