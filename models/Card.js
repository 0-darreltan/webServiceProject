const { required } = require("joi");
const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama kartu tidak boleh kosong"],
      unique: true,
      trim: true,
    },
    faction: {
      type: String,
      ref: "Faction",
      required: [true, "Faksi tidak boleh kosong"],
    },
    typeCard: {
      type: String,
      ref: "TypeCard",
      required: [true, "Tipe kartu tidak boleh kosong"],
    },
    ability: [
      {
        type: String,
        ref: "Ability",
      },
    ],
    power: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

const Card = mongoose.model("Card", cardSchema);
module.exports = Card;
