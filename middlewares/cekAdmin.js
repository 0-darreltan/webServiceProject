const cekAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No user authenticated." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Hanya admin yang mendapat akses" });
  }

  next();
};

module.exports = cekAdmin;
