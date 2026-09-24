import {Schema, model, Types} from 'mongoose'

const bookingSchema = new Schema({
    resourceId: {
        type: Types.ObjectId,
        ref: "resource",
        required: [true, "Resource ID is required"]
    },
    userId: {
        type: Types.ObjectId,
        ref: "user",
        required: [true, "User ID is required"]
    },
    purpose: {
        type: String,
        required: [true, "Purpose of booking is required"],
        trim: true
    },
    bookingStatus: {
        type: String,
        enum: {
            values: ['Accepted', 'Rejected', 'Pending', 'Cancelled'],
            message: "Invalid booking status"
        }
    },
    startTimeDate: {
        type: Date,
        required: [true, "Start time and date is required"]
    },
    endTimeDate: {
        type: Date,
        required: [true, "End time and date is required"],
        validate: {
            validate: {
                validator: function (value) {
                    return value > this.startTimeDate;
                },
                message: "End time must be after start time"
            }
        }
    }
},{
    timestamps: true,
    versionKey: false,
    strict: "throw"
})

export const BookingModel = await model("booking", bookingSchema)