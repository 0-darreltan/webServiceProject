const mongoose = require("mongoose");

const factionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama faksi tidak boleh kosong"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Deskripsi tidak boleh kosong"],
    },
  },
  {
    timestamps: false,
  }
);

const Faction = mongoose.model("Faction", factionSchema);

module.exports = Faction;
