let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const HistoricalAccountSchema = new Schema({
    day: { type: String, default: Date.now() },
    accountCount: { type: Number, default: 0 },
    createdOn: { type: Number, default: Date.now() },
    modifiedOn: { type: Number, default: Date.now() },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
})

HistoricalAccountSchema.method({
    saveData: async function () {
        return await this.save();
    },
});

HistoricalAccountSchema.static({
    getHistoricalData: function (findQuery) {
        return this.findOne(findQuery);
    },

    updateHistoricalData: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnNewDocument: true,
        });
    },

    updateManyHistoricalData: function (findObj, updateObj) {
        return this.updateMany(findObj, updateObj);
    },
    getHistoricalDataList: function (findObj, selectionKey = "", skip = 0, limit = 0, sort = 1) {
        return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
    },
    bulkUpsert: function (bulkOps) {
        return this.bulkWrite(bulkOps);
    },
});
module.exports = mongoose.model("xin-historical-account", HistoricalAccountSchema);