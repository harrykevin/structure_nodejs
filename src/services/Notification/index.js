import admin from "firebase-admin";
import { createRequire } from "module"; // To use `require` in ES modules
import Notification from "../../models/Notification.js";
import Device from "../../models/Device.js";

const require = createRequire(import.meta.url);
const serviceAccount = require("./ink-bliss-firebase-sdk.json"); // Use `require` for the JSON import


// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Send a notification using Firebase Admin SDK.
 * @param {Object} message - The notification message object.
 * @returns {Promise} - A promise that resolves with the response or rejects with an error.
 */
export const sendNotification = (message) => {
  return admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      // throw new Error(`Firebase Error: ${error.message}`);
    });
};

/**
 * Send a notification to a specific device and save it to MongoDB.
 * @param {ObjectId} senderId - ID of the user sending the notification.
 * @param {ObjectId} receiverId - ID of the user receiving the notification.
 * @param {String} title - Title of the notification.
 * @param {String} message - Message body of the notification.
 * @param {Object} [payload] - Optional additional data to include with the notification.
 * @returns {Promise<Object>} - Returns an object containing the response from Firebase and the saved notification.
 */
export const notifyUser = async (
  senderId,
  receiverId,
  title,
  message,
  payload = {}
) => {
  // Find all devices for the user to get all device tokens
  const devices = await Device.find({ user: receiverId });
  // if (!device || !device.deviceToken) {
  //   throw new Error("Device token not found for the receiver.");
  // }

  if (devices) {
    devices.forEach(async (device, index) => {
      const token = device.deviceToken;
      console.log(`check token on loop ${index}: `, token);
      
      const messageObj = {
        notification: {
          title,
          body: message,
        },
        token, // Use device token for sending notification to a specific device
        data: payload, // Include any additional data as payload
      };
      await sendNotification(messageObj);
    });
  }

  try {

    // Save notification to MongoDB
    const notification = new Notification({
      sender: senderId,
      receiver: receiverId,
      title,
      message,
      payload,
    });
    await notification.save();

    return { notification };
  } catch (error) {
    console.error("Error in sending or saving notification:", error);
    // throw new Error(`Notification Error: ${error.message}`);
  }
};
