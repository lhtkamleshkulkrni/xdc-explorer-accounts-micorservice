import AccountModel from "../../models/Account";
import CoinMasterModel from "../../models/coinMaster";
import HistoricalAccountModel from "../../models/HistoricalAccount";
import Utils from "../../utils";
import moment from "moment";
import Web3 from "xdc3";
import Config from '../../../config'
import TransactionModel from "../../models/transaction";


export default class AccountManager {
  async getTotalAccounts() {
    Utils.lhtLog(
      "AccountManager:getTotalAccounts",
      "get total block count",
      "",
      ""
    );
    return await AccountModel.count();
  }

  async getAccountDetailsUsingAddress(address) {
    address = address.toLowerCase();
    Utils.lhtLog(
      "AccountManager:getAccountDetailsUsingAddress",
      "getAccountDetailsUsingAddress",
      address,
      ""
    );
    return await AccountModel.getAccount({ address: address });
  }

  async getAccountRanking(req) {
    let address = req.input.toLowerCase();
    let zeroBalanceAccount = req.includeZeroBalanceAccounts;
    Utils.lhtLog(
        "AccountManager:getAccountRanking",
        "getAccountRanking",
        address,
        ""
    );

    let accountResponse = await AccountModel.getAccount({ address: address });
    let balance = accountResponse.balance;
    let richerQuery = {
      balance: { $gt: balance },
    };
    let poorerQuery = {
      balance: { $lte: balance },
    };
    if (zeroBalanceAccount==="false") {
      richerQuery = {
        $and: [
          {
            balance: { $gt: balance },
          },
          {
            balance: { $ne: 0 },
          },
        ],
      };

      poorerQuery = {
        $and:[
          {
            balance: { $lte: balance },
          },
          {
            balance: { $ne: 0 },
          },
        ]
      }
    }
    let accountsRicher = await AccountModel.getAccount(richerQuery).count();
    let accountsPoorer = await AccountModel.getAccount(poorerQuery).count();
    const [fromCount, toCount] = await Promise.all([
      TransactionModel.countDocuments({ from: address }),
      TransactionModel.countDocuments({ to: address }),
    ]);
    balance=balance/1000000000000000000;
    return {
      balance,
      accountsPoorer,
      accountsRicher,
      type: "account",
      account: address,
      transactions: fromCount + toCount,
    };
  }

  async getLatestAccounts(req) {
    Utils.lhtLog(
      "AccountManager:getLatestAccounts",
      "getLatestAccounts",
      req,
      ""
    );
    let sortKey = "balance",
      sortType = -1;
    if (req && req.sortKey) sortKey = req.sortKey;
    if (req && req.sortType) sortType = parseInt(req.sortType);

    if (!req.keywords)
      return await AccountModel.getAccountList(
        {},
        "",
        parseInt(req.skip),
        parseInt(req.limit),
        { [sortKey]: sortType }
      );
    Utils.lhtLog(
      "AccountManager:getLatestAccounts",
      "getLatestAccounts",
      {
        address: {
          $regex: ".*" + req.keywords + ".*",
        },
      },
      ""
    );
    return await AccountModel.getAccountList(
      {
        address: {
          $regex: ".*" + req.keywords + ".*",
        },
      },
      "",
      parseInt(req.skip),
      parseInt(req.limit),
      { [sortKey]: sortType }
    );
  }

  async updateAccountBalance(req) {
    let web3= new Web3(Config.WEBSOCKET_URL);
    Utils.lhtLog("AccountManager:updateAccountBalance", "updateAccountBalance", req, "");
    let accounts= await AccountModel.getAccountList({}, "", parseInt(req.skip), parseInt(req.limit), {_id:1});
    for(let index=0;index<accounts.length;index++){
      let findObj={
        address:accounts[index].address
      };
      let blockchainBalance=await  web3.eth.getBalance(accounts[index].address+"");
      Utils.lhtLog("AccountManager:updateAccountBalance", "blockchainBalance", {index,blockchainBalance}, "");
      let updateObj={
        balance:blockchainBalance
      }

      let updateResponse=await AccountModel.updateAccount(findObj,updateObj)
      Utils.lhtLog("AccountManager:updateAccountBalance", "updateResponse", updateResponse, "");
    }
  }

  async getAccountList(requestData) {
    if (!requestData) requestData = {};
    const accountListRequest = this.parseAccountListRequest(requestData);
    if (requestData.percentage) {
      const totalSupply = await this.getCoinMarketTotalSupply();
      const balanceStart = ((requestData.percentage - 25) * totalSupply) / 100;
      const balanceEnd = (requestData.percentage * totalSupply) / 100;
      delete accountListRequest.requestData.percentage;
      accountListRequest.requestData.balance = {
        $gt: balanceStart,
        $lt: balanceEnd,
      };
    }
    const accountList = await AccountModel.getAccountList(
      accountListRequest.requestData,
      accountListRequest.selectionKeys,
      accountListRequest.skip,
      accountListRequest.limit,
      accountListRequest.sorting
    );
    let totalCount = await AccountModel.count(accountListRequest.requestData);
    return { accountList, totalCount };
  }

