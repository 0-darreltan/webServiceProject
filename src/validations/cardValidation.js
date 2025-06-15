const Joi = require("joi");

const cardValidation = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": `Nama kartu harusstring`,
    "string.min": `Nama kartu minimal 3 karakter`,
    "string.max": `Nama kartu maksimal 50 karakter`,
    "any.required": `Nama kartu tidak boleh kosong`,
  }),
  faction: Joi.string().required().messages({
    "string.base": `Faction harus string`,
    "any.required": `Faction tidak boleh kosong`,
  }),
  type: Joi.string().required().messages({
    "string.base": `Tipe harus string`,
    "any.required": `Tipe tidak boleh kosong`,
  }),
  ability: Joi.array()
    .items(Joi.string().empty(""))
    .min(0)
    .max(2)
    .optional()
    .messages({
      "array.base": `Ability harus array`,
      "array.min": `Ability minimal harus 0`,
      "array.max": `Ability maksimal hanya boleh 2`,
      "string.base": `Setiap ability di dalam array harus berupa teks`,
      "string.empty": `Ability di dalam array tidak boleh kosong`,
    }),
  power: Joi.number().min(0).max(20).required().messages({
    "any.required": `Power tidak boleh kosong`,
    "number.min": `Power minimal 0`,
    "number.max": `Power maksimal 20`,
  }),
});

const factionValidation = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": `Nama faksi harus string`,
    "string.min": `Nama faksi minimal 3 karakter`,
    "string.max": `Nama faksi maksimal 50 karakter`,
    "any.required": `Nama faksi tidak boleh kosong`,
  }),
  description: Joi.string().min(10).max(500).required().messages({
    "string.base": `Deskripsi faksi harus string`,
    "string.min": `Deskripsi faksi minimal 10 karakter`,
    "string.max": `Deskripsi faksi maksimal 500 karakter`,
    "any.required": `Deskripsi faksi tidak boleh kosong`,
  }),
});

const typeValidation = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": `Nama tipe card harus string`,
    "string.min": `Nama tipe card minimal 3 karakter`,
    "string.max": `Nama tipe card maksimal 50 karakter`,
    "any.required": `Nama tipe card tidak boleh kosong`,
  }),
  description: Joi.string().min(10).max(500).required().messages({
    "string.base": `Deskripsi tipe card harus string`,
    "string.min": `Deskripsi tipe card minimal 10 karakter`,
    "string.max": `Deskripsi tipe card maksimal 500 karakter`,
    "any.required": `Deskripsi tipe card tidak boleh kosong`,
  }),
});

const abilityValidation = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": `Nama ability harus string`,
    "string.min": `Nama ability minimal 3 karakter`,
    "string.max": `Nama ability maksimal 50 karakter`,
    "any.required": `Nama ability tidak boleh kosong`,
  }),
  description: Joi.string().min(10).max(500).required().messages({
    "string.base": `Deskripsi ability harus string`,
    "string.min": `Deskripsi ability minimal 10 karakter`,
    "string.max": `Deskripsi ability maksimal 500 karakter`,
    "any.required": `Deskripsi ability tidak boleh kosong`,
  }),
});

const leaderValidation = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": `Nama leader harus string`,
    "string.min": `Nama leader minimal 3 karakter`,
    "string.max": `Nama leader maksimal 50 karakter`,
    "any.required": `Nama leader tidak boleh kosong`,
  }),
  faction: Joi.string().required().messages({
    "string.base": `Faction harus string`,
    "any.required": `Faction tidak boleh kosong`,
  }),
  effect: Joi.string().required().messages({
    "string.base": `Effect harus string`,
    "any.required": `Effect tidak boleh kosong`,
  }),
});

module.exports = {
  cardValidation,
  factionValidation,
  typeValidation,
  abilityValidation,
  leaderValidation,
};
