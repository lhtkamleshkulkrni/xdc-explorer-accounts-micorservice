import BLManager from "./manager";

export default class JobController {
  static async generateTokenAnalytics() {
    await new BLManager().generateTokenAnalytics().catch((err) => {});
  }

  static async syncHistoryPriceData() {
    await new BLManager().syncHistoryPriceData().catch((err) => {
      console.log(err, "err");
    });
  }

  static async syncTokenInfo() {
    await new BLManager().syncTokenInfo().catch((err) => {
      console.log(err, "err");
    });
  }
}
