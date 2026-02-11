import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http"; // 1. Import HTTP Server
import { Server } from "socket.io";  // 2. Import Socket.io
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import cors from "cors";

// Import Routes
import UserRouter from "./routes/UserRoute.js";
import EmergencyRouter from "./routes/emergencyRoutes.js"; // Import the new route
import RescuerRouter from "./routes/rescuerroutes.js";
// Reconstruct __dirname (Required for ES Modules to serve static files)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app); // 3. Wrap app in HTTP server

connectDB();

// ... imports

const io = new Server(httpServer, {
  cors: {
    origin: "*", // 👈 Allow ANY frontend to connect
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({
  origin: "*", // 👈 Allow Express to accept requests from anywhere
  credentials: true
}));


app.use(express.json());

// 5. Make 'uploads' folder public so frontend can access images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Middleware to pass 'io' to every request (so Controllers can use it)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/v1', UserRouter);
app.use('/api/v1/emergencies', EmergencyRouter); // This handles the upload + socket trigger
app.use('/api/v1/rescuers', RescuerRouter);
// Socket.io Connection Events
io.on("connection", (socket) => {
  console.log(`⚡ New Client Connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log("Client Disconnected");
  });
});

const PORT = process.env.PORT || 8000;

// 7. LISTEN using httpServer, NOT app
httpServer.listen(PORT, () => {
  console.log(`App listens at PORT ${PORT}`);
  console.log(`Socket.io initialized`);
});