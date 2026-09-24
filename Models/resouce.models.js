import {Schema, model, Types} from 'mongoose'

const resourceSchema = new Schema({
    resourceName: {
        type: String,
        required: [true, "Resource name is required"],
        trim: true
    },
    resourceType: {
        type: String,
        enum: {values: ['Seminar Halls', 'Classrooms', 'Laboratory', 'Sports Facilities', 'Open-air places'], message: "Invalid resource type"},
        required: [true, "Resource type is required"]
    },
    resourceLocation: {
        type: String,
        required: [true, "Resource location is required"],
        trim: true
    },
    availabilityStatus: {
        type: String,
        enum: {values: ['available', 'unavailable', 'maintenance'], message: "Invalid availability status"},
        required: [true, "Availability status is required"]
    },
    resourceCapacity: {
        type: Number,
        required: [true, "Resource capacity is required"],
        min: [1, "Resource capacity must be at least 1"]
    },
    bookings: {
        type: [Types.ObjectId],
        ref: "booking"
    }
},{
    timestamps: true,
    versionKey: false, 
    strict: "throw"
})

export const REsourceModel = model("resource", resourceSchema)