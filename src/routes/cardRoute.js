const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const {
  getCardApi,
  getAllCard,
  getSingleCard,
  getImageCard,
  tambahCard,
  updateCard,
  deleteCard,
  getAllAbilities,
  getSingleAbility,
  tambahAbility,
  updateAbility,
  deleteAbility,
  getAllFaction,
  getSingleFaction,
  tambahFaction,
  updateFaction,
  deleteFaction,
  getAllLeader,
  getSingleLeader,
  tambahLeader,
  updateLeader,
  deleteLeader,
  getAllTypeCard,
  getSingleTypeCard,
  tambahTypeCard,
  updateTypeCard,
  deleteTypeCard,
  getAllPowerUp,
  getSinglePowerUp,
  tambahPowerUp,
  updatePowerUp,
  deletePowerUp,
} = require("../controllers/cardController");

const verifyApiKey = require("../middlewares/verifyApiKey");
const cekAdmin = require("../middlewares/cekAdmin");

const storageSingle = multer.diskStorage({
  destination: (req, file, callback) => {
    const folderName = `uploads/cards/${req.body.faction}`;
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName, { recursive: true });
    }
    callback(null, folderName);
  },
  filename: (req, file, callback) => {
    // const fileExtension = path.extname(file.originalname).toLowerCase();

    callback(null, `${req.body.name}.png`);
  },
});

const uploadSingle = multer({
  storage: storageSingle,
  limits: {
    fileSize: 10 * 1000 * 1000, // 10 mb
  },
  fileFilter: (req, file, callback) => {
    const allowedFileType = /jpeg|jpg|png/;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const cekExtName = allowedFileType.test(fileExtension);
    const cekMimeType = allowedFileType.test(file.mimetype);

    if (cekExtName && cekMimeType) {
      callback(null, true);
    } else {
      callback("Waduh error mime type", false);
    }
  },
});

// Ability Routes
router.get("/ability/", getAllAbilities);
router.get("/ability/:_id", getSingleAbility);
router.post("/ability/", [verifyApiKey, cekAdmin], tambahAbility);
router.put("/ability/:_id", [verifyApiKey, cekAdmin], updateAbility);
router.delete("/ability/:_id", [verifyApiKey, cekAdmin], deleteAbility);

//Faction Routes
router.get("/faction/", getAllFaction);
router.get("/faction/:_id", getSingleFaction);
router.post("/faction/", [verifyApiKey, cekAdmin], tambahFaction);
router.put("/faction/:_id", [verifyApiKey, cekAdmin], updateFaction);
router.delete("/faction/:_id", [verifyApiKey, cekAdmin], deleteFaction);

//Leader Routes
router.get("/leader/", getAllLeader);
router.get("/leader/:_id", getSingleLeader);
router.post("/leader", [verifyApiKey, cekAdmin], tambahLeader);
router.put("/leader/:_id", [verifyApiKey, cekAdmin], updateLeader);
router.delete("/leader/:_id", [verifyApiKey, cekAdmin], deleteLeader);

//Type Card Routes
router.get("/type/", getAllTypeCard);
router.get("/type/:_id", getSingleTypeCard);
router.post("/type", [verifyApiKey, cekAdmin], tambahTypeCard);
router.put("/type/:_id", [verifyApiKey, cekAdmin], updateTypeCard);
router.delete("/type/:_id", [verifyApiKey, cekAdmin], deleteTypeCard);

router.get("/powerup/", getAllPowerUp);
router.get("/powerup/:_id", getSinglePowerUp);
router.post("/powerup", [verifyApiKey, cekAdmin], tambahPowerUp);
router.put("/powerup/:_id", [verifyApiKey, cekAdmin], updatePowerUp);
router.delete("/powerup/:_id", [verifyApiKey, cekAdmin], deletePowerUp);

//Card Routes
router.get("/api", getCardApi);
router.get("/", getAllCard);
router.get("/:_id", getSingleCard);
router.get("/image/:_id", getImageCard);
router.post(
  "/",
  [verifyApiKey, cekAdmin],
  uploadSingle.single("cardImage"),
  tambahCard
);
router.put("/:_id", [verifyApiKey, cekAdmin], updateCard);
router.delete("/:_id", [verifyApiKey, cekAdmin], deleteCard);

module.exports = router;
