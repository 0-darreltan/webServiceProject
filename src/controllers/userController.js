const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const {
  User,
  Deck,
  Card,
  Leader,
  HistoryTopup,
  HistoryPlay,
  PowerUp,
  Htrans,
  Dtrans,
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

const beliCoin = async (req, res) => {
  const { amount } = req.body;

  try {
    const yangLogin = req.user;

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Minimal beli 1 coin",
      });
    }

    const cekUser = await User.findById(yangLogin._id);

    if (!cekUser) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    if (cekUser.saldo < Number(amount) * 5000) {
      return res.status(400).json({
        message: `Saldo tidak cukup untuk membeli ${amount} coin!`,
      });
    }

    let total = Number(amount) * 5000;

    cekUser.saldo -= total;
    cekUser.coin += Number(amount);

    await cekUser.save();

    return res.status(200).json({
      message: `Pembelian berhasil! Coin ${cekUser.username} sekarang Rp ${cekUser.coin}`,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const beliPowerUp = async (req, res) => {
  const { name, amount } = req.body;

  try {
    const yangLogin = req.user;

    const cekPowerUp = await PowerUp.findOne({ name: name });

    if (!cekPowerUp) {
      return res.status(404).json({ message: "Power Up tidak ditemukan!" });
    }

    if (Number(amount) < 1) {
      return res.status(400).json({
        message: "Minimal beli 1 power up",
      });
    }

    const cekUser = await User.findById(yangLogin._id);

    if (!cekUser) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    let total = Number(amount) * cekPowerUp.harga;

    if (cekUser.saldo < total) {
      return res.status(400).json({
        message: `Saldo tidak cukup untuk membeli ${amount} power up!`,
      });
    }

    cekUser.saldo -= total;

    const inventoryItem = cekUser.inventory.find(
      (item) => item.powerUp.toString() === cekPowerUp._id.toString()
    );

    if (inventoryItem) {
      inventoryItem.quantity += Number(amount);
    } else {
      cekUser.inventory.push({
        powerUp: cekPowerUp._id,
        quantity: Number(amount),
      });
    }

    await cekUser.save();

    const htrans = await Htrans.create({
      user: cekUser._id,
      totalHarga: total,
    });

    await Dtrans.create({
      Htrans: htrans._id,
      powerUp: cekPowerUp._id,
      qty: amount,
      harga: total,
    });

    return res.status(200).json({
      message: `Pembelian power up ${cekPowerUp.name} berhasil! Sisa saldo ${cekUser.username} sekarang Rp ${cekUser.saldo}`,
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

const topup = async (req, res) => {
  const { amount } = req.body;

  try {
    const yangLogin = req.user;

    if (amount < 5000) {
      return res.status(400).json({
        message: "Topup minimal Rp 5000",
      });
    }

    const cekUser = await User.findById(yangLogin._id);

    if (!cekUser) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    // let total = Math.floor(Number(amount) / 5000);

    cekUser.saldo += Number(amount);

    await cekUser.save();

    const history = HistoryTopup.create({
      user: cekUser._id,
      amount: amount,
    });

    return res.status(200).json({
      message: `Topup berhasil! Saldo ${cekUser.username} sekarang Rp ${cekUser.saldo}`,
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

const playGame = async (req, res) => {
  try {
    const { deck_player1, player2, deck_player2 } = req.body;

    const player1 = req.user;

    if (player1.coin < 1) {
      return res.status(400).json({
        message: "Saldo anda tidak mencukupi",
        saldoAnda: player1.saldo,
      });
    }

    const cekPlayer2 = await User.findOne({ username: player2 });
    if (!cekPlayer2) {
      return res.status(404).json({ message: "Player 2 tidak ditemukan!" });
    }

    if (cekPlayer2.coin < 1) {
      return res.status(400).json({
        message: `${player2} tidak memiliki saldo yang mencukupi untuk bermain!`,
      });
    }

    let cekDeckP1, cekDeckP2;

    if (typeof Deck.findOne === "function" && Deck.associations) {
      cekDeckP1 = await Deck.findOne({
        where: {
          name: deck_player1,
        },
        include: [
          {
            association: "cards",
            required: false,
          },
        ],
      });

      cekDeckP2 = await Deck.findOne({
        where: {
          name: deck_player2,
        },
        include: [
          {
            association: "cards",
            required: false,
          },
        ],
      });
    } else {
      cekDeckP1 = await Deck.findOne({ name: deck_player1 }).populate("cards");
      cekDeckP2 = await Deck.findOne({ name: deck_player2 }).populate("cards");
    }

    if (!cekDeckP1) {
      return res.status(404).json({
        message: "Deck Player 1 tidak ditemukan!",
        deckName: deck_player1,
      });
    }

    if (!cekDeckP2) {
      return res.status(404).json({
        message: "Deck Player 2 tidak ditemukan!",
        deckName: deck_player2,
      });
    }

    const cards1 = cekDeckP1.cards || [];
    const cards2 = cekDeckP2.cards || [];

    // Hitung total power
    const totalPowerP1 = cards1.reduce((acc, card) => {
      const power = card.power || 0;
      return acc + power;
    }, 0);

    const totalPowerP2 = cards2.reduce((acc, card) => {
      const power = card.power || 0;
      return acc + power;
    }, 0);

    let result = "";
    let winner = null;

    if (totalPowerP1 > totalPowerP2) {
      result = "Player 1 Menang!";
      winner = "player1";
    } else if (totalPowerP2 > totalPowerP1) {
      result = "Player 2 Menang!";
      winner = "player2";
    } else {
      result = "Seri!";
      winner = "draw";
    }

    player1.coin -= 1;
    cekPlayer2.coin -= 1;
    player1.totalPlay += 1;
    cekPlayer2.totalPlay += 1;

    if (winner === "player1") {
      player1.totalWin += 1;
    } else if (winner === "player2") {
      cekPlayer2.totalWin += 1;
    }

    player1.winrate =
      player1.totalPlay > 0 ? (player1.totalWin / player1.totalPlay) * 100 : 0;
    cekPlayer2.winrate =
      player2.totalPlay > 0
        ? (cekPlayer2.totalWin / cekPlayer2.totalPlay) * 100
        : 0;

    await player1.save();
    await cekPlayer2.save();

    await HistoryPlay.create({
      player1: player1._id,
      totalPower1: totalPowerP1,
      player2: cekPlayer2._id,
      totalPower2: totalPowerP2,
      winner:
        winner === "draw"
          ? "draw"
          : winner === "player1"
          ? player1._id
          : cekPlayer2._id,
    });

    return res.status(200).json({
      message: `Pertandingan selesai! Player 1 dengan power ${totalPowerP1} vs Player 2 dengan power ${totalPowerP2}`,
      hasilPertandingan: result,
    });
  } catch (error) {
    console.error("Error dalam playGame:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan internal server",
      error: error.message,
    });
  }
};

const getHistoryPlayAsPlayer = async (req, res) => {
  try {
    const yangLogin = req.user;

    let historyMain = await HistoryPlay.find({
      $or: [{ player1: yangLogin._id }, { player2: yangLogin._id }],
    })
      .populate("player1", "username _id")
      .populate("player2", "username _id")
      .sort({ createdAt: -1 });

    if (!historyMain || historyMain.length === 0) {
      return res.status(200).json({
        message: "Belum ada riwayat permainan!",
        data: [],
      });
    }

    const historynya = historyMain.map((gameRecord) => {
      const isPlayer1 =
        gameRecord.player1._id.toString() === yangLogin._id.toString();
      const isPlayer2 =
        gameRecord.player2._id.toString() === yangLogin._id.toString();

      let namaMusuh = isPlayer1
        ? gameRecord.player2.username
        : gameRecord.player1.username;

      let hasilPertandingan = "Seri";
      if (gameRecord.winner === null) {
        hasilPertandingan = "Seri";
      } else if (gameRecord.winner.toString() === yangLogin._id.toString()) {
        hasilPertandingan = "Menang";
      } else {
        hasilPertandingan = "Kalah";
      }

      return {
        musuh: namaMusuh,
        time: gameRecord.createdAt,
        hasilPertandingan: hasilPertandingan,
        total_power_anda: isPlayer1
          ? gameRecord.totalPower1
          : gameRecord.totalPower2,
        total_power_musuh: isPlayer1
          ? gameRecord.totalPower2
          : gameRecord.totalPower1,
      };
    });

    return res.status(200).json({
      message: "Riwayat permainan berhasil diambil!",
      history: historynya,
    });
  } catch (error) {
    console.error("Error dalam getHistoryPlayAsPlayer:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan internal server",
      error: error.message,
    });
  }
};

const getHistoryPlayAsAdmin = async (req, res) => {
  try {
    const { _id } = req.query;

    const isValidId = mongoose.Types.ObjectId.isValid(_id);

    if (!_id || !isValidId) {
      // Jika _id kosong atau tidak valid → ambil semua riwayat
      const semuaHistory = await HistoryPlay.find()
        .populate("player1", "username")
        .populate("player2", "username")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Berhasil mengambil semua riwayat permainan!",
        total: semuaHistory.length,
        data: semuaHistory.map((h) => ({
          id: h._id,
          player1: h.player1.username,
          player2: h.player2.username,
          totalPower1: h.totalPower1,
          totalPower2: h.totalPower2,
          winner: h.winner
            ? h.winner.toString() === h.player1._id.toString()
              ? h.player1.username
              : h.player2.username
            : "Seri",
          createdAt: h.createdAt,
        })),
      });
    }

    const history = await HistoryPlay.findById(_id)
      .populate("player1", "username")
      .populate("player2", "username");

    if (!history) {
      return res
        .status(404)
        .json({ message: "Riwayat permainan tidak ditemukan!" });
    }

    return res.status(200).json({
      message: "Berhasil mengambil riwayat permainan!",
      history: {
        id: history._id,
        player1: history.player1.username,
        player2: history.player2.username,
        totalPower1: history.totalPower1,
        totalPower2: history.totalPower2,
        winner: history.winner
          ? history.winner.toString() === history.player1._id.toString()
            ? history.player1.username
            : history.player2.username
          : "Seri",
        createdAt: history.createdAt,
      },
    });
  } catch (error) {
    console.error("Error dalam getHistoryPlayAsAdmin:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  const { username } = req.query;

  try {
    const search = {};

    if (username) {
      search.username = new RegExp(username, "i");
    }

    const result = await User.find(search);

    if (!result || result.length === 0) {
      return res.status(400).json({ message: "Tidak ada akun" });
    }

    return res.status(200).json({
      message: "Berhasil mengambil data user!",
      users: result.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        saldo: user.saldo,
        coin: user.coin,
        totalPlay: user.totalPlay,
        totalWin: user.totalWin,
        winrate: user.winrate + "%",
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const yangLogin = req.user;

    const user = await User.findById(yangLogin._id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    return res.status(200).json({
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        saldo: user.saldo,
        coin: user.coin,
        totalPlay: user.totalPlay,
        totalWin: user.totalWin,
        winrate: user.winrate + "%",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const yangLogin = req.user;

    const user = await User.findById(yangLogin._id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    if (username) {
      user.username = username;
    }

    if (email) {
      user.email = email;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "Profil berhasil diperbarui!",
      profile: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        saldo: user.saldo,
        coin: user.coin,
        totalPlay: user.totalPlay,
        totalWin: user.totalWin,
        winrate: user.winrate + "%",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const yangLogin = req.user;

    const user = await User.findById(yangLogin._id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    await User.delete({ _id: yangLogin._id });

    return res.status(200).json({
      message: "Profil berhasil dihapus!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
  beliCoin,
  beliPowerUp,
  getHistoryTopup,
  getDetailHtopup,
  playGame,
  getHistoryPlayAsPlayer,
  getHistoryPlayAsAdmin,
  getUser,
  getProfile,
  updateProfile,
  deleteProfile,
};
