import { Schema, model } from "mongoose";

const resourceSchema = new Schema(
  {
    resourceName: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
      unique: true,
    },

    resourceType: {
      type: String,
      enum: {
        values: [
          "Seminar Halls",
          "Classrooms",
          "Laboratory",
          "Sports Facilities",
          "Open-air places",
        ],
        message: "Invalid resource type",
      },
      required: [true, "Resource type is required"],
    },

    resourceLocation: {
      type: String,
      required: [true, "Resource location is required"],
      trim: true,
    },

    availabilityStatus: {
      type: String,
      enum: {
        values: ["AVAILABLE", "UNAVAILABLE", "MAINTENANCE"],
        message: "Invalid availability status",
      },
      default: "AVAILABLE",
    },

    resourceCapacity: {
      type: Number,
      required: [true, "Resource capacity is required"],
      min: [1, "Resource capacity must be at least 1"],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  }
);

export const ResourceModel = model("Resource", resourceSchema);
