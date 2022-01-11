import AccountModel from "../../models/Account"
import CoinMasterModel from "../../models/coinMaster"
import HistoricalAccountModel from "../../models/HistoricalAccount"
import Utils from "../../utils"

export default class AccountManager {
    async getTotalAccounts() {
        Utils.lhtLog("AccountManager:getTotalAccounts", "get total block count", "", "")
        return await AccountModel.count();
    }

    async getAccountDetailsUsingAddress(address) {
        address=address.toLowerCase();
        Utils.lhtLog("AccountManager:getAccountDetailsUsingAddress", "getAccountDetailsUsingAddress", address, "")
        return await AccountModel.getAccount({address: address});
    }

    async getLatestAccounts(req) {
        Utils.lhtLog("AccountManager:getLatestAccounts", "getLatestAccounts", req, "");
        let sortKey = "balance",
            sortType = -1;
        if (req && req.sortKey)
            sortKey = req.sortKey;
        if (req && req.sortType)
            sortType = parseInt(req.sortType);

        if (!req.keywords)
            return await AccountModel.getAccountList({}, "", parseInt(req.skip), parseInt(req.limit), {[sortKey]: sortType});
        Utils.lhtLog("AccountManager:getLatestAccounts", "getLatestAccounts", {
            address: {
                $regex: ".*" + req.keywords + ".*"
            }
        }, "");
        return await AccountModel.getAccountList({
            address: {
                $regex: ".*" + req.keywords + ".*"
            }
        }, "", parseInt(req.skip), parseInt(req.limit), {[sortKey]: sortType});
    }

    async getAccountList(requestData) {
        if (!requestData) requestData = {}
        const accountListRequest = this.parseGetContractListRequest(requestData);
        if (requestData.percentage) {
            const totalSupply = await this.getCoinMarketTotalSupply();
            const balanceStart = ((requestData.percentage - 25) * totalSupply) / 100
            const balanceEnd = (requestData.percentage * totalSupply) / 100
            delete accountListRequest.requestData.percentage
            accountListRequest.requestData.balance = {$gt: balanceStart, $lt: balanceEnd}
        }
        const accountList = await AccountModel.getAccountList(accountListRequest.requestData, accountListRequest.selectionKeys, accountListRequest.skip, accountListRequest.limit, accountListRequest.sorting);
        let totalCount = await AccountModel.count(accountListRequest.requestData)
        return {accountList, totalCount};
    }

    getCoinMarketTotalSupply = async () => {
        let coinMarketResponse = await CoinMasterModel.getCoinMarketCapList({}, "", 0, 1, {lastUpdated: -1});
        return coinMarketResponse[0].totalSupply;
    }

    async getSomeDaysAccounts(days) {
        Utils.lhtLog("AccountManager:getSomeDaysAccounts", "getSomeDaysAccounts", days, "");
        return await HistoricalAccountModel.getHistoricalDataList({}, "", 0, parseInt(days), {timestamp: -1});
    }

    parseGetContractListRequest = (requestObj) => {
        if (!requestObj) return {};
        let skip = 0;
        if (requestObj.skip || requestObj.skip === 0) {
            skip = requestObj.skip;
            delete requestObj.skip
        }
        let limit = 0;
        if (requestObj.limit) {
            limit = requestObj.limit;
            delete requestObj.limit
        }
        let sorting = '';
        if (requestObj.sortKey) {
            sorting = {[requestObj.sortKey]: requestObj.sortType || -1};
            delete requestObj.sortKey;
            delete requestObj.sortType;
        }
        let selectionKeys = '';
        if (requestObj.selectionKeys) {
            selectionKeys = requestObj.selectionKeys;
            delete requestObj.selectionKeys
        }
        let searchQuery = [];
        if (requestObj.searchKeys && requestObj.searchValue && Array.isArray(requestObj.searchKeys) && requestObj.searchKeys.length) {
            requestObj.searchKeys.map((searchKey) => {
                let searchRegex = {"$regex": requestObj.searchValue, "$options": "i"};
                searchQuery.push({[searchKey]: searchRegex});
            });
            requestObj["$or"] = searchQuery;
        }
        if (requestObj.searchKeys)
            delete requestObj.searchKeys;
        if (requestObj.searchValue)
            delete requestObj.searchValue;
        return {requestData: requestObj, skip, limit, sorting, selectionKeys};
    }
}
