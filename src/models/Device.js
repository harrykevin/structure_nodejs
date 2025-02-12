import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "users",
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        lastSeen: {
            type: Date,
            default: Date.now(),
        },
        deviceType: {
            type: String,
            enum: ["android", "postman", "mac", "browser"],
            default: "postman",
        },
        deviceMAC: {
            type: String,
            default: null,
        },
        deviceToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Device = mongoose.model("devices", DeviceSchema);

export default Device;
