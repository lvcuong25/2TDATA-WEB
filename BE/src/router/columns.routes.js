// ─────────────────────────────────────────────────────────────────────────────
// src/routes/columns.routes.js — Xoá cột (check deletable)
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import Column from "../model/Column.js";
import Row from "../model/Row.js";
import { can } from "../middlewares/can.js";

const routerCols = express.Router({ mergeParams: true });


async function deleteColumnById(req, res, next) {
  try {
    const { baseId, tableId, columnId } = req.params; const { colPerms } = req.perms;
    const col = await Column.findOne({ _id: columnId, tableId, baseId }).lean();
    if (!col) return res.status(404).json({ ok: false, error: "column_not_found" });

    const p = colPerms.find((x) => String(x.tableId) === String(tableId) && String(x.columnId) === String(columnId));
    if (!p || p.deletable !== true) return res.status(403).json({ ok: false, error: "column_not_deletable" });

    // 1) Xoá metadata column
    await Column.deleteOne({ _id: columnId });
    // 2) (Tuỳ chọn) Xoá dữ liệu key trong mọi row để gọn CSDL
    await Row.updateMany({ baseId, tableId }, { $unset: { [`data.${col.key}`]: "" } });

    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "column_delete_error" }); }
}

async function deleteColumnByKey(req, res, next) {
  try {
    const { baseId, tableId, columnKey } = req.params; // tableId đã được can() add vào req.params
    const col = await Column.findOne({ baseId, tableId, key: columnKey }).lean();
    if (!col) return res.status(404).json({ ok: false, error: "column_not_found" });
    // Điều hướng sang handler theo columnId để tái dùng check
    req.params.columnId = String(col._id);
    req.url = `/bases/${baseId}/tables/${tableId}/columns/${req.params.columnId}`;
    return routerCols.handle(req, res);
  } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "column_delete_error" }); }
}

// Xoá theo columnId (đảm bảo role hiện tại có columnPerm.deletable === true)
routerCols.delete("/bases/:baseId/tables/:tableId/columns/:columnId", can("update"), deleteColumnById);
// Xoá theo columnKey + tableName (thân thiện FE)
routerCols.delete("/bases/:baseId/tables/by-name/:tableName/columns/:columnKey", can("update"), deleteColumnByKey);

export default routerCols;