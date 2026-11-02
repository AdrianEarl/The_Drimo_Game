
import Phaser from "phaser";

import { GAME_SETTINGS } from "../config/gameConfig";

import Drimo from "../entities/Drimo";

import CollisionSystem from "../systems/CollisionSystem";
import ObstacleSystem from "../systems/ObstacleSystem";
import HealthSystem from "../systems/HealthSystem";
import ScoreSystem from "../systems/ScoreSystem";
import CoinSystem from "../systems/CoinSystem";

import HUD from "../ui/HUD";
import GameOverScreen from "../ui/GameOverScreen";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.gameOver = false;
  }

  // =================================
  // 01. PRELOAD ASSETS
  // =================================

  preload() {
    this.load.image(
      "nightScene",
      "/assets/backgrounds/night-scene.png"
    );

    for (let i = 1; i <= 8; i++) {
      const frame = String(i).padStart(2, "0");

      this.load.image(
        `drimo-run-${frame}`,
        `/assets/characters/run/run-${frame}.png`
      );
    }

    this.load.image(
      "obstacle-01",
      "/assets/obstacles/obstacles-01.png"
    );

    // LOAD COIN FRAMES
    for (let i = 1; i <= 5; i++) {
      const frame = String(i).padStart(2, "0");

      this.load.image(
        `coin-${frame}`,
        `/assets/coins/coins-${frame}.png`
      );
    }
  }

  // =================================
  // 02. CREATE GAME
  // =================================

  create() {
    this.gameOver = false;

    this.worldWidth = GAME_SETTINGS.width;
    this.worldHeight = GAME_SETTINGS.height;

    // RESET DIFFICULTY WHEN GAME STARTS
    this.elapsedTime = 0;
    this.backgroundSpeed = GAME_SETTINGS.backgroundSpeed;
    this.speedMultiplier = 1;

    this.camera = this.cameras.main;

    this.camera.setBounds(
      0,
      0,
      this.worldWidth,
      this.worldHeight
    );

    this.createBackground();
    this.createBoundaries();
    this.createControls();
    this.createPlayer();
    this.createInterface();
    this.createSystems();

    this.setupKeyboardTests();
  }

  // =================================
  // 03. BACKGROUND
  // =================================

  createBackground() {
    const bg = this.textures
      .get("nightScene")
      .getSourceImage();

    this.bgBaseScale = this.worldHeight / bg.height;

    this.bgDisplayWidth =
      bg.width * this.bgBaseScale;

    this.backgrounds = [];

    const imageCount =
      Math.ceil(
        this.worldWidth / this.bgDisplayWidth
      ) + 2;

    for (let i = 0; i < imageCount; i++) {
      const background = this.add.image(
        0,
        this.worldHeight / 2,
        "nightScene"
      );

      background.setOrigin(0.5);
      background.setScale(this.bgBaseScale);
      background.setDepth(0);

      background.worldX =
        this.bgDisplayWidth / 2 +
        i * this.bgDisplayWidth;

      background.x = background.worldX;

      this.backgrounds.push(background);
    }
  }

  // =================================
  // 04. UPDATE BACKGROUND
  // =================================

  updateBackground(deltaSeconds) {
    for (const background of this.backgrounds) {
      background.worldX -=
        this.backgroundSpeed * deltaSeconds;
    }

    let rightmostX = Math.max(
      ...this.backgrounds.map(bg => bg.worldX)
    );

    for (const background of this.backgrounds) {
      if (
        background.worldX +
        this.bgDisplayWidth / 2 < 0
      ) {
        background.worldX =
          rightmostX + this.bgDisplayWidth;

        rightmostX = background.worldX;
      }

      background.x = background.worldX;
    }
  }

  // =================================
  // 05. DIFFICULTY PROGRESSION
  // =================================

  updateDifficulty(deltaSeconds) {
    // TRACK HOW LONG THE PLAYER HAS SURVIVED
    this.elapsedTime += deltaSeconds;

    // CALCULATE BACKGROUND SPEED
    this.backgroundSpeed = Math.min(
      GAME_SETTINGS.backgroundSpeed +
      this.elapsedTime *
      GAME_SETTINGS.backgroundSpeedIncrease,

      GAME_SETTINGS.backgroundSpeedMax
    );

    // CALCULATE SPEED MULTIPLIER
    this.speedMultiplier =
      this.backgroundSpeed /
      GAME_SETTINGS.backgroundSpeed;

    // ACCELERATE OBSTACLES
    if (this.obstacleSystem) {
      this.obstacleSystem.speed =
        GAME_SETTINGS.obstacleSpeed *
        this.speedMultiplier;
    }

    // ACCELERATE COINS
    if (this.coinSystem) {
      this.coinSystem.speed =
        GAME_SETTINGS.obstacleSpeed *
        this.speedMultiplier;
    }
  }

  // =================================
  // 06. BOUNDARIES
  // =================================

  createBoundaries() {
    this.roadTop =
      this.worldHeight * GAME_SETTINGS.obstacleTop;

    this.roadBottom =
      this.worldHeight * GAME_SETTINGS.obstacleBottom;

    this.roadTopDebug = this.add.rectangle(
      this.worldWidth / 2,
      this.roadTop,
      this.worldWidth,
      4,
      0x00ff00
    ).setDepth(50);

    this.roadBottomDebug = this.add.rectangle(
      this.worldWidth / 2,
      this.roadBottom,
      this.worldWidth,
      4,
      0xff0000
    ).setDepth(50);
  }

  // =================================
  // 07. CONTROLS
  // =================================

  createControls() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      damage: Phaser.Input.Keyboard.KeyCodes.H,
      collect: Phaser.Input.Keyboard.KeyCodes.C,
      restart: Phaser.Input.Keyboard.KeyCodes.R
    });

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  setupKeyboardTests() {
    // H = TEST DAMAGE
    // C = TEST COIN COLLECTION
    // R = RESTART AFTER GAME OVER
  }

  // =================================
  // 08. PLAYER
  // =================================

  createPlayer() {
    this.drimo = new Drimo(this);
  }

  // =================================
  // 09. INTERFACE
  // =================================

  createInterface() {
    this.hud = new HUD(this);

    this.hud.updateHealth(
      GAME_SETTINGS.maxHealth,
      GAME_SETTINGS.maxHealth
    );

    this.scoreSystem = new ScoreSystem(this.hud);

    this.gameOverScreen = new GameOverScreen(this);
  }

  // =================================
  // 10. GAME SYSTEMS
  // =================================

  createSystems() {
    this.collisionSystem = new CollisionSystem();

    this.healthSystem = new HealthSystem(
      this,
      this.hud,
      () => this.endGame()
    );

    this.obstacleSystem = new ObstacleSystem(
      this,
      this.collisionSystem,
      () => this.healthSystem.takeDamage()
    );

    this.coinSystem = new CoinSystem(
      this,
      () => this.scoreSystem.collectCoin()
    );

    // INITIAL SPEEDS
    this.obstacleSystem.speed =
      GAME_SETTINGS.obstacleSpeed;

    this.coinSystem.speed =
      GAME_SETTINGS.obstacleSpeed;
  }

  // =================================
  // 11. GAME OVER
  // =================================

  endGame() {
    if (this.gameOver) return;

    this.gameOver = true;

    console.log("GAME OVER TRIGGERED");

    const player = this.drimo.getSprite();

    if (player && player.active) {
      player.anims.stop();
      player.setAlpha(1);
    }

    this.healthSystem.destroy();

    this.obstacleSystem.clear();

    this.coinSystem.clear();

    this.gameOverScreen.show(
      this.scoreSystem.score
    );
  }

  // =================================
  // 12. GAME LOOP
  // =================================

  update(time, delta) {
    if (this.gameOver) {
      if (
        Phaser.Input.Keyboard.JustDown(
          this.keys.restart
        )
      ) {
        this.scene.restart();
      }

      return;
    }

    const deltaSeconds = delta / 1000;

    // UPDATE DIFFICULTY
    this.updateDifficulty(deltaSeconds);

    // BACKGROUND
    this.updateBackground(deltaSeconds);

    // PLAYER
    this.drimo.update(
      deltaSeconds,
      this.keys,
      this.cursors
    );

    // OBSTACLES
    this.obstacleSystem.update(deltaSeconds);

    if (this.gameOver) return;

    // COINS
    this.coinSystem.update(deltaSeconds);

    // H = TEST DAMAGE
    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.damage
      )
    ) {
      this.healthSystem.takeDamage();
    }

    // C = TEST COIN COLLECTION
    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.collect
      )
    ) {
      this.scoreSystem.collectCoin();
    }
  }
}
