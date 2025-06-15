const express = require("express");
const router = express.Router();

const {
  register,
  login,
  topup,
  createDecks,
  getAllDecks,
  getDecks,
  updateDecks,
  deleteDecks,
} = require("../controllers/user");

router.post("/register", register);
router.post("/login", login);

router.post("/decks/create", createDecks);
router.get("/decks/get/", getAllDecks);
router.get("/decks/get/:id", getDecks);
router.put("/decks/update/:id", updateDecks);
router.delete("/decks/delete/:id", deleteDecks);
router.post("/topup", topup);

module.exports = router;
