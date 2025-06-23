const {
  cardValidation,
  factionValidation,
  typeValidation,
  abilityValidation,
  leaderValidation,
  powerUpValidation,
} = require("./cardValidation");

const {
  registerValidation,
  loginValidation,
  deckValidation,
} = require("./userValidation");

module.exports = {
  registerValidation,
  loginValidation,
  cardValidation,
  factionValidation,
  typeValidation,
  abilityValidation,
  leaderValidation,
  deckValidation,
  powerUpValidation,
};
