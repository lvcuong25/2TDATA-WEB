import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true, // Tên tổ chức không trùng nhau
        trim: true,
    },
    site_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Site",
        required: true,
        description: "ID của site liên kết với organization",
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: false,
    },
    address: {
        type: String,
        required: false,
    },
    identifier: { // Mã định danh
        type: String,
        required: false,
    },
    taxCode: { // Mã số thuế
        type: String,
        required: false,
    },
    logo: {
        type: String, // Đường dẫn ảnh logo
    },
    logo_public_id: {
        type: String, // Public ID của Cloudinary để xóa file
    },
    active: {
        type: Boolean,
        default: true,
    },
    services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrganizationService"
    }],
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["owner", "manager", "member"], default: "member" }
    }],
},
{ timestamps: true, versionKey: false });

export default mongoose.model("Organization", OrganizationSchema);
