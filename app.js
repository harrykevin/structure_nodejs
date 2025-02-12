import { createServer as createHttpsServer } from "https"; // For HTTPS server
import { createServer as createHttpServer } from "http"; // For HTTP server

import { connectDB } from "./src/services/mongoose.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import morganBody from "morgan-body";
import bodyParser from "body-parser";
import fs from "fs";

// Import Socket.io
import { initializeSocket } from "./src/services/socketio/index.js";

// Routes
import { UserRoutes } from "./src/routes/UserRoutes.js";
import { AdminRoutes } from "./src/routes/AdminRoute.js";

// Middleware
import responseMiddleware from "./src/middleware/ResponseMiddleware.js";

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

export const imagesDir = path.join(__dirname, "src/services/uploads/images/");
app.use("/images", express.static(imagesDir));

const API_PreFix = "/api/v1";

// Determine if HTTPS is required based on APP_ENV
const isProduction = process.env.APP_ENV === "production";

let server;

if (isProduction) {
  console.log("Running in production with HTTPS");

  // Configure HTTPS server with SSL certificates
  server = createHttpsServer(
    {
      key: fs.readFileSync(
        ""
      ),
      cert: fs.readFileSync(
        ""
      ),
      ca: fs.readFileSync(
        ""
      ),
    },
    app
  );

  server;
} else {
  console.log("Running in development with HTTP");

  // Configure plain HTTP server
  server = createHttpServer(app);
}


const port = process.env.PORT || 6002;        // HTTP/HTTPS server

var corsOptions = {
  origin: "*", // Allow all origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow specific HTTP methods
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization", // Allow specific headers
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Handle URL-encoded data
app.use(morgan("dev"));
app.use(responseMiddleware);

app.get("/test-image", (req, res) => {
  res.sendFile(path.join(imagesDir, "10pearls_logo-1722338250911.jpg"));
});

app.use(API_PreFix, UserRoutes);
app.use(API_PreFix, AdminRoutes);

morganBody(app, {
  prettify: true,
  logReqUserAgent: true,
  logReqDateTime: true,
});


initializeSocket(server);

// Connect to the database
connectDB();

// Start the HTTP or HTTPS server
server.listen(port, '0.0.0.0', async () => {
  console.log(`HTTP${isProduction ? "S" : ""} Server listening on IPv4 address at port ${port}`);
});