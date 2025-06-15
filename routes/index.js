const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/mainController");

const verifyApiKey = require("../middlewares/verifyApiKey");
const cekAdmin = require("../middlewares/cekAdmin");

router.post("/register", register);
router.post("/login", login);
router.get("/card/api", getCardApi);
router.get("/card", getCardApi);
router.post("/card/", [verifyApiKey, cekAdmin], tambahCard);
router.put("/card/:_id", [verifyApiKey, cekAdmin], updateCard);
router.delete("/card/:_id", [verifyApiKey, cekAdmin], deleteCard);
router.post("/card/ability", [verifyApiKey, cekAdmin], tambahAbility);
router.put("/card/ability/:_id", [verifyApiKey, cekAdmin], updateAbility);
router.delete("/card/ability/:_id", [verifyApiKey, cekAdmin], deleteAbility);
router.post("/card/faction", [verifyApiKey, cekAdmin], tambahFaction);
router.put("/card/faction/:_id", [verifyApiKey, cekAdmin], updateFaction);
router.delete("/card/faction/:_id", [verifyApiKey, cekAdmin], deleteFaction);
router.post("/card/leader", [verifyApiKey, cekAdmin], tambahLeader);
router.put("/card/leader/:_id", [verifyApiKey, cekAdmin], updateLeader);
router.delete("/card/leader/:_id", [verifyApiKey, cekAdmin], deleteLeader);
router.post("/card/type", [verifyApiKey, cekAdmin], tambahTypeCard);
router.put("/card/type/:_id", [verifyApiKey, cekAdmin], updateTypeCard);
router.delete("/card/type/:_id", [verifyApiKey, cekAdmin], deleteTypeCard);

module.exports = router;
