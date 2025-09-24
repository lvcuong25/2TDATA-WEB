// ─────────────────────────────────────────────────────────────────────────────
// src/routes/members.routes.js — Thêm/đổi role cho thành viên base
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import BaseMember from "../model/BaseMember.js";
import Base from "../model/Base.js";
import Organization from "../model/Organization.js";
import BaseRole from "../model/BaseRole.js";
import { guardPerBaseUserLimit } from "../middlewares/limits.js";
import { canManageMembers } from "../middlewares/can.js";
import User from "../model/User.js";
const routerMembers = express.Router({ mergeParams: true });

// Mời user vào base với 1 role nhất định
async function addUserToBase(req, res, next) {
  try {
    const { baseId } = req.params; const { userId, roleId } = req.body;
    const base = await Base.findById(baseId).lean(); if (!base) return res.status(404).json({ ok: false, error: "base_not_found" });
    const org = await Organization.findById(base.orgId).lean();

    // Quota số user trong mỗi base
    const count = await BaseMember.countDocuments({ baseId });
    if (count >= (org.perBaseUserLimit ?? 50)) return res.status(403).json({ ok: false, error: "per_base_user_limit" });

    // Role phải thuộc base này
    const role = await BaseRole.findOne({ _id: roleId, baseId }).lean();
    if (!role) return res.status(400).json({ ok: false, error: "invalid_role" });

    const created = await BaseMember.create({ baseId, userId, baseRoleId: roleId });
    res.json({ ok: true, data: created });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "member_add_error" }); }
}


// Đổi role của 1 thành viên
async function changeMemberRole(req, res, next) {
  try {
    const { baseId, userId } = req.params; const { roleId } = req.body;
    const role = await BaseRole.findOne({ _id: roleId, baseId }).lean();
    if (!role) return res.status(400).json({ ok: false, error: "invalid_role" });
    const updated = await BaseMember.findOneAndUpdate({ baseId, userId }, { baseRoleId: roleId }, { new: true });
    res.json({ ok: true, data: updated });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "member_update_error" }); }
}

routerMembers.post("/bases/:baseId/members",canManageMembers(), addUserToBase);

routerMembers.patch("/bases/:baseId/members/:userId",canManageMembers(), guardPerBaseUserLimit({defaultLimit:100}), changeMemberRole);

/** GET: danh sách member của base */
routerMembers.get("/bases/:baseId/members",canManageMembers(), async (req, res, next) => {
  try {
    const { baseId } = req.params;
    const members = await BaseMember.find({ baseId })
      .lean();
 
    // join role + user (đơn giản, 2 query phụ)
    const roleIds = [...new Set(members.map(m => String(m.baseRoleId)))];
    const userIds = [...new Set(members.map(m => String(m.userId)))];
 
    const roles = await BaseRole.find({ _id: { $in: roleIds } }).lean();
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id email name")
      .lean();
 
    const roleMap = Object.fromEntries(roles.map(r => [String(r._id), r]));
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));
 
    const data = members.map(m => ({
      _id: m._id,
      user: userMap[String(m.userId)] || { _id: m.userId },
      role: roleMap[String(m.baseRoleId)] || { _id: m.baseRoleId },
      //createdAt: m.createdAt,
    }));
 
    return res.json({ ok: true, data });
  } catch (e) { return next(e); }
});
 
/** GET: tôi trong base này là ai */
routerMembers.get("/bases/:baseId/me", async (req, res, next) => {
  try {
    const { baseId } = req.params;
    const userId = req.user?._id;
    const m = await BaseMember.findOne({ baseId, userId }).lean();
    if (!m) return res.status(200).json({ ok: true, isMember: false });
    const role = await BaseRole.findById(m.baseRoleId).lean();
    return res.json({
      ok: true,
      isMember: true,
      member: {
        _id: m._id,
        role: role ? { _id: role._id, name: role.name, canManageMembers: !!role.canManageMembers } : null,
      }
    });
  } catch (e) { return next(e); }
});

export default routerMembers;