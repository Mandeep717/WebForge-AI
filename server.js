import express from "express";
import cookieParser from "cookie-parser";
import { connect } from "mongoose";
import "dotenv/config";

import { userRouter } from "./APIs/user.router.js";
import adminRouter from "./APIs/admin.router.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Campus Resource Booking API is running",
  });
});

app.use("/api", userRouter);
app.use("/api/admin", adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware must be registered after routes.
app.use((err, req, res, next) => {
  console.error(err);

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([key, value]) => [key, value.message])
      ),
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists",
    });
  }

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    await connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
