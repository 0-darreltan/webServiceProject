const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const historyPlaySchema = new mongoose.Schema(
  {
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalPower1: {
      type: Number,
    },
    totalPower2: {
      type: Number,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

historyPlaySchema.plugin(mongoose_delete, { overrideMethods: "all" });

const HistoryPlay = mongoose.model("HistoryPlay", historyPlaySchema);
module.exports = HistoryPlay;
