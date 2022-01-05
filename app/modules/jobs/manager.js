import Transfer from "../../models/Transfer";
import Contract from "../../models/Contract";
import TokenAnalytics from "../../models/tokenAnalytics";
import Config from "../../../config";
import moment from "moment";
import HTTPService from "../../service/http-service";
import { httpConstants } from "../../common/constants";
export default class BLManager {
  async generateTokenAnalytics() {
    let startTime = moment().subtract(1, "day").startOf("day").valueOf(),
      endTime = moment().subtract(1, "day").endOf("day").valueOf();

    let query = [
      {
        $match: {
          $and: [
            { timestamp: { $gte: startTime / 1000 } },
            { timestamp: { $lte: endTime / 1000 } },
          ],
        },
      },
      { $group: { _id: "$contract", data: { $push: "$$ROOT" } } },
    ];
    let response = await Transfer.aggregate(query);
    let analyticsData = await generateAnalyticsData(response, startTime);
    if (!analyticsData || !analyticsData.length) {
      return true;
    }
    await TokenAnalytics.bulkWrite(analyticsData);
    return true;
  }
}

async function generateAnalyticsData(responseData, startTime) {
  let data = [];
  for (const element of responseData) {
    let contractDetails = await Contract.getContract({ address: element._id });
    if (!contractDetails) {
      continue;
    }
    let sentAmount = 0,
      receivedAmount = 0,
      uniqueSenders = [],
      uniqueAddress = [],
      uniqueReceivers = [];

    for (let doc of element.data) {
      const amount = !isNaN(Number(doc.value)) ? Number(doc.value) : 0;
      if (doc.from == element._id) {
        let recieverIndex = uniqueReceivers.findIndex(
          (item) => item.reciever == doc.from
        );
        if (recieverIndex === -1) {
          uniqueReceivers.push({
            reciever: doc.from,
            amount,
          });
        } else {
          uniqueReceivers[recieverIndex].amount += amount;
        }
        uniqueAddress = updateUniqueAddress(
          uniqueAddress,
          -amount,
          doc.from,
          false
        );
        sentAmount += amount;
      } else {
        let senderIndex = uniqueSenders.findIndex(
          (item) => item.sender == doc.to
        );
        if (senderIndex === -1) {
          uniqueSenders.push({
            sender: doc.to,
            amount,
          });
        } else {
          uniqueSenders[senderIndex].amount += amount;
        }
        uniqueAddress = updateUniqueAddress(
          uniqueAddress,
          amount,
          doc.to,
          true
        );
        receivedAmount += amount;
      }
    }

    data.push({
      updateOne: {
        filter: {
          addedOn: startTime,
          tokenAddress: element._id,
        },
        update: {
          transactionCount: element.data.length,
          sentAmount,
          receivedAmount,
          totalTransferTokens: sentAmount + receivedAmount,
          uniqueSenders: uniqueSenders.length,
          uniqueReceivers: uniqueReceivers.length,
          uniqueAddress: uniqueAddress.length,
          addedOn: startTime,
        },
        upsert: true,
      },
    });
  }
  return data;
}

function updateUniqueAddress(uniqueAddress, amount, address, isRecieved) {
  let uniqueAdreesIndex = uniqueAddress.findIndex(
    (item) => item.address == address
  );
  if (uniqueAdreesIndex === -1) {
    uniqueAddress.push({
      address,
      // amount,
      // totalInBoundTransferCount: isRecieved ? 1 : 0,
      // totalOutBoundTransferCount: isRecieved ? 0 : 1,
      // totalTransferCount: 1,
    });
  }
  // } else {
  //   uniqueAddress[uniqueAdreesIndex].amount += amount;
  //   uniqueAddress[uniqueAdreesIndex].totalTransferCount += 1;
  //   uniqueAddress[uniqueAdreesIndex].totalOutBoundTransferCount += isRecieved
  //     ? 0
  //     : 1;
  //   uniqueAddress[uniqueAdreesIndex].totalInBoundTransferCount += isRecieved
  //     ? 1
  //     : 0;
  // }
  return uniqueAddress;
}

async function getMarketCapData(symbol) {
  let conversions = ["INR", "USD", "EUR"];
  let coinMarketData = {};
  for (let index = 0; index < conversions.length; index++) {
    if (!symbol) {
      coinMarketData[conversions[index]] = {};
      continue;
    }

    const URL = `${Config.COIN_MARKET_API_URL}?symbol=${symbol}&CMC_PRO_API_KEY=${Config.CMC_API_KEY}&convert=${conversions[index]}`;
    let response = await HTTPService.executeHTTPRequest(
      httpConstants.METHOD_TYPE.GET,
      URL,
      "",
      {},
      {
        "Content-Type": httpConstants.HEADER_TYPE.APPLICATION_JSON,
      }
    );
    if (
      !response ||
      !response.status ||
      !response.data[symbol] ||
      response.status.error_message
    ) {
      coinMarketData[conversions[index]] = {};
      continue;
    }
    coinMarketData[conversions[index]] = response.data[symbol];
  }
  return coinMarketData;
}
// &convert=INR
