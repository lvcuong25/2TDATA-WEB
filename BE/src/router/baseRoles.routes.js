// ─────────────────────────────────────────────────────────────────────────────
// src/routes/roles.routes.js — CRUD Role tuỳ biến
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import BaseRole from "../model/BaseRole.js";
import Base from "../model/Base.js";
import Organization from "../model/Organization.js";
import { toObjectId } from "../utils/helper.js";
import responseHelper from "../utils/responseHelper.js";

const routerRoles = express.Router({ mergeParams: true });

async function createRole(req, res, next) {
  try {
    const { name, permissions } = req.body;
    const role = await BaseRole.create({ name, builtin: false, permissions });
    res.json({ ok: true, data: role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "role_create_error" });
  }
}

routerRoles.post("/baseroles", createRole);

// Cập nhật role custom
async function updateRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const patch = { ...req.body };
    const role = await BaseRole.findOneAndUpdate(
      { _id: toObjectId(roleId) },
      patch,
      { new: true }
    );
    if (!role)
      return res.status(404).json({ ok: false, error: "role_not_found" });
    res.json({ ok: true, data: role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "role_update_error" });
  }
}
routerRoles.patch("/baseroles/:roleId", updateRole);

// Danh sách role của base
async function getRoles(req, res, next) {
  const roles = await BaseRole.find(
    {},
    { name: 1, permissions: 1, builtin: 1 }
  ).lean();
  return responseHelper.sendReponseList(res, {
    items: roles,
    metadata: { total: roles.length, page: 1, perPage: roles.length },
  });
}
routerRoles.get("/baseroles", getRoles);

// Lấy danh sách role của tổ chức (không tạo role riêng cho database)
async function getOrgRoles(req, res, next) {
  try {
    const { databaseId } = req.params;
    console.log("getOrgRoles - databaseId:", databaseId);
    
    // Lấy database để tìm orgId
    const database = await Base.findById(databaseId).lean();
    if (!database) {
      return res.status(404).json({ ok: false, error: "database_not_found" });
    }
    
    // Lấy organization để lấy danh sách roles
    const organization = await Organization.findById(database.orgId).lean();
    if (!organization) {
      return res.status(404).json({ ok: false, error: "organization_not_found" });
    }
    
    // Trả về roles của tổ chức
    const orgRoles = [
      { name: "Owner", role: "owner", canManageDatabase: true },
      { name: "Manager", role: "manager", canManageDatabase: true },
      { name: "Member", role: "member", canManageDatabase: false }
    ];
    
    return res.json({ ok: true, data: orgRoles });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "get_roles_error" });
  }
}
routerRoles.get("/database/databases/:databaseId/roles", getOrgRoles);

export default routerRoles;
