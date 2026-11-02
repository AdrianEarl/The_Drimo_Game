
import { GAME_SETTINGS } from "../config/gameConfig";

export default class HealthSystem {
  constructor(scene, hud, onDeath) {
    this.scene = scene;
    this.hud = hud;
    this.onDeath = onDeath;

    this.maxHealth = GAME_SETTINGS.maxHealth;
    this.health = this.maxHealth;

    this.damagePerHit = GAME_SETTINGS.damagePerHit;

    this.invincible = false;
    this.invincibilityDuration = 5000;

    this.blinkTimer = null;
    this.blinkTween = null;

    // Initialize health bar with both values
    this.updateHUD();
  }

  // =================================
  // UPDATE HEALTH DISPLAY
  // =================================

  updateHUD() {
    this.hud.updateHealth(
      this.health,
      this.maxHealth
    );
  }

  // =================================
  // TAKE DAMAGE
  // =================================

  takeDamage() {
    if (this.invincible || this.health <= 0) {
      return false;
    }

    this.health = Math.max(
      0,
      this.health - this.damagePerHit
    );

    this.updateHUD();

    // Check Game Over
    if (this.health <= 0) {
      this.onDeath();
      return true;
    }

    // Start 5-second invincibility
    this.startInvincibility();

    return true;
  }

  // =================================
  // INVINCIBILITY
  // =================================

  startInvincibility() {
    this.invincible = true;

    const player = this.scene.drimo.getSprite();

    if (!player || !player.active) return;

    this.blinkTween = this.scene.tweens.add({
      targets: player,
      alpha: 0.45,
      duration: 180,
      yoyo: true,
      repeat: -1
    });

    this.blinkTimer = this.scene.time.delayedCall(
      this.invincibilityDuration,
      () => {
        this.endInvincibility();
      }
    );
  }

  endInvincibility() {
    this.invincible = false;

    if (this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = null;
    }

    const player = this.scene.drimo.getSprite();

    if (player && player.active) {
      player.setAlpha(1);
    }

    this.blinkTimer = null;
  }

  // =================================
  // GETTERS
  // =================================

  getHealth() {
    return this.health;
  }

  isInvincible() {
    return this.invincible;
  }

  // =================================
  // CLEANUP
  // =================================

  destroy() {
    if (this.blinkTimer) {
      this.blinkTimer.remove();
      this.blinkTimer = null;
    }

    if (this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = null;
    }

    this.invincible = false;

    const player = this.scene.drimo?.getSprite();

    if (player && player.active) {
      player.setAlpha(1);
    }
  }
}
