import moment from "moment";
import Contract from "../../models/Contract";
import Transfer from "../../models/Transfer";
import Web3 from "xdc3";
import Config from "../../../config";
import Utility from "../../utils";

export default class Manger {
  getTokenBalance = async (requestData) => {
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

  filterDataFromStartAndEndTime(request, index, requestData) {
    const startTimeStamp =
      moment(requestData.from).add(index, "days").startOf("day").valueOf() /
      1000;
    const endTimeStamp =
      moment(requestData.from).add(index, "days").endOf("day").valueOf() / 1000;
    let response = [];
    let filtered = [];
    request.map((data) => {
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
}
