// ─────────────────────────────────────────────────────────────────────────────
// src/services/perms.service.js — Tính quyền hiệu lực cho user tại table
// ─────────────────────────────────────────────────────────────────────────────
import BaseMember from "../model/BaseMember.js";
import BaseRole from "../model/BaseRole.js";

// Thay placeholder $ctx.* trong object JSON (rowPolicy / ruleLock.where)
function deepReplacePlaceholders(obj, ctxMap) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((x) => deepReplacePlaceholders(x, ctxMap));
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = deepReplacePlaceholders(v, ctxMap);
    return out;
  }
  if (typeof obj === "string" && obj.startsWith("$ctx.")) return ctxMap[obj.slice(5)] ?? null;
  return obj;
}

// Trả về: allow, rowQuery (áp vào $match), colPerms (để ẩn/mask), cellRuleLocks (để lock theo rule)
export async function resolveEffectivePerms({ userId, orgId, baseId, tableId, action }) {
  // 1) Kiểm tra thành viên base
  const membership = await BaseMember.findOne({ baseId, userId }).lean();
  if (!membership) return { allow: false, reason: "Not a base member" };

  // 2) Lấy role
  const role = await BaseRole.findById(membership.baseRoleId).lean();
  if (!role) return { allow: false, reason: "Role not found" };

  // 3) Bật/tắt CRUD ở cấp Table
  const tp = (role.tablePerms || []).find((p) => String(p.tableId) === String(tableId));
  if (!tp || tp[action] !== true) return { allow: false, reason: "Table deny" };

  // 4) RowPolicy → AND: chỉ cho xem những row thỏa tất cả policy
  const ctxMap = { userId, orgId, baseId };
  const rowFilters = (role.rowPolicies || [])
    .filter((rp) => String(rp.tableId) === String(tableId))
    .map((rp) => deepReplacePlaceholders(rp.queryTemplate, ctxMap));
  const rowQuery = rowFilters.length ? { $and: rowFilters } : {};

  // 5) Column perms & Cell rule locks cho table này
  const colPerms = (role.columnPerms || []).filter((c) => String(c.tableId) === String(tableId));
  // const cellRuleLocks = (role.cellRuleLocks || []).filter((r) => String(r.tableId) === String(tableId));
  
  const cellRuleLocks = (role.cellRuleLocks || []).filter((r) => String(r.tableId) === String(tableId)).map(rl => ({
    ...rl,
    where: deepReplacePlaceholders(rl.where || {}, ctxMap)
  }));
  return { allow: true, rowQuery, colPerms, cellRuleLocks, canCreate: !!tp.create, canUpdate: !!tp.update, canDelete: !!tp.delete, roleId: role._id, roleName: role.name };
}