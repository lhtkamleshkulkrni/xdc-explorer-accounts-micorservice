import moment from "moment";
import Contract from "../../models/Contract";
import Transfer from "../../models/Transfer";
import Web3 from "xdc3";
import Config from "../../../config";

export default class Manger {
  getTokenBalance = async (requestData) => {
    const contractDetail = await Contract.getContract({
      address: requestData.tokenAddress,
    });
    if (!contractDetail) {
      throw `No such contract found`;
    }
    let response = await Transfer.getTokenList({
      $and: [
        {
          timestamp: {
            $gte:
              requestData.type == "all"
                ? Math.round(contractDetail.createdOn / 1000)
                : requestData.from / 1000,
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
        "month"
      );
      for (let index = 0; index < period; index++) {
        let fromAmount = 0,
          toAmount = 0;
        const filtered = response.filter((item) => {
          item.timestamp = item.timestamp * 1000;
          if (getTimeCondition(item, requestData, index)) {
            return item;
          }
        });
        filtered.map((transaction) => {
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
          totalDocument: filtered.length,
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
}

function getTimeCondition(item, requestData, index) {
  return (
    moment(requestData.from).add(index, "days").startOf("day").valueOf() <=
      item.timestamp &&
    item.timestamp <=
      moment(requestData.to).add(index, "days").endOf("day").valueOf()
  );
}
