const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Deck } = require("../models");
const { registerValidation, loginValidation } = require("../validations");

const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    await registerValidation.validateAsync(req.body, {
      abortEarly: false,
    });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekUser = await User.findOne({ username: username });

    if (cekUser) {
      return res.status(400).json({ message: "Username sudah terdaftar!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: username,
      email: email,
      password: hashedPassword,
      role: role,
    });

    return res.status(201).json({
      message: "User berhasil terdaftar!",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    await loginValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekUser = await User.findOne({ username: username });

    if (!cekUser) {
      return res.status(404).json({ message: "Username tidak ditemukan!" });
    }

    const cekPass = await bcrypt.compare(password, cekUser.password);

    if (!cekPass) {
      return res.status(400).json({ message: "Password salah!" });
    }

    let token = jwt.sign(
      {
        _id: cekUser._id,
        username: cekUser.username,
        role: cekUser.role,
        saldo: cekUser.saldo,
      },
      process.env.JWT_KEY,
      { expiresIn: "30m" }
    );

    return res.status(200).json({
      message: `Selamat ${cekUser.username} berhasil melakukan login!`,
      token: token,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const createDecks = async (req, res) => {
  // Implementasi untuk membuat decks
  res.status(501).json({ message: "Fitur ini belum diimplementasikan." });
};

const getAllDecks = async (req, res) => {
  // Implementasi untuk mendapatkan decks
  res.status(501).json({ message: "Fitur ini belum diimplementasikan." });
};
const getDecks = async (req, res) => {
  // Implementasi untuk mendapatkan decks
  res.status(501).json({ message: "Fitur ini belum diimplementasikan." });
};

const updateDecks = async (req, res) => {
  // Implementasi untuk memperbarui decks
  res.status(501).json({ message: "Fitur ini belum diimplementasikan." });
};

const deleteDecks = async (req, res) => {
  // Implementasi untuk menghapus decks
  res.status(501).json({ message: "Fitur ini belum diimplementasikan." });
};

const topup = async (req, res) => {
  // Implementasi untuk topup
  res.status(501).json({ message: "Fitur ini belum diimplementasikan." });
};

module.exports = {
  register,
  login,
  createDecks,
  getAllDecks,
  getDecks,
  updateDecks,
  deleteDecks,
  topup,
};
