const express = require("express");
const router = express.Router();

const {
  getCardApi,
  getAllCard,
  getCardByQuery,
  tambahCard,
  updateCard,
  deleteCard,
  getAllAbilities,
  getAbilitiesByQuery,
  tambahAbility,
  updateAbility,
  deleteAbility,
  getAllFaction,
  getFactionByQuery,
  tambahFaction,
  updateFaction,
  deleteFaction,
  getAllLeader,
  getLeaderByQuery,
  tambahLeader,
  updateLeader,
  deleteLeader,
  getAllTypeCard,
  getTypeCardByQuery,
  tambahTypeCard,
  updateTypeCard,
  deleteTypeCard,
} = require("../controllers/card");

const verifyApiKey = require("../middlewares/verifyApiKey");
const cekAdmin = require("../middlewares/cekAdmin");

//Card Routes
router.get("/api", getCardApi);
router.get("/", getAllCard);
router.get("/:id", getCardByQuery);
router.post("/", [verifyApiKey, cekAdmin], tambahCard);
router.put("/:_id", [verifyApiKey, cekAdmin], updateCard);
router.delete("/:_id", [verifyApiKey, cekAdmin], deleteCard);

//Ability Routes
router.get("/ability/", getAllAbilities);
router.get("/ability/:id", getAbilitiesByQuery);
router.post("/ability/", [verifyApiKey, cekAdmin], tambahAbility);
router.put("/ability/:_id", [verifyApiKey, cekAdmin], updateAbility);
router.delete("/ability/:_id", [verifyApiKey, cekAdmin], deleteAbility);

//Faction Routes
router.get("/faction/", getAllFaction);
router.get("/faction/:id", getFactionByQuery);
router.post("/faction/", [verifyApiKey, cekAdmin], tambahFaction);
router.put("/faction/:_id", [verifyApiKey, cekAdmin], updateFaction);
router.delete("/faction/:_id", [verifyApiKey, cekAdmin], deleteFaction);

//Leader Routes
router.get("/card/leader/", getAllLeader);
router.get("/card/leader/:id", getLeaderByQuery);
router.post("/card/leader", [verifyApiKey, cekAdmin], tambahLeader);
router.put("/card/leader/:_id", [verifyApiKey, cekAdmin], updateLeader);
router.delete("/card/leader/:_id", [verifyApiKey, cekAdmin], deleteLeader);

//Type Card Routes
router.get("/type/", getAllTypeCard);
router.get("/type/:id", getTypeCardByQuery);
router.post("/type", [verifyApiKey, cekAdmin], tambahTypeCard);
router.put("/type/:_id", [verifyApiKey, cekAdmin], updateTypeCard);
router.delete("/type/:_id", [verifyApiKey, cekAdmin], deleteTypeCard);

module.exports = router;
