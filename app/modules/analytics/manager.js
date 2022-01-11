import moment from "moment";
import Contract from "../../models/Contract";
import Transfer from "../../models/Transfer";
import Accounts from "../../models/Account";
import TokenInfo from "../../models/tokenInfo";
import TokenAnalytics from "../../models/tokenAnalytics";
import HistoryPrice from "../../models/historyPrice";
import Web3 from "xdc3";
import Config from "../../../config";
import { model, Schema } from "mongoose";
import { AnalyticsDataType } from "../../common/constants";
import { updateUniqueAddress } from "../jobs/manager";
const Transactions = model("xin-transactions", new Schema({}));
const CoinMarketExchanges = model("xin-coin-market-exchanges", new Schema({}));

export default class Manger {
  getTokenBalance = async (requestData) => {
    let tokenAddress=requestData.tokenAddress.toLowerCase();
    const contractDetail = await Contract.getContract({
      address: tokenAddress,
    });
    if (!contractDetail) {
      throw `No such contract found`;
    }
    let startTime = requestData.from / 1000;
    if (requestData.type == "all") {
      startTime = Math.round(contractDetail.createdOn / 1000);
      requestData.from = contractDetail.createdOn;
    }

    let response = await Transfer.getTokenList(
      {
        $and: [
          {
            timestamp: {
              $gte: startTime,
            },
          },
          {
            timestamp: {
              $lte: requestData.to / 1000,
            },
          },
        ],
        $or: [
          {
            from: requestData.walletAddress,
          },
          {
            to: requestData.walletAddress,
          },
        ],
      },
      {
        timestamp: 1,
        from: 1,
        to: 1,
        contract: 1,
        value: 1,
      }
    );
    let data = [];
    let totalBalance = await this.getBalance(
      requestData.tokenAddress,
      requestData.walletAddress
    );
    let currentBalance = totalBalance;
    if (response && response.length) {
      let period = moment(requestData.to).diff(
        moment(requestData.from),
        "days"
      );
      for (let index = 0; index < period; index++) {
        let fromAmount = 0,
          toAmount = 0;
        // response.map((item, ind) => {
        //   if (getTimeCondition(item, requestData, index)) {
        //     filtered.push(item);
        //     // response.splice(ind, 1);
        //   }
        // });
        let filteredData = this.filterDataFromStartAndEndTime(
          response,
          index,
          requestData
        );
        response = filteredData.response;
        if (!filteredData.filtered || !filteredData.filtered.length) {
          continue;
        }
        filteredData.filtered.map((transaction) => {
          transaction = transaction._doc;
          if (transaction.from == requestData.walletAddress) {
            fromAmount += Number(transaction.value);
          } else {
            toAmount += Number(transaction.value);
          }
        });
        currentBalance = currentBalance + toAmount - fromAmount;
        data.push({
          date: moment(requestData.from).add(index, "days").valueOf(),
          toAmount,
          fromAmount,
          totalDocument: filteredData.filtered.length,
          totalAmount: toAmount + fromAmount,
          currentBalance,
        });
      }
    }

    return { data, totalBalance };
  };

  getBalance = async (contractAddress, tokenAddress) => {
    const web3 = new Web3(Config.WEBSOCKET_URL);
    let ERC20ABI = require("../../../jsonInterface").minABI;
    const token = new web3.eth.Contract(ERC20ABI, contractAddress);
    return token.methods.balanceOf(tokenAddress).call();
  };

