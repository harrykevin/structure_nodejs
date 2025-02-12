import User from "../../models/User.js";
import {
  comparePassword,
  hashPassword,
} from "../../services/SecuringPassword.js";
import { generateOTP } from "../../services/helper/index.js";
import { sendEmails, getFileContent } from "../../services/mailerService.js";
import { tokenGen } from "../../services/AccessTokenManagement/Tokens.js";
import { linkUserDevice, unlinkUserDevice } from "../../services/linkUserDevice.js";
import { addTokenToBlacklist } from "../../middleware/UserMiddleware.js";
import { UserTransformer } from "../../services/transformers/UserTransformer.js";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.error("User Not Found", 404);
    }

    const isPasswordValid = comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.error("Invalid Password", 500);
    }

    const token = await tokenGen(
      { id: user._id, userType: user.userType },
      "auth"
    );

    // Assuming you want to add the token to the userModel object
    const adminModelWithToken = {
      ...user.toObject(), // Convert userModel to a plain JavaScript object
      token: token,
    };

    var response = UserTransformer(adminModelWithToken);

    return res.success("Admin login successfully", response);
  } catch (error) {
    console.log("🚀 ~ login ~ error:", error);
    return res.error("Internal server error", 500);
  }
};

const signup = async (req, res, next) => {
  try {
    // Check if an admin with the given email already exists
    const existingAdmin = await User.findOne({
      email: "superadmin@trustman-roofing.com",
    });

    if (existingAdmin) {
      return res.error("Admin with this email already exists", 400);
    }

    // Create new admin
    const admin = new User();
    admin.email = "superadmin@trustman-roofing.com";
    admin.password = hashPassword("admin1234");
    admin.userType = "admin";
    admin.fullname = "super admin";
    admin.is_verified = true;
    await admin.save();

    // Generate authentication token
    const token = await tokenGen(
      { id: admin._id, userType: admin.userType },
      "auth"
    );

    // Construct response with token
    const adminModelWithToken = {
      ...admin.toObject(),
      token,
    };

    var response = UserTransformer(adminModelWithToken);

    return res.success("Admin created successfully", response);
  } catch (error) {
    console.error("Signup error:", error);
    return res.error("Internal server error", 500);
    next(error);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user) {
      return res.sendResponse(400, false, "User not found", []);
    }

    const userOtp = generateOTP();

    // Update the user with the new OTP
    const updateUser = await User.findByIdAndUpdate(
      user._id,
      { otp: userOtp },
      { new: true }
    );

    if (!updateUser) {
      return res.sendResponse(404, false, "User update failed", []);
    }

    // Prepare and send the OTP verification email
    const to = user.email;
    const subject = "Confirmation Email OTP Verification";
    let template = await getFileContent(
      "src/services/emails/otpVerification.html"
    );
    template = template.replace("{{otp}}", userOtp);

    sendEmails(to, subject, template, null, (err) => {
      if (err) {
        console.error("Error sending email:", err.message);
        return res.sendResponse(500, false, "Failed to send OTP email", []);
      }
    });

    // Respond with the updated user data
    res.sendResponse(200, true, "OTP resent successfully", updateUser);
  } catch (error) {
    console.error("Send OTP error:", error);
    res.sendResponse(500, false, "Internal server error", []);
    next(error);
  }
};

const forgot = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.sendResponse(404, false, "User not found", []);
    }

    // Generate OTP and update user
    const userOtp = generateOTP();
    const updateUser = await User.findByIdAndUpdate(
      user._id,
      { otp: userOtp },
      { new: true }
    );

    if (!updateUser) {
      return res.sendResponse(500, false, "Failed to update user with OTP", []);
    }

    // Prepare and send OTP email
    const to = user.email;
    const subject = "Forgot Password OTP Verification";
    let template = await getFileContent(
      "src/services/emails/otpVerification.html"
    );
    template = template.replace("{{otp}}", userOtp);

    sendEmails(to, subject, template, null, (err) => {
      if (err) {
        console.error("Error sending email:", err.message);
        return res.sendResponse(500, false, "Failed to send OTP email", []);
      }
    });

    // Respond with success
    res.sendResponse(200, true, "Email sent successfully", updateUser);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.sendResponse(500, false, "Internal server error", []);
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { user, body } = req;

    console.log("body.otp === user.otp", body.otp, user.otp);

    // Check if the user exists
    if (!user) {
      return res.sendResponse(400, false, "User not found", []);
    }

    // Verify OTP
    if (body.otp === user.otp) {
      // Update user with verified status
      const userData = {
        otp: "",
        is_verified: true,
      };

      const updateUser = await User.findByIdAndUpdate(user._id, userData, {
        new: true,
      });

      if (!updateUser) {
        return res.sendResponse(
          500,
          false,
          "Failed to update user verification status",
          []
        );
      }

      return res.sendResponse(
        200,
        true,
        "Otp verified successfully",
        updateUser
      );
    }

    return res.sendResponse(400, false, "Invalid OTP", []);
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.sendResponse(500, false, "Internal server error", []);
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { user, body } = req;

    // Check if the user exists
    if (!user) {
      return res.error("User not found", 400);
    }

    // Hash the new password
    const hashedPassword = hashPassword(body.password);

    // Prepare data to update user
    const updateUserData = { password: hashedPassword };

    // Update the user's password
    const updateUser = await User.findByIdAndUpdate(user._id, updateUserData, {
      new: true,
    });

    if (!updateUser) {
      return res.error("Failed to update password", 500);
    }

    const userModelWithToken = {
      ...updateUser.toObject(),
      token: null,
    };

    var response = UserTransformer(userModelWithToken);

    // Respond with success
    return res.success("Password updated successfully", response);
  } catch (error) {
    console.error("Change password error:", error);
    return res.error("Internal server error", 500);
    next(error);
  }
};

