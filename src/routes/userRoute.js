const express = require("express");
const router = express.Router();

const {
  register,
  login,
  topup,
  createDecks,
  getDecks,
  getSingleDeck,
  updateDecks,
  deleteDecks,
  getHistoryTopup,
  getDetailHtopup,
  playGame,
  getHistoryPlayAsPlayer,
  getHistoryPlayAsAdmin

} = require("../controllers/userController");

const verifyApiKey = require("../middlewares/verifyApiKey");
const cekAdmin = require("../middlewares/cekAdmin");

router.post("/register", register);
router.post("/login", login);

router.post("/decks", [verifyApiKey], createDecks);
router.get("/decks", [verifyApiKey], getDecks);
router.get("/decks/:_id", [verifyApiKey], getSingleDeck);
router.put("/decks/:_id", [verifyApiKey], updateDecks);
router.delete("/decks/:_id", [verifyApiKey], deleteDecks);
router.post("/topup", [verifyApiKey], topup);
router.get("/topup/history", [verifyApiKey], getHistoryTopup);
router.get("/topup/history/detail", [verifyApiKey, cekAdmin], getDetailHtopup);
router.post("/play", [verifyApiKey], playGame);
router.get("/history/play/player", [verifyApiKey], getHistoryPlayAsPlayer);
router.get("/history/play/admin/:_id", [verifyApiKey, cekAdmin], getHistoryPlayAsAdmin);

module.exports = router;