  getTokenTransferCount = async (requestData) => {
    const contractDetail = await Contract.getContract({
      address: requestData.tokenAddress,
    });
    if (!contractDetail) {
      throw `No such contract found`;
    }
    let startTime = requestData.from / 1000;
    if (requestData.type == "all") {
      startTime = Math.round(contractDetail.createdOn / 1000);
      requestData.from = contractDetail.createdOn;
    }

    let response = await Transfer.getTokenList({
      $and: [
        {
          timestamp: {
            $gte: startTime,
          },
        },
        {
          timestamp: {
            $lte: requestData.to / 1000,
          },
        },
      ],
      contract: requestData.tokenAddress,
      from: { $nin: [requestData.tokenAddress] },
      to: { $nin: [requestData.tokenAddress] },
      $or: [
        {
          from: requestData.walletAddress,
        },
        {
          to: requestData.walletAddress,
        },
      ],
    });
    let data = [];
    if (response && response.length) {
      let period = moment(requestData.to).diff(
        moment(requestData.from),
        "days"
      );
      for (let index = 0; index < period; index++) {
        let inBoundTransfer = 0,
          outBoundTransfer = 0,
          uniqueAddressesSent = [],
          uniqueAddressReceived = [];
        let filteredData = this.filterDataFromStartAndEndTime(
          response,
          index,
          requestData
        );
        response = filteredData.response;
        if (!filteredData.filtered || !filteredData.filtered.length) {
          continue;
        }
        filteredData.filtered.map((transaction) => {
          transaction = transaction._doc;
          if (
            transaction.from == requestData.walletAddress &&
            transaction.to !== requestData.tokenAddress
          ) {
            outBoundTransfer += 1;
            if (
              uniqueAddressesSent.findIndex((item) => item == transaction.to) ==
              -1
            ) {
              uniqueAddressesSent.push(transaction.to);
            }
          } else if (
            transaction.to == requestData.walletAddress &&
            transaction.from !== requestData.tokenAddress
          ) {
            inBoundTransfer += 1;
            if (
              uniqueAddressReceived.findIndex(
                (item) => item == transaction.from
              ) == -1
            ) {
              uniqueAddressReceived.push(transaction.from);
            }
          }
        });
        data.push({
          uniqueAddressReceived: uniqueAddressReceived.length,
          uniqueAddressesSent: uniqueAddressesSent.length,
          outBoundTransfer,
          inBoundTransfer,
          totalTransfers: outBoundTransfer + inBoundTransfer,
          date: moment(requestData.from)
            .add(index, "days")
            .startOf("day")
            .valueOf(),
        });
      }
    }
    return data;
  };

  filterDataFromStartAndEndTime(request, index, requestData, isDoc = false) {
    const startTimeStamp =
      moment(requestData.from).add(index, "days").startOf("day").valueOf() /
      1000;
    const endTimeStamp =
      moment(requestData.from).add(index, "days").endOf("day").valueOf() / 1000;
    let response = [];
    let filtered = [];
    request.map((data) => {
      data = isDoc ? data._doc : data;
      if (data.timestamp >= startTimeStamp && data.timestamp <= endTimeStamp) {
        filtered.push(data);
      } else {
        response.push(data);
      }
      return data;
    });

    return {
      filtered,
      response,
    };
  }

  getTokenOverview = async (requestData) => {
    // let requestData = {
    //   tokenAddress: "xdc536dd70445cea1e97f9bf1bada04cbda5199a2a1",
    //   startTime: moment().startOf("day").valueOf(),
    //   endTime: moment().endOf("day").valueOf(),
    // };
    return TokenAnalytics.getTokenAnalyticsList({
      $and: [
        {
          addedOn: {
            $gte: requestData.startTime,
          },
        },
        {
          addedOn: {
            $lte: requestData.endTime,
          },
        },
      ],
      tokenAddress: requestData.tokenAddress,
    });
  };

  getHistoryPrice = async (requestData) => {
    // let requestData = {
    //   tokenAddress: "xdc536dd70445cea1e97f9bf1bada04cbda5199a2a1",
    //   startTime: moment().startOf("month").valueOf(),
    //   endTime: moment().endOf("month").valueOf(),
    // };
    return HistoryPrice.getHistoryPriceDataList({
      $and: [
        {
          timestamp: {
            $gte: requestData.startTime,
          },
        },
        {
          timestamp: {
            $lte: requestData.endTime,
          },
        },
      ],
      tokenAddress: requestData.tokenAddress,
    });
  };

  getAddressAnalytics = async (requestData) => {
    const findObj = {
      $and: [
        { timestamp: { $gte: requestData.from / 1000 } },
        { timestamp: { $lte: requestData.to / 1000 } },
      ],
      $or: [{ from: requestData.address }, { to: requestData.address }],
      timestamp: { $exists: true },
    };
    if (requestData.type == AnalyticsDataType.XDC_TRANSACTIONS) {
      return this.getTransactionAnalyticsData(findObj, requestData);
    }
    if (requestData.type == AnalyticsDataType.TOKEN_TRANSFER) {
      return this.getTokenAnalyticsDataForAddress(findObj, requestData);
    }
    if (requestData.type == AnalyticsDataType.XDC_BALANCE) {
      return this.getAddressBalanceAnalytics(requestData);
    }
    return `invalid value for type`;
  };

