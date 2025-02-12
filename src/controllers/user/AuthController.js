import User from "../../models/User.js";
import {
  comparePassword,
  hashPassword,
} from "../../services/SecuringPassword.js";
import { generateOTP } from "../../services/helper/index.js";
import { sendEmails, getFileContent } from "../../services/mailerService.js";
import { tokenGen } from "../../services/AccessTokenManagement/Tokens.js";
import {
  linkUserDevice,
  unlinkUserDevice,
} from "../../services/linkUserDevice.js";
import { addTokenToBlacklist } from "../../middleware/UserMiddleware.js";
import { UserTransformer } from "../../services/transformers/UserTransformer.js";
import { basename } from 'path';

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email }).populate('device');

    // Check if the user exists
    if (!user) {
      return res.error("User Not Found", 404);
    }

    // Validate the password
    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.error("Invalid Password", 404);
    }

    if (!user.is_verified) {
      sendOTPEmail("Confirmation Email OTP Verification", user.email);
    }

    // Generate a token
    const token = await tokenGen(
      { id: user._id, userType: user.userType },
      "auth"
    );
    // Construct response with token
    const userModelWithToken = {
      ...user.toObject(),
      token,
    };

    var response = UserTransformer(userModelWithToken);

    let exceptionMessage = "User logged in successfully";

    if (!user.is_verified) {
      exceptionMessage = "First verify your account";
    }

    return res.success(exceptionMessage, response);
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    return res.error("Internal server error", 500);
  }
};

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.error("Email already exists", 400);
    }

    // Hash the password and generate OTP
    const hashedPassword = hashPassword(password);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    sendOTPEmail("Confirmation Email OTP Verification", email);

    // Generate authentication token
    const token = await tokenGen(
      { id: newUser._id, userType: newUser.userType },
      "auth"
    );

    // Construct response with token
    const userModelWithToken = {
      ...newUser.toObject(),
      token,
    };

    var response = UserTransformer(userModelWithToken);

    return res.success("Otp sent to registered email", response);
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
      return res.error("Email already exists", 400);
    }

    // Update the user with the new OTP
    const updateUser = await User.findById(user._id);

    // Prepare and send the OTP verification email
    sendOTPEmail("Confirmation Email OTP Verification", user.email);

    // Generate authentication token
    const token = await tokenGen(
      { id: updateUser._id, userType: updateUser.userType },
      "auth"
    );

    // Construct response with token
    const userModelWithToken = {
      ...updateUser.toObject(),
      token,
    };

    var response = UserTransformer(userModelWithToken);

    // Respond with the updated user data
    return res.success("Otp sent to registered email", response);
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.error("Internal server error", 500);
    next(error);
  }
};

const forgot = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.error("User not found", 404);
    }
    // Generate OTP and update user
    const updateUser = await User.findById(user._id);

    sendOTPEmail("Forgot Password OTP Verification", user.email);

    // Generate authentication token
    const token = await tokenGen(
      { id: updateUser._id, userType: updateUser.userType },
      "auth"
    );

    // Construct response with token
    const userModelWithToken = {
      ...updateUser.toObject(),
      token,
    };

    var response = UserTransformer(userModelWithToken);

    // Respond with the updated user data
    return res.success("OTP sent successfully", response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.error("Internal server error", 500);
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { user, body } = req;

    // Check if the user exists
    if (!user) return res.error("User not found", 400);

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
        return res.error("Failed to update user verification status", 500);
      }

      // Generate authentication token
      const token = await tokenGen(
        { id: user._id, userType: user.userType },
        "auth"
      );

      // Construct response with token
      const userModelWithToken = {
        ...user.toObject(),
        token,
      };

      var response = UserTransformer(userModelWithToken);

      return res.success("Otp verified successfully", response);
    }

    return res.error("Invalid OTP", 400);
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.error("Internal server error", 500);
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
    console.log("files.image[0].filename", files);
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

const sendOTPEmail = async (subject, email) => {
  try {
    // Generate OTP
    const otp = generateOTP();

    // Find the user by email
    const data = await User.findOne({ email });

    if (!data) {
      console.error("User not found");
    }

    // Update the user's profile with the new OTP
    await User.findByIdAndUpdate(data.id, { otp }, { new: true });

    // Prepare and send the OTP verification email
    // const subject = "Confirmation Email OTP Verification";
    let template = await getFileContent(
      "src/services/emails/otpVerification.html"
    );
    template = template.replace("{{otp}}", otp);

    sendEmails(email, subject, template, null, (err) => {
      if (err) {
        console.error("Error sending email:", err.message);
      }
    });
  } catch (error) {
    console.error("Error in sendOTPEmail:", error.message);
  }
};

const updateDeviceToken = async (req, res, next) => {
  const { body, user } = req;

  try {
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

const socialLogin = async (req, res) => {
  const { email, phone_number, soicalType } = req.body;

  try {
    // Try to find the user by email or phone number
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (phone_number) {
      user = await User.findOne({ phone: phone_number });
    }

    if (user) {
      await user.save();

      // Generate token
      const token = await tokenGen({ id: user._id, userType: user.userType }, "auth");

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

      // Construct response with token
      const userModelWithToken = {
        ...user.toObject(),
        token,
        payment_card: paymentCard,
        shipping: shippingAddress,
        billing: billingAddress,
      };

      return res.success("Login successfully", UserTransformer(userModelWithToken));
    } else {
      // User doesn't exist, create a new user
      const newUser = new User({
        email,
        soicalType,
        phone: phone_number,
        userType: "user", // Default user type
      });

      await newUser.save();

      // Generate token
      const token = await tokenGen({ id: newUser._id, userType: newUser.userType }, "auth");

      // Fetch default addresses
      const shippingAddress = await UserAddress.findOne({
        user: newUser._id,
        type: "shipping",
        mark_as_default: true,
      });
      const billingAddress = await UserAddress.findOne({
        user: newUser._id,
        type: "billing",
        mark_as_default: true,
      });
      const paymentCard = await PaymentCard.findOne({
        user: newUser._id,
        set_as_default: true,
      });

      // Construct response with token
      const userModelWithToken = {
        ...newUser.toObject(),
        token,
        payment_card: paymentCard,
        shipping: shippingAddress,
        billing: billingAddress,
      };

      return res.success("Sign up successfully", UserTransformer(userModelWithToken));
    }
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    return res.error("Internal server error", 500);
  }
};


const AuthController = {
  switchNotification,
  signup,
  verifyOtp,
  sendOtp,
  login,
  socialLogin,
  updateProfile,
  forgot,
  changePassword,
  viewUserProfile,
  updateDeviceToken,
  logout,
};

export default AuthController;
