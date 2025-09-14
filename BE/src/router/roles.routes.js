// ─────────────────────────────────────────────────────────────────────────────
// src/routes/roles.routes.js — CRUD Role tuỳ biến
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import BaseRole from "../model/BaseRole.js";

const routerRoles = express.Router({ mergeParams: true });

// Tạo role custom (gộp đủ 4 tầng: table/column/row/cell-rule)
async function createRole(req, res, next) {
    try {
    const { baseId } = req.params;
    const { name, tablePerms = [], columnPerms = [], rowPolicies = [], cellRuleLocks = [] } = req.body;
    const role = await BaseRole.create({ baseId, name, builtin: false, tablePerms, columnPerms, rowPolicies, cellRuleLocks });
    res.json({ ok: true, data: role });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "role_create_error" }); }
}

routerRoles.post("/bases/:baseId/roles", createRole);

// Cập nhật role custom
async function updateRole(req, res, next) {
    try {
    const { baseId, roleId } = req.params; const patch = { ...req.body };
    const role = await BaseRole.findOneAndUpdate({ _id: roleId, baseId }, patch, { new: true });
    if (!role) return res.status(404).json({ ok: false, error: "role_not_found" });
    res.json({ ok: true, data: role });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "role_update_error" }); }
}
routerRoles.patch("/bases/:baseId/roles/:roleId", updateRole);

// Danh sách role của base
async function getRoles(req, res, next) {
  const { baseId } = req.params; 
  const roles = await BaseRole.find({ baseId }).lean(); 
  res.json({ ok: true, data: roles });
  
}
routerRoles.get("/bases/:baseId/roles", getRoles);

export default routerRoles;