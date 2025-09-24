// ─────────────────────────────────────────────────────────────────────────────
// src/routes/columns.read.routes.js — Trả danh sách cột theo quyền
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import Column from "../model/Column.js";
import { can } from "../middlewares/can.js";

const routerColsRead = express.Router({ mergeParams: true });

// Helper: set các key cột visible
function visibleColumnKeys(colPerms) { return new Set(colPerms.filter((p) => p.visibility !== "hidden").map((p) => p.columnKey)); }

// Lấy danh sách cột — theo tableId

async function getListColumnsByTableId(req, res, next) {
  const { tableId } = req.params; 
  const { colPerms } = req.perms; 
  const vset = visibleColumnKeys(colPerms);
  const all = await Column.find({ tableId }).lean();
  res.json({ ok: true, data: all.filter((c) => vset.has(c.key)) });
}

async function getListColumnsByTableName(req, res, next) {
  const { tableId } = req.params; 
  const { colPerms } = req.perms; 
  const vset = visibleColumnKeys(colPerms);
  const all = await Column.find({ tableId }).lean();
  res.json({ ok: true, data: all.filter((c) => vset.has(c.key)) });
}

routerColsRead.get("/bases/:baseId/tables/:tableId/columns", can("read"), getListColumnsByTableId);

// Lấy danh sách cột — theo tableName
routerColsRead.get("/bases/:baseId/tables/by-name/:tableName/columns", can("read"), getListColumnsByTableName);

export default routerColsRead;
