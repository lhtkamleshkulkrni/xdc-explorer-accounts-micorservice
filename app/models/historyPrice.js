import { Schema, model } from "mongoose";

const HistoryPriceData = new Schema({
  tokenAddress: { type: String, default: "" },
  openingTime: { type: Number, default: 0 },
  closingTime: { type: Number, default: 0 },
  highValueTime: { type: Number, default: 0 },
  lowValueTime: { type: Number, default: 0 },

  openingPrice: { type: Number, default: 0 },
  highestPrice: { type: Number, default: 0 },
  lowestPrice: { type: Number, default: 0 },
  closingPrice: { type: Number, default: 0 },

  volume: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },

  timestamp: { type: Number, default: 0 },
});

HistoryPriceData.method({
  saveData: async function () {
    return await this.save();
  },
});
HistoryPriceData.static({
  updateDocuments: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },

  updateManyDocuments: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getHistoryPriceDataList: function (
    findObj,
    selectionKey = "",
    skip = 0,
    limit = 0,
    sort = { createdOn: -1 }
  ) {
    return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
  },
});
module.exports = model("xin-history-prices", HistoryPriceData);
