const mongoose = require("mongoose");

const powerUpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama power up tidak boleh kosong"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Deskripsi tidak boleh kosong"],
    },
    harga: {
      type: Number,
      required: [true, "Harga tidak boleh kosong"],
      min: [0, "Harga tidak boleh negatif"],
    },
  },
  {
    timestamps: false,
  }
);

const PowerUp = mongoose.model("PowerUp", powerUpSchema);

module.exports = PowerUp;
