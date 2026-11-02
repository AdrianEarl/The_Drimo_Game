
export default class HUD {
  constructor(scene) {
    this.scene = scene;

    const centerX = 960;

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

    this.healthLabel.setDepth(100);
    this.healthBarBg.setDepth(100);
    this.healthBarFill.setDepth(101);
    this.healthValueText.setDepth(102);
    this.scoreText.setDepth(100);
    this.coinsText.setDepth(100);
  }

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
  }

  updateScore(score, coins) {
    this.scoreText.setText(`SCORE: ${score}`);
    this.coinsText.setText(`COINS: ${coins}`);
  }
}