  async getAccountListNew(requestData) {
    if (!requestData) requestData = {};
    const accountListRequest = this.parseGetContractListRequest(requestData);
    if (requestData.percentage) {
      const totalSupply = await this.getCoinMarketTotalSupply();
      const balanceStart = ((requestData.percentage - 25) * totalSupply) / 100;
      const balanceEnd = (requestData.percentage * totalSupply) / 100;
      delete accountListRequest.requestData.percentage;
      accountListRequest.requestData.balance = {
        $gt: balanceStart,
        $lt: balanceEnd,
      };
    }
    const itemsResponse = await AccountModel.getAccountList(
      accountListRequest.requestData,
      accountListRequest.selectionKeys,
      accountListRequest.skip,
      accountListRequest.limit,
      accountListRequest.sorting
    );
    const items = this.parseItems(itemsResponse);
    let total = await AccountModel.count(accountListRequest.requestData);
    let pages = Math.ceil(total / accountListRequest.limit);
    let currentPage =
      Math.ceil(total / accountListRequest.limit) -
      Math.ceil((total - accountListRequest.skip) / accountListRequest.limit) +
      1;
    let perPage = accountListRequest.limit;
    return { items, total, pages, currentPage, perPage };
  }

  parseItems(items) {
    return items.map((row, index) => {
      const newItemResponse = {
        hash: row.address,
        balance: row.balance,
        balanceNumber: row.balance / 100000000000000000,
        code: "0x",
        createdAt: moment(row.createdOn).toISOString(),
        isToken: false,
        status: true,
        updatedAt: moment(row.modifiedOn).toISOString(),
        logCount: 0,
        minedBlock: 0,
        rewardCount: 0,
        percentage: "",
        rank: index + 1,
        accountName: null,
      };

      return newItemResponse;
    });
  }
  getCoinMarketTotalSupply = async () => {
    let coinMarketResponse = await CoinMasterModel.getCoinMarketCapList(
      {},
      "",
      0,
      1,
      { lastUpdated: -1 }
    );
    return coinMarketResponse[0].totalSupply;
  };

  async getSomeDaysAccounts(days) {
    Utils.lhtLog(
      "AccountManager:getSomeDaysAccounts",
      "getSomeDaysAccounts",
      days,
      ""
    );
    return await HistoricalAccountModel.getHistoricalDataList(
      {},
      "",
      0,
      parseInt(days),
      { timestamp: -1 }
    );
  }

  parseAccountListRequest = (requestObj) => {
    if (!requestObj) return {};
    let skip = 0;
    if (requestObj.skip || requestObj.skip === 0) {
      skip = requestObj.skip;
      delete requestObj.skip;
    }
    let limit = 0;
    if (requestObj.limit) {
      limit = requestObj.limit;
      delete requestObj.limit;
    }
    let sorting = "";
    if (requestObj.sortKey) {
      sorting = { [requestObj.sortKey]: requestObj.sortType || -1 };
      delete requestObj.sortKey;
      delete requestObj.sortType;
    }
    let selectionKeys = "";
    if (requestObj.selectionKeys) {
      selectionKeys = requestObj.selectionKeys;
      delete requestObj.selectionKeys;
    }
    let searchQuery = [];
    if (
        requestObj.searchKeys &&
        requestObj.searchValue &&
        Array.isArray(requestObj.searchKeys) &&
        requestObj.searchKeys.length
    ) {
      requestObj.searchKeys.map((searchKey) => {
        let searchRegex = { $regex: requestObj.searchValue, $options: "i" };
        searchQuery.push({ [searchKey]: searchRegex });
      });
      requestObj["$or"] = searchQuery;
    }
    if (requestObj.searchKeys) delete requestObj.searchKeys;
    if (requestObj.searchValue) delete requestObj.searchValue;
    return { requestData: requestObj, skip, limit, sorting, selectionKeys };
  };

  parseGetContractListRequest = (requestObj) => {
    if (!requestObj) return {};
    let skip = 0;
    if (requestObj.pageNum || requestObj.pageNum === 0) {
      skip = requestObj.pageNum;
      delete requestObj.pageNum;
    }
    let limit = 0;
    if (requestObj.perpage) {
      limit = requestObj.perpage;
      delete requestObj.perpage;
    }
    let sorting = "";
    if (requestObj.sortKey) {
      sorting = { [requestObj.sortKey]: requestObj.sortType || -1 };
      delete requestObj.sortKey;
      delete requestObj.sortType;
    }
    let selectionKeys = "";
    if (requestObj.selectionKeys) {
      selectionKeys = requestObj.selectionKeys;
      delete requestObj.selectionKeys;
    }
    let searchQuery = [];
    if (
      requestObj.searchKeys &&
      requestObj.searchValue &&
      Array.isArray(requestObj.searchKeys) &&
      requestObj.searchKeys.length
    ) {
      requestObj.searchKeys.map((searchKey) => {
        let searchRegex = { $regex: requestObj.searchValue, $options: "i" };
        searchQuery.push({ [searchKey]: searchRegex });
      });
      requestObj["$or"] = searchQuery;
    }
    if (requestObj.searchKeys) delete requestObj.searchKeys;
    if (requestObj.searchValue) delete requestObj.searchValue;
    return { requestData: requestObj, skip, limit, sorting, selectionKeys };
  };
}
