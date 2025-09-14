// ─────────────────────────────────────────────────────────────────────────────
// src/routes/rows.routes.js — CRUD Row với quyền & lock (by-id + by-name)
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import Row from "../model/Row.js";
import Column from "../model/Column.js";
import ManualCellLock from "../model/ManualCellLock.js";
import { OID } from "../lib/mongo.js";
import { can } from "../middlewares/can.js";
import ColumnVisibilityRule from "../model/ColumnVisibilityRule.js";
import { guardUserQuery } from "../utils/rows.query-guard.js";

const routerRows = express.Router({ mergeParams: true });

// Helper: key cột visible của role hiện tại
// Trích keys cột visible từ colPerms (role-level)
function visibleColumnKeys(colPerms = []) {
  const s = new Set();
  for (const c of colPerms) {
    // c: { columnKey, visibility, ... }
    if (!c.columnKey) continue;
    if (c.visibility === "hidden") continue; // ẩn cứng từ role
    s.add(c.columnKey);
  }
  return s;
}

function appliesToCurrentPrincipal(rule, { roleId, userId }) {
  const hasRoleList = Array.isArray(rule.roles) && rule.roles.length > 0;
  const hasUserList = Array.isArray(rule.users) && rule.users.length > 0;
  const roleOk = !hasRoleList || rule.roles.some((r) => String(r) === String(roleId));
  const userOk = !hasUserList || rule.users.some((u) => String(u) === String(userId));
  return roleOk && userOk;
}

