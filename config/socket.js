import { Server } from "socket.io";
import User from "../src/models/User.js"; // Assuming User model exists

// Middleware function to log incoming events
function logEvents(socket, next) {
  console.log(`Received event: ${socket.event}`);
  next(); // Call next to continue to the event handler
}

export function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Define your frontend URL here
    },
  });

  // Apply middleware
  io.use(logEvents);

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    const chatId = socket.handshake.query.chatId;

    // Mark user as online when they connect
    await User.findByIdAndUpdate(userId, { isOnline: true });
    console.log(`User ${userId} connected and marked as online`);

    // Handle typing event
    socket.on("typing", (data) => {
      socket.broadcast.to(chatId).emit("userTyping", {
        userId: data.userId,
        isTyping: true,
      });
      console.log(`User ${data.userId} is typing in chat ${chatId}`);
    });

    // Handle stop typing event
    socket.on("stopTyping", (data) => {
      socket.broadcast.to(chatId).emit("userTyping", {
        userId: data.userId,
        isTyping: false,
      });
      console.log(`User ${data.userId} stopped typing in chat ${chatId}`);
    });

    // Handle disconnect and mark user as offline
    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(userId, { isOnline: false });
      console.log(`User ${userId} disconnected and marked as offline`);
    });
  });
}

export default initializeSocket;
