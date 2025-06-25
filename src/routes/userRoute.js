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
  getHistoryPlayAsAdmin,
  getUser,
  getProfile,
  updateProfile,
  deleteProfile,
  beliCoin,
  beliPowerUp,
  detailTrans,
  headerTrans,
} = require("../controllers/userController");

const verifyApiKey = require("../middlewares/verifyApiKey");
const cekAdmin = require("../middlewares/cekAdmin");

router.post("/register", register);
router.post("/login", login);
router.get("/user", [verifyApiKey, cekAdmin], getUser);
router.get("/profile", [verifyApiKey], getProfile);
router.put("/profile", [verifyApiKey], updateProfile);
router.delete("/profile", [verifyApiKey], deleteProfile);

router.post("/decks", [verifyApiKey], createDecks);
router.get("/decks", [verifyApiKey], getDecks);
router.get("/decks/:_id", [verifyApiKey], getSingleDeck);
router.put("/decks/:_id", [verifyApiKey], updateDecks);
router.delete("/decks/:_id", [verifyApiKey], deleteDecks);
router.post("/topup", [verifyApiKey], topup);
router.get("/topup/history", [verifyApiKey], getHistoryTopup);
router.get("/topup/history/detail", [verifyApiKey, cekAdmin], getDetailHtopup);
router.post("/coin", [verifyApiKey], beliCoin);
router.post("/powerup", [verifyApiKey], beliPowerUp);
router.post("/play", [verifyApiKey], playGame);
router.get("/play/history/", [verifyApiKey], getHistoryPlayAsPlayer);
router.get(
  "/play/history/detail",
  [verifyApiKey, cekAdmin],
  getHistoryPlayAsAdmin
);
router.get("/dtrans/", [verifyApiKey, cekAdmin], detailTrans);
router.get("/htrans/", [verifyApiKey, cekAdmin], headerTrans);

module.exports = router;
