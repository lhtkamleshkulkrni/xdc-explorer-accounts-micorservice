import Utils from "../utils";
import CoinMarketController from "../modules/coinMarket/index";
import {httpConstants} from "../common/constants";

const CronMasterJob = require("cron-master").CronMasterJob;

module.exports = new CronMasterJob({
    // Optional. Used to determine when to trigger the 'time-warning'. Fires after
    // the provided number of milliseconds (e.g 2 minutes in the case below) has
    // passed if the job has not called the done callback

    timeThreshold: 5 * 60 * 1000,
    meta: {
        name: "job to save coin market exchange data in DB",
        requestID: "",
    },
    cronParams: {
        cronTime: "*/30 * * * * *",
        onTick: async (job, done) => {
            Utils.lhtLog("cron jobs", "cron job running", {}, "", httpConstants.LOG_LEVEL_TYPE.INFO);
            await CoinMarketController.saveData();
            done(null, "ok");
        },
    },
});
