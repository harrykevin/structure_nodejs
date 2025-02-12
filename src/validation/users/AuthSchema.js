import Joi from "joi";

export function SignUpValidator(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(15).required().messages({
      "string.min": "Password should be at least 8 characters long",
      "string.max": "Password should be no more than 15 characters long",
      "any.required": "Password is required",
    }),
  }).unknown(true);
  handle(schema, req, res, next);
}

export function loginValidator(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(15).required().messages({
      "string.min": "Password should be at least 8 characters long",
      "string.max": "Password should be no more than 15 characters long",
      "any.required": "Password is required",
    }),
  }).unknown(true);
  handle(schema, req, res, next);
}

export function forgotValidator(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  }).unknown(true);
  handle(schema, req, res, next);
}

export function changePasswordValidator(req, res, next) {
  const schema = Joi.object({
    password: Joi.string().required().messages({
      "string.pattern.base":
        "Password should be 8 characters long should contain uppercase, lowercase, numeric and special character",
      "any.required": "Password is required",
    }),
    confirm_password: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Password must match",
        "any.required": "Confirm password is required",
      }),
  }).unknown(true);
  handle(schema, req, res, next);
}

export function updateProfileValidator(req, res, next) {
  const schema = Joi.object({
    fullname: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    zip: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
  }).unknown(true);
  handle(schema, req, res, next);
}

export function OtpValidator(req, res, next) {
  const schema = Joi.object({
    otp: Joi.string().required(),
  }).unknown(true);
  handle(schema, req, res, next);
}

function handle(schema, req, res, next) {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = {};
    error.details.forEach((err) => {
      errors[err.context.key] = err.message;
    });
    return res.error(error.details[0].message, 400);
  }
  next();
}
