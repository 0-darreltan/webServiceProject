const mongoose = require("mongoose");

const dTransSchema = new mongoose.Schema(
  {
    Htrans: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Htrans",
      required: [true, "Transaksi tidak boleh kosong"],
    },
    powerUp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PowerUp",
      required: [true, "Power Up tidak boleh kosong"],
    },
    qty: {
      type: Number,
      required: [true, "Jumlah tidak boleh kosong"],
      min: [1, "Jumlah minimal adalah 1"],
    },
    harga: {
      type: Number,
      required: [true, "Harga tidak boleh kosong"],
    },
  },
  {
    timestamps: false,
  }
);

const Dtrans = mongoose.model("Dtrans", dTransSchema);

module.exports = Dtrans;
