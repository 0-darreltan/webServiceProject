const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username tidak boleh kosong"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email tidak boleh kosong"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password tidak boleh kosong"],
    },
    role: {
      type: String,
      enum: ["player", "admin"],
    },
    saldo: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
    deck: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deck",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoose_delete, { overrideMethods: "all" });

const User = mongoose.model("User", userSchema);
module.exports = User;
