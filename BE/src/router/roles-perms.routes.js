import express, { Router } from "express";
import mongoose from "mongoose";
import BaseRole from "../model/BaseRole.js";
import { canManageMembers } from "../middlewares/can.js";


const OID = (v) => new mongoose.Types.ObjectId(v);
const router = express.Router({ mergeParams: true });


/**
 * Path: /bases/:baseId/roles/:roleId/perms
 * Body: 
 * {
 *  flags?: { canManageMembers?, canManageSchema?, canCreateTables? },
 *   tablePerms?: {
 *     upsert?: [{ tableId, create?, read?, update?, delete? }],
 *     remove?: [tableId,...],
 *     replaceAll?: [{ tableId, create?, read?, update?, delete? }]
 *   },
 *  columnPerms?: {
 *      upsert?: [{ tableId, queryTemplate  }],
 *      remove?: [{ _id }],  // ưu tiên remove theo _id
 *      replaceAll?: [{ tableId, queryTemplate }]
 *    }
 * rowPolicies?: {
 *  upsert?: [{ tableId, queryTemplate}],
 *  remove?: [{ _id }],
 *  replaceAll?: [tableId, queryTemplate]
 * }
 *  cellRuleLocks?: {
 *  upsert?: [{ tableId, where, columns, mode , users?, roles? }],
 *  remove?: [{ _id }],
 *  replaceAll?: [{ ... }]

 *  }
 * }
 */

