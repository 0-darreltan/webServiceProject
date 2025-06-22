const {
  cardValidation,
  factionValidation,
  typeValidation,
  abilityValidation,
  leaderValidation,
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
};
