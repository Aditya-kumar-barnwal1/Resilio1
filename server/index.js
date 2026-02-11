import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http"; 
import { Server } from "socket.io"; 
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import cors from "cors";

// Import Routes
import UserRouter from "./routes/UserRoute.js";
import EmergencyRouter from "./routes/emergencyRoutes.js"; 
import RescuerRouter from "./routes/rescuerroutes.js"; // Ensure casing is correct (rescuerRoutes vs rescuerroutes)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app); 

connectDB();

// 1. DEFINE ALLOWED ORIGINS (Crucial for Socket.io + CORS)
const allowedOrigins = [
  "http://localhost:5173",             // Your Local Frontend
  "https://resilio-vert.vercel.app", // Your Vercel Frontend (Change this to your actual URL)
  "http://localhost:3000"              // Fallback
];

// 2. SOCKET.IO SETUP
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// 3. EXPRESS CORS SETUP
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. ATTACH IO TO REQUEST (Your Middleware)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
// Note: If UserRouter has router.post('/login'), this becomes /api/v1/login
app.use('/api/v1', UserRouter);
app.use('/api/v1/emergencies', EmergencyRouter); 
app.use('/api/v1/rescuers', RescuerRouter);

// Socket Logs
io.on("connection", (socket) => {
  console.log(`✅ Socket Connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected");
  });
});

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});