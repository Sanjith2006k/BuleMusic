import express from "express";
import cors from "cors";
import roomRoutes from "./routes/room.routes";
import songRoutes from "./routes/song.routes";
import adminRoutes from "./routes/admin.routes";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);

app.use(
  cors({
    origin: (origin, callback) => {
      // Dynamically allow the request origin to prevent CORS blocks, especially for Vercel preview deploys and trailing slashes
      callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api/rooms", roomRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Bule Music API is running",
  });
});

export default app;
