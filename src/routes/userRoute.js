const express = require("express");
const router = express.Router();

const {
  register,
  login,
  topup,
  createDecks,
  getAllDecks,
  getSingleDeck,
  updateDecks,
  deleteDecks,
} = require("../controllers/userController");

const verifyApiKey = require("../middlewares/verifyApiKey");

router.post("/register", register);
router.post("/login", login);

router.post("/decks/create", verifyApiKey, createDecks);
router.get("/decks/get/", verifyApiKey, getAllDecks);
router.get("/decks/get/:name", verifyApiKey, getSingleDeck);
router.put("/decks/update/:id", verifyApiKey, updateDecks);
router.delete("/decks/delete/:id", verifyApiKey, deleteDecks);
router.post("/topup/:_id", [verifyApiKey], topup);

module.exports = router;
