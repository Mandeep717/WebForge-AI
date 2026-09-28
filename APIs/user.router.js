import express from "express";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { UserModel } from "../Models/user.models.js";
import { ResourceModel } from "../Models/resource.models.js";
import { BookingModel } from "../Models/bookings.models.js";
import { verifyToken } from "../Middleware/verify-token.middleware.js";
import { allowedRoles } from "../Middleware/allowed-roles.middleware.js";

export const userRouter = express.Router();

// Register a normal user. Role is intentionally forced to USER.
userRouter.post("/user", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await hash(password, 12);

    const userDoc = await UserModel.create({
      name,
      email,
      password: passwordHash,
      role: "USER",
    });

    const safeUser = await UserModel.findById(userDoc._id).select("-password");

    return res.status(201).json({
      success: true,
      message: "New user created",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
});

// Login
userRouter.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const userInDb = await UserModel.findOne({ email: email.toLowerCase() });

    if (!userInDb) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await compare(password, userInDb.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const signedToken = jwt.sign(
      { _id: userInDb._id.toString(), role: userInDb.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.cookie("token", signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: userInDb._id,
        name: userInDb.name,
        email: userInDb.email,
        role: userInDb.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Current authenticated user
userRouter.get("/auth/me", verifyToken, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Logout
userRouter.post("/auth/logout", verifyToken, (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

// Get all resources
userRouter.get(
  "/resources",
  verifyToken,
  allowedRoles("ADMIN", "USER"),
  async (req, res, next) => {
    try {
      const resources = await ResourceModel.find().sort({ resourceName: 1 });
      return res.status(200).json({
        success: true,
        message: "Resources of the college",
        data: resources,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get resource by name
userRouter.get(
  "/resources/:name",
  verifyToken,
  allowedRoles("ADMIN", "USER"),
  async (req, res, next) => {
    try {
      const resourceInDb = await ResourceModel.findOne({
        resourceName: req.params.name,
      });

      if (!resourceInDb) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Resource found",
        data: resourceInDb,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get resources by type
userRouter.get(
  "/resources/type/:type",
  verifyToken,
  allowedRoles("ADMIN", "USER"),
  async (req, res, next) => {
    try {
      const resourcesInDb = await ResourceModel.find({
        resourceType: req.params.type,
      }).sort({ resourceName: 1 });

      return res.status(200).json({
        success: true,
        message: "Resources found",
        data: resourcesInDb,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a booking request
userRouter.post(
  "/bookings/:name",
  verifyToken,
  allowedRoles("ADMIN", "USER"),
  async (req, res, next) => {
    try {
      const resourceInDb = await ResourceModel.findOne({
        resourceName: req.params.name,
      });

      if (!resourceInDb) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      if (resourceInDb.availabilityStatus !== "AVAILABLE") {
        return res.status(409).json({
          success: false,
          message: `Resource is currently ${resourceInDb.availabilityStatus}`,
        });
      }

      const newBooking = {
        ...req.body,
        resourceId: resourceInDb._id,
        userId: req.user._id,
      };

      const startTime = new Date(newBooking.startTimeDate);
      const endTime = new Date(newBooking.endTimeDate);

      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start or end time",
        });
      }

      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time",
        });
      }

      const conflict = await BookingModel.findOne({
        resourceId: resourceInDb._id,
        bookingStatus: { $in: ["Accepted", "Pending"] },
        startTimeDate: { $lt: endTime },
        endTimeDate: { $gt: startTime },
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Booking conflicts with an existing booking",
        });
      }

      const bookingDoc = await BookingModel.create({
        ...newBooking,
        startTimeDate: startTime,
        endTimeDate: endTime,
        bookingStatus: "Pending",
      });

      return res.status(201).json({
        success: true,
        message: "New booking created",
        data: bookingDoc,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get one booking. Users can only access their own bookings; admins can access any booking.
userRouter.get(
  "/bookings/:id",
  verifyToken,
  allowedRoles("ADMIN", "USER"),
  async (req, res, next) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID",
        });
      }

      const query = { _id: req.params.id };
      if (req.user.role !== "ADMIN") {
        query.userId = req.user._id;
      }

      const bookingInDb = await BookingModel.findOne(query)
        .populate("resourceId")
        .populate("userId", "name email role");

      if (!bookingInDb) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Booking found",
        data: bookingInDb,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user's bookings. Admin can use the dedicated admin endpoint for all bookings.
userRouter.get(
  "/bookings",
  verifyToken,
  allowedRoles("ADMIN", "USER"),
  async (req, res, next) => {
    try {
      const bookingsInDb = await BookingModel.find({ userId: req.user._id })
        .populate("resourceId")
        .sort({ startTimeDate: -1 });

      return res.status(200).json({
        success: true,
        message: "Bookings found",
        data: bookingsInDb,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Cancel a booking. Users can cancel only their own bookings; admins can cancel any booking.
userRouter.patch(
  "/bookings/:id/cancel",
  verifyToken,
  allowedRoles("ADMIN", "USER"),
  async (req, res, next) => {
    try {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID",
        });
      }

      const bookingInDb = await BookingModel.findById(req.params.id);

      if (!bookingInDb) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (
        req.user.role !== "ADMIN" &&
        bookingInDb.userId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to cancel this booking",
        });
      }

      if (bookingInDb.bookingStatus === "Cancelled") {
        return res.status(400).json({
          success: false,
          message: "Booking is already cancelled",
        });
      }

      if (bookingInDb.bookingStatus === "Rejected") {
        return res.status(400).json({
          success: false,
          message: "Rejected bookings cannot be cancelled",
        });
      }

      if (bookingInDb.startTimeDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "A booking cannot be cancelled after it has started",
        });
      }

      bookingInDb.bookingStatus = "Cancelled";
      await bookingInDb.save();

      return res.status(200).json({
        success: true,
        message: "Booking cancelled",
        data: bookingInDb,
      });
    } catch (error) {
      next(error);
    }
  }
);
