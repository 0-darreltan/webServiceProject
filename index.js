// index.js
// This is the main entry point for the application.

// 1. Import Dependencies
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// 2. Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Database Connection (MongoDB with Mongoose) ---
// Replace '<your_mongodb_uri>' with your actual MongoDB connection string.
// For local development, this might be 'mongodb://localhost:27017/yourdbname'
const MONGO_URI = process.env.MONGO_URI || "<your_mongodb_uri>";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.error("Connection error", err));

// --- Basic Routes ---

// Welcome route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Web Service API!" });
});

// Example of a protected route placeholder
// A real implementation would have middleware to verify the token.
app.get("/api/protected", (req, res) => {
  // Example: Check for Authorization header
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // In a real app, use your actual JWT_SECRET
    const decoded = jwt.verify(token, "your_jwt_secret_key");
    res.json({ message: "This is a protected route.", user: decoded });
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
});

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
