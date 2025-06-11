require("dotenv").config();

const express = require("express");
const { connectDB, mongoose } = require("./config/mongodb"); // Impor dari file mongodb.js

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sistemRouter = require("./routes");

app.use("/api", sistemRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Web Service API!" });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      if (mongoose.connection.readyState === 1) {
        console.log("Mongoose connection state: connected");
      } else {
        console.log(
          "Mongoose connection state:",
          mongoose.connection.readyState
        );
      }
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

startServer();
