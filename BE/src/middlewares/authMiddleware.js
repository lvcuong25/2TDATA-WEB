import jwt from "jsonwebtoken";
import User from "../model/User.js";
import OrgMember from "../model/OrgMember.js";
import Role from "../model/Role.js";
import Permission from '../model/Permission.js'

export const authMiddleware = async (req, res, next) => {
  try {
    // giả sử lấy token từ header Authorization
    // const authHeader = req.headers.authorization;
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   req.user = null;
    //   req.roles = [];
    //   return next();
    // }

    // const token = authHeader.split(" ")[1];
    // const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const user = await User.findById('68c2ceab5b59d6bb35fb368d');
    if (!user || !user.active) return res.status(401).json({ message: "Unauthorized" });

    // Load OrgMember + Role + Permissions
    const orgMembers = await OrgMember.find({ user: user._id }).populate({
      path: "role",
      populate: { path: "permissions" }
    }).lean();

    user.roles = orgMembers.map(m => ({
      org: m.org,
      base: m.base,
      role: m.role,
      permissions: m.role.permissions
    }));

    req.user = user;
    // if (!user) return res.status(401).json({ message: "User not found" });
    // if (!user.active) return res.status(403).json({ message: "User inactive" });

    // // Lấy tất cả role trong OrgMember
    // const orgMembers = await OrgMember.find({ user: user._id, status: "active" }).populate("role");
    // const roles = orgMembers.map(om => ({
    //   orgId: om.org.toString(),
    //   baseId: om.base?.toString(),
    //   roleName: om.role.name,
    //   permissions: om.role.permissions // ObjectId
    // }));

    // req.user = user;
    // req.roles = roles;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
