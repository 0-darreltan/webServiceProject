const axios = require("axios");
const bcrypt = require("bcrypt");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const {
  Ability,
  Card,
  Deck,
  Faction,
  HistoryPlay,
  HistoryTopup,
  Leader,
  TypeCard,
  User,
} = require("../models");

const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: "Semua field perlu diisi!" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password harus minimal dari 6 karakter!" });
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
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username dan password perlu diisi!" });
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

const getCardApi = async (req, res) => {
  try {
    // URL dari API eksternal
    const gwentApiUrl = "https://api.gwent.one/?key=data&version=3.0.0";

    console.log("Fetching data from Gwent API...");

    // 1. Tembak API eksternal menggunakan Axios
    const response = await axios.get(gwentApiUrl);

    // Data dari API biasanya ada di dalam properti `data` dari response axios
    const cardsData = response.data;

    console.log("Successfully fetched data.");

    // 2. Kirim data yang didapat langsung sebagai response
    return res.status(200).json(cardsData);
  } catch (error) {
    // Tangani jika API eksternal error atau tidak bisa dijangkau
    console.error("Error fetching data from Gwent API:", error.message);
    return res
      .status(500)
      .json({ message: "Gagal mengambil data dari sumber eksternal." });
  }
};

const tambahCard = async (req, res) => {
  // const user = await User.findById(req.user._id);
  return res.status(200).json({ message: "Card berhasil ditambahkan!" });
};

const tambahFaction = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: "Semua field perlu diisi!" });
  }
  const cekFaction = await Faction.findOne({ name: name });

  if (cekFaction) {
    return res.status(400).json({ message: "Faction sudah ada!" });
  }

  const newFaction = await Faction.create({
    name: name,
    description: description,
  });

  return res.status(201).json({
    message: "Faction berhasil ditambahkan!",
    faction: {
      id: newFaction._id,
      name: newFaction.name,
      description: newFaction.description,
    },
  });
};

const tambahAbility = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: "Semua field perlu diisi!" });
  }
  const cekAbility = await Ability.findOne({ name: name });

  if (cekAbility) {
    return res.status(400).json({ message: "Ability sudah ada!" });
  }

  const newAbility = await Ability.create({
    name: name,
    description: description,
  });

  return res.status(201).json({
    message: "Ability berhasil ditambahkan!",
    ability: {
      id: newAbility._id,
      name: newAbility.name,
      description: newAbility.description,
    },
  });
};
const tambahLeader = async (req, res) => {
  return res.status(200).json({ message: "Leader berhasil ditambahkan!" });
};

const tambahTypeCard = async (req, res) => {
  return res.status(200).json({ message: "TypeCard berhasil ditambahkan!" });
};

module.exports = {
  register,
  login,
  getCardApi,
  tambahCard,
  tambahFaction,
  tambahAbility,
  tambahLeader,
  tambahTypeCard,
};
