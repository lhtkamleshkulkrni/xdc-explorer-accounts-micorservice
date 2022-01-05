import { Schema, model } from "mongoose";

const TokenAnalytics = new Schema({
  tokenAddress: { type: String, default: "" },
  transactionCount: { type: Number, default: 0 },

  sentAmount: { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 },
  totalTransferTokens: { type: Number, default: 0 },
  tokenBalance: { type: Number, default: 0 },

  uniqueSender: { type: Number, default: 0 },
  uniqueReceiver: { type: Number, default: 0 },
  uniqueAddress: { type: Number, default: 0 },

  addedOn: { type: Number, default: Date.now() },
});

TokenAnalytics.method({
  saveData: async function () {
    return await this.save();
  },
});
TokenAnalytics.static({
  updateDocuments: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },

  updateManyDocuments: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getTokenAnalyticsList: function (
    findObj,
    selectionKey = "",
    skip = 0,
    limit = 0,
    sort = { createdOn: -1 }
  ) {
    return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
  },
});
module.exports = model("xin-token-analytics", TokenAnalytics);
