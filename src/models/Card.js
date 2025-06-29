const mongoose = require("mongoose");
const Joi = require("joi"); // Import Joi

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama kartu tidak boleh kosong"],
      unique: true,
      trim: true,
    },
    faction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faction",
      required: [true, "Faksi tidak boleh kosong"],
    },
    typeCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypeCard",
      required: [true, "Tipe kartu tidak boleh kosong"],
    },
    ability: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ability",
      },
    ],
    power: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

const Card = mongoose.model("Card", cardSchema);
module.exports = Card;
