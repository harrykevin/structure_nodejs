import { Server } from "socket.io";
import User from "../../models/User.js";

export let io; // Declare io globally so it can be used in other files

// Middleware function to log incoming events
function logEvents(socket, next) {
  console.log(`Received event: ${socket.event}`);
  next(); // Call next to continue to the event handler
}

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Define your frontend URL here
    },
  });

  // Apply middleware
  io.use(logEvents);

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    const chatId = socket.handshake.query.chatId;
    console.log('SocketUserId', userId);
    console.log('SocketChatId', chatId);

    console.log("A user connected");

    HandleTypingEvent(socket, userId, chatId)

    socket.on('message', (message) => {
      console.log('Message received:', message);

      // Send message to all clients, including the one that sent the message
      trigger('messageResponse', { message }, (error) => {
        if (error) {
          console.error('Error during emit:', error);
        } else {
          console.log('Message sent to all clients');
        }
      });
    });

    socket.on("disconnect", async () => {
      if (userId) {
        await User.findByIdAndUpdate(userId, { isOnline: false });
      }
      console.log("User disconnected");
    });
  });
}

export function trigger(eventName, data, callback) {
  if (!io) {
    console.error("Socket.io instance not initialized");
    if (callback) callback(new Error("Socket.io not initialized"));
    return;
  }

  io.emit(eventName, data, (error) => {
    if (error) {
      console.error("Socket emit failed:", error);
      if (callback) {
        callback(error);
      }
    } else {
      console.log("Socket emit successful for event:", eventName);
      console.log("Socket emit data:", data);
      if (callback) {
        callback(null); // No error
      }
    }
  });
}

export const HandleTypingEvent = async (socket, userId, chatId) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { isOnline: true });
  }
  console.log(`User ${userId} connected and marked as online`);

  // Handle typing event
  socket.on("typing", (data) => {
    socket.broadcast.to(chatId).emit("userTyping", {
      userId: data.userId,
      message: `User ${data.userId} is typing in chat ${chatId}`,
      isTyping: true,
    });
    console.log(`User ${data.userId} is typing in chat ${chatId}`);
  });

};

export const HandleStopTypingEvent = async (socket, userId, chatId) => {
  console.log(`User ${userId} connected and marked as online`);

  // Handle typing event
  socket.on("stopTyping", (data) => {
    socket.broadcast.to(chatId).emit("userTyping", {
      userId: data.userId,
      isTyping: false,
    });
    console.log(`User ${data.userId} stopped typing in chat ${chatId}`);
  });

};

export default { initializeSocket };
