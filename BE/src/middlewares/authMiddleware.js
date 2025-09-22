import jwt from "jsonwebtoken";
import User from "../model/User.js";
import OrgMember from "../model/OrgMember.js";

export const authMiddleware = async (req, res, next) => {
  try {

    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: "no_token" });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
      console.log("🚀 ~ authMiddleware ~ payload:", payload)
      // payload nên chứa: { _id, orgId, email }
      req.user = payload;
     
    } catch (e) {
      return res.status(401).json({ ok: false, error: "invalid_token" });
    }
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
