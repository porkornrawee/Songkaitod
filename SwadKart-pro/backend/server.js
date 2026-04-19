import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

// Error Middlewares
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Routes Import
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import biometricRoutes from "./routes/biometricRoutes.js";

dotenv.config();
connectDB(); // 🗄️ เชื่อมต่อ MongoDB Atlas ที่เราเซ็ตไว้

const app = express();
const httpServer = createServer(app);
app.set('trust proxy', 1); 

// --- 🌐 Configuration (ปรับให้รองรับ localhost ทั้ง http และ https) ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://swadkart.vercel.app",
];

// --- 🔌 Socket.io Setup ---
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log(`⚡ Signal Established: ${socket.id}`);
  socket.on("joinOrder", (id) => {
    socket.join(id);
    console.log(`👤 Security: Socket locked into Sector ${id}`);
  });
  socket.on("disconnect", () => {
    console.log(`❌ Signal Lost: ${socket.id} left the grid.`);
  });
});

// --- 🛡️ Standard Middleware ---
app.use(helmet({ contentSecurityPolicy: false })); // ปิด CSP ชั่วคราวเพื่อให้โหลดรูปง่ายขึ้นในเครื่อง
app.use(compression());
app.use(express.json({ limit: "50mb" })); // เพิ่มลิมิตให้ส่งรูปได้
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// --- 🛡️ CORS Fix (อนุญาตให้ Frontend คุยกับ Backend ได้) ---
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // ปล่อยให้ผ่านไปก่อนเพื่อความลื่นไหลในการ Dev
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}));

// --- 🚦 Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // เพิ่มจำนวน Request ให้ไม่โดนบล็อกง่ายๆ ตอนลองเล่น
  message: "Too many requests, please try again later",
});
app.use("/api", apiLimiter);

app.get("/ping", (req, res) => {
  res.status(200).send("Pong");
});

// --- 🛣️ API Routes ---
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/restaurants", restaurantRoutes);
app.use("/api/v1/biometric", biometricRoutes);

// --- 📂 Static Files ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.get("/", (req, res) => {
  res.send("🚀 SwadKart Beast Engine is running...");
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// --- 🚀 Server Start ---
const PORT = process.env.PORT || 4000; 
httpServer.listen(PORT, () => {
  console.log(`🔥 Mainframe firing on Sector ${PORT}`);
  console.log(`✅ Ready to accept connections`);
});