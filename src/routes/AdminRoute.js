import { Router, application } from "express";

import AuthController from "../controllers/admin/AuthController.js";

import {
  OtpValidator,
  forgotValidator,
  updateProfileValidator,
  changePasswordValidator,
} from "../validation/admin/AuthSchema.js";

import { AdminMiddleware } from "../middleware/AdminMiddleware.js";
import { handleMultipartData } from "../services/multipart.js";
export let AdminRoutes = Router();

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(AdminRoutes);
  this.use(path, middleware, AdminRoutes);
  return AdminRoutes;
};

AdminRoutes.route("/admin-signup").get(AuthController.signup);
AdminRoutes.route("/admin-login").post(AuthController.login);

AdminRoutes.prefix("/admin", AdminMiddleware, () => {
  AdminRoutes.route("/switch-notification").post(
    AuthController.switchNotification
  );
  AdminRoutes.route("/update/device-token").post(
    AuthController.updateDeviceToken
  );
  AdminRoutes.route("/forgot").post(forgotValidator, AuthController.forgot);
  AdminRoutes.route("/viewAdminProfile").get(AuthController.viewUserProfile);
  AdminRoutes.route("/updateProfile").post(
    handleMultipartData.fields([{ name: "image" }]),
    // updateProfileValidator,
    AuthController.updateProfile
  );
  AdminRoutes.route("/sendotp").post(AuthController.sendOtp);
  AdminRoutes.route("/verifyotp").post(OtpValidator, AuthController.verifyOtp);
  AdminRoutes.route("/changePassword").post(
    changePasswordValidator,
    AuthController.changePassword
  );
  AdminRoutes.route("/logout").get(AuthController.logout);

});
