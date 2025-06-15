const Joi = require("joi");

const registerValidation = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.base": `Username harus string`,
    "string.alphanum": `Username hanya boleh alfanumerik`,
    "string.min": `Username minimal 3 karakter`,
    "string.max": `Username maksimal 30 karakter`,
    "any.required": `Username tidak boleh kosong`,
  }),
  email: Joi.string().email().required().messages({
    "string.base": `Email harus string`,
    "string.email": `Email tidak valid`,
    "any.required": `Email tidak boleh kosong`,
  }),
  password: Joi.string().min(6).required().messages({
    "string.base": `Password harus string`,
    "string.min": `Password minimal 6 karakter`,
    "any.required": `Password tidak boleh kosong`,
  }),
  role: Joi.string().valid("player", "admin").required().messages({
    "string.base": `Role harus string`,
    "any.only": `Role harus 'player' atau 'admin'`,
    "any.required": `Role tidak boleh kosong`,
  }),
});

const loginValidation = Joi.object({
  username: Joi.string().required().messages({
    "string.base": `Username harus string`,
    "any.required": `Username tidak boleh kosong`,
  }),
  password: Joi.string().required().messages({
    "string.base": `Password harus string`,
    "any.required": `Password tidak boleh kosong`,
  }),
});

module.exports = {
  registerValidation,
  loginValidation,
};
