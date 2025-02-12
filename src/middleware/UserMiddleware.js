import User from "../models/User.js";
import { joseJwtDecrypt } from "../services/AccessTokenManagement/Tokens.js";

const tokenBlacklist = new Set();

export const UserMiddleware = async (req, res, next) => {
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];

  if (!AuthHeader) {
    return res.error("Unauthorized", 401);
  }

  const parts = AuthHeader.split(" ");

  try {
    if (parts.length !== 2) {
      return res.error("Unauthorized", 401);
    }

    const [scheme, token] = parts;

    // Validate Bearer scheme
    if (!/^Bearer$/i.test(scheme)) {
      return res.error("Unauthorized", 401);
    }

    // Check if the token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.error("Unauthorized", 401);
    }

    const UserToken = await joseJwtDecrypt(token);

    const UserDetail = await User.findOne({
      _id: UserToken.payload.uid,
    }).populate("image");

    if (!UserDetail) {
      return res.error("Unauthorized", 401);
    }

    UserDetail.tokenType = UserToken.payload.tokenType;
    req.user = UserDetail;

    return next();
  } catch (error) {
    console.error("UserMiddleware Error:", error);
    return res.error("Unauthorized", 401);
  }
};

export const addTokenToBlacklist = (token) => {
  tokenBlacklist.add(token);
};
