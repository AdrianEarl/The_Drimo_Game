import Phaser from "phaser";
import { GAME_SETTINGS } from "../config/gameConfig";

const TEXTURE_SIZE = 72;

const TYPES = {
  shield: {
    label: "SHIELD",
    pickup: "SHIELD!",
    color: 0x3aa8ff,
    duration: GAME_SETTINGS.shieldDuration
  },
  magnet: {
    label: "MAGNET",
    pickup: "MAGNET!",
    color: 0xff4d4d,
    duration: GAME_SETTINGS.magnetDuration
  },
  slow: {
    label: "SLOW-MO",
    pickup: "SLOW-MO!",
    color: 0xa66bff,
    duration: GAME_SETTINGS.slowMoDuration
  },
  double: {
    label: "2X SCORE",
    pickup: "2X SCORE!",
    color: 0xffc933,
    duration: GAME_SETTINGS.doubleScoreDuration
  },
  heal: {
    label: "HEAL",
    pickup: "HEAL!",
    color: 0xff6b9a,
    duration: 0 // instant
  }
};

// =================================
// ICON DRAWING (no image assets needed)
// =================================

function fillPolygon(graphics, points) {
  graphics.beginPath();
  graphics.moveTo(points[0][0], points[0][1]);

  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i][0], points[i][1]);
  }

  graphics.closePath();
  graphics.fillPath();
}

function drawBadge(graphics, color) {
  const c = TEXTURE_SIZE / 2;

  graphics.fillStyle(0x000000, 0.3);
  graphics.fillCircle(c, c + 3, c - 3);

  graphics.fillStyle(color, 1);
  graphics.fillCircle(c, c, c - 4);

  graphics.lineStyle(4, 0xffffff, 1);
  graphics.strokeCircle(c, c, c - 4);
}

function drawIcon(graphics, type, color) {
  drawBadge(graphics, color);

  graphics.fillStyle(0xffffff, 1);
  graphics.lineStyle(9, 0xffffff, 1);

  switch (type) {
    case "shield":
      fillPolygon(graphics, [
        [22, 20], [50, 20], [50, 38], [36, 54], [22, 38]
      ]);

      graphics.fillStyle(color, 1);
      fillPolygon(graphics, [
        [27, 25], [45, 25], [45, 36], [36, 47], [27, 36]
      ]);
      break;

    case "magnet":
      // U-shape: two legs + bottom half circle
      graphics.beginPath();
      graphics.moveTo(24, 20);
      graphics.lineTo(24, 36);
      graphics.arc(36, 36, 12, Math.PI, 0, true);
      graphics.lineTo(48, 20);
      graphics.strokePath();

      graphics.fillStyle(0xffd0d0, 1);
      graphics.fillRect(19.5, 15, 9, 9);
      graphics.fillRect(43.5, 15, 9, 9);
      break;

    case "slow":
      // Hourglass
      fillPolygon(graphics, [[23, 18], [49, 18], [36, 36]]);
      fillPolygon(graphics, [[36, 36], [49, 54], [23, 54]]);
      graphics.fillRect(21, 14, 30, 5);
      graphics.fillRect(21, 53, 30, 5);
      break;

    case "double": {
      // Star
      const points = [];

      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? 18 : 8;
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;

        points.push([
          36 + Math.cos(angle) * radius,
          37 + Math.sin(angle) * radius
        ]);
      }

      fillPolygon(graphics, points);
      break;
    }

    case "heal":
      // Heart
      graphics.fillCircle(28, 31, 10);
      graphics.fillCircle(44, 31, 10);
      graphics.fillTriangle(19, 35, 53, 35, 36, 54);
      break;

    default:
      break;
  }
}

export default class PowerUpSystem {
  constructor(scene) {
    this.scene = scene;

    this.items = [];

    // key -> seconds remaining
    this.active = {};

    this.speed = GAME_SETTINGS.obstacleSpeed;

    this.spawnTimer = 0;
    this.nextSpawn = this.randomSpawnDelay();

    PowerUpSystem.createTextures(scene);
  }

  // Draws every icon once into a texture (shared across restarts)
  static createTextures(scene) {
    Object.keys(TYPES).forEach((type) => {
      const key = `powerup-${type}`;

      if (scene.textures.exists(key)) return;

      const graphics = scene.make.graphics({
        x: 0,
        y: 0,
        add: false
      });

      drawIcon(graphics, type, TYPES[type].color);

      graphics.generateTexture(key, TEXTURE_SIZE, TEXTURE_SIZE);
      graphics.destroy();
    });
  }

  randomSpawnDelay() {
    return (
      Phaser.Math.Between(
        GAME_SETTINGS.powerUpSpawnMin,
        GAME_SETTINGS.powerUpSpawnMax
      ) / 1000
    );
  }

  // =================================
  // QUERIES
  // =================================

  isActive(key) {
    return (this.active[key] || 0) > 0;
  }

  getSlowFactor() {
    return this.isActive("slow") ? GAME_SETTINGS.slowMoFactor : 1;
  }

  // For the HUD: active timed power-ups with remaining time
  getActiveList() {
    const list = [];

    for (const key of Object.keys(TYPES)) {
      if (this.isActive(key)) {
        list.push({
          key,
          label: TYPES[key].label,
          color: TYPES[key].color,
          remaining: this.active[key],
          duration: TYPES[key].duration
        });
      }
    }

    return list;
  }

  // =================================
  // SPAWNING
  // =================================

  pickType() {
    const maxHealth = GAME_SETTINGS.maxHealth;

    const health = this.scene.healthSystem
      ? this.scene.healthSystem.getHealth()
      : maxHealth;

    const weights = {
      shield: 3,
      magnet: 3,
      slow: 2,
      double: 3,
      heal: 0
    };

    // Hearts only show up when the player is actually hurt
    if (health < maxHealth) {
      weights.heal = health <= maxHealth * 0.5 ? 6 : 3;
    }

    const keys = Object.keys(weights);

    const total = keys.reduce(
      (sum, key) => sum + weights[key],
      0
    );

    let roll = Phaser.Math.FloatBetween(0, total);

    for (const key of keys) {
      roll -= weights[key];

      if (roll <= 0 && weights[key] > 0) {
        return key;
      }
    }

    return "shield";
  }

  canSpawnAt(x, y) {
    const size = GAME_SETTINGS.powerUpSize;

    const bounds = new Phaser.Geom.Rectangle(
      x - size / 2,
      y - size / 2,
      size,
      size
    );

    const obstacles =
      this.scene.obstacleSystem?.obstacles || [];

    for (const obstacleData of obstacles) {
      const sprite = obstacleData.sprite;

      if (!sprite || !sprite.active) continue;

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          bounds,
          sprite.getBounds()
        )
      ) {
        return false;
      }
    }

    const coins = this.scene.coinSystem?.coins || [];

    for (const coin of coins) {
      if (!coin || !coin.active) continue;

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          bounds,
          coin.getBounds()
        )
      ) {
        return false;
      }
    }

    return true;
  }

  spawn() {
    const size = GAME_SETTINGS.powerUpSize;

    const minY =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleTop +
      size / 2;

    const maxY =
      GAME_SETTINGS.height * GAME_SETTINGS.obstacleBottom -
      size / 2;

    const x = GAME_SETTINGS.width + 100;

    let spawnY = null;

    for (let attempt = 0; attempt < 20; attempt++) {
      const candidateY = Phaser.Math.Between(minY, maxY);

      if (this.canSpawnAt(x, candidateY)) {
        spawnY = candidateY;
        break;
      }
    }

    if (spawnY === null) {
      return false;
    }

    const type = this.pickType();

    const sprite = this.scene.add.image(
      x,
      spawnY,
      `powerup-${type}`
    );

    sprite.setDisplaySize(size, size);
    sprite.setDepth(8);

    this.items.push({
      type,
      sprite,
      baseScale: sprite.scaleX,
      time: Math.random() * Math.PI * 2
    });

    return true;
  }

  // =================================
  // COLLECTION
  // =================================

  collides(item) {
    const hitboxes = this.scene.drimo.getHitboxes();
    const bounds = item.sprite.getBounds();

    return (
      Phaser.Geom.Intersects.RectangleToRectangle(
        hitboxes.body,
        bounds
      ) ||
      Phaser.Geom.Intersects.RectangleToRectangle(
        hitboxes.foot,
        bounds
      )
    );
  }

  collect(item) {
    const def = TYPES[item.type];
    const x = item.sprite.x;
    const y = item.sprite.y;
    const hud = this.scene.hud;

    if (item.type === "heal") {
      const healed = this.scene.healthSystem.heal(
        GAME_SETTINGS.healAmount
      );

      hud.spawnFloatingText(
        x,
        y - 40,
        healed > 0 ? `+${healed} HP` : def.pickup,
        "#ff9ec0",
        38
      );

      return;
    }

    // Picking up the same type again refreshes the timer
    this.active[item.type] = def.duration;

    if (item.type === "shield") {
      this.scene.drimo.setShield(true);
    }

    if (item.type === "double") {
      this.scene.scoreSystem.setDoubleScore(true);
    }

    hud.spawnFloatingText(x, y - 40, def.pickup, "#ffffff", 38);
  }

  expire(key) {
    delete this.active[key];

    if (key === "shield") {
      this.scene.drimo.setShield(false);
    }

    if (key === "double") {
      this.scene.scoreSystem.setDoubleScore(false);
    }
  }

  // Called by HealthSystem. Returns true if a shield absorbed the hit.
  consumeShield() {
    if (!this.isActive("shield")) {
      return false;
    }

    this.expire("shield");

    this.scene.cameras.main.flash(150, 80, 180, 255);

    const center = this.scene.drimo.getCenter();

    this.scene.hud.spawnFloatingText(
      center.x,
      center.y - 100,
      "BLOCKED!",
      "#9eeaff",
      40
    );

    return true;
  }

  // =================================
  // UPDATE
  // =================================

  update(deltaSeconds) {
    // TIMERS
    for (const key of Object.keys(this.active)) {
      this.active[key] -= deltaSeconds;

      if (this.active[key] <= 0) {
        this.expire(key);
      }
    }

    // SPAWNING (scaled by world speed, like obstacles and coins)
    if (!this.scene.dying) {
      const speedMultiplier = this.scene.speedMultiplier || 1;

      this.spawnTimer += deltaSeconds * speedMultiplier;

      if (this.spawnTimer >= this.nextSpawn) {
        this.spawnTimer = 0;

        if (this.spawn()) {
          this.nextSpawn = this.randomSpawnDelay();
        } else {
          this.nextSpawn = GAME_SETTINGS.spawnRetryDelay;
        }
      }
    }

    // MOVEMENT + PICKUP
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      if (!item.sprite.active) {
        this.items.splice(i, 1);
        continue;
      }

      item.time += deltaSeconds;

      item.sprite.x -= this.speed * deltaSeconds;

      item.sprite.setScale(
        item.baseScale * (1 + 0.1 * Math.sin(item.time * 6))
      );

      if (!this.scene.dying && this.collides(item)) {
        this.collect(item);

        item.sprite.destroy();
        this.items.splice(i, 1);
        continue;
      }

      if (
        item.sprite.x + GAME_SETTINGS.powerUpSize / 2 < 0
      ) {
        item.sprite.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  // =================================
  // CLEAR
  // =================================

  clear() {
    for (const item of this.items) {
      item.sprite.destroy();
    }

    this.items = [];

    for (const key of Object.keys(this.active)) {
      this.expire(key);
    }
  }
}