const logout = async (req, res) => {
  try {
    const AuthHeader =
      req.headers.authorization ||
      req.body.token ||
      req.query.token ||
      req.headers["x-access-token"];

    if (!AuthHeader) {
      return res.sendResponse(400, false, "Token not provided", []);
    }

    const parts = AuthHeader.split(" ");
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      return res.sendResponse(400, false, "Invalid token format", []);
    }

    const token = parts[1];

    // Add token to the blacklist
    addTokenToBlacklist(token);

    const { deviceType, deviceToken } = req.body;

    unlinkUserDevice(req.user._id, deviceToken, deviceType);

    res.sendResponse(200, true, "User Logout Successfully", []);
  } catch (error) {
    return res.sendResponse(500, false, error.message, []);
  }
};

const viewUserProfile = async (req, res) => {
  try {
    const { user, body } = req;

    // Check if the user exists
    if (!user) {
      return res.error("User not found", 400);
    }

    // Construct response with token
    const userModelWithToken = {
      ...user.toObject(),
      token: null,
    };

    var response = UserTransformer(userModelWithToken);

    // Respond with success
    return res.success("user found successfully", response);
  } catch (error) {
    return res.sendResponse(500, false, error.message, []);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { user, body, files } = req;

    // Check if the user exists
    if (!user) {
      return res.error("User not found", 400);
    }

    // Find previous record of user
    const previousUser = await User.findById(user._id);

    // Initialize variable for profile image
    let image = null;

    // Handle file upload if an image is provided
    if (files?.image?.[0]) {
      console.log("files.image[0].filename", files.image[0]);

      if (files && files?.image?.[0]?.filename) {
        image = files?.image?.[0]?.filename;
      } else {
        console.log("file.key", files?.image?.[0]?.key);
        console.log("req.file.key path.basename", basename(files?.image?.[0]?.key));
        image = basename(files?.image?.[0]?.key);
      }
    } else {
      image = previousUser.image;
    }

    // Prepare data to update user profile
    const userData = {
      fullname: body.fullname,
      gender: body.gender,
      dob: body.dob,
      image: image,
      phone: body.phone,
      address: body.address,
      city: body.city,
      zip: body.zip,
      state: body.state,
      country: body.country,
      is_profile_completed: true,
    };

    // Update the user's profile
    const updateUser = await User.findByIdAndUpdate(user._id, userData, {
      new: true,
    });

    if (!updateUser) {
      return res.error("Failed to update user profile", 405);
    }
    // Construct response with token
    const userModelWithToken = {
      ...updateUser.toObject(),
    };

    var response = UserTransformer(userModelWithToken);

    // Respond with success
    return res.success("Profile updated successfully", response);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.error("Internal server error", 500);
    next(error);
  }
};

const updateDeviceToken = async (req, res, next) => {
  const { body, user } = req;

  try {
    // Fetch default addresses
    const shippingAddress = await UserAddress.findOne({
      user: user._id,
      type: "shipping",
      mark_as_default: true,
    });
    const billingAddress = await UserAddress.findOne({
      user: user._id,
      type: "billing",
      mark_as_default: true,
    });
    const paymentCard = await PaymentCard.findOne({
      user: user._id,
      set_as_default: true,
    });

    // Link the user device
    const linkedDevice = await linkUserDevice(
      user._id,
      body.deviceToken,
      body.deviceType
    );
    if (linkedDevice.error) {
      return res.error(linkedDevice.error, 500);
    }

    // Construct response with token
    const userModelWithToken = {
      ...user.toObject(),
      payment_card: paymentCard,
      shipping: shippingAddress,
      billing: billingAddress,
      device: linkedDevice.device, // Include device info in response if needed
    };

    var response = UserTransformer(userModelWithToken);

    return res.success("User Device Token Update in successfully", response);
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    return res.error("Internal server error", 500);
  }
};

const switchNotification = async (req, res, next) => {
  try {
    const { user, body } = req;

    // Ensure `is_notification` is provided in the request body
    if (typeof body.is_notification === "undefined") {
      return res.error("Notification status is required", 400);
    }

    // Prepare data to update user profile
    const userData = {
      notification_on:
        body.is_notification === true || body.is_notification === "true",
    };

    // Update the user's profile
    const updateUser = await User.findByIdAndUpdate(user._id, userData, {
      new: true,
    });

    if (!updateUser) {
      return res.error("Failed to update user profile", 405);
    }

    // Transform user data and include token if needed
    const userModelWithToken = updateUser.toObject();

    var response = UserTransformer(userModelWithToken);

    // Respond with success
    return res.success("Notification updated successfully", response);
  } catch (error) {
    console.error("Update notification error:", error);
    return res.error("Internal server error", 500);
    next(error);
  }
};

const AuthController = {
  signup,
  verifyOtp,
  sendOtp,
  login,
  updateProfile,
  forgot,
  changePassword,
  viewUserProfile,
  logout,
  switchNotification,
  updateDeviceToken,
};

export default AuthController;