// Handler dùng chung cho GET theo id/name
async function listRowsHandler(req, res) {
  try {
    const { baseId, tableId } = req.params;
    const { rowQuery, colPerms, cellRuleLocks } = req.perms; // từ can()
    const { skip = 0, limit = 50 } = req.query;

    // parse JSON an toàn
    let userFilter = {};
    let userSort = {};
    try {
      userFilter = req.query.filter ? JSON.parse(req.query.filter) : {};
    } catch (_) { /* bỏ qua, dùng {} */ }
    try {
      userSort = req.query.sort ? JSON.parse(req.query.sort) : {};
    } catch (_) { /* bỏ qua, dùng {} */ }

    // Lấy metadata cột (để FE render tiêu đề/loại cột nếu cần)
    const columns = await Column.find({ tableId: OID(tableId) }).lean();
    const keySet = new Set(columns.map((c) => c.key));

    // 1) VISIBLE KEYS từ ROLE (columnPerms)
    const visibleKeys = visibleColumnKeys(colPerms);
    const roleHiddenKeys = new Set(
      (colPerms || []).filter((c) => c.visibility === "hidden").map((c) => c.columnKey)
    );

    // 2) Guard filter/sort theo visible keys hiện tại (role-level)
    const { safeFilter, safeSort } = guardUserQuery({ userFilter, userSort, visibleKeys });

    // 3) MATCH theo rowPolicies + filter hợp lệ
    const matchStage = {
      baseId: OID(baseId),
      tableId: OID(tableId),
      ...(rowQuery || {}),
      ...safeFilter,
    };

    // 4) Query rows (agg tối giản)
    const agg = [
      { $match: matchStage },
      { $project: { _id: 1, baseId: 1, tableId: 1, data: 1, createdBy: 1, createdAt: 1, updatedAt: 1 } },
      { $sort: safeSort },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ];
    let rows = await Row.aggregate(agg);

    // 5) COLUMN VISIBILITY OVERRIDES (user/role) – deny-first
    // Lọc sơ bộ theo principal ở DB
    const principalQuery = {
      baseId: OID(baseId),
      tableId: OID(tableId),
      $and: [
        { $or: [{ users: { $exists: false } }, { users: { $size: 0 } }, { users: req.user._id }] },
        { $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }, { roles: req.perms.roleId }] },
      ],
    };
    const visRules = await ColumnVisibilityRule.find(principalQuery).lean();

    const overrideHidden = new Set();
    const overrideVisible = new Set();
    for (const r of visRules) {
      if (!appliesToCurrentPrincipal(r, { roleId: req.perms.roleId, userId: req.user._id })) continue;
      if (r.visibility === "hidden") overrideHidden.add(r.columnKey);
      else if (r.visibility === "visible") overrideVisible.add(r.columnKey);
    }

    // Áp deny-first: ẩn cứng bởi role → luôn ẩn; hidden override → ẩn mềm; visible override → chỉ gỡ ẩn mềm
    for (const key of Array.from(visibleKeys)) {
      if (roleHiddenKeys.has(key)) { visibleKeys.delete(key); continue; }
      if (overrideHidden.has(key)) { visibleKeys.delete(key); }
    }
    for (const key of overrideVisible) {
      if (!roleHiddenKeys.has(key)) visibleKeys.add(key);
    }

    // 6) Ẩn cột theo visibleKeys đã finalize
    rows = rows.map((r) => {
      const data = {};
      const src = r.data || {};
      for (const k of Object.keys(src)) {
        if (visibleKeys.has(k)) data[k] = src[k];
      }
      return { ...r, data };
    });

    // 7) TÍNH LOCK THEO RULE (cellRuleLocks) – ưu tiên hidden > readOnly
    const locksByRowId = {};
    for (const row of rows) {
      const rowId = String(row._id);
      locksByRowId[rowId] = locksByRowId[rowId] || {};

      for (const rl of (cellRuleLocks || [])) {
        if (!appliesToCurrentPrincipal(rl, { roleId: req.perms.roleId, userId: req.user._id })) continue;

        // where kiểu { "data.Status": "Approved" }
        const ok = Object.entries(rl.where || {}).every(([kk, vv]) => {
          const val = kk.split(".").reduce((o, t) => (o ? o[t] : undefined), row);
          return val === vv;
        });
        if (!ok) continue;

        const targetCols = rl.columns.includes("*")
          ? Array.from(visibleKeys)
          : rl.columns.filter((k) => keySet.has(k) && visibleKeys.has(k));

        for (const ck of targetCols) {
          const curr = locksByRowId[rowId][ck];
          if (rl.mode === "hidden") {
            locksByRowId[rowId][ck] = "hidden";
          } else if (rl.mode === "readOnly") {
            if (curr !== "hidden") locksByRowId[rowId][ck] = "readOnly";
          } else if (rl.mode === "editableByRole" || rl.mode === "editableByUser") {
            if (curr && curr !== "hidden") delete locksByRowId[rowId][ck];
          }
        }
      }
    }

    // 8) MANUAL LOCKS (áp dụng theo principal + đúng row/col, ưu tiên hidden)
    const manualLocks = await ManualCellLock.find(principalQuery).lean();
    for (const ml of manualLocks) {
      if (!appliesToCurrentPrincipal(ml, { roleId: req.perms.roleId, userId: req.user._id })) continue;

      const targets = Array.isArray(ml.resolvedTargets) && ml.resolvedTargets.length
        ? ml.resolvedTargets
        : (Array.isArray(ml.cells) ? ml.cells : []);

      for (const t of targets) {
        const rowId = String(t.rowId);
        const colKey = t.columnKey;
        if (!locksByRowId[rowId]) continue;          // row không thuộc page hiện tại
        if (!visibleKeys.has(colKey)) continue;      // cột đang ẩn ở column-level
        const curr = locksByRowId[rowId][colKey];

        if (ml.mode === "hidden") {
          locksByRowId[rowId][colKey] = "hidden";
        } else if (ml.mode === "readOnly") {
          if (curr !== "hidden") locksByRowId[rowId][colKey] = "readOnly";
        } else if (ml.mode === "editableByRole" || ml.mode === "editableByUser") {
          if (curr && curr !== "hidden") delete locksByRowId[rowId][colKey];
        }
      }
    }

    // 9) Render: thay giá trị cell hidden → "🔒" và gắn __locks để FE disable edit
    rows = rows.map((r) => {
      const rowId = String(r._id);
      const locks = locksByRowId[rowId] || {};
      const data = { ...r.data };
      for (const [ck, mode] of Object.entries(locks)) {
        if (mode === "hidden" && ck in data) data[ck] = "🔒";
      }
      return {
        ...r,
        data,
        __locks: locks,
      };
    });

    // (Tuỳ chọn) trả kèm danh sách cột visible để FE render header dễ dàng
    const columnsVisibleOnly = columns.filter((c) => visibleKeys.has(c.key));

    return res.json({
      ok: true,
      data: rows,
      columns: columnsVisibleOnly, // hoặc trả full columns nếu FE cần
      _table: {
        canCreate: !!req.perms.canCreate,
        canUpdate: !!req.perms.canUpdate,
        canDelete: !!req.perms.canDelete,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "rows_read_error" });
  }
}

// UPDATE row: chặn sửa cell nếu hidden/readOnly hoặc cột bị ẩn
async function updateRowHandler(req, res, next) {
  try {
    const { baseId, tableId, rowId } = req.params; const patch = req.body?.data || {};

    // Tải row hiện tại để đánh giá rule locks
    const row = await Row.findOne({ _id: rowId, baseId, tableId }).lean();
    if (!row) return res.status(404).json({ ok: false, error: "row_not_found" });

    const { colPerms, cellRuleLocks } = req.perms; const visibleKeys = visibleColumnKeys(colPerms);

    // Tính lock theo rule trên row hiện tại
    const locks = {};
    for (const rl of cellRuleLocks || []) {
      if (!appliesToCurrentPrincipal(rl, { roleId: req.perms.roleId, userId: req.user._id })) continue;
      const match = Object.entries(rl.where || {}).every(([k, v]) => {
        const val = k.split(".").reduce((o, kk) => (o ? o[kk] : undefined), row); return val === v;
      });
      if (!match) continue;
      const targetCols = rl.columns.includes("*") ? Array.from(visibleKeys) : rl.columns;
      for (const ck of targetCols) {
        if (rl.mode === "hidden") {
          locks[ck] = "hidden";
        }
        else if (rl.mode === "readOnly" && locks[ck] !== "hidden") {
          locks[ck] = "readOnly";
        } else if (rl.mode === "editableByRole") {
          if (locks[ck] && locks[ck] !== "hidden") delete locks[ck]
        }
        else if (rl.mode === "editableByUser") {
          if (locks[ck] && locks[ck] !== "hidden") delete locks[ck]
        }
      }
    }

    // Áp lock thủ công
    const manual = await ManualCellLock.find({ baseId, tableId }).lean();
    for (const ml of manual) {
      if (!appliesToCurrentPrincipal(ml, { roleId: req.perms.roleId, userId: req.user._id })) continue;
      for (const t of ml.resolvedTargets || ml.cells || []) {
        if (String(t.rowId) === String(rowId)) {
          const ck = t.columnKey;
          if (ml.mode === "hidden") locks[ck] = "hidden";
          else if (ml.mode === "readOnly" && locks[ck] !== "hidden") locks[ck] = "readOnly";
        }
      }
    }

    // CHẶN: không cho update cột ẩn hoặc cell bị lock
    for (const [k] of Object.entries(patch)) {
      if (!visibleKeys.has(k)) return res.status(403).json({ ok: false, error: `column_hidden:${k}` });
      if (locks[k] === "hidden" || locks[k] === "readOnly") return res.status(403).json({ ok: false, error: `cell_locked:${k}` });
    }

    // Áp patch
    const updated = await Row.findOneAndUpdate(
      { _id: rowId },
      { $set: Object.fromEntries(Object.entries(patch).map(([k, v]) => [`data.${k}`, v])) },
      { new: true }
    );
    res.json({ ok: true, data: updated });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "row_update_error" }); }
}

async function createRowHandler(req, res, next) {
  try {
    const { baseId, tableId } = req.params; const body = req.body || {};
    const doc = await Row.create({ baseId, tableId, data: body.data || {}, createdBy: req.user._id });
    res.json({ ok: true, data: doc });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "row_create_error" }); }
}

async function createRowByTableNameHandler(req, res, next) {
  // can() đã resolve tableName -> tableId
  req.url = `/bases/${req.params.baseId}/tables/${req.params.tableId}/rows`;
  return routerRows.handle(req, res);
}

async function updateRowByTableNameHandler(req, res, next) {
  req.url = `/bases/${req.params.baseId}/tables/${req.params.tableId}/rows/${req.params.rowId}`;
  return routerRows.handle(req, res);
}
async function deleteRowHandler(req, res, next) {
  try { await Row.findByIdAndDelete(req.params.rowId); res.json({ ok: true }); }
  catch (e) { console.error(e); res.status(500).json({ ok: false, error: "row_delete_error" }); }
}
async function deleteRowByTableNameHandler(req, res, next) {
  req.url = `/bases/${req.params.baseId}/tables/${req.params.tableId}/rows/${req.params.rowId}`;
  return routerRows.handle(req, res);
}
// GET theo tableId
routerRows.get("/bases/:baseId/tables/:tableId/rows", can("read"), listRowsHandler);
// GET theo tableName
routerRows.get("/bases/:baseId/tables/by-name/:tableName/rows", can("read"), listRowsHandler);

// CREATE row (giữ nguyên logic, rowPolicy thường không áp khi create)
routerRows.post("/bases/:baseId/tables/:tableId/rows", can("create"), createRowHandler);

// CREATE theo tableName
routerRows.post("/bases/:baseId/tables/by-name/:tableName/rows", can("create"), createRowByTableNameHandler);


routerRows.patch("/bases/:baseId/tables/:tableId/rows/:rowId", can("update"), updateRowHandler);

// UPDATE theo tableName
routerRows.patch("/bases/:baseId/tables/by-name/:tableName/rows/:rowId", can("update"), updateRowByTableNameHandler);

// DELETE row (tablePerm.delete)
routerRows.delete("/bases/:baseId/tables/:tableId/rows/:rowId", can("delete"), deleteRowHandler);
// DELETE theo tableName
routerRows.delete("/bases/:baseId/tables/by-name/:tableName/rows/:rowId", can("delete"), deleteRowByTableNameHandler);

export default routerRows;