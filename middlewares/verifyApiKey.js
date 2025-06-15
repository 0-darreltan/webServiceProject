const jwt = require("jsonwebtoken");
const { User } = require("../models");

const verifyApiKey = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await User.findById(decoded._id);

    if (!user) {
      return res
        .status(401) // Unauthorized
        .json({ message: "Token is not valid, user not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Token is not valid." });
    }
    console.error("Error in token verification:", error);
    return res
      .status(500)
      .json({ message: "Server error during token verification." });
  }
};

module.exports = verifyApiKey;