  getTransactionAnalyticsData = async (findObj, requestData) => {
    let response = await Transactions.find(findObj, {
      timestamp: 1,
      from: 1,
      to: 1,
      gas: 1,
      gasPrice: 1,
      value: 1,
    });
    if (!response || !response.length) {
      return [];
    }
    let data = [],
      totalFeesSpent = 0,
      isDoc = true,
      totalFeesUsed = 0;
    let period = moment(requestData.to).diff(moment(requestData.from), "days");
    for (let index = 0; index < period; index++) {
      let receivedAddresses = [],
        sentAmount = 0,
        receivedAmount = 0,
        feesSpent = 0,
        feesUsed = 0,
        sentAddresses = [];
      let filteredData = this.filterDataFromStartAndEndTime(
        response,
        index,
        requestData,
        isDoc
      );
      isDoc = false;

      response = filteredData.response;
      if (!filteredData.filtered || !filteredData.filtered.length) {
        continue;
      }
      filteredData.filtered.map((transaction) => {
        const amount = !isNaN(Number(transaction.value))
          ? Number(transaction.value)
          : 0;

        if (transaction.from == requestData.address) {
          feesSpent += !isNaN(Number(transaction.gasPrice))
            ? Number(transaction.gasPrice)
            : 0;
          sentAmount += amount;
          if (
            sentAddresses.findIndex((item) => item.address == transaction.to) ==
            -1
          )
            sentAddresses.push({ address: transaction.to });
          totalFeesSpent += feesSpent;
        } else {
          feesUsed += !isNaN(Number(transaction.gasUsed))
            ? Number(transaction.gasUsed)
            : 0;
          receivedAmount += amount;
          totalFeesUsed += feesUsed;
          if (
            receivedAddresses.findIndex(
              (item) => item.address == transaction.from
            ) == -1
          )
            receivedAddresses.push({ address: transaction.from });
        }
      });

      data.push({
        date: moment(requestData.from).add(index, "days").valueOf(),
        sentAmount,
        receivedAmount,
        sentAddresses: sentAddresses.length,
        receivedAddresses: receivedAddresses.length,
        feesUsed,
        feesSpent,
        totalTransactions: filteredData.filtered.length,
      });
    }
    // return { data, totalFeesSpent, totalFeesUsed };
    return data;
  };

  getTokenAnalyticsDataForAddress = async (findObj, requestData) => {
    let response = await Transfer.getTokenList(findObj, {
      timestamp: 1,
      from: 1,
      to: 1,
      contract: 1,
      value: 1,
    });
    if (!response || !response.length) {
      return [];
    }
    let data = [];
    let period = moment(requestData.to).diff(moment(requestData.from), "days");
    for (let index = 0; index < period; index++) {
      let sentAmount = 0,
        receivedAmount = 0,
        uniqueSenders = [],
        uniqueAddress = [],
        inBoundTransfers = 0,
        outBoundTransfers = 0,
        contracts = [],
        uniqueReceivers = [];

      let filteredData = this.filterDataFromStartAndEndTime(
        response,
        index,
        requestData
      );

      response = filteredData.response;
      if (!filteredData.filtered || !filteredData.filtered.length) {
        continue;
      }

      for (let doc of filteredData.filtered) {
        const amount = !isNaN(Number(doc.value)) ? Number(doc.value) : 0;
        contracts = updateContracts(contracts, doc, amount);

        if (doc.from == requestData.address) {
          const recieverIndex = uniqueReceivers.findIndex(
            (item) => item.reciever == doc.to
          );
          if (recieverIndex === -1) {
            uniqueReceivers.push({
              reciever: doc.to,
              amount,
            });
          } else {
            uniqueReceivers[recieverIndex].amount += amount;
          }
          uniqueAddress = updateUniqueAddress(
            uniqueAddress,
            -amount,
            doc.to,
            false
          );
          sentAmount += amount;
          outBoundTransfers += 1;
        } else {
          const senderIndex = uniqueSenders.findIndex(
            (item) => item.sender == doc.from
          );
          if (senderIndex === -1) {
            uniqueSenders.push({
              sender: doc.from,
              amount,
            });
          } else {
            uniqueSenders[senderIndex].amount += amount;
          }

          uniqueAddress = updateUniqueAddress(
            uniqueAddress,
            amount,
            doc.from,
            true
          );
          receivedAmount += amount;
          inBoundTransfers += 1;
        }
      }

      data.push({
        transfersCount: filteredData.filtered.length,
        sentAmount,
        receivedAmount,
        inBoundTransfers,
        outBoundTransfers,
        contracts,
        totalTransferTokens: sentAmount + receivedAmount,
        uniqueSenders: uniqueSenders.length,
        uniqueReceivers: uniqueReceivers.length,
        uniqueAddress: uniqueAddress.length,
        addedOn: moment(requestData.from).add(index, "days").valueOf(),
      });
    }
    return data;
  };

