import User from "../models/User.js";
import { joseJwtDecrypt } from "../services/AccessTokenManagement/Tokens.js";

const tokenBlacklist = new Set();

export const AdminMiddleware = async (req, res, next) => {
  // Check for token in authorization, authentication headers, or other locations
  const AuthHeader =
    req.headers.authorization ||
    req.headers.authentication || // Added check for 'authentication'
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];

  if (!AuthHeader) {
    return res.error("Unauthorized", 401);
  }

  let token = AuthHeader;
  // If token contains "Bearer" scheme, remove it
  if (AuthHeader.startsWith("Bearer ")) {
    token = AuthHeader.split(" ")[1];
  }

  try {
    const UserToken = await joseJwtDecrypt(token);

    const UserDetail = await User.findOne({
      _id: UserToken.payload.uid,
    }).populate("image");

    if (!UserDetail || UserDetail.userType !== "admin") {
      return res.error("Unauthorized", 401);
    }

    req.user = UserDetail;
    return next();
  } catch (error) {
    console.error("AdminMiddleware Error:", error);
    return res.error("Unauthorized", 401);
  }
};

export const addTokenToBlacklist = (token) => {
  tokenBlacklist.add(token);
};
