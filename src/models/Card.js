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
  },
  {
    timestamps: false,
  }
);

// Joi schema for card creation/update using names
const cardInputSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    "string.base": `"name" kartu harus berupa teks`,
    "string.empty": `"name" kartu tidak boleh kosong`,
    "string.min": `"name" kartu minimal {#limit} karakter`,
    "any.required": `"name" kartu tidak boleh kosong`,
  }),
  factionName: Joi.string().trim().min(1).required().messages({
    "string.base": `"factionName" harus berupa teks`,
    "string.empty": `"factionName" tidak boleh kosong`,
    "any.required": `"factionName" tidak boleh kosong`,
  }),
  typeCardName: Joi.string().trim().min(1).required().messages({
    "string.base": `"typeCardName" harus berupa teks`,
    "string.empty": `"typeCardName" tidak boleh kosong`,
    "any.required": `"typeCardName" tidak boleh kosong`,
  }),
  abilityNames: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(0)
    .optional()
    .messages({
      // min(0) if abilities are optional, min(1) if at least one is required
      "array.base": `"abilityNames" harus berupa array`,
      "array.min": `Minimal {#limit} ability harus dipilih`,
      "string.empty": `Nama ability tidak boleh kosong`,
    }),
  power: Joi.number().min(0).default(0).messages({
    "number.base": `"power" harus berupa angka`,
    "number.min": `"power" tidak boleh kurang dari {#limit}`,
  }),
});

const Card = mongoose.model("Card", cardSchema);
module.exports = {
  Card,
  cardInputSchema, // Export the Joi schema
};
