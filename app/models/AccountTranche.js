let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const AccountTrancheSchema = new Schema({
    balanceFrom: { type: Number, default: 0 },
    balanceTo: { type: Number, default: 0 },
    accounts: { type: Number, default: 0 },
    usdBalance: { type: Number, default: 0 },
    xdcBalance: { type: Number, default: 0 },
});

AccountTrancheSchema.method({
  saveData: async function () {
    return await this.save();
  },
});
AccountTrancheSchema.static({
    getAccountByTranche: function () {
    return this.find({}).sort({"balanceFrom":1});
  },
  updateAccount: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },
});
module.exports = mongoose.model("xin-tranche", AccountTrancheSchema);
