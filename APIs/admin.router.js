import express from "express";
import { Types } from "mongoose";

import { UserModel } from "../Models/user.models.js";
import { BookingModel } from "../Models/bookings.models.js";
import { ResourceModel } from "../Models/resource.models.js";
import { verifyToken } from "../Middleware/verify-token.middleware.js";
import { allowedRoles } from "../Middleware/allowed-roles.middleware.js";

const router = express.Router();

router.use(verifyToken, allowedRoles("ADMIN"));

// Get all users
router.get("/users", async (req, res, next) => {
  try {
    const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// Get a particular user
router.get("/users/:id", async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await UserModel.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Get all bookings
router.get("/bookings", async (req, res, next) => {
  try {
    const bookings = await BookingModel.find()
      .populate("userId", "name email role")
      .populate("resourceId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

// Approve a pending booking
router.patch("/bookings/:id/approve", async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await BookingModel.findById(req.params.id).populate("resourceId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.bookingStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be approved",
      });
    }

    if (booking.resourceId.availabilityStatus !== "AVAILABLE") {
      return res.status(409).json({
        success: false,
        message: `Resource is currently ${booking.resourceId.availabilityStatus}`,
      });
    }

    const conflict = await BookingModel.findOne({
      _id: { $ne: booking._id },
      resourceId: booking.resourceId._id,
      bookingStatus: "Accepted",
      startTimeDate: { $lt: booking.endTimeDate },
      endTimeDate: { $gt: booking.startTimeDate },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Booking conflicts with an already accepted booking",
      });
    }

    booking.bookingStatus = "Accepted";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking approved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// Reject a pending booking
router.patch("/bookings/:id/reject", async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await BookingModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.bookingStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be rejected",
      });
    }

    booking.bookingStatus = "Rejected";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking rejected successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// Create a resource
router.post("/resources", async (req, res, next) => {
  try {
    const resource = await ResourceModel.create({
      resourceName: req.body.resourceName,
      resourceType: req.body.resourceType,
      resourceLocation: req.body.resourceLocation,
      availabilityStatus: req.body.availabilityStatus?.toUpperCase() || "AVAILABLE",
      resourceCapacity: req.body.resourceCapacity,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: resource,
    });
  } catch (error) {
    next(error);
  }
});

// Update resource details or availability
router.patch("/resources/:id", async (req, res, next) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid resource ID" });
    }

    const allowedFields = [
      "resourceName",
      "resourceType",
      "resourceLocation",
      "availabilityStatus",
      "resourceCapacity",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    if (req.body.availabilityStatus) {
      updates.availabilityStatus = req.body.availabilityStatus.toUpperCase();
    }

    const resource = await ResourceModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      data: resource,
    });
  } catch (error) {
    next(error);
  }
});

// Admin dashboard summary
router.get("/dashboard", async (req, res, next) => {
  try {
    const [users, resources, pendingBookings, acceptedBookings] = await Promise.all([
      UserModel.countDocuments(),
      ResourceModel.countDocuments(),
      BookingModel.countDocuments({ bookingStatus: "Pending" }),
      BookingModel.countDocuments({ bookingStatus: "Accepted" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        resources,
        pendingBookings,
        acceptedBookings,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
