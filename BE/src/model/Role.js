import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        get_user: {
            type: Boolean,
            default: true,
        },
        create_user: {
            type: Boolean,
            default: true,
        },
        update_user: {
            type: Boolean,
            default: true,
        },
        delete_user: {
            type: Boolean,
            default: true,
        },
        restore_user: {
            type: Boolean,
            default: true,
        },
        create_role: {
            type: Boolean,
            default: true,
        },
        update_role: {
            type: Boolean,
            default: true,
        },
        delete_role: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("Role", roleSchema);