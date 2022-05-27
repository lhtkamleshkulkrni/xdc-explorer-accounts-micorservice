import ContractModel from "../../models/Contract";
import TokenHolderModel from "../../models/TokenHolder";
import TransferTokenModel from "../../models/Transfer";
import AccountTrancheModel from "../../models/AccountTranche";
import AccountModel from "../../models/Account";
import HistoryPriceModel from "../../models/historyPrice"
const moment = require("moment");

import Utils from "../../utils";

export default class ContractManager {
  async getAccountByTranche() {
    Utils.lhtLog(
      "BLManager:getAccountByTranche",
      "get getAccountByTranche ",
      "",
      ""
    );
    return await AccountTrancheModel.getAccountByTranche({}, { "balanceFrom": 1 });
  }
  async getTotalTokens() {
    Utils.lhtLog(
      "ContractManager:getTotalTokens",
      "getTotalTokens count",
      "",
      ""
    );
    return await ContractModel.count({ ERC: { $gt: 0 } });
  }

  async getListOfTokenForAddress(req) {
    let addressToken = req.address.toLowerCase();
    const query = {
      ERC: { $gt: 0 },
      $or: [{ address: addressToken }, { owner: addressToken }],
    };
    Utils.lhtLog(
      "ContractManager:getListOfTokenForAddress",
      "getListOfTokenForAddress List",
      req,
      ""
    );
    let tokenHolderTableData = await TokenHolderModel.find({
      address: addressToken,
    });
    let tokenHolderTableResponse = [];
    for (let element of tokenHolderTableData) {
      let findObj = {
        ERC: { $gt: 0 },
        $or: [
          { address: element.tokenContract },
          { owner: element.tokenContract },
        ],
      };
      let dataResponseContract = await ContractModel.getContractList(
        findObj,
        {
          address: 1,
          holdersCount: 1,
          tokenName: 1,
          symbol: 1,
          totalSupply: 1,
          decimals: 1,
          ERC: 1,
          tokenImage: 1,
        },
        "",
        1,
        ""
      );
      if(!dataResponseContract || dataResponseContract.length == 0){
        continue;
      }
      let holderDetails = {
        address: dataResponseContract[0].address,
        holdersCount: dataResponseContract[0].holdersCount,
        tokenName: dataResponseContract[0].tokenName,
        symbol: dataResponseContract[0].symbol,
        totalSupply: dataResponseContract[0].totalSupply,
        decimals: dataResponseContract[0].decimals,
        ERC: dataResponseContract[0].ERC,
        tokenImage: dataResponseContract[0].tokenImage,
        tokenContract: element.tokenContract,
        balance: element.balance,
      };
      tokenHolderTableResponse.push(holderDetails);
      
    }
    if (tokenHolderTableData.length === 0) {
      let data = await ContractModel.getContractList(
        query,
        {
          address: 1,
          holdersCount: 1,
          tokenName: 1,
          symbol: 1,
          totalSupply: 1,
          decimals: 1,
          ERC: 1,
          tokenImage: 1,
        },
        parseInt(req.skip),
        parseInt(req.limit),
        req.sortKey ? req.sortKey : { _id: -1 }
      );
      let holderTableResponse = [];
      for (let element of data) {
        let findObj = {
          address: element.owner,
          tokenContract: element.address,
        };
        let tokenHolderData = await TokenHolderModel.getHolderList(
          findObj,
          "",
          "",
          1,
          ""
        );
        let balance =
          tokenHolderData &&
            tokenHolderData.length > 0 &&
            tokenHolderData[0].balance
            ? tokenHolderData[0].balance
            : 0;

        holderTableResponse.push({ ...element._doc, balance: balance });
      }
      return holderTableResponse;
    } else {
      return tokenHolderTableResponse;
    }
  }

  async getTotalContracts() {
    Utils.lhtLog(
      "ContractManager:getTotalContracts",
      "getTotalContracts count",
      "",
      ""
    );
    return await ContractModel.count();
  }

  async getListOfTokens(req) {
    Utils.lhtLog("ContractManager:getListOfTokens", "getListOfTokens", req, "");

    let query = {
      $or: [
        { address: { $regex: req.searchKey, $options: "i" } },
        { tokenName: { $regex: req.searchKey, $options: "i" } },
        { symbol: { $regex: req.searchKey, $options: "i" } },
      ],
    };
    if (req.isERC) {
      query["ERC"] = 721;
    } else {
      query["$and"] = [{ ERC: { $gt: 0 } }, { ERC: { $ne: 721 } }];
    }
    let totalCount = await ContractModel.count(query);
    let tokens = await ContractModel.getContractList(
      query,
      {
        address: 1,
        holdersCount: 1,
        tokenName: 1,
        symbol: 1,
        totalSupply: 1,
        decimals: 1,
        tokenImage: 1,
        transfers: 1,
        description: 1,
        totalSupplyCount: 1
      },
      parseInt(req.skip),
      parseInt(req.limit),
      req.sortKey ? req.sortKey : { _id: -1 }
    );
    // const resultArray = [];
    // for (let v of resultSet) {
    //     let holderCount = await TokenHolderModel.countDocuments({tokenContract: v.address});
    //     // console.log('h----',v)
    //     if (v.abi != '' && v.sourceCode != '' && v.compilerVersion != '') {
    //         resultArray.push({
    //             "_id": v._id,
    //             "address": v.address,
    //             "tokenName": v.tokenName,
    //             "symbol": v.symbol,
    //             "type": "XRC20",
    //             "status": "verified",
    //             "totalSupply": v.totalSupply,
    //             "tokenHolders": holderCount,
    //             decimals:v.decimals
    //         })
    //     } else {
    //         resultArray.push({
    //             "_id": v._id,
    //             "address": v.address,
    //             "tokenName": v.tokenName,
    //             "symbol": v.symbol,
    //             "type": "XRC20",
    //             "status": "unverified",
    //             "totalSupply": v.totalSupply,
    //             "tokenHolders": holderCount,
    //             decimals:v.decimals
    //         })
    //     }
    // }
    return { tokens, totalCount };
  }

  async getListOfContracts(req, reqBody) {
    Utils.lhtLog(
      "ContractManager:getListOfContracts",
      "getListOfContracts",
      req,
      ""
    );
    let selectionKey = {
      address: 1.0,
      blockNumber: 1.0,
      ERC: 1.0,
      creationTransaction: 1.0,
      contractName: 1.0,
      tokenName: 1.0,
      symbol: 1.0,
      owner: 1.0,
      decimals: 1.0,
      totalSupply: 1.0,
      abi: 1.0,
      isCreatedOn: 1.0,
      isModifiedOn: 1.0,
      isActive: 1.0,
      isDeleted: 1.0,
    };
    return await ContractModel.getContractList(
      {},
      selectionKey,
      parseInt(req.skip),
      parseInt(req.limit),
      reqBody.sortKey ? reqBody.sortKey : { blockNumber: -1 }
    );
  }

  async contractDetailsUsingAddressResponse(req) {
    Utils.lhtLog(
      "ContractManager:contractDetailsUsingAddressResponse",
      "contractDetailsUsingAddressResponse",
      req,
      ""
    );
    let contractAddress = req.contractAddress.toLowerCase();
    let contractResponse = await ContractModel.getContract({
      address: contractAddress,
    });
    let balanceFromAccountTable = await AccountModel.getAccount({
      address: contractAddress
    })
    let balance = balanceFromAccountTable ? balanceFromAccountTable.balance : ""
    let response = {};
    let contractStatus = "Unverified";
    if (!contractResponse) {
      return response;
    }
    contractResponse = contractResponse.toJSON();
    if (
      contractResponse.sourceCode &&
      contractResponse.abi &&
      contractResponse.byteCode
    ) {
      contractStatus = "Verified";
    } else {
      contractStatus = "Unverified";
    }
    return {
      contractResponse,
      contractStatus,
      balance
    };
  }

  async getContractSearch(res) {
    Utils.lhtLog(
      "ContractManager:getContractSearch",
      "getContractSearch",
      res,
      ""
    );
    let skip = 0;
    let limit = 0;
    let keywords = "";
    if (res.skip) {
      skip = parseInt(res.skip);
    }
    if (res.limit) {
      limit = parseInt(res.limit);
    }
    if (res.keywords) {
      keywords = res.keywords;
    }
    const totalResult = await ContractModel.countData({
      $or: [
        {
          address: {
            $regex: ".*" + keywords.toLowerCase() + ".*",
            $options: "i",
          },
        },
        { tokenName: { $regex: ".*" + keywords + ".*", $options: "i" } },
      ],
    });

    const datas = await ContractModel.getContractList(
      {
        $or: [
          {
            address: {
              $regex: ".*" + keywords.toLowerCase() + ".*",
              $options: "i",
            },
          },
          { tokenName: { $regex: ".*" + keywords + ".*", $options: "i" } },
        ],
      },
      "",
      skip,
      limit
    );
    return { response: datas, totalRecord: totalResult };
  }

