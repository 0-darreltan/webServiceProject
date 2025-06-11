const mongoose = require("mongoose");

const abilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama ability tidak boleh kosong"],
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

const Ability = mongoose.model("Ability", abilitySchema);

module.exports = Ability;
