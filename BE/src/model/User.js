import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "member",
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    age: {
      type: Number,
    },
    avatar: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
    },
    otpCreatedAt: {
      type: Date,
    },
    service: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserService'
    }],
    information: [{
      code: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true
      },
      description:{
        type: String,
        description: "Mô tả chi tiết về link"
      }
    }]
  },
  { timestamps: true, versionKey: false }
);

userSchema.plugin(mongoosePaginate);

export default mongoose.model("User", userSchema);
