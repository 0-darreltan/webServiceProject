const mongoose = require("mongoose");

const hTransSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Pengguna tidak boleh kosong"],
    },
    totalHarga: {
      type: Number,
      required: [true, "Total harga tidak boleh kosong"],
    },
  },
  {
    timestamps: true,
  }
);

const Htrans = mongoose.model("Htrans", hTransSchema);

module.exports = Htrans;
