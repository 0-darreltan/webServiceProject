const axios = require("axios");
const {
  Card,
  Faction,
  TypeCard,
  Ability,
  Leader,
  PowerUp,
} = require("../models");
const {
  cardValidation,
  abilityValidation,
  factionValidation,
  leaderValidation,
  typeValidation,
  powerUpValidation,
} = require("../validations");

const getCardApi = async (req, res) => {
  try {
    const gwentApiUrl = "https://api.gwent.one/?key=data&version=3.0.0";

    console.log("Fetching data from Gwent API...");

    const response = await axios.get(gwentApiUrl);
    const cardsData = response.data;

    console.log("Successfully fetched data.");

    return res.status(200).json(cardsData);
  } catch (error) {
    console.error("Error fetching data from Gwent API:", error.message);
    return res
      .status(500)
      .json({ message: "Gagal mengambil data dari sumber eksternal." });
  }
};

const getAllCard = async (req, res) => {
  const { ability, faction, type } = req.query;

  try {
    let search = {};
    if (ability) {
      const cekAbility = await Ability.findOne({
        name: new RegExp(`${ability}`, "i"),
      });
      if (!cekAbility) {
        return res.status(404).json({ message: "Ability tidak ditemukan!" });
      }

      search.ability = cekAbility._id;
    }

    if (faction) {
      const cekFaction = await Faction.findOne({
        name: new RegExp(`${faction}`, "i"),
      });
      if (!cekFaction) {
        return res.status(404).json({ message: "Faction tidak ditemukan!" });
      }
      search.faction = cekFaction._id;
    }

    if (type) {
      const cekType = await TypeCard.findOne({
        name: new RegExp(`${type}`, "i"),
      });
      if (!cekType) {
        return res.status(404).json({ message: "Type tidak ditemukan!" });
      }
      search.typeCard = cekType._id;
    }

    const cards = await Card.find(search)
      .populate("faction", "name")
      .populate("typeCard", "name")
      .populate("ability", "name");

    return res.status(200).json(cards);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSingleCard = async (req, res) => {
  const { _id } = req.params;

  try {
    const card = await Card.findById(_id)
      .populate("faction", "name")
      .populate("typeCard", "name")
      .populate("ability", "name");

    if (!card) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }

    const result = {
      name: card.name,
      faction: card.faction.name,
      typeCard: card.typeCard.name,
      ability: card.ability.map((abil) => abil.name),
      power: card.power,
      imageUrl: card.image,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getImageCard = async (req, res) => {
  const { _id } = req.params;

  try {
    const card = await Card.findById(_id);

    if (!card) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }

    // Buat field baru secara dinamis yang berisi URL publik gambar
    const imageUrl = `${req.protocol}://${req.get("host")}${card.image}`;

    return res.sendFile(imageUrl, { root: "." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahCard = async (req, res) => {
  const { name, faction, type, ability, power } = req.body;

  try {
    await cardValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekCard = await Card.findOne({ name });

    if (cekCard) {
      return res.status(400).json({ message: "Nama kartu sudah ada!" });
    }

    const cekFaction = await Faction.findOne({ name: faction });

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    const cekType = await TypeCard.findOne({ name: type });

    if (!cekType) {
      return res.status(404).json({ message: "Tipe kartu tidak ditemukan!" });
    }

    let abilities = [];
    if (ability && ability.length > 0) {
      const cekAbility = await Ability.find({ name: { $in: ability } });

      if (cekAbility.length !== ability.length) {
        return res.status(404).json({ message: "Ability tidak ditemukan!" });
      }

      abilities = cekAbility.map((abil) => abil._id);
    }

    const powers = Number(power);

    let result = await Card.create({
      name: name,
      faction: cekFaction._id,
      typeCard: cekType._id,
      ability: abilities,
      power: powers,
      image: `/uploads/cards/${faction}/${name}.png`,
    });

    return res
      .status(200)
      .json({ message: "Card berhasil ditambahkan!", card: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateCard = async (req, res) => {
  const { _id } = req.params;
  const { name, faction, type, ability, power } = req.body;

  try {
    await cardValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekCard = await Card.findById(_id);

    if (!cekCard) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }

    if (name !== cekCard.name) {
      const cekNamaCard = await Card.findOne({ name: name });
      if (cekNamaCard) {
        return res
          .status(400)
          .json({ message: "Nama kartu sudah digunakan oleh kartu lain!" });
      }
    }

    const cekFaction = await Faction.findOne({ name: faction });
    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    const cekType = await TypeCard.findOne({ name: type });
    if (!cekType) {
      return res.status(404).json({ message: "Tipe kartu tidak ditemukan!" });
    }

    let abilities = [];
    if (ability && ability.length > 0) {
      const cekAbility = await Ability.find({ name: { $in: ability } });

      if (cekAbility.length !== ability.length) {
        return res.status(404).json({ message: "Ability tidak ditemukan!" });
      }

      abilities = cekAbility.map((abil) => abil._id);
    }

    const powers = Number(power);

    cekCard.name = name;
    cekCard.faction = cekFaction._id;
    cekCard.typeCard = cekType._id;
    cekCard.ability = abilities;
    cekCard.power = powers;

    await cekCard.save();

    return res
      .status(200)
      .json({ message: `Kartu ${cekCard.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteCard = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekCard = await Card.findById(_id);

    if (!cekCard) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }

    await Card.deleteOne({ _id });

    return res
      .status(200)
      .json({ message: `Kartu ${cekCard.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllAbilities = async (req, res) => {
  const { name } = req.query;
  try {
    let search = {};

    if (name) {
      search.name = new RegExp(name, "i");
    }

    const abilities = await Ability.find(search);

    return res.status(200).json(abilities);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSingleAbility = async (req, res) => {
  const { _id } = req.params;

  try {
    const ability = await Ability.findById(_id);
    if (!ability) {
      return res.status(404).json({ message: "Ability tidak ditemukan!" });
    }
    return res.status(200).json(ability);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahAbility = async (req, res) => {
  const { name, description } = req.body;

  try {
    await abilityValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekAbility = await Ability.findOne({ name: name });

    if (cekAbility) {
      return res.status(400).json({ message: "Ability sudah ada!" });
    }

    const result = await Ability.create({
      name: name,
      description: description,
    });

    return res.status(201).json({
      message: "Ability berhasil ditambahkan!",
      ability: {
        id: result._id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateAbility = async (req, res) => {
  const { _id } = req.params;
  const { name, description } = req.body;

  try {
    await abilityValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekAbility = await Ability.findById(_id);

    if (!cekAbility) {
      return res.status(404).json({ message: "Ability tidak ditemukan!" });
    }

    cekAbility.name = name;
    cekAbility.description = description;

    await cekAbility.save();

    return res
      .status(200)
      .json({ message: `Ability ${cekAbility.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteAbility = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekAbility = await Ability.findById(_id);
    if (!cekAbility) {
      return res.status(404).json({ message: "Ability tidak ditemukan!" });
    }

    await Ability.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `Ability ${cekAbility.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllFaction = async (req, res) => {
  const { name } = req.query;
  try {
    let search = {};

    if (name) {
      search.name = new RegExp(name, "i");
    }

    const factions = await Faction.find(search);

    return res.status(200).json(factions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSingleFaction = async (req, res) => {
  const { _id } = req.params;

  try {
    const faction = await Faction.findById(_id);
    if (!faction) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }
    return res.status(200).json(faction);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahFaction = async (req, res) => {
  const { name, description } = req.body;

  try {
    await factionValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekFaction = await Faction.findOne({ name: name });

    if (cekFaction) {
      return res.status(400).json({ message: "Faction sudah ada!" });
    }

    const result = await Faction.create({
      name: name,
      description: description,
    });

    return res.status(201).json({
      message: "Faction berhasil ditambahkan!",
      faction: {
        id: result._id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateFaction = async (req, res) => {
  const { _id } = req.params;
  const { name, description } = req.body;

  try {
    await factionValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekFaction = await Faction.findById(_id);

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    cekFaction.name = name;
    cekFaction.description = description;

    await cekFaction.save();

    return res
      .status(200)
      .json({ message: `Faction ${cekFaction.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteFaction = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekFaction = await Faction.findById(_id);
    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    await Faction.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `Faction ${cekFaction.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllLeader = async (req, res) => {
  const { name } = req.query;
  try {
    let search = {};

    if (name) {
      search.name = new RegExp(name, "i");
    }

    const leaders = await Leader.find(search);

    return res.status(200).json(leaders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSingleLeader = async (req, res) => {
  const { _id } = req.params;

  try {
    const leader = await Leader.findById(_id);
    if (!leader) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }
    return res.status(200).json(leader);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahLeader = async (req, res) => {
  const { name, faction, effect } = req.body;

  try {
    await leaderValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekLeader = await Leader.findOne({ name: name });

    if (cekLeader) {
      return res.status(400).json({ message: "Leader sudah ada!" });
    }

    const cekFaction = await Faction.findOne({ name: faction });

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    const result = await Leader.create({
      name: name,
      faction: cekFaction._id,
      effect: effect,
    });

    return res.status(201).json({
      message: "Leader berhasil ditambahkan!",
      leader: {
        id: result._id,
        name: result.name,
        faction: cekFaction._id,
        effect: result.effect,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateLeader = async (req, res) => {
  const { _id } = req.params;
  const { name, faction, effect } = req.body;

  try {
    await leaderValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekLeader = await Leader.findById(_id);

    if (!cekLeader) {
      return res.status(404).json({ message: "Leader tidak ditemukan!" });
    }

    const cekFaction = await Faction.findOne({ name: faction });

    if (!cekFaction) {
      return res.status(404).json({ message: "Faction tidak ditemukan!" });
    }

    cekLeader.name = name;
    cekLeader.faction = cekFaction._id;
    cekLeader.effect = effect;

    await cekLeader.save();

    return res
      .status(200)
      .json({ message: `Leader ${cekLeader.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteLeader = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekLeader = await Leader.findById(_id);
    if (!cekLeader) {
      return res.status(404).json({ message: "Leader tidak ditemukan!" });
    }

    await Leader.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `Leader ${cekLeader.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllTypeCard = async (req, res) => {
  const { name } = req.query;
  try {
    let search = {};

    if (name) {
      search.name = new RegExp(name, "i");
    }

    const typecards = await TypeCard.find(search);

    return res.status(200).json(typecards);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSingleTypeCard = async (req, res) => {
  const { _id } = req.params;

  try {
    const typecard = await TypeCard.findById(_id);
    if (!typecard) {
      return res.status(404).json({ message: "Kartu tidak ditemukan!" });
    }
    return res.status(200).json(typecard);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahTypeCard = async (req, res) => {
  const { name, description } = req.body;

  try {
    await typeValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekTypeCard = await TypeCard.findOne({ name: name });

    if (cekTypeCard) {
      return res.status(400).json({ message: "TypeCard sudah ada!" });
    }

    const result = await TypeCard.create({
      name: name,
      description: description,
    });

    return res.status(200).json({
      message: "TypeCard berhasil ditambahkan!",
      typeCard: {
        id: result._id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTypeCard = async (req, res) => {
  const { _id } = req.params;
  const { name, description } = req.body;

  try {
    await typeValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekTypeCard = await TypeCard.findById(_id);

    if (!cekTypeCard) {
      return res.status(404).json({ message: "TypeCard tidak ditemukan!" });
    }

    cekTypeCard.name = name;
    cekTypeCard.description = description;

    await cekTypeCard.save();

    return res
      .status(200)
      .json({ message: `TypeCard ${cekTypeCard.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteTypeCard = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekTypeCard = await TypeCard.findById(_id);
    if (!cekTypeCard) {
      return res.status(404).json({ message: "TypeCard tidak ditemukan!" });
    }

    await TypeCard.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `TypeCard ${cekTypeCard.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllPowerUp = async (req, res) => {
  const { name } = req.query;
  try {
    let search = {};

    if (name) {
      search.name = new RegExp(name, "i");
    }

    const powerUps = await PowerUp.find(search);

    return res.status(200).json(powerUps);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSinglePowerUp = async (req, res) => {
  const { _id } = req.params;

  try {
    const powerUp = await PowerUp.findById(_id);
    if (!powerUp) {
      return res.status(404).json({ message: "Power Up tidak ditemukan!" });
    }
    return res.status(200).json(powerUp);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const tambahPowerUp = async (req, res) => {
  const { name, description, harga } = req.body;

  try {
    await powerUpValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekPowerUp = await PowerUp.findOne({ name });

    if (cekPowerUp) {
      return res.status(400).json({ message: "Power Up sudah ada!" });
    }

    const result = await PowerUp.create({
      name,
      description,
      harga,
    });

    return res.status(201).json({
      message: "Power Up berhasil ditambahkan!",
      powerUp: {
        id: result._id,
        name: result.name,
        description: result.description,
        harga: result.harga,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updatePowerUp = async (req, res) => {
  const { _id } = req.params;
  const { name, description, harga } = req.body;

  try {
    await powerUpValidation.validateAsync(req.body, { abortEarly: false });
  } catch (validationError) {
    const errorMessages = validationError.details
      .map((detail) => detail.message)
      .join(", ");
    return res.status(400).json({ message: errorMessages });
  }

  try {
    const cekPowerUp = await PowerUp.findById(_id);

    if (!cekPowerUp) {
      return res.status(404).json({ message: "Power Up tidak ditemukan!" });
    }

    cekPowerUp.name = name;
    cekPowerUp.description = description;
    cekPowerUp.harga = harga;

    await cekPowerUp.save();

    return res
      .status(200)
      .json({ message: `Power Up ${cekPowerUp.name} berhasil diperbarui!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deletePowerUp = async (req, res) => {
  const { _id } = req.params;

  try {
    const cekPowerUp = await PowerUp.findById(_id);
    if (!cekPowerUp) {
      return res.status(404).json({ message: "Power Up tidak ditemukan!" });
    }

    await PowerUp.deleteOne({ _id });
    return res
      .status(200)
      .json({ message: `Power Up ${cekPowerUp.name} berhasil dihapus!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
