// ─────────────────────────────────────────────────────────────────────────────
// src/routes/bases.routes.js — Tạo Base + seed roles built-in
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import Base from "../model/Base.js";
import BaseRole from "../model/BaseRole.js";
import BaseMember from "../model/BaseMember.js";
import Organization from "../model/Organization.js";
import { guardOrgBaseLimit } from "../middlewares/limits.js";

const router = express.Router();

// Tạo Base mới trong org (chỉ owner/manager của org)
async function createBase(req, res, next) {
  try {
    const { orgId } = req.params; const { name } = req.body; const userId = req.user._id;
    const org = await Organization.findById(orgId).lean();
    if (!org) return res.status(404).json({ ok: false, error: "org_not_found" });

    // Kiểm tra vai trò ở org
    const isOrgAdmin = (org.members || []).some((m) => String(m.user) === String(userId) && ["owner", "manager"].includes(m.role));
    if (!isOrgAdmin) return res.status(403).json({ ok: false, error: "not_org_admin" });

    // Kiểm tra quota số base của org
    const count = await Base.countDocuments({ orgId });
    if (count >= (org.baseLimit ?? 5)) return res.status(403).json({ ok: false, error: "org_base_limit" });

    // Tạo base và seed 4 role built-in (Owner/Admin/Editor/Viewer)
    const base = await Base.create({ orgId, name, ownerId: userId });
    const [ownerRole, adminRole, editorRole, viewerRole] = await BaseRole.insertMany([
      { baseId: base._id, name: "Owner", builtin: true },
      { baseId: base._id, name: "Admin", builtin: true },
      { baseId: base._id, name: "Editor", builtin: true },
      { baseId: base._id, name: "Viewer", builtin: true },
    ]);

    // Người tạo base -> Owner của base đó
    await BaseMember.create({ baseId: base._id, userId, roleId: ownerRole._id });

    res.json({ ok: true, data: base });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "base_create_error" }); }
}
router.post("/orgs/:orgId/bases",guardOrgBaseLimit({defaultLimit:20}), createBase);

export default router;