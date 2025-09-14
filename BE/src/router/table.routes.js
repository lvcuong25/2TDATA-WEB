// ─────────────────────────────────────────────────────────────────────────────
// src/routes/columns.routes.js — Xoá cột (check deletable)
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import BaseRole from "../model/BaseRole.js";
import Table from "../model/Table.js";
import { canCreateTable } from "../middlewares/can.js";

const routerTable = express.Router({ mergeParams: true });


async function createTable(req, res, next) {
  try {
    const { baseId } = req.params;
    const { name, description, dataBaseId, siteId } = req.body;

    // Create table logic here
    const table = await Table.create({ baseId, name, description, dataBaseId, siteId });

    //Update tablePerms cho Owner/Admin của base

    await BaseRole.updateMany(
      { baseId, name: { $in: ["Owner", "Admin"] } },
      {
        $addToSet: {
          tablePerms: {
            tableId: table._id,
            creatable: true,
            readable: true,
            updatable: true,
            deletable: true
          }
        }
      }
    )
    return res.status(200).json({ ok: true, data: table });
  } catch (e) {

    if (e.code === 11000) {
      return res.status(400).json({ ok: false, error: "table_name_duplicate" });
    }
    return next(e);

  }
}

routerTable.post("/bases/:baseId/tables", canCreateTable(), createTable);


export default routerTable;