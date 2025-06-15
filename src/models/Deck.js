const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama deck tidak boleh kosong"],
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Pengguna tidak boleh kosong"],
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leader",
      required: [true, "Leader tidak boleh kosong"],
    },
  },
  {
    timestamps: false,
  }
);

const Deck = mongoose.model("Deck", deckSchema);
module.exports = Deck;
