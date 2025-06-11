const mongoose = require("mongoose");

const leaderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama leader tidak boleh kosong"],
    },
    effect: {
      type: String,
      required: [true, "Effect tidak boleh kosong"],
    },
    faction: {
      type: String,
      required: [true, "Faksi tidak boleh kosong"],
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

const Leader = mongoose.model("Leader", leaderSchema);
module.exports = Leader;
