require("dotenv").config();
const express = require("express");
const { connectDB } = require("./src/config/mongodb"); // Pastikan connectDB diekspor dari file ini

// --- Vercel Change 1: Connect to Database on module load ---
// We call this directly. Vercel will wait for it to complete on a "cold start".
connectDB();

const app = express();

// --- All your middleware and routes stay the same ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { userRouter, cardRouter } = require("./src/routes");

app.use("/api/", userRouter);
app.use("/api/card", cardRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Web Service API!" });
});

// --- Vercel Change 2: Remove startServer() and app.listen() ---
// There is no need to listen on a PORT, Vercel handles that.
// We just need to export the configured 'app'.

module.exports = app;
