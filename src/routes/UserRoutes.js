import { Router, application } from "express";

// Import All Controller Here
import AuthController from "../controllers/user/AuthController.js";

// Import All Validation Here
import {
  SignUpValidator,
  loginValidator,
  forgotValidator,
  updateProfileValidator,
  changePasswordValidator,
} from "../validation/users/AuthSchema.js";

// Import All Other Work Like Middleware, Multipart etc Here
import { UserMiddleware } from "../middleware/UserMiddleware.js";
import { handleMultipartData } from "../services/multipart.js";

export let UserRoutes = Router();

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(UserRoutes);
  this.use(path, middleware, UserRoutes);
  return UserRoutes;
};

UserRoutes.route("/signup").post(SignUpValidator, AuthController.signup);
UserRoutes.route("/login").post(loginValidator, AuthController.login);
UserRoutes.route("/social/login").post(AuthController.socialLogin);
UserRoutes.route("/forgot").post(forgotValidator, AuthController.forgot);


UserRoutes.prefix("/user", UserMiddleware, () => {
  UserRoutes.route("/viewUserProfile").get(AuthController.viewUserProfile);
  UserRoutes.route("/createProfile").post(
    handleMultipartData.fields([{ name: "image" }]),
    updateProfileValidator,
    AuthController.updateProfile
  );
  UserRoutes.route("/verifyotp").post(AuthController.verifyOtp);
  UserRoutes.route("/update/device-token").post(
    AuthController.updateDeviceToken
  );
  UserRoutes.route("/sendotp").post(AuthController.sendOtp);
  UserRoutes.route("/changePassword").post(
    changePasswordValidator,
    AuthController.changePassword
  );
  UserRoutes.route("/logout").get(AuthController.logout);

});