  getAddressBalanceAnalytics = async (requestData) => {
    if (!requestData.currency) {
      throw `Currency is misssing from the request`;
    }
    let response = await Transactions.find(
      {
        $and: [
          {
            timestamp: {
              $gte: requestData.from / 1000,
            },
          },
          {
            timestamp: {
              $lte: requestData.to / 1000,
            },
          },
        ],
        $or: [
          {
            from: requestData.address,
          },
          {
            to: requestData.address,
          },
        ],
      },
      {
        timestamp: 1,
        from: 1,
        to: 1,
        contract: 1,
        value: 1,
      }
    );
    if (!response || !response.length) {
      return [];
    }
    let data = [];
    let totalBalance = await Accounts.getAccountList(
      { address: requestData.address },
      { address: 1, balance: 1 }
    );
    if (!totalBalance || !totalBalance.length) {
      return [];
    }
    let currentBalance = totalBalance[totalBalance.length - 1].balance,
      isDoc = true;

    let period = moment(requestData.to).diff(moment(requestData.from), "days");
    for (let index = 0; index < period; index++) {
      const startDate = moment(requestData.from)
        .add(index, "days")
        .startOf("day")
        .valueOf();
      const endDate = moment(requestData.from)
        .add(index, "days")
        .endOf("day")
        .valueOf();

      let fromAmount = 0,
        toAmount = 0;

      let filteredData = this.filterDataFromStartAndEndTime(
        response,
        index,
        requestData,
        isDoc
      );
      isDoc = false;
      response = filteredData.response;
      if (!filteredData.filtered || !filteredData.filtered.length) {
        continue;
      }
      let coinMarketData = await CoinMarketExchanges.find(
        {
          symbol: "XDC",
          fiatValue: requestData.currency,
          $and: [
            {
              lastUpdated: {
                $gte: startDate / 1000,
              },
            },
            {
              lastUpdated: {
                $lte: endDate / 1000,
              },
            },
          ],
        },
        { price: 1 }
      )
        .sort({ lastUpdated: -1 })
        .limit(1);
      if (!coinMarketData || !coinMarketData.length) {
        continue;
      }
      coinMarketData = coinMarketData[coinMarketData.length - 1]._doc;
      // let currentBalance = coinMarketData.price;

      filteredData.filtered.map((transaction) => {
        if (transaction.from == requestData.address) {
          fromAmount += Number(transaction.value);
        } else {
          toAmount += Number(transaction.value);
        }
      });
      currentBalance = currentBalance + toAmount - fromAmount;
      data.push({
        date: startDate,
        toAmount,
        fromAmount,
        totalDocument: filteredData.filtered.length,
        totalAmount: toAmount + fromAmount,
        currentBalance,
        priceInUSD: coinMarketData.price,
      });
    }

    return data;
  };

  getTokenInfo = (requestData) => {
    return TokenInfo.getTokenInfo({ symbol: requestData.symbol });
  };
}

function updateContracts(contracts, doc, amount) {
  const contractIndex = contracts.findIndex(
    (item) => item.contract == doc.contract
  );
  const isSent = doc.from == doc.contract;
  if (contractIndex === -1) {
    contracts.push({
      contract: doc.contract,
      sentAmount: isSent ? amount : 0,
      recievedAmount: !isSent ? amount : 0,
    });
  } else {
    contracts[contractIndex].sentAmount = isSent ? amount : 0;
    contracts[contractIndex].recievedAmount = !isSent ? amount : 0;
  }
  return contracts;
}
