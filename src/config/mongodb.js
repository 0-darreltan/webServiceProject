const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

// Opsi koneksi Mongoose (opsional, Mongoose modern memiliki default yang baik)
const mongooseOptions = {
  // useNewUrlParser: true, // Tidak lagi diperlukan di Mongoose 6+
  // useUnifiedTopology: true, // Tidak lagi diperlukan di Mongoose 6+
  // useCreateIndex: true, // Tidak lagi didukung, gunakan createIndexes() pada model
  // useFindAndModify: false, // Tidak lagi didukung, gunakan findOneAndUpdate(), dll.
};

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
    console.log("Successfully connected to MongoDB via mongodb.js!");

    const db = mongoose.connection.db;
    const collections = [
      "abilities",
      "cards",
      "decks",
      "factions",
      "historyplays",
      "historytopups",
      "leaders",
      "powerups",
      "typecards",
      "users",
    ];

    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map((col) => col.name);

    for (const collection of collections) {
      if (!existingCollectionNames.includes(collection)) {
        await db.createCollection(collection);
        console.log(`Collection '${collection}' dibuat.`);
      } else {
        console.log(`Collection '${collection}' sudah ada.`);
      }
    }

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB runtime connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected.");
    });
  } catch (error) {
    console.error("MongoDB initial connection error:", error.message);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
  mongoose,
};
