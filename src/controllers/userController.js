const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  User,
  Deck,
  Card,
  Leader,
  HistoryTopup,
  HistoryPlay,
} = require("../models");
const {
  registerValidation,
  loginValidation,
  deckValidation,
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

    let token = jwt.sign(
      {
        _id: cekUser._id,
        username: cekUser.username,
        role: cekUser.role,
        saldo: cekUser.saldo,
      },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 * 24 }
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
  let { name, cards, leader } = req.body;

  try {
    const yangLogin = req.user;

    if (typeof cards === "string") {
      try {
        cards = JSON.parse(cards);
      } catch (e) {
        cards = cards.split(",").map((card) => card.trim());
      }
    }

    console.log(
      "Received data - name:",
      name,
      "cards:",
      cards,
      "cards type:",
      typeof cards
    );

    try {
      await deckValidation.validateAsync(req.body, { abortEarly: false });
    } catch (validationError) {
      const errorMessages = validationError.details
        .map((detail) => detail.message)
        .join(", ");
      return res.status(400).json({ message: errorMessages });
    }

    const existingDeck = await Deck.findOne({
      name: name,
      user: yangLogin._id,
    });

    if (existingDeck) {
      return res.status(400).json({
        message: "Deck dengan nama tersebut sudah ada!",
      });
    }

    const validCards = await Card.find({ name: { $in: cards } }).populate(
      "faction",
      "name"
    );

    if (validCards.length !== cards.length) {
      const validCardNames = validCards.map((card) => card.name);
      const invalidCards = cards.filter(
        (cardName) => !validCardNames.includes(cardName)
      );

      console.log("Kartu yang tidak valid:", invalidCards);
      console.log("Total kartu yang diminta:", cards.length);
      console.log("Total kartu valid yang ditemukan:", validCards.length);

      return res.status(400).json({
        message: "Beberapa kartu yang dipilih tidak valid!",
        invalidCards: invalidCards,
      });
    }

    const factionNames = validCards
      .map((card) => card.faction?.name) // Ambil nama, bukan _id. Gunakan ?. untuk keamanan.
      .filter(Boolean);

    const uniqueFactionNames = [...new Set(factionNames)];

    const mainFactions = uniqueFactionNames.filter(
      (name) => name.toLowerCase() !== "neutral"
    );

    if (mainFactions.length > 1) {
      // Jika lebih dari 1, berarti ada campuran faksi utama yang tidak diizinkan.
      // Contoh: ['Northern Realms', 'Nilfgaard']
      return res.status(400).json({
        message:
          "Deck tidak valid. Hanya boleh mencampurkan satu faksi utama dengan kartu Neutral.",
        conflictingFactions: mainFactions, // Opsional: Beri tahu faksi apa saja yang konflik
      });
    }

    // Jika lolos, Anda bisa lanjut.
    // Di sini Anda juga bisa menentukan faksi utama dari deck tersebut.
    const deckFactionName =
      mainFactions.length === 1 ? mainFactions[0] : "Neutral";

    const cardIds = validCards.map((card) => card._id);

    console.log("Valid cards found:", validCards.length);
    console.log("Card IDs to save:", cardIds);
    console.log("Sample card object:", validCards[0]);

    const validLeader = await Leader.findOne({ name: leader }).populate(
      "faction"
    );

    if (!validLeader) {
      return res.status(400).json({
        message: "Leader yang dipilih tidak valid!",
      });
    }

    if (validLeader.faction.name.toString() !== deckFactionName) {
      return res.status(400).json({
        message: "Leader harus berasal dari faction yang sama dengan kartu!",
      });
    }

    const newDeck = await Deck.create({
      name: name,
      user: yangLogin._id,
      cards: cardIds,
      leader: validLeader._id,
    });

    return res.status(201).json({
      message: "Deck berhasil dibuat!",
      deck: {
        id: newDeck._id,
        name: newDeck.name,
        leader: validLeader.name,
        cardsIds: cardIds,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDecks = async (req, res) => {
  const { name } = req.query;

  try {
    const yangLogin = req.user;

    const search = { user: yangLogin._id };

    if (name) {
      search.name = new RegExp(name, "i");
    }

    const decks = await Deck.find(search)
      .populate("leader", "name")
      .populate("cards", "name");

    console.log("Found decks:", decks.length);
    if (decks.length > 0) {
      console.log("First deck cards:", decks[0].cards);
    }

    if (decks.length === 0) {
      return res.status(200).json({
        message: "Belum ada deck yang dibuat!",
        decks: [],
      });
    }

    const deckList = decks.map((deck) => ({
      id: deck._id,
      name: deck.name,
      leader: deck.leader.name,
      cardsCount: deck.cards.length,
      cards: deck.cards.map((card) => card.name),
    }));

    return res.status(200).json({
      message: "Berhasil mengambil semua deck!",
      total: decks.length,
      decks: deckList,
    });
  } catch (error) {
    console.log("Error in getAllDecks:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getSingleDeck = async (req, res) => {
  const { _id } = req.params;

  try {
    const yangLogin = req.user;

    const deck = await Deck.findOne({
      _id: _id,
      user: yangLogin._id,
    })
      .populate("leader", "name effect")
      .populate({
        path: "cards",
        select: "name power",
        populate: {
          path: "faction typeCard ability",
          select: "name description",
        },
      });

    if (!deck) {
      return res.status(404).json({
        message: "Deck tidak ditemukan atau bukan milik Anda!",
      });
    }

    return res.status(200).json({
      message: "Berhasil mengambil detail deck!",
      deck: {
        id: deck._id,
        name: deck.name,
        leader: {
          id: deck.leader._id,
          name: deck.leader.name,
          effect: deck.leader.effect,
        },
        cards: deck.cards.map((card) => ({
          id: card._id,
          name: card.name,
          power: card.power,
          faction: card.faction.name,
          type: card.typeCard.name,
          abilities: card.ability ? card.ability.map((ab) => ab.name) : [],
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateDecks = async (req, res) => {
  const { _id } = req.params;
  let { name, cards, leader } = req.body;

  try {
    const yangLogin = req.user;

    if (typeof cards === "string") {
      try {
        cards = JSON.parse(cards);
      } catch (e) {
        cards = cards.split(",").map((card) => card.trim());
      }
    }

    console.log(
      "Update - Received data - name:",
      name,
      "cards:",
      cards,
      "cards type:",
      typeof cards
    );

    const deck = await Deck.findOne({
      _id: _id,
      user: yangLogin._id,
    });

    if (!deck) {
      return res.status(404).json({
        message: "Deck tidak ditemukan atau bukan milik Anda!",
      });
    }

    try {
      await deckValidation.validateAsync(req.body, { abortEarly: false });
    } catch (validationError) {
      const errorMessages = validationError.details
        .map((detail) => detail.message)
        .join(", ");
      return res.status(400).json({ message: errorMessages });
    }

    if (name !== deck.name) {
      const existingDeck = await Deck.findOne({
        name: name,
        user: yangLogin._id,
        _id: { $ne: _id },
      });

      if (existingDeck) {
        return res.status(400).json({
          message: "Nama deck sudah digunakan oleh deck lain!",
        });
      }
    }

    const validCards = await Card.find({ name: { $in: cards } }).populate(
      "faction",
      "name"
    );

    if (validCards.length !== cards.length) {
      const validCardNames = validCards.map((card) => card.name);
      const invalidCards = cards.filter(
        (cardName) => !validCardNames.includes(cardName)
      );

      console.log("Kartu yang tidak valid di updateDecks:", invalidCards);
      console.log("Total kartu yang diminta:", cards.length);
      console.log("Total kartu valid yang ditemukan:", validCards.length);

      return res.status(400).json({
        message: "Beberapa kartu yang dipilih tidak valid!",
        invalidCards: invalidCards,
      });
    }

    const factionNames = validCards
      .map((card) => card.faction?.name)
      .filter(Boolean);

    const uniqueFactionNames = [...new Set(factionNames)];

    const mainFactions = uniqueFactionNames.filter(
      (name) => name.toLowerCase() !== "neutral"
    );

    if (mainFactions.length > 1) {
      return res.status(400).json({
        message:
          "Deck tidak valid. Hanya boleh mencampurkan satu faksi utama dengan kartu Neutral.",
        conflictingFactions: mainFactions,
      });
    }

    const deckFactionName =
      mainFactions.length === 1 ? mainFactions[0] : "Neutral";

    const cardIds = validCards.map((card) => card._id);

    const validLeader = await Leader.findOne({ name: leader }).populate(
      "faction"
    );
    if (!validLeader) {
      return res.status(400).json({
        message: "Leader yang dipilih tidak valid!",
      });
    }

    if (validLeader.faction.name.toString() !== deckFactionName) {
      return res.status(400).json({
        message: "Leader harus berasal dari faction yang sama dengan kartu!",
      });
    }

    deck.name = name;
    deck.cards = cardIds;
    deck.leader = validLeader._id;
    deck.totalCards = cards.length;

    await deck.save();

    return res.status(200).json({
      message: "Deck berhasil diperbarui!",
      deck: {
        id: deck._id,
        name: deck.name,
        leader: deck.leader,
        cards: deck.cards,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteDecks = async (req, res) => {
  const { _id } = req.params;

  try {
    const yangLogin = req.user;

    // Cari deck yang akan dihapus
    const deck = await Deck.findOne({
      _id: _id,
      user: yangLogin._id,
    });

    if (!deck) {
      return res.status(404).json({
        message: "Deck tidak ditemukan atau bukan milik Anda!",
      });
    }

    // Hapus deck
    await Deck.deleteOne({ _id });

    return res.status(200).json({
      message: `Deck ${deck.name} berhasil dihapus!`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const topup = async (req, res) => {
  const { amount } = req.body;

  try {
    const yangLogin = req.user;

    if (amount < 5000) {
      return res.status(400).json({
        message: "Topup minimal Rp 5000 untuk mendapatkan 1 saldo!",
      });
    }

    const cekUser = await User.findById(yangLogin._id);

    if (!cekUser) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    let total = Math.floor(Number(amount) / 5000);

    cekUser.saldo += total;

    await cekUser.save();

    const history = HistoryTopup.create({
      user: cekUser._id,
      amount: total,
    });

    return res.status(200).json({
      message: `Topup berhasil! Saldo ${cekUser.username} sekarang Rp ${cekUser.saldo}`,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getHistoryTopup = async (req, res) => {
  try {
    const yangLogin = req.user;

    const history = await HistoryTopup.find({ user: yangLogin._id }).populate(
      "user",
      "username"
    );

    if (history.length === 0) {
      return res.status(200).json({
        message: "Belum ada history topup!",
        history: [],
      });
    }

    const historyList = history.map((item) => ({
      amount: item.amount,
      time: item.createdAt,
    }));

    return res.status(200).json({
      message: "Berhasil mengambil history topup!",
      total: history.length,
      history: historyList,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getDetailHtopup = async (req, res) => {
  try {
    const history = await HistoryTopup.find({}).populate("user", "username");

    if (history.length === 0) {
      return res.status(200).json({
        message: "Belum ada history topup!",
        history: [],
      });
    }

    const historyList = history.map((item) => ({
      id: item._id,
      user: item.user.username,
      amount: item.amount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.status(200).json({
      message: "Berhasil mengambil riwayat topup!",
      total: history.length,
      history: historyList,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  createDecks,
  getDecks,
  getSingleDeck,
  updateDecks,
  deleteDecks,
  topup,
  getHistoryTopup,
  getDetailHtopup,
};
