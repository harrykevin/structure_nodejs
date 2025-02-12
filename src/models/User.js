import mongoose from "mongoose";

const BASE_URL = "http://localhost:6002/src/services/uploads/images/";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      trim: true,
    },
    fullname: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    code: {
      type: Number,
      trim: true,
    },
    image: {
      type: String,
      required: false,
    },
    dob: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    zip: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    gender: {
      type: String,
      default: "",
      required: false,
    },
    userType: {
      type: String,
      enum: ["admin", "user", "guest"],
      default: "user",
      required: true,
    },
    soicalType: {
      type: String,
      enum: ["facebook", "google", "ink"],
      default: "ink",
      required: true,
    },
    otp: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    deleted_email: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    is_artist: {
      type: Boolean,
      default: false,
    },
    is_affiliate: {
      type: Boolean,
      default: false,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    notification_on: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

// Add virtual property for full image URL
UserSchema.virtual("imageUrl").get(function () {
  if (this.image) {
    return `${BASE_URL}${this.image}`;
  }
  return null;
});

UserSchema.index({ coordinates: "2dsphere" });

// Define the virtual field for device
UserSchema.virtual("device", {
  ref: "devices", // Corrected model reference
  localField: "_id", // Field in the Art schema
  foreignField: "user", // Field in the ArtImage schema
  justOne: false, // False because it's a one-to-many relationship
});

// Ensure virtual fields are included in JSON and object responses
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

const User = mongoose.model("users", UserSchema);
export default User;
