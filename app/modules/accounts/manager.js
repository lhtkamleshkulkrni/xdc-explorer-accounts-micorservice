import AccountModel from "../../models/Account"
import HistoricalAccountModel from "../../models/HistoricalAccount"
import Utils from "../../utils"

export default class AccountManager {
    async getTotalAccounts() {
        Utils.lhtLog("AccountManager:getTotalAccounts", "get total block count", "", "")
        return await AccountModel.count();
    }

    async getAccountDetailsUsingAddress(address) {
        Utils.lhtLog("AccountManager:getAccountDetailsUsingAddress", "getAccountDetailsUsingAddress", address, "")
        return await AccountModel.getAccount({address: address});
    }

    async getLatestAccounts(req) {
        Utils.lhtLog("AccountManager:getLatestAccounts", "getLatestAccounts", req, "");
        if (!req.keywords)
            return await AccountModel.getAccountList({}, "", parseInt(req.skip), parseInt(req.limit), {"balance": -1});
        Utils.lhtLog("AccountManager:getLatestAccounts", "getLatestAccounts", {
            address: {
                $regex: ".*" + req.keywords + ".*"
            }
        }, "");
        return await AccountModel.getAccountList({
            address: {
                $regex: ".*" + req.keywords + ".*"
            }
        }, "", parseInt(req.skip), parseInt(req.limit), {"balance": -1});
    }

    async getSomeDaysAccounts(days) {
        Utils.lhtLog("AccountManager:getSomeDaysAccounts", "getSomeDaysAccounts", days, "");
            return await HistoricalAccountModel.getHistoricalDataList({}, "", 0, parseInt(days), { timestamp: -1  });
    }
}