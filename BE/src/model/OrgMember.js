import mongoose from "mongoose";

const OrgMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  org: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  base: { type: mongoose.Schema.Types.ObjectId, ref: "Base" },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
  //site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: false },
  status: { type: String, enum: ["active","invited","suspended"], default: "active" },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });


export default mongoose.model("OrgMember", OrgMemberSchema);