import { Schema, model } from "mongoose";

const TokenInfo = new Schema({
  tokenAddress: { type: String, default: "" },
  symbol: { type: String, default: "" },
  name: { type: String, default: "" },
  slug: { type: String, default: "" },
  numMarketPairs: { type: Number, default: 0 },

  circulatingSupply: { type: Number, default: 0 },
  totalSupply: { type: Number, default: 0 },
  maxSupply: { type: Number, default: 0 },

  cmcRank: { type: Number, default: 0 },
  isFiat: { type: Number, default: 0 },
  quote: { type: Object, default: {} },

  tags: { type: Array, default: [] },
  platform: { type: Array, default: [] },

  dateAdded: { type: Number, default: 0 },
  modifiedOn: { type: Number, default: 0 },
  isActive: { type: Number, default: 0 },
});

TokenInfo.method({
  saveData: async function () {
    return await this.save();
  },
});
TokenInfo.static({
  getTokenInfo: function (findQuery) {
    return this.findOne(findQuery);
  },
  updateTokenInfo: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },
  updateManyTokensInfo: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getTokenInfo: function (
    findObj,
    selectionKey = "",
    skip = 0,
    limit = 0,
    sort = { createdOn: -1 }
  ) {
    return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
  },
  bulkUpsert: function (bulkOps) {
    return this.bulkWrite(bulkOps);
  },
});

module.exports = model("xin-token-infos", TokenInfo);
