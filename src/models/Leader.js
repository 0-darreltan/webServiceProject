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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faction",
      required: [true, "Faction tidak boleh kosong"],
    },
  },
  {
    timestamps: false,
  }
);

const Leader = mongoose.model("Leader", leaderSchema);
module.exports = Leader;
