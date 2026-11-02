
import Phaser from "phaser";

export const GAME_SETTINGS = {
  width: 1920,
  height: 1080,

  // BACKGROUND DIFFICULTY
  backgroundSpeed: 180,
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

  obstacleSpeed: 180,
  obstacleWidth: 320,
  obstacleHeight: 100,
  obstacleSpawnMin: 3500,
  obstacleSpawnMax: 6500,

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
