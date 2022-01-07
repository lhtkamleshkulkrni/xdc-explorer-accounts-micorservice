import Transfer from "../../models/Transfer";
import Contract from "../../models/Contract";
import TokenAnalytics from "../../models/tokenAnalytics";
import HistoryPrice from "../../models/historyPrice";
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

  async syncHistoryPriceData() {
    let contracts = await Contract.find({
      symbol: { $exists: true },
      isActive: true,
      isDeleted: false,
    });
    if (!contracts || !contracts.length) {
      return true;
    }
    let historyPriceData = await getHistoryPriceData(contracts);
    if (!historyPriceData || !historyPriceData.length) {
      return true;
    }
    await HistoryPrice.bulkWrite(historyPriceData);
    return true;
  }
}

async function generateAnalyticsData(responseData, startTime) {
  if (!responseData || !responseData.length) {
    return [];
  }
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
          doc.from,
          false
        );
        sentAmount += amount;
      } else {
        let senderIndex = uniqueSenders.findIndex(
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

export function updateUniqueAddress(
  uniqueAddress,
  amount,
  address,
  isRecieved
) {
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

    const URL = `${Config.COIN_MARKET_API_URL}/latest?symbol=${symbol}&CMC_PRO_API_KEY=${Config.CMC_API_KEY}&convert=${conversions[index]}`;
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

async function getHistoryPriceData(contracts) {
  const startTime = moment().subtract(1, "day").startOf("day").valueOf();
  const endTime = Math.round(
    moment().subtract(1, "day").endOf("day").valueOf() / 1000
  );
  let data = [];
  for (let index = 0; index < contracts.length; index++) {
    const selectedContract = contracts[index];
    if (!selectedContract.symbol) {
      continue;
    }
    // https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?symbol=ECOIN&CMC_PRO_API_KEY=cb190bb3-b61a-4d83-8559-374edbfb27b3&time_start=1641254400&time_end=1641254400
    const URL = `${Config.COIN_MARKET_API_URL}/historical?symbol=${
      selectedContract.symbol
    }&CMC_PRO_API_KEY=${Config.CMC_API_KEY}}&time_start=${
      startTime / 1000
    }&time_end=${endTime}`;
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
      response.status.error_message ||
      !response.data.quotes ||
      !response.data.quotes.length
    ) {
      continue;
    }
    const currentDateData =
      response.data.quotes[response.data.quotes.length - 1];
    const USDData = currentDateData.quote.USD;
    data.push({
      updateOne: {
        filter: {
          timestamp: startTime,
          tokenAddress: contracts[index].address,
        },
        update: {
          tokenAddress: contracts[index].address,
          openingTime: moment(currentDateData.time_open).valueOf(),
          closingTime: moment(currentDateData.time_close).valueOf(),
          highValueTime: moment(currentDateData.time_high).valueOf(),
          lowValueTime: moment(currentDateData.time_low).valueOf(),
          openingPrice: USDData.open,
          highestPrice: USDData.high,
          lowestPrice: USDData.low,
          closingPrice: USDData.close,
          volume: USDData.volume,
          marketCap: USDData.market_data,
          timestamp: moment(currentDateData.timestamp).valueOf(),
        },
      },
    });
  }
  return data;
}

// &convert=INR

// let data = {
//   data: {
//     id: 1,
//     name: "Bitcoin",
//     symbol: "BTC",
//     quotes: [
//       {
//         time_open: "2019-01-03T00:00:00.000Z",
//         time_close: "2019-01-03T23:59:59.999Z",
//         time_high: "2019-01-02T03:53:00.000Z",
//         time_low: "2019-01-02T02:43:00.000Z",
//         quote: {
//           USD: {
//             open: 3931.04863841,
//             high: 3935.68513083,
//             low: 3826.22287069,
//             close: 3836.74131867,
//             volume: 4530215218.84018,
//             market_cap: 66994920902.7202,
//             timestamp: "2019-01-03T23:59:59.999Z",
//           },
//         },
//       },
//     ],
//   },
//   status: {
//     timestamp: "2022-01-04T04:45:08.158Z",
//     error_code: 0,
//     error_message: "",
//     elapsed: 10,
//     credit_count: 1,
//   },
// };
