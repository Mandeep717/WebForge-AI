import { schema,model,types} from "moongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER"
    },
    bookings: {
      type: [Types.ObjectId],
      ref: "booking"
    }
  },
  {
    timestamps: true,
    versionKey: false,
    strict: 'throw'
  }
);

export const UserModel = model("user", userSchema);