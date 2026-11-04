import Phaser from "phaser";

export const GAME_SETTINGS = {
  width: 1920,
  height: 1080,

  // BACKGROUND DIFFICULTY
  backgroundSpeed: 450,
  backgroundSpeedIncrease: 1.5,
  backgroundSpeedMax: 450,

  obstacleTop: 0.50,
  obstacleBottom: 0.90,

  drimoTop: 0.29,
  drimoBottom: 0.90,

  playerX: 0.20,
  playerY: 0.68,
  playerScale: 0.15,
  playerSpeed: 500,

  maxHealth: 100,
  damagePerHit: 10,

  obstacleSpeed: 450,
  obstacleWidth: 320,
  obstacleHeight: 100,
  obstacleSpawnMin: 3500,
  obstacleSpawnMax: 6500,

  // Single source of truth for the obstacle damage hitbox
  // (used by both collision checks and the debug drawing)
  obstacleHitboxScale: 0.90,

  // If a spawn fails (no clear spot), retry after this many seconds
  spawnRetryDelay: 0.3,

  // Max frame time (ms) used by the game loop, prevents
  // objects teleporting after lag spikes or tab switches
  maxDeltaMs: 50,

  // DEBUG: road boundary lines + H (damage) / C (coin) test keys
  debug: false,
  showHitboxes: false
};

export const GAME_CONFIG = {
  type: Phaser.AUTO,
  parent: "app",

  width: GAME_SETTINGS.width,
  height: GAME_SETTINGS.height,

  backgroundColor: "#111111",

  pixelArt: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};