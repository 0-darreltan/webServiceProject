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

router.post("/decks/create", createDecks);
router.get("/decks/get/", getAllDecks);
router.get("/decks/get/:id", getSingleDeck);
router.put("/decks/update/:id", updateDecks);
router.delete("/decks/delete/:id", deleteDecks);
router.post("/topup/:_id", [verifyApiKey], topup);

module.exports = router;
