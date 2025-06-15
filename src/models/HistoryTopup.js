const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const historyTopupSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

historyTopupSchema.plugin(mongoose_delete, { overrideMethods: "all" });

const HistoryTopup = mongoose.model("HistoryTopup", historyTopupSchema);
module.exports = HistoryTopup;
