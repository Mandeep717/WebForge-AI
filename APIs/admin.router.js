import express from "express";

import { UserModel } from "../Models/user.models.js";
import { BookingModel } from "../Models/bookings.models.js";
import { REsourceModel } from "../Models/resouce.models.js";

import { verifyToken } from "../Middleware/verify-token.middleware.js";
import { allowedRoles } from "../Middleware/allowed-roles.middleware.js";

const router = express.Router();

router.use(verifyToken, allowedRoles("ADMIN"));


// Get all users
router.get("/users", async (req, res) => {
    try {
        const users = await UserModel.find()
            .select("-password");

        return res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Get a particular user using their ID
router.get("/users/:id", async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Get all the bookings made by users
router.get("/bookings", async (req, res) => {
    try {
        const bookings = await BookingModel.find()
            .populate("userId", "name email role")
            .populate("resourceId");

        return res.status(200).json({
            success: true,
            bookings
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Approve a booking if it is still pending
router.patch("/bookings/:id/approve", async (req, res) => {
    try {
        const booking = await BookingModel.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (booking.bookingStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending bookings can be approved"
            });
        }

        booking.bookingStatus = "Accepted";

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Booking approved successfully",
            booking
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Reject a booking if it is still pending
router.patch("/bookings/:id/reject", async (req, res) => {
    try {
        const booking = await BookingModel.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (booking.bookingStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending bookings can be rejected"
            });
        }

        booking.bookingStatus = "Rejected";

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            booking
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Create a new resource
router.post("/resources", async (req, res) => {
    try {
        const {
            resourceName,
            resourceType,
            resourceLocation,
            availabilityStatus,
            resourceCapacity
        } = req.body;

        const resource = await REsourceModel.create({
            resourceName,
            resourceType,
            resourceLocation,
            availabilityStatus,
            resourceCapacity
        });

        return res.status(201).json({
            success: true,
            message: "Resource created successfully",
            resource
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Update the details of an existing resource
router.patch("/resources/:id", async (req, res) => {
    try {
        const resource = await REsourceModel.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: "Resource not found"
            });
        }

        const {
            resourceName,
            resourceType,
            resourceLocation,
            availabilityStatus,
            resourceCapacity
        } = req.body;

        if (resourceName !== undefined) {
            resource.resourceName = resourceName;
        }

        if (resourceType !== undefined) {
            resource.resourceType = resourceType;
        }

        if (resourceLocation !== undefined) {
            resource.resourceLocation = resourceLocation;
        }

        if (availabilityStatus !== undefined) {
            resource.availabilityStatus = availabilityStatus;
        }

        if (resourceCapacity !== undefined) {
            resource.resourceCapacity = resourceCapacity;
        }

        await resource.save();

        return res.status(200).json({
            success: true,
            message: "Resource updated successfully",
            resource
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


export default router;