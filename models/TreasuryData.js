const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TreasuryDataSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    date: { type: Date, required: true },
    two_year_yield: { type: Number, required: true },
    ten_year_yield: { type: Number, required: true },
  });

// check the model has not already been defined before recreating it, otherwise next.js tries to overwrite the model and ann error throws
module.exports = mongoose.models.TreasuryData || mongoose.model("TreasuryData", TreasuryDataSchema);