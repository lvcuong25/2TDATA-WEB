import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userSchema = new mongoose.Schema(
  {
    site_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: function() {
        // site_id is not required for super_admin users
        return this.role !== 'super_admin';
      },
      index: true
    },
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
    }],
    // Thêm các trường lưu trữ trạng thái đồng ý điều khoản
    termsAcceptance: {
      agreeTermsOfService: {
        type: Boolean,
        default: false
      },
      agreeDataPolicy: {
        type: Boolean,
        default: false
      },
      agreeSecurityPolicy: {
        type: Boolean,
        default: false
      },
      acceptedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  { timestamps: true, versionKey: false }
);

userSchema.plugin(mongoosePaginate);

export default mongoose.model("User", userSchema);
