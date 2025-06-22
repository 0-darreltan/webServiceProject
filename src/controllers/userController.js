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

    // Parsing untuk URL-encoded data
    if (typeof cards === "string") {
      try {
        // Coba parse sebagai JSON jika dikirim sebagai string
        cards = JSON.parse(cards);
      } catch (e) {
        // Jika gagal, coba split dengan koma
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

    // Validasi input
    if (!name || !cards) {
      return res.status(400).json({
        message: "Nama deck dan array kartu harus diisi!",
      });
    }

    // Validasi cards harus berupa array
    if (!Array.isArray(cards)) {
      return res.status(400).json({
        message: "Kartu harus berupa array!",
      });
    }

    // Validasi minimal 22 kartu
    if (cards.length < 22) {
      return res.status(400).json({
        message: "Deck harus memiliki minimal 22 kartu!",
      });
    }

    // Cek apakah deck dengan nama yang sama sudah ada untuk user ini
    const existingDeck = await Deck.findOne({
      name: name,
      user: yangLogin._id,
    });

    if (existingDeck) {
      return res.status(400).json({
        message: "Deck dengan nama tersebut sudah ada!",
      });
    } // Validasi kartu yang dipilih ada di database
    const { Card, Leader } = require("../models");
    const validCards = await Card.find({ name: { $in: cards } }).populate(
      "faction",
      "name"
    );

    if (validCards.length !== cards.length) {
      // Cari kartu yang tidak valid
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

    // Validasi semua kartu harus 1 faction
    const factions = validCards
      .map((card) => card.faction?._id?.toString())
      .filter(Boolean);
    const uniqueFactions = [...new Set(factions)];

    if (uniqueFactions.length > 1) {
      return res.status(400).json({
        message: "Semua kartu dalam deck harus berasal dari faction yang sama!",
      });
    }

    if (uniqueFactions.length === 0) {
      return res.status(400).json({
        message: "Kartu harus memiliki faction yang valid!",
      });
    }
    const deckFaction = uniqueFactions[0];

    // Ambil ID dari kartu yang valid untuk disimpan
    const cardIds = validCards.map((card) => card._id);

    console.log("Valid cards found:", validCards.length);
    console.log("Card IDs to save:", cardIds);
    console.log("Sample card object:", validCards[0]);

    // Validasi leader jika ada
    let validLeader = null;
    let leaderId = null;
    if (leader) {
      validLeader = await Leader.findOne({ name: leader }).populate("faction");
      if (!validLeader) {
        return res.status(400).json({
          message: "Leader yang dipilih tidak valid!",
        });
      }

      // Validasi leader harus sama faction dengan kartu
      if (validLeader.faction._id.toString() !== deckFaction) {
        return res.status(400).json({
          message: "Leader harus berasal dari faction yang sama dengan kartu!",
        });
      }

      leaderId = validLeader._id;
    } // Buat deck baru
    const newDeck = await Deck.create({
      name: name,
      user: yangLogin._id,
      cards: cardIds, // Simpan ID kartu, bukan nama
      leader: leaderId || null, // Simpan ID leader, bukan nama
      totalCards: cards.length,
    });

    console.log("Deck berhasil dibuat dengan cards:", cardIds);
    console.log("New deck object:", newDeck);

    return res.status(201).json({
      message: "Deck berhasil dibuat!",
      deck: {
        id: newDeck._id,
        name: newDeck.name,
        totalCards: newDeck.totalCards,
        leader: validLeader ? validLeader.name : null,
        cardsIds: cardIds, // Tambahkan untuk debugging
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllDecks = async (req, res) => {
  try {
    const yangLogin = req.user;

    // Ambil semua deck milik user yang login
    const decks = await Deck.find({ user: yangLogin._id })
      .populate("leader", "name effect")
      .populate("cards", "name power"); // Fix: "cards" bukan "card"

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
      totalCards: deck.totalCards,
      leader: deck.leader ? deck.leader.name : null,
      cardsCount: deck.cards.length,
      cards: deck.cards.map((card) => card.name), // Tambahkan list nama kartu
      createdAt: deck.createdAt,
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
  const { name } = req.params;

  try {
    const yangLogin = req.user;

    // Cari deck berdasarkan ID dan user yang login
    const deck = await Deck.findOne({
      name: name,
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
        totalCards: deck.totalCards,
        leader: deck.leader
          ? {
              id: deck.leader._id,
              name: deck.leader.name,
              effect: deck.leader.effect,
            }
          : null,
        cards: deck.cards.map((card) => ({
          id: card._id,
          name: card.name,
          power: card.power,
          faction: card.faction ? card.faction.name : null,
          type: card.typeCard ? card.typeCard.name : null,
          abilities: card.ability ? card.ability.map((ab) => ab.name) : [],
        })),
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateDecks = async (req, res) => {
  const { id } = req.params;
  let { name, cards, leader } = req.body;

  try {
    const yangLogin = req.user;

    // Parsing untuk URL-encoded data (sama seperti createDecks)
    if (typeof cards === "string") {
      try {
        // Coba parse sebagai JSON jika dikirim sebagai string
        cards = JSON.parse(cards);
      } catch (e) {
        // Jika gagal, coba split dengan koma
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

    // Cari deck yang akan diupdate
    const deck = await Deck.findOne({
      _id: id,
      user: yangLogin._id,
    });

    if (!deck) {
      return res.status(404).json({
        message: "Deck tidak ditemukan atau bukan milik Anda!",
      });
    } // Validasi input
    if (!name || !cards || !Array.isArray(cards)) {
      console.log(
        "Invalid input - name:",
        name,
        "cards:",
        cards,
        "isArray:",
        Array.isArray(cards)
      );
      return res.status(400).json({
        message: "Nama deck dan array kartu harus diisi!",
      });
    }

    // Validasi minimal 22 kartu
    if (cards.length < 22) {
      return res.status(400).json({
        message: "Deck harus memiliki minimal 22 kartu!",
      });
    }

    // Cek apakah nama deck sudah digunakan oleh deck lain dari user yang sama
    if (name !== deck.name) {
      const existingDeck = await Deck.findOne({
        name: name,
        user: yangLogin._id,
        _id: { $ne: id },
      });

      if (existingDeck) {
        return res.status(400).json({
          message: "Nama deck sudah digunakan oleh deck lain!",
        });
      }
    } // Validasi kartu yang dipilih ada di database
    const { Card, Leader } = require("../models");
    const validCards = await Card.find({ name: { $in: cards } }).populate(
      "faction",
      "name"
    );

    if (validCards.length !== cards.length) {
      // Cari kartu yang tidak valid
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

    // Validasi semua kartu harus 1 faction
    const factions = validCards
      .map((card) => card.faction?._id?.toString())
      .filter(Boolean);
    const uniqueFactions = [...new Set(factions)];

    if (uniqueFactions.length > 1) {
      return res.status(400).json({
        message: "Semua kartu dalam deck harus berasal dari faction yang sama!",
      });
    }

    if (uniqueFactions.length === 0) {
      return res.status(400).json({
        message: "Kartu harus memiliki faction yang valid!",
      });
    }

    const deckFaction = uniqueFactions[0];

    // Ambil ID dari kartu yang valid untuk disimpan
    const cardIds = validCards.map((card) => card._id);

    // Validasi leader jika ada
    let validLeader = null;
    if (leader) {
      validLeader = await Leader.findOne({ name: leader }).populate("faction");
      if (!validLeader) {
        return res.status(400).json({
          message: "Leader yang dipilih tidak valid!",
        });
      }

      // Validasi leader harus sama faction dengan kartu
      if (validLeader.faction._id.toString() !== deckFaction) {
        return res.status(400).json({
          message: "Leader harus berasal dari faction yang sama dengan kartu!",
        });
      }
    } // Update deck
    deck.name = name;
    deck.cards = cardIds; // Simpan ID kartu, bukan nama
    deck.leader = validLeader ? validLeader._id : null; // Simpan ID leader, bukan nama
    deck.totalCards = cards.length;

    await deck.save();

    return res.status(200).json({
      message: "Deck berhasil diperbarui!",
      deck: {
        id: deck._id,
        name: deck.name,
        totalCards: deck.totalCards,
        leader: validLeader ? validLeader.name : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteDecks = async (req, res) => {
  const { id } = req.params;

  try {
    const yangLogin = req.user;

    // Cari deck yang akan dihapus
    const deck = await Deck.findOne({
      _id: id,
      user: yangLogin._id,
    });

    if (!deck) {
      return res.status(404).json({
        message: "Deck tidak ditemukan atau bukan milik Anda!",
      });
    }

    // Hapus deck
    await Deck.deleteOne({ _id: id });

    return res.status(200).json({
      message: `Deck "${deck.name}" berhasil dihapus!`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const topup = async (req, res) => {
  const { _id } = req.params;
  const { amount } = req.body;

  try {
    const yangLogin = req.user;

    if (yangLogin._id.toString() !== _id) {
      return res
        .status(403)
        .json({ message: "Tidak boleh melakukan topup untuk user lain" });
    }

    if (amount < 5000) {
      return res.status(400).json({
        message: "Topup minimal Rp 5000 untuk mendapatkan 1 saldo!",
      });
    }

    const cekUser = await User.findById(_id);

    if (!cekUser) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    let total = Math.floor(Number(amount) / 5000);

    cekUser.saldo += total;

    await cekUser.save();

    return res.status(200).json({
      message: `Topup berhasil! Saldo ${cekUser.username} sekarang Rp ${cekUser.saldo}`,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  createDecks,
  getAllDecks,
  getSingleDeck,
  updateDecks,
  deleteDecks,
  topup,
};
