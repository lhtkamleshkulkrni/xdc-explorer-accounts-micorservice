import BLManager from "./manager";

export default class JobController {
  static async generateTokenAnalytics() {
    await new BLManager().generateTokenAnalytics().catch((err) => {});
  }
}
