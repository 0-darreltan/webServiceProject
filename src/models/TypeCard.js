const mongoose = require("mongoose");

const typeCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama tipe kartu tidak boleh kosong"],
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

const TypeCard = mongoose.model("TypeCard", typeCardSchema);

module.exports = TypeCard;
