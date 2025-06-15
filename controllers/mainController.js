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

const {
  registerValidation,
  loginValidation,
  cardValidation,
  factionValidation,
  typeValidation,
  abilityValidation,
  leaderValidation,
} = require("../validations");

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

    // console.log("JWT KEY nya : " + process.env.JWT_KEY);

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
  const { name, faction, type, ability, power } = req.body;

  try {
    await cardValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekCard = await Card.findOne({ name });

    if (cekCard) {
      return res.status(400).json({ message: "Nama kartu sudah ada!" });
    }

    const cekFaction = await Faction.findOne({ name: faction });

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    const cekType = await TypeCard.findOne({ name: type });

    if (!cekType) {
      return res.status(404).json({ message: "Tipe kartu tidak ditemukan!" });
    }

    let abilities = [];
    if (ability && ability.length > 0) {
      const cekAbility = await Ability.find({ name: { $in: ability } });

      if (cekAbility.length !== ability.length) {
        return res.status(404).json({ message: "Ability tidak ditemukan!" });
      }

      abilities = cekAbility.map((abil) => abil._id);
    }

    const powers = Number(power);

    let result = await Card.create({
      name: name,
      faction: cekFaction._id,
      typeCard: cekType._id,
      ability: abilities,
      power: powers,
    });

    return res
      .status(200)
      .json({ message: "Card berhasil ditambahkan!", card: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateCard = async (req, res) => {
  const { _id } = req.params;
  const { name, faction, type, ability, power } = req.body;

  try {
    await cardValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekCard = await Card.findById(_id);

    if (!cekCard) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }

    if (name !== cekCard.name) {
      const cekNamaCard = await Card.findOne({ name: name });
      if (cekNamaCard) {
        return res
          .status(400)
          .json({ message: "Nama kartu sudah digunakan oleh kartu lain!" });
      }
    }

    const cekFaction = await Faction.findOne({ name: faction });
    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    const cekType = await TypeCard.findOne({ name: type });
    if (!cekType) {
      return res.status(404).json({ message: "Tipe kartu tidak ditemukan!" });
    }

    let abilities = [];
    if (ability && ability.length > 0) {
      const cekAbility = await Ability.find({ name: { $in: ability } });

      if (cekAbility.length !== ability.length) {
        return res.status(404).json({ message: "Ability tidak ditemukan!" });
      }

      abilities = cekAbility.map((abil) => abil._id);
    }

    const powers = Number(power);

    cekCard.name = name;
    cekCard.faction = cekFaction._id;
    cekCard.typeCard = cekType._id;
    cekCard.ability = abilities;
    cekCard.power = powers;

    await cekCard.save();

    return res
      .status(200)
      .json({ message: `Kartu ${cekCard.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteCard = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekCard = await Card.findById(_id);

    if (!cekCard) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }

    await Card.deleteOne({ _id });

    return res
      .status(200)
      .json({ message: `Kartu ${cekCard.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahFaction = async (req, res) => {
  const { name, description } = req.body;

  try {
    await factionValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekFaction = await Faction.findOne({ name: name });

    if (cekFaction) {
      return res.status(400).json({ message: "Faction sudah ada!" });
    }

    const result = await Faction.create({
      name: name,
      description: description,
    });

    return res.status(201).json({
      message: "Faction berhasil ditambahkan!",
      faction: {
        id: result._id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateFaction = async (req, res) => {
  const { _id } = req.params;
  const { name, description } = req.body;

  try {
    await factionValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekFaction = await Faction.findById(_id);

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    cekFaction.name = name;
    cekFaction.description = description;

    await cekFaction.save();

    return res
      .status(200)
      .json({ message: `Faction ${cekFaction.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteFaction = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekFaction = await Faction.findById(_id);
    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    await Faction.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `Faction ${cekFaction.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahAbility = async (req, res) => {
  const { name, description } = req.body;

  try {
    await abilityValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekAbility = await Ability.findOne({ name: name });

    if (cekAbility) {
      return res.status(400).json({ message: "Ability sudah ada!" });
    }

    const result = await Ability.create({
      name: name,
      description: description,
    });

    return res.status(201).json({
      message: "Ability berhasil ditambahkan!",
      ability: {
        id: result._id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateAbility = async (req, res) => {
  const { _id } = req.params;
  const { name, description } = req.body;

  try {
    await abilityValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekAbility = await Ability.findById(_id);

    if (!cekAbility) {
      return res.status(404).json({ message: "Ability tidak ditemukan!" });
    }

    cekAbility.name = name;
    cekAbility.description = description;

    await cekAbility.save();

    return res
      .status(200)
      .json({ message: `Ability ${cekAbility.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteAbility = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekAbility = await Ability.findById(_id);
    if (!cekAbility) {
      return res.status(404).json({ message: "Ability tidak ditemukan!" });
    }

    await Ability.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `Ability ${cekAbility.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahLeader = async (req, res) => {
  const { name, faction, effect } = req.body;

  try {
    await leaderValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekLeader = await Leader.findOne({ name: name });

    if (cekLeader) {
      return res.status(400).json({ message: "Leader sudah ada!" });
    }

    const cekFaction = await Faction.findOne({ name: faction });

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    const result = await Leader.create({
      name: name,
      faction: cekFaction._id,
      effect: effect,
    });

    return res.status(201).json({
      message: "Leader berhasil ditambahkan!",
      leader: {
        id: result._id,
        name: result.name,
        faction: cekFaction._id,
        effect: result.effect,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateLeader = async (req, res) => {
  const { _id } = req.params;
  const { name, faction, effect } = req.body;

  try {
    await leaderValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekLeader = await Leader.findById(_id);

    if (!cekLeader) {
      return res.status(404).json({ message: "Leader tidak ditemukan!" });
    }

    const cekFaction = await Faction.findOne({ name: faction });

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    cekLeader.name = name;
    cekLeader.faction = cekFaction._id;
    cekLeader.effect = effect;

    await cekLeader.save();

    return res
      .status(200)
      .json({ message: `Leader ${cekLeader.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteLeader = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekLeader = await Leader.findById(_id);
    if (!cekLeader) {
      return res.status(404).json({ message: "Leader tidak ditemukan!" });
    }

    await Leader.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `Leader ${cekLeader.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahTypeCard = async (req, res) => {
  const { name, description } = req.body;

  try {
    await typeValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekTypeCard = await TypeCard.findOne({ name: name });

    if (cekTypeCard) {
      return res.status(400).json({ message: "TypeCard sudah ada!" });
    }

    const result = await TypeCard.create({
      name: name,
      description: description,
    });

    return res.status(200).json({
      message: "TypeCard berhasil ditambahkan!",
      typeCard: {
        id: result._id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTypeCard = async (req, res) => {
  const { _id } = req.params;
  const { name, description } = req.body;

  try {
    await typeValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekTypeCard = await TypeCard.findById(_id);

    if (!cekTypeCard) {
      return res.status(404).json({ message: "TypeCard tidak ditemukan!" });
    }

    cekTypeCard.name = name;
    cekTypeCard.description = description;

    await cekTypeCard.save();

    return res
      .status(200)
      .json({ message: `TypeCard ${cekTypeCard.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteTypeCard = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekTypeCard = await TypeCard.findById(_id);
    if (!cekTypeCard) {
      return res.status(404).json({ message: "TypeCard tidak ditemukan!" });
    }

    await TypeCard.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `TypeCard ${cekTypeCard.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getCardApi,
  tambahCard,
  updateCard,
  deleteCard,
  tambahFaction,
  updateFaction,
  deleteFaction,
  tambahAbility,
  updateAbility,
  deleteAbility,
  tambahLeader,
  updateLeader,
  deleteLeader,
  tambahTypeCard,
  updateTypeCard,
  deleteTypeCard,
};