  async getListOfHoldersForToken(req) {
    Utils.lhtLog(
      "ContractManager:getListOfHoldersForToken",
      "getListOfHoldersForToken",
      "",
      ""
    );
    let tokenAddress = req.params.address.toLowerCase();
    let findObj = {
      tokenContract: tokenAddress,
    };
    // let countFromHolder = await TransferTokenModel.distinct("from", {
    //   contract: tokenAddress,
    // });
    // let countToHolder = await TransferTokenModel.distinct("to", {
    //   contract: tokenAddress,
    // });
    let response = await TokenHolderModel.getHolderList(
      findObj,
      {},
      parseInt(req.body.skip),
      parseInt(req.body.limit),
      req.body.sortKey ? req.body.sortKey : { balance: -1 }
    );
    let responseCount = await TokenHolderModel.getHoldersCount(findObj)
    let contractResponse = await ContractModel.getContract({
      address: tokenAddress,
    });

    /**
         A token which has the maximu 2o. of address for a particular contract address has the rank 1 and go on.
         Percentage will be calculated on the basis of Quantity/Total supply for that token * 100
    **/

    // if (!req.body.sortKey || req.body.sortKey["balance"] === -1) {
    //   response.sort(function (a, b) {
    //     return (
    //       Number(b.balance) /
    //       parseFloat(10 ** parseInt(contractResponse.decimals)) -
    //       Number(a.balance) /
    //       parseFloat(10 ** parseInt(contractResponse.decimals))
    //     );
    //   });
    // } else {
    //   response.sort(function (a, b) {
    //     return (
    //       Number(a.balance) /
    //       parseFloat(10 ** parseInt(contractResponse.decimals)) -
    //       Number(b.balance) /
    //       parseFloat(10 ** parseInt(contractResponse.decimals))
    //     );
    //   });
    // }
    // let totalSupply = contractResponse.totalSupply
    let reponseTotalSupply = await TokenHolderModel.getHolderList(
      {
        address: tokenAddress,
      },
      {},
      parseInt(req.body.skip),
      parseInt(req.body.limit),
      req.body.sortKey ? req.body.sortKey : { balance: -1 }
    );
    const data = response.filter((t) => { return (t.address !== tokenAddress ? true : false) }).map(function (t, index) {
      // if (t.address == tokenAddress) {
      //    return false ;
      // }
      let percentage;
      try {
        percentage =
          (Number(t.balance) /
            reponseTotalSupply[0].totalSupply) * 100
        percentage = percentage > 100 ? 100 : percentage
      } catch (error) {

        percentage =
          (Number(t.balance) /
            t.totalSupply) * 100
        percentage = percentage > 100 ? 100 : percentage
      }
      let quantity =
        Number(t.balance) /
        parseFloat(10 ** parseInt(contractResponse.decimals));
      return {
        Rank: index + 1,
        Address: t.address,
        Quantity: quantity,
        Percentage: percentage,
        Value: t.balance,
      };
    });


    return { data, responseCount };
  }
  async someDaysHolders(req) {
    Utils.lhtLog("ContractManager:someDaysHolders", "", "", "");
    let numberOfDays = Number(req.params.numberOfDays);
    let endTime = parseInt(moment().valueOf() / 1000);
    let startTime = parseInt(
      moment().subtract(req.params.numberOfDays, "days").valueOf() / 1000
    );
    let holdersCount = await TokenHolderModel.countDocuments({ tokenContract: req.params.address });
    let responseHolder = await TransferTokenModel.aggregate([
      {
        $match: {
          $and: [
            { timestamp: { $gte: startTime, $lte: endTime } },
            { contract: req.params.address },
          ],
        },
      },
      {
        $group: {
          _id: {
            day: {
              $dayOfMonth: {
                $add: [new Date(0), { $multiply: [1000, "$timestamp"] }],
              },
            },
            month: {
              $month: {
                $add: [new Date(0), { $multiply: [1000, "$timestamp"] }],
              },
            },
            year: {
              $year: {
                $add: [new Date(0), { $multiply: [1000, "$timestamp"] }],
              },
            },
          },
          uniqueCount1: { $addToSet: "$to" },
          uniqueCount2: { $addToSet: "$from" },
          toAddresses: { $addToSet: "$to" },
          fromAddresses: { $addToSet: "$from" },
          count: { $sum: 1 },
          date: {
            $first: {
              $add: [new Date(0), { $multiply: [1000, "$timestamp"] }],
            },
          },
        },
      },

      { $sort: { date: 1 } },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          toCount: { $size: "$uniqueCount1" },
          fromCount: { $size: "$uniqueCount2" },
          addresses: { "$concatArrays": ["$fromAddresses", "$toAddresses"] },
          // total:      {$add:[Number("$toCount"),Number("$fromCount")]},
          count: 1,
          _id: 0,
        },
      },
    ]);

    const resultArray = [];
    if (responseHolder.length > 0)
      responseHolder.map((item) => {
        let count = [...new Set(item.addresses)].length;
        resultArray.push({
          date: item.date,
          count: count > holdersCount ? holdersCount : count,
        });
      });
    else {
      for (let index = numberOfDays; index > 0; index--) {
        let startTime = parseInt(
          moment().subtract(index, "days").valueOf() / 1000
        );
        resultArray.push({
          date: moment.unix(startTime).format("YYYY-MM-DD"),
          count: 0,
        });
      }
    }

    return resultArray;
  }


  async getHolderDetailsUsingAddress(req) {

    Utils.lhtLog("ContractManager:getHolderDetailsUsingAddress", "", "", "");
    let result = [];
    let address = req.body.address;
    address = address.toLowerCase();
    let tokenContract = req.body.tokenContract;
    tokenContract = tokenContract.toLowerCase();
    let skip = parseInt(req.body.skip);
    let limit = parseInt(req.body.limit);
    let queryStr;
    if (req.body.keywords) {
      queryStr = {
        $or: [
          { hash: { $regex: req.body.keywords.toLowerCase(), $options: "i" }, from: address },
          { hash: { $regex: req.body.keywords.toLowerCase(), $options: "i" }, to: address },
        ],
      };
    } else {
      queryStr = { $or: [{ from: address }, { to: address }] };
    }

    let holderDetails = await TokenHolderModel.findOne({ $and: [{ address: address }, { tokenContract: tokenContract }] });
    let holderTransactions;
    if (req.body.sortKey && Object.keys(req.body.sortKey)[0] === "value") {
      try {
        holderTransactions = await TransferTokenModel.aggregate([
          { $match: { $or: [{ from: address }, { to: address }] } },
          {
            $addFields: {
              "MyStringValueSize": { $strLenCP: "$value" }
            }
          },
          {
            $sort: {
              "MyStringValueSize": req.body.sortKey.value ? req.body.sortKey.value : -1,
              "value": req.body.sortKey.value ? req.body.sortKey.value : -1
            }
          },
          {
            $skip: skip
          },
          {
            $limit: limit
          }
        ])

      } catch (err) {


        holderTransactions = await TransferTokenModel.find(queryStr, {
          hash: 1,
          timestamp: 1,
          blockNumber: 1,
          from: 1,
          to: 1,
          value: 1,
        })
          .skip(skip)
          .limit(limit)
          .sort(req.body.sortKey ? req.body.sortKey : { value: -1 });
      }
    } else {
      holderTransactions = await TransferTokenModel.find(queryStr, {
        hash: 1,
        timestamp: 1,
        blockNumber: 1,
        from: 1,
        to: 1,
        value: 1,
      })
        .skip(skip)
        .limit(limit)
        .sort(req.body.sortKey ? req.body.sortKey : { value: -1 });
    }
    let holderTransactionsCount = await TransferTokenModel.countDocuments(
      queryStr
    );
    result.push({
      Holder_address: holderDetails && holderDetails.address,
      Holder_token_balance: holderDetails && holderDetails.balance,
      Total_transfes_transactions_Count: holderTransactionsCount,
      Contract_address: holderDetails && holderDetails.tokenContract,
      Transfers: JSON.stringify(holderTransactions),
    });
    return result;
  }

  async gettokenPriceUsingTimestamp(req) {

    Utils.lhtLog("ContractManager:gettokenPriceUsingTimestamp", "", "", "");
    let address = req.body.address;
    address = address.toLowerCase();
    let timestamp = req.body.timestamp;
    timestamp = timestamp * 1000
    let query = {
      $and: [
        {
          "timestamp": { $lte: timestamp }
        },
        {
          "tokenAddress": address
        }
      ]
    }
    let coinMarketData = await HistoryPriceModel.getHistoryPriceDataList(query, "", 0, 1, { timestamp: -1 })
    if (!coinMarketData || !coinMarketData.length) {
      coinMarketData = await HistoryPriceModel.getHistoryPriceDataList({ tokenAddress: address }, "", 0, 1, "")
    }
    return coinMarketData;
  }

  async getTokenUsingTokenNameAndAddress(reqObj) {
    Utils.lhtLog(
      "BLManager:getTokenUsingTokenNameAndAddress",
      "getTokenUsingTokenNameAndAddress",
      "",
      ""
    );
    let skip = 0;
    let limit = 0;
    let resultSet = [];
    try {
      if (reqObj.query.data) {
        if (reqObj && reqObj.query.skip) skip = parseInt(reqObj.query.skip);
        if (reqObj && reqObj.query.limit) limit = parseInt(reqObj.query.limit);

        resultSet = await ContractModel.aggregate([
          {
            $addFields: {
              tokenStatus: {
                $add: [
                  { $cond: [{ $ifNull: ["$compilerVersion", null] }, 1, 0] },
                  { $cond: [{ $ifNull: ["$sourceCode", null] }, 1, 0] },
                  { $cond: [{ $ifNull: ["$abi", null] }, 1, 0] },
                ],
              },
            },
          },
          {
            $match: {
              ERC: { $gt: 0 },
              $or: [
                {
                  address: {
                    $regex: reqObj.query.data.toLowerCase(),
                    $options: "i",
                  },
                },
                { tokenName: { $regex: reqObj.query.data, $options: "i" } },
                { symbol: { $regex: reqObj.query.data, $options: "i" } },
              ],
            },
          },
          {
            $lookup: {
              from: "xin-tokenholders",
              localField: "address",
              foreignField: "tokenContract",
              as: "tokenholders",
            },
          },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              address: 1,
              type: "XRC20",
              tokenName: 1,
              tokenHolders: { $size: "$tokenholders" },
              totalSupply: 1,
              symbol: 1,
              decimals: 1,
              status: {
                $cond: {
                  if: { $gte: ["$tokenStatus", 3] },
                  then: "verified",
                  else: "unverified",
                },
              },
            },
          },
        ]);
      }
    } catch (error) {
      console.log(error);
    }
    return { resultSet, total: resultSet.length };
  }

  async updateContracts(param, requestData) {
    Utils.lhtLog(
      "ContractManager:updateContracts",
      "updateContracts start",
      "",
      ""
    );
    let contractAddress = param.contractAddress.toLowerCase();
    let contractResponse = await ContractModel.getContract({
      address: contractAddress,
    });
    if (!contractResponse) throw `No address found`;
    return await ContractModel.updateContract(
      { address: contractAddress },
      {
        website: requestData.website ? requestData.website : "",
        twitter: requestData.twitter ? requestData.twitter : "",
        telegram: requestData.telegram ? requestData.telegram : "",
        tokenImage: requestData.symbolUrl ? requestData.symbolUrl : "",
        email: requestData.email ? requestData.email : "",
        linkedIn: requestData.linkedIn ? requestData.linkedIn : "",
        reddit: requestData.reddit ? requestData.reddit : "",
        coinGecko: requestData.coinGecko ? requestData.coinGecko : "",
        description: requestData.description ? requestData.description : "",
        facebook: requestData.facebook ? requestData.facebook : "",
      }
    );
  }
  async getTokenHashDetail(param) {
    Utils.lhtLog(
      "ContractManager:getTokenHashDetail",
      "getTokenHashDetail start",
      "",
      ""
    );
    let tokenHash = param.hash.toLowerCase();
    return await TransferTokenModel.getToken({ hash: tokenHash })
  }
  migrateTokenTransfer = async () => {
    let query = {
      ERC: { $gt: 0 },
    };
    let tokens = await ContractModel.find(query, {
      address: 1,
    });
    for (const token of tokens) {
      let totalTransfers = await TransferTokenModel.find({
        contract: token.address,
      }).count();
      await ContractModel.findOneAndUpdate(query, {
        transfers: {
          total: totalTransfers,
          last24Hour: 0,
          last3days: 0,
        },
      });
    }
    return true;
  };

  getContracts = async (request) => {
    const contracts = await ContractModel.find(request);
    if (!contracts || !contracts.length) throw `No contract found`;
    return contracts;
  }

}
