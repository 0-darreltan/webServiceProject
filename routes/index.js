const express = require("express");
const router = express.Router();

const {
  register,
  login,
  tambahCard,
  updateCard,
  hapusCard,
  getCardApi,
  tambahFaction,
  tambahAbility,
  tambahLeader,
  tambahTypeCard,
} = require("../controllers/mainController");

const verifyApiKey = require("../middlewares/verifyApiKey");
const cekAdmin = require("../middlewares/cekAdmin");

router.post("/register", register);
router.post("/login", login);
router.get("/card", getCardApi);
router.get("/card/api", getCardApi);
router.post("/card/add", [verifyApiKey, cekAdmin], tambahCard);
router.put("/card/update/:id", [verifyApiKey, cekAdmin], updateCard);
router.delete("/card/delete/:id", [verifyApiKey, cekAdmin], hapusCard);
router.post("/card/ability", [verifyApiKey, cekAdmin], tambahAbility);
router.post("/card/faction", [verifyApiKey, cekAdmin], tambahFaction);
router.post("/card/leader", [verifyApiKey, cekAdmin], tambahLeader);
router.post("/card/type", [verifyApiKey, cekAdmin], tambahTypeCard);

module.exports = router;
