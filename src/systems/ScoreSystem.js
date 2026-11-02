
export default class ScoreSystem {
  constructor(hud) {
    this.hud = hud;

    this.score = 0;
    this.coins = 0;

    this.update();
  }

  collectCoin() {
    this.coins += 1;
    this.score += 10;

    this.update();
  }

  update() {
    this.hud.updateScore(
      this.score,
      this.coins
    );
  }
}
