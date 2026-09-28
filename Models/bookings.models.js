import { Schema, model } from "mongoose";

const bookingSchema = new Schema(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
      required: [true, "Resource ID is required"],
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    purpose: {
      type: String,
      required: [true, "Purpose of booking is required"],
      trim: true,
      minlength: [3, "Purpose must be at least 3 characters"],
    },

    bookingStatus: {
      type: String,
      enum: {
        values: ["Accepted", "Rejected", "Pending", "Cancelled"],
        message: "Invalid booking status",
      },
      default: "Pending",
    },

    startTimeDate: {
      type: Date,
      required: [true, "Start time and date is required"],
    },

    endTimeDate: {
      type: Date,
      required: [true, "End time and date is required"],
      validate: {
        validator: function (value) {
          return value > this.startTimeDate;
        },
        message: "End time must be after start time",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  }
);

bookingSchema.index({ resourceId: 1, startTimeDate: 1, endTimeDate: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });

export const BookingModel = model("Booking", bookingSchema);
