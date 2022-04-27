import CoinMarketManager from "./coinManager";

export default class CoinMarketController {
  static async saveData() {
    await new CoinMarketManager().saveData();
  }
}
