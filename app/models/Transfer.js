let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const TokenTransferSchem = new Schema({
  hash: { type: String, default: "" },
  blockNumber: { type: Number, default: "" },
  method: { type: String, default: "" },
  from: { type: String, default: "" },
  to: { type: String, default: "" },
  contract: { type: String, default: "" },
  value: { type: String, default: "" },
  timestamp: { type: Number, default: "" },
  modifiedOn: { type: Number, default: Date.now() },
  createdOn: { type: Number, default: Date.now() },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

TokenTransferSchem.method({
  saveData: async function () {
    return await this.save();
  },
});
TokenTransferSchem.static({
  getToken: function (findQuery) {
    return this.findOne(findQuery);
  },
  updateToken: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },
  updateManyTokens: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getTokenList: function (
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
module.exports = mongoose.model("xin-transfertoken", TokenTransferSchem);
