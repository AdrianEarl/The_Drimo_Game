const formatMultiplier = (value) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const POWERUP_ROWS = 4;
const POWERUP_BAR_WIDTH = 160;
const DASH_BAR_WIDTH = 260;

export default class HUD {
  constructor(scene) {
    this.scene = scene;

    const centerX = 960;

    // =================================
    // HEALTH
    // =================================

    this.healthLabel = scene.add.text(
      centerX,
      35,
      "HEALTH",
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.healthBarBg = scene.add.rectangle(
      centerX,
      100,
      400,
      28,
      0x444444
    );

    this.healthBarBg.setOrigin(0.5);

    this.healthBarFill = scene.add.rectangle(
      centerX - 200,
      100,
      400,
      28,
      0x35d07f
    );

    this.healthBarFill.setOrigin(0, 0.5);

    this.healthValueText = scene.add.text(
      centerX,
      100,
      "100 / 100",
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    // =================================
    // SCORE / COINS / DISTANCE / COMBO
    // =================================

    this.scoreText = scene.add.text(
      centerX - 170,
      155,
      "SCORE: 0",
      {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#ffffff",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.coinsText = scene.add.text(
      centerX + 170,
      155,
      "COINS: 0",
      {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#ffd447",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.distanceText = scene.add.text(
      centerX - 170,
      200,
      "DISTANCE: 0 m",
      {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#9fd8ff",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.comboText = scene.add.text(
      centerX + 170,
      200,
      "COMBO x1",
      {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#aaaaaa",
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.bestText = scene.add.text(
      1880,
      40,
      "BEST: 0",
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold"
      }
    ).setOrigin(1, 0.5);

    this.comboBaseColor = "#aaaaaa";
    this.lastMultiplier = 1;
    this.lastDistance = -1;

    // =================================
    // DASH BAR (bottom-left)
    // =================================

    this.dashLabel = scene.add.text(
      60,
      1010,
      "DASH [SPACE]",
      {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4
      }
    ).setOrigin(0, 0.5);

    this.dashBarBg = scene.add.rectangle(
      60,
      1042,
      DASH_BAR_WIDTH,
      16,
      0x333333
    ).setOrigin(0, 0.5);

    this.dashBarFill = scene.add.rectangle(
      60,
      1042,
      DASH_BAR_WIDTH,
      16,
      0x35d0ff
    ).setOrigin(0, 0.5);

    // =================================
    // POWER-UP INDICATORS (top-left)
    // =================================

    this.powerUpRows = [];

    for (let i = 0; i < POWERUP_ROWS; i++) {
      const y = 40 + i * 52;

      const label = scene.add.text(
        40,
        y,
        "",
        {
          fontFamily: "Arial",
          fontSize: "22px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 4
        }
      ).setOrigin(0, 0.5);

      const barBg = scene.add.rectangle(
        40,
        y + 24,
        POWERUP_BAR_WIDTH,
        10,
        0x333333
      ).setOrigin(0, 0.5);

      const barFill = scene.add.rectangle(
        40,
        y + 24,
        POWERUP_BAR_WIDTH,
        10,
        0xffffff
      ).setOrigin(0, 0.5);

      label.setDepth(100);
      barBg.setDepth(100);
      barFill.setDepth(101);

      label.setVisible(false);
      barBg.setVisible(false);
      barFill.setVisible(false);

      this.powerUpRows.push({ label, barBg, barFill });
    }

    // =================================
    // MILESTONE BANNER
    // =================================

    this.bannerTitle = scene.add.text(
      centerX,
      330,
      "",
      {
        fontFamily: "Arial",
        fontSize: "96px",
        color: "#ffd447",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 10
      }
    ).setOrigin(0.5);

    this.bannerSub = scene.add.text(
      centerX,
      420,
      "",
      {
        fontFamily: "Arial",
        fontSize: "42px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 7
      }
    ).setOrigin(0.5);

    this.bannerTitle.setAlpha(0);
    this.bannerSub.setAlpha(0);

    // =================================
    // LOW-HEALTH VIGNETTE
    // =================================

    this.createVignette();

    this.lowHealth = false;
    this.vignetteTween = null;
    this.barTween = null;

    // =================================
    // DEPTHS
    // =================================

    this.healthLabel.setDepth(100);
    this.healthBarBg.setDepth(100);
    this.healthBarFill.setDepth(101);
    this.healthValueText.setDepth(102);
    this.scoreText.setDepth(100);
    this.coinsText.setDepth(100);
    this.distanceText.setDepth(100);
    this.comboText.setDepth(100);
    this.bestText.setDepth(100);
    this.dashLabel.setDepth(100);
    this.dashBarBg.setDepth(100);
    this.dashBarFill.setDepth(101);
    this.bannerTitle.setDepth(120);
    this.bannerSub.setDepth(120);
  }

  // Red radial gradient drawn once into a canvas texture
  createVignette() {
    const key = "lowHealthVignette";
    const width = 1920;
    const height = 1080;

    if (!this.scene.textures.exists(key)) {
      const texture = this.scene.textures.createCanvas(
        key,
        width,
        height
      );

      const context = texture.getContext();

      const gradient = context.createRadialGradient(
        width / 2,
        height / 2,
        380,
        width / 2,
        height / 2,
        1100
      );

      gradient.addColorStop(0, "rgba(255, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 0.75)");

      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      texture.refresh();
    }

    this.vignette = this.scene.add.image(
      width / 2,
      height / 2,
      key
    );

    this.vignette.setDepth(90);
    this.vignette.setAlpha(0);
  }

  // =================================
  // HEALTH
  // =================================

  updateHealth(health, maxHealth) {
    const percentage = Math.max(
      0,
      Math.min(1, health / maxHealth)
    );

    this.healthBarFill.width = 400 * percentage;

    if (percentage > 0.60) {
      this.healthBarFill.setFillStyle(0x35d07f);
    } else if (percentage > 0.30) {
      this.healthBarFill.setFillStyle(0xffa500);
    } else {
      this.healthBarFill.setFillStyle(0xff3333);
    }

    this.healthValueText.setText(
      `${health} / ${maxHealth}`
    );

    // Low-health warning (pulsing bar + red vignette)
    this.setLowHealth(percentage > 0 && percentage <= 0.30);

    // Dead: leave a static red vignette
    if (health <= 0) {
      this.vignette.setAlpha(0.85);
    }
  }

  setLowHealth(low) {
    if (low === this.lowHealth) return;

    this.lowHealth = low;

    if (low) {
      this.vignette.setAlpha(0.3);

      this.vignetteTween = this.scene.tweens.add({
        targets: this.vignette,
        alpha: { from: 0.3, to: 0.9 },
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      this.barTween = this.scene.tweens.add({
        targets: [this.healthBarBg, this.healthBarFill],
        scaleY: { from: 1, to: 1.5 },
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    } else {
      if (this.vignetteTween) {
        this.vignetteTween.stop();
        this.vignetteTween = null;
      }

      if (this.barTween) {
        this.barTween.stop();
        this.barTween = null;
      }

      this.vignette.setAlpha(0);
      this.healthBarBg.setScale(1);
      this.healthBarFill.setScale(1);
    }
  }

  // =================================
  // SCORE / DISTANCE / COMBO / BEST
  // =================================

  updateScore(score, coins) {
    this.scoreText.setText(`SCORE: ${score}`);
    this.coinsText.setText(`COINS: ${coins}`);
  }

  updateDistance(meters) {
    if (meters === this.lastDistance) return;

    this.lastDistance = meters;

    this.distanceText.setText(`DISTANCE: ${meters} m`);
  }

  updateBest(best) {
    this.bestText.setText(`BEST: ${best}`);
  }

  updateCombo(multiplier, streak) {
    const label = `COMBO x${formatMultiplier(multiplier)}`;

    const baseColor = multiplier > 1 ? "#7dffb0" : "#aaaaaa";

    if (
      label === this.comboText.text &&
      multiplier === this.lastMultiplier
    ) {
      return;
    }

    this.comboText.setText(label);
    this.comboBaseColor = baseColor;

    if (multiplier > this.lastMultiplier) {
      // Combo went up: green pop
      this.comboText.setColor(baseColor);

      this.scene.tweens.add({
        targets: this.comboText,
        scale: { from: 1.5, to: 1 },
        duration: 250,
        ease: "Back.easeOut"
      });
    } else if (multiplier < this.lastMultiplier) {
      // Combo lost: red flash
      this.comboText.setColor("#ff5555");

      this.scene.tweens.add({
        targets: this.comboText,
        scale: { from: 1.3, to: 1 },
        duration: 400,
        onComplete: () => {
          this.comboText.setColor(this.comboBaseColor);
        }
      });
    } else {
      this.comboText.setColor(baseColor);
    }

    this.lastMultiplier = multiplier;
  }

  // =================================
  // DASH BAR
  // =================================

  updateDash(charge, dashing) {
    this.dashBarFill.width = DASH_BAR_WIDTH * charge;

    if (dashing) {
      this.dashBarFill.setFillStyle(0xffffff);
      this.dashLabel.setText("DASHING!");
    } else if (charge >= 1) {
      this.dashBarFill.setFillStyle(0x35d0ff);
      this.dashLabel.setText("DASH READY [SPACE]");
    } else {
      this.dashBarFill.setFillStyle(0x4a6a80);
      this.dashLabel.setText("DASH");
    }
  }

  // =================================
  // POWER-UP INDICATORS
  // =================================

  updatePowerUps(list) {
    for (let i = 0; i < this.powerUpRows.length; i++) {
      const row = this.powerUpRows[i];
      const entry = list[i];

      if (!entry) {
        row.label.setVisible(false);
        row.barBg.setVisible(false);
        row.barFill.setVisible(false);
        continue;
      }

      row.label.setVisible(true);
      row.barBg.setVisible(true);
      row.barFill.setVisible(true);

      if (row.label.text !== entry.label) {
        row.label.setText(entry.label);
      }

      row.barFill.setFillStyle(entry.color);

      row.barFill.width =
        POWERUP_BAR_WIDTH *
        Math.max(0, Math.min(1, entry.remaining / entry.duration));
    }
  }

  // =================================
  // MILESTONE BANNER
  // =================================

  showBanner(title, subtitle) {
    const tweens = this.scene.tweens;

    tweens.killTweensOf([this.bannerTitle, this.bannerSub]);

    this.bannerTitle.setText(title).setAlpha(1);
    this.bannerSub.setText(subtitle).setAlpha(1);

    tweens.add({
      targets: this.bannerTitle,
      scale: { from: 1.6, to: 1 },
      duration: 350,
      ease: "Back.easeOut"
    });

    tweens.add({
      targets: [this.bannerTitle, this.bannerSub],
      alpha: 0,
      delay: 1800,
      duration: 500
    });
  }

  // =================================
  // FLOATING TEXT ("+10", "BLOCKED!", ...)
  // =================================

  spawnFloatingText(
    x,
    y,
    message,
    color = "#ffd447",
    size = 32
  ) {
    const text = this.scene.add.text(
      x,
      y,
      message,
      {
        fontFamily: "Arial",
        fontSize: `${size}px`,
        color,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 5
      }
    ).setOrigin(0.5);

    text.setDepth(60);

    this.scene.tweens.add({
      targets: text,
      y: y - 90,
      alpha: 0,
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy()
    });
  }
}