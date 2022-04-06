import Transfer from "../../models/Transfer";
import Contract from "../../models/Contract";
import CoinMasterModel from "../../models/coinMaster";
import AccountTrancheModel from "../../models/AccountTranche";
import AccountModel from "../../models/Account";
import TokenAnalytics from "../../models/tokenAnalytics";
import HistoryPrice from "../../models/historyPrice";
import TokenInfo from "../../models/tokenInfo";
import Config from "../../../config";
import moment from "moment";
import HTTPService from "../../service/http-service";
import { httpConstants } from "../../common/constants";
export default class BLManager {
  async syncAccountByTranche() {
    let usdPrice = await CoinMasterModel.getCoinMarketCapList(
      {
        fiatValue: "USD",
      },
      "",
      0,
      1,
      { _id: -1 }
    );
    let latestUsdPrice = usdPrice[0].quote[0].USD.price;
    let rangeArray = [
      { balanceFrom: 0, balanceTo: 4999 },
      { balanceFrom: 5000, balanceTo: 9999 },
      { balanceFrom: 10000, balanceTo: 24999 },
      { balanceFrom: 25000, balanceTo: 49999 },
      { balanceFrom: 50000, balanceTo: 74999 },
      { balanceFrom: 75000, balanceTo: 99999 },
      { balanceFrom: 100000, balanceTo: 249999 },
      { balanceFrom: 250000, balanceTo: 499999 },
      { balanceFrom: 500000, balanceTo: 999999 },
      { balanceFrom: 1000000, balanceTo: 1999999 },
      { balanceFrom: 2000000, balanceTo: 2999999 },
      { balanceFrom: 3000000, balanceTo: 3999999 },
      { balanceFrom: 4000000, balanceTo: 4999999 },
      { balanceFrom: 5000000, balanceTo: 9999999 },
      { balanceFrom: 10000000, balanceTo: 19999999 },
      { balanceFrom: 20000000, balanceTo: 49999999 },
      { balanceFrom: 50000000, balanceTo: 99999999 },
      { balanceFrom: 100000000, balanceTo: 499999999 },
      { balanceFrom: 500000000, balanceTo: 999999999 },
      { balanceFrom: 1000000000, balanceTo: null },
    ];
    let wei = 1000000000000000000;
    for (let index = 0; index < rangeArray.length; index++) {
      let balanceFrom = rangeArray[index].balanceFrom;
      let balanceTo = rangeArray[index].balanceTo;
      let findObj =
        index == rangeArray.length - 1
          ? { balance: { $gte: balanceFrom * wei } }
          : { balance: { $gte: balanceFrom * wei, $lte: balanceTo * wei } };
      let response = await AccountModel.aggregate([
        {
          $match: findObj,
        },
        {
          $group: {
            _id: null,
            xdcBalance: { $sum: "$balance" },
            accounts: { $sum: 1 },
          },
        },
      ]);
      let findObjTranche =
        index == rangeArray.length - 1
          ? { balanceFrom: balanceFrom }
          : { balanceFrom: balanceFrom, balanceTo: balanceTo };
      let updateObj =
        response && response.length > 0
          ? {
              accounts: response[0].accounts,
              xdcBalance: response[0].xdcBalance/wei,
              usdBalance: (response[0].xdcBalance * latestUsdPrice)/wei,
            }
          : {};
      await AccountTrancheModel.findOneAndUpdate(findObjTranche, updateObj);
    }
  }
  async generateTokenAnalytics() {
    let startTime = moment().subtract(1,"hour").valueOf(),
      endTime = moment().valueOf();

    let query = [
      {
        $match: {
          $and: [
            { timestamp: { $gte: startTime / 1000 } },
            { timestamp: { $lte: endTime / 1000 } },
          ],
        },
      },
      { $group: { _id: "$contract", data: { $push: {to:"$to",from:"$from",value:"$value"} } } },
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
    let contracts = await Contract.aggregate([
      {
        $match: {
          ERC: { $gt: 0 },
          symbol: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$symbol",
          address: { $first: "$address" },
        },
      },
    ]);
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

  async syncTokenInfo() {
    let contracts = await Contract.aggregate([
      {
        $match: {
          ERC: { $gt: 0 },
          symbol: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$symbol",
          address: { $first: "$address" },
        },
      },
    ]);
    if (!contracts || !contracts.length) {
      return true;
    }
    let tokenInfoData = await getTokenInfo(contracts);
    if (!tokenInfoData || !tokenInfoData.length) {
      return true;
    }
    await TokenInfo.bulkWrite(tokenInfoData);
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

    const URL = `${Config.COIN_MARKET_API_URL}/quotes/latest?symbol=${symbol}&CMC_PRO_API_KEY=${Config.CMC_API_KEY}&convert=${conversions[index]}`;
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
    const startTime = moment()
    .subtract(3, "days")
    .format("YYYY-MM-DD")
    const endTime = moment().subtract(2, "day").endOf("day").format("YYYY-MM-DD");
    let data = [];
    for (let index = 0; index < 1; index++) {
      const selectedContract = contracts[index];
      if (!selectedContract || !selectedContract._id) {
        continue;
      }
      const URI = `${Config.COIN_MARKET_API_URL}/ohlcv/historical?symbol=${
        selectedContract._id
      }&CMC_PRO_API_KEY=${Config.CMC_API_KEY}&time_start=${startTime}&time_end=${endTime}`;
      const URL = encodeURI(URI);
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
      const currentDateData = response.data.quotes[response.data.quotes.length - 1];
      const USDData = currentDateData.quote.USD;
      
      data.push({
        updateOne: {
          filter: {
            timestamp: moment(USDData.timestamp).valueOf(),
            tokenAddress: selectedContract.address,
          },
          update: {
            tokenAddress: selectedContract.address,
            openingTime: moment(currentDateData.time_open).valueOf(),
            closingTime: moment(currentDateData.time_close).valueOf(),
            highValueTime: moment(currentDateData.time_high).valueOf(),
            lowValueTime: moment(currentDateData.time_low).valueOf(),
            openingPrice: USDData.open,
            highestPrice: USDData.high,
            lowestPrice: USDData.low,
            closingPrice: USDData.close,
            volume: USDData.volume,
            marketCap: USDData.market_cap,
            timestamp: moment(USDData.timestamp).valueOf(),
          },
          upsert: true,
        },
      });
    return data;
  }
 
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

async function getTokenInfo(contracts) {
  let data = [];
  for (let index = 0; index < contracts.length; index++) {
    const selectedContract = contracts[index];
    if (!selectedContract || !selectedContract._id) {
      continue;
    }

    const URI = `${Config.COIN_MARKET_API_URL}/quotes/latest?symbol=${selectedContract._id}&CMC_PRO_API_KEY=${Config.CMC_API_KEY}`;
    const URL = encodeURI(URI);
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
      !response.data ||
      !response.data[selectedContract._id]
    ) {
      continue;
    }

    const info = response.data[selectedContract._id];
    data.push({
      updateOne: {
        filter: {
          symbol: info.symbol,
          tokenAddress: selectedContract.address,
        },
        update: {
          tokenAddress: selectedContract.address,
          symbol: info.symbol,
          name: info.name,
          slug: info.slug,
          numMarketPairs: info.num_market_pairs,
          isFiat: info.is_fiat,
          cmcRank: info.cmc_rank,

          circulatingSupply: info.circulating_supply,
          totalSupply: info.total_supply,
          maxSupply: info.max_supply,
          quote: info.quote,
          tags: info.tags,
          platform: info.platform,
          isActive: info.is_active,

          modifiedOn: moment(info.last_updated).valueOf(),
          createdOn: moment(info.date_added).valueOf(),
        },
        upsert: true,
      },
    });
    
  }
  return data;
}