router.post("/bases/:baseId/roles/:roleId/perms", canManageMembers(), async (req, res, next) => {
  try {
    const { baseId, roleId } = req.params;
    const { flags = {}, tablePerms = {}, columnPerms = {}, cellRuleLocks = {}, rowPolicies = {} } = req.body || {};
    const role = await BaseRole.findOne({ _id: roleId, baseId }).lean();
    if (!role) return res.status(404).json({ ok: false, error: "role_not_found_in_base" });

    // Gom cacs update theo từng nhóm để save
    let dirtry = false;


    // 1. Flags (canManageMembers, canManageSchema, canCreateTables)
    if (flags && Object.keys(flags).length > 0) {
      if (typeof flags.canManageMembers === "boolean") {
        role.canManageMembers = flags.canManageMembers;
        dirtry = true;
      }
      if (typeof flags.canManageSchema === "boolean") {
        role.canManageSchema = flags.canManageSchema;
        dirtry = true;
      }
      if (typeof flags.canCreateTables === "boolean") {
        role.canCreateTables = flags.canCreateTables;
        dirtry = true;
      }
    }

    // Helpers - 
    const upsertBy = (arr, mathcher, patch) => {
      const idx = arr.findIndex((x) => mathcher(x));
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...patch };
      } else {
        arr.push(patch);
      }
    }

    const removeBy = (arr, predicate) => {
      const before = arr.length;
      const next = arr.filter((x) => !predicate(x));
      const changed = next.length !== before;
      return { next, changed };
    }

    // 2. TablePerms
    if (tablePerms && Object.keys(tablePerms).length > 0) {

      // ReplaceAll 
      if (Array.isArray(tablePerms.repplaceAll)) {
        role.tablePerms = tablePerms.replaceAll.map((x) => ({
          tableId: OID(x.tableId),
          create: x.create === true,
          read: x.read === true,
          update: x.update === true,
          delete: x.delete === true
        }));
        dirtry = true;
      }

      // upsert
      if (Array.isArray(tablePerms.upsert)) {
        for (const tp of tablePerms.upsert) {
          if (!tp.tableId) continue;
          upsertBy(role.tablePerms, (x) => x.tableId.toString() === tp.tableId, {
            tableId: OID(tp.tableId),
            create: tp.create === true || false,
            read: tp.read === true || false,
            update: tp.update === true || false,
            delete: tp.delete === true || false
          });
          dirtry = true;
        }
      }

      // remove
      if (Array.isArray(tablePerms.remove)) {
        const { next, changed } = removeBy(role.tablePerms, (x) => tablePerms.remove.includes(x.tableId.toString()));
        if (changed) {
          role.tablePerms = next;
          dirtry = true;
        }
      }
    }

    // 3. ColumnPerms
    if (columnPerms && Object.keys(columnPerms).length > 0) {
      // ReplaceAll 
      if (Array.isArray(columnPerms.replaceAll)) {
        role.columnPerms = columnPerms.replaceAll.map((x) => ({
          tableId: OID(x.tableId),
          columnId: x.columnId ? OID(x.columnId) : undefined,
          columnKey: x.columnKey || undefined,
          visibility: ["visible", "hidden", "collapsed"].includes(x.visibility) ? x.visibility : "visible",
          edit: ["none", "ro", "rw"].includes(x.edit) ? x.edit : "none",
        }));
        dirtry = true;
      }
      // upsert
      if (Array.isArray(columnPerms.upsert)) {
        for (const cp of columnPerms.upsert) {
          if (!cp.tableId || (!cp.columnId && !cp.columnKey)) continue;
          upsertBy(role.columnPerms, (x) => x.tableId.toString() === cp.tableId && ((cp.columnId && x.columnId && x.columnId.toString() === cp.columnId) || (cp.columnKey && x.columnKey === cp.columnKey)), {
            tableId: OID(cp.tableId),
            columnId: cp.columnId ? OID(cp.columnId) : undefined,
            columnKey: cp.columnKey || undefined,
            visibility: ["visible", "hidden", "collapsed"].includes(cp.visibility) ? cp.visibility : "visible",
            edit: ["none", "ro", "rw"].includes(cp.edit) ? cp.edit : "none",
          });
          dirtry = true;
        }
      }
      // remove
      if (Array.isArray(columnPerms.remove)) {
        const { next, changed } = removeBy(role.columnPerms, (x) => columnPerms.remove.includes(x._id?.toString()));
        if (changed) {
          role.columnPerms = next;
          dirtry = true;
        }
      }
    }

    // 4 rowPolicies
    if (rowPolicies && Object.keys(rowPolicies).length > 0) {
      // ReplaceAll
      if (Array.isArray(rowPolicies.replaceAll)) {
        role.rowPolicies = rowPolicies.replaceAll.map((x) => ({
          tableId: OID(x.tableId),
          queryTemplate: x.queryTemplate && typeof x.queryTemplate === "object" ? x.queryTemplate : {}
        }));
        dirtry = true;
      }
      // upsert
      if (Array.isArray(rowPolicies.upsert)) {
        for (const rp of rowPolicies.upsert) {
          if (!rp.tableId || !rp.queryTemplate || typeof rp.queryTemplate !== "object") continue;
          upsertBy(role.rowPolicies, (x) => x.tableId.toString() === rp.tableId, {
            tableId: OID(rp.tableId),
            queryTemplate: rp.queryTemplate
          });
          dirtry = true;
        }
      }
      // remove

      if (Array.isArray(rowPolicies.remove)) {
        const { next, changed } = removeBy(role.rowPolicies, (x) => rowPolicies.remove.includes(x._id?.toString()));
        if (changed) {
          role.rowPolicies = next;
          dirtry = true;
        }
      }

    }
    // 5. CellRuleLocks
    if (cellRuleLocks && Object.keys(cellRuleLocks).length > 0) {
      // ReplaceAll 
      if (Array.isArray(cellRuleLocks.replaceAll)) {
        role.cellRuleLocks = cellRuleLocks.replaceAll.map((x) => ({
          tableId: OID(x.tableId),
          where: x.where && typeof x.where === "object" ? x.where : {},
          columns: Array.isArray(x.columns) ? x.columns : [],
          mode: ["ro", "rw"].includes(x.mode) ? x.mode : "ro",
          users: Array.isArray(x.users) ? x.users : [],
          roles: Array.isArray(x.roles) ? x.roles : [],
        }));
        dirtry = true;
      }
      // upsert 
      if (Array.isArray(cellRuleLocks.upsert)) {
        for (const rl of cellRuleLocks.upsert) {

          if (!rl.tableId || !rl.where || typeof rl.where !== "object" || !Array.isArray(rl.columns) || rl.columns.length === 0) continue;
          upsertBy(role.cellRuleLocks, (x) => x.tableId.toString() === rl.tableId && JSON.stringify(x.where) === JSON.stringify(rl.where) && JSON.stringify(x.columns) === JSON.stringify(rl.columns), {
            tableId: OID(rl.tableId),
            where: rl.where,
            columns: rl.columns,
            mode: ["ro", "rw"].includes(rl.mode) ? rl.mode : "ro",
            users: Array.isArray(rl.users) ? rl.users : [],
            roles: Array.isArray(rl.roles) ? rl.roles : [],
          });
          dirtry = true;
        }
      }
      // remove
      if (Array.isArray(cellRuleLocks.remove)) {
        const { next, changed } = removeBy(role.cellRuleLocks, (x) => cellRuleLocks.remove.includes(x._id?.toString()));
        if (changed) {
          role.cellRuleLocks = next;
          dirtry = true;
        }
      }
    }
    // Lưu nếu có thay đổi
    if (dirtry) {
      await BaseRole.updateOne({ _id: roleId }, {
        $set: {
          canManageMembers: role.canManageMembers,
          canManageSchema: role.canManageSchema,
          canCreateTables: role.canCreateTables,
          tablePerms: role.tablePerms,
          columnPerms: role.columnPerms,
          rowPolicies: role.rowPolicies,
          cellRuleLocks: role.cellRuleLocks
        }
      });
    }
    // Return current perms
    const updated = await BaseRole.findById(roleId).lean();
    if (!updated) return res.status(500).json({ ok: false, error: "failed_to_get_updated_role" });

    return res.json({ ok: true, message: "perms_updated", data: updated });


  }
  catch (e) { return next(e); }
});

export default router;