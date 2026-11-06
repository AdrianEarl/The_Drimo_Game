import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

export default class Drimo {
  constructor(scene) {
    this.scene = scene;

    this.speed = GAME_SETTINGS.playerSpeed;

    this.alive = true;
    this.fxTime = 0;

    // JUMP STATE
    this.jumping = false;
    this.jumpTime = 0;
    this.jumpOffset = 0;

    // DASH STATE
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashBoost = 1;
    this.dashOffsetX = 0;
    this.afterimageTimer = 0;

    // SHIELD STATE
    this.shieldActive = false;

    this.createAnimations();
    this.createSprite();
    this.createShadow();
    this.createShield();
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
    this.baseX = GAME_SETTINGS.width * GAME_SETTINGS.playerX;

    // groundY = the lane the player is running in.
    // sprite.y = groundY - jumpOffset.
    this.groundY = GAME_SETTINGS.height * GAME_SETTINGS.playerY;

    this.sprite = this.scene.add.sprite(
      this.baseX,
      this.groundY,
      "drimo-run-01"
    );

    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(GAME_SETTINGS.playerScale);
    this.sprite.setDepth(10);

    this.sprite.play("drimo-run");
  }

  createShadow() {
    this.shadow = this.scene.add.ellipse(
      this.baseX,
      this.groundY,
      this.sprite.displayWidth * 0.6,
      26,
      0x000000,
      0.35
    );

    this.shadow.setDepth(9);
  }

  createShield() {
    this.shieldRing = this.scene.add.ellipse(
      this.baseX,
      this.groundY,
      this.sprite.displayWidth * 1.15,
      this.sprite.displayHeight * 1.1,
      0x44ccff,
      0.18
    );

    this.shieldRing.setStrokeStyle(4, 0x9eeaff, 0.9);
    this.shieldRing.setDepth(11);
    this.shieldRing.setVisible(false);
  }

  createHitboxGraphics() {
    this.hitboxGraphics = this.scene.add.graphics();
    this.hitboxGraphics.setDepth(20);
  }

  // =================================
  // ACTIONS
  // =================================

  startJump() {
    if (!this.alive || this.jumping) return false;

    this.jumping = true;
    this.jumpTime = 0;

    return true;
  }

  startDash() {
    if (
      !this.alive ||
      this.dashTimer > 0 ||
      this.dashCooldownTimer > 0
    ) {
      return false;
    }

    this.dashTimer = GAME_SETTINGS.dashDuration;
    this.afterimageTimer = 0;

    this.sprite.setTint(0x66ccff);

    return true;
  }

  setShield(active) {
    this.shieldActive = active;
    this.shieldRing.setVisible(active);
  }

  playDeath() {
    this.alive = false;

    this.setShield(false);

    this.sprite.setTint(0xff5555);
    this.sprite.anims.timeScale = 0.2;

    this.scene.tweens.add({
      targets: this.sprite,
      angle: -70,
      duration: 900,
      ease: "Quad.easeIn"
    });
  }

  // =================================
  // STATE QUERIES
  // =================================

  isDashing() {
    return this.dashTimer > 0;
  }

  isAirborne() {
    return this.jumping && this.jumpOffset > 20;
  }

  // Dashing or airborne = potholes can't hurt the player
  isInvulnerable() {
    return this.isDashing() || this.isAirborne();
  }

  // 0 = empty (dashing / just finished), 1 = ready
  getDashCharge() {
    if (this.dashTimer > 0) return 0;
    if (this.dashCooldownTimer <= 0) return 1;

    return 1 - this.dashCooldownTimer / GAME_SETTINGS.dashCooldown;
  }

  // World speed multiplier contributed by the dash (eased)
  getDashBoost() {
    return this.dashBoost;
  }

  getCenter() {
    return {
      x: this.sprite.x,
      y: this.sprite.y - this.sprite.displayHeight / 2
    };
  }

  // =================================
  // UPDATE
  // =================================

  update(
    deltaSeconds,
    keys,
    cursors,
    worldMultiplier = 1,
    controlsEnabled = true
  ) {
    this.fxTime += deltaSeconds;

    // LANE MOVEMENT
    if (controlsEnabled) {
      const up = keys.up.isDown || cursors.up.isDown;
      const down = keys.down.isDown || cursors.down.isDown;

      // Opposite keys cancel out
      const moveY = (down ? 1 : 0) - (up ? 1 : 0);

      this.groundY += moveY * this.speed * deltaSeconds;
    }

    const playerHeight = this.sprite.displayHeight;

    const minY =
      GAME_SETTINGS.height * GAME_SETTINGS.drimoTop +
      playerHeight;

    const maxY =
      GAME_SETTINGS.height * GAME_SETTINGS.drimoBottom;

    this.groundY = Phaser.Math.Clamp(
      this.groundY,
      minY,
      maxY
    );

    // JUMP (advances faster when the world is faster, so the
    // distance covered in the air stays about the same)
    if (this.jumping) {
      const rate = Phaser.Math.Clamp(worldMultiplier, 0.6, 1.8);

      this.jumpTime += deltaSeconds * rate;

      const t = this.jumpTime / GAME_SETTINGS.jumpDuration;

      if (t >= 1) {
        this.jumping = false;
        this.jumpTime = 0;
        this.jumpOffset = 0;
      } else {
        this.jumpOffset =
          4 * GAME_SETTINGS.jumpHeight * t * (1 - t);
      }
    }

    // DASH TIMERS
    if (this.dashTimer > 0) {
      this.dashTimer -= deltaSeconds;
      this.afterimageTimer -= deltaSeconds;

      if (this.afterimageTimer <= 0) {
        this.spawnAfterimage();
        this.afterimageTimer = 0.04;
      }

      if (this.dashTimer <= 0) {
        this.dashTimer = 0;
        this.dashCooldownTimer = GAME_SETTINGS.dashCooldown;

        if (this.alive) {
          this.sprite.clearTint();
        }
      }
    } else if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(
        0,
        this.dashCooldownTimer - deltaSeconds
      );
    }

    // EASED DASH EFFECTS
    const ease = Math.min(1, deltaSeconds * 12);

    const targetBoost =
      this.dashTimer > 0 ? GAME_SETTINGS.dashSpeedBoost : 1;

    this.dashBoost += (targetBoost - this.dashBoost) * ease;

    const targetOffset = this.dashTimer > 0 ? 70 : 0;

    this.dashOffsetX += (targetOffset - this.dashOffsetX) * ease;

    // APPLY POSITION
    this.sprite.x = this.baseX + this.dashOffsetX;
    this.sprite.y = this.groundY - this.jumpOffset;

    // SHADOW (stays on the ground, shrinks while airborne)
    const air = this.jumpOffset / GAME_SETTINGS.jumpHeight;

    this.shadow.setPosition(this.sprite.x, this.groundY - 2);
    this.shadow.setScale(1 - 0.45 * air);
    this.shadow.setAlpha(0.35 * (1 - 0.5 * air));

    // SHIELD RING
    if (this.shieldActive) {
      this.shieldRing.setPosition(
        this.sprite.x,
        this.sprite.y - this.sprite.displayHeight / 2
      );

      this.shieldRing.setScale(
        1 + 0.04 * Math.sin(this.fxTime * 6)
      );
    }

    this.drawHitboxes();
  }

  spawnAfterimage() {
    const ghost = this.scene.add.image(
      this.sprite.x,
      this.sprite.y,
      this.sprite.texture.key
    );

    ghost.setOrigin(0.5, 1);
    ghost.setScale(this.sprite.scaleX, this.sprite.scaleY);
    ghost.setDepth(9);
    ghost.setTint(0x66ccff);
    ghost.setAlpha(0.5);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      x: ghost.x - 60,
      duration: 260,
      onComplete: () => ghost.destroy()
    });
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
    this.shadow.destroy();
    this.shieldRing.destroy();
    this.hitboxGraphics.destroy();
  }
}