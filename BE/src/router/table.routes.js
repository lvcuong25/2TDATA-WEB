// ─────────────────────────────────────────────────────────────────────────────
// src/routes/columns.routes.js — Xoá cột (check deletable)
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import Table from "../model/Table.js";

const routerTable = express.Router({ mergeParams: true });

const updateTableAccess = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    const { userIds, allUsers, access } = req.body;

    const table = await Table.findByIdAndUpdate(
      tableId,
      {
        $set: {
          "tableAccessRule.userIds": userIds,
          "tableAccessRule.allUsers": allUsers,
          "tableAccessRule.access": access,
        },
      },
      { new: true }
    );

    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({
      message: "Table access updated",
      tableAccessRule: table.tableAccessRule,
    });
  } catch (err) {
    next(err);
  }
};

const updateColumnAccess = async (req, res, next) => {
  try {
    const { tableId, columnId } = req.params;
    const { userIds, allUsers, access } = req.body;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });
    if (!table.columnAccessRules) {
      table.columnAccessRules = [];
    }
    table.columnAccessRules.push({
      columnId,
      userIds,
      allUsers,
      access,
      createdBy: req.user?._id, // optional if you have auth
    });

    await table.save();
    res.json({
      message: "Column access rule added",
      columnAccessRules: table.columnAccessRules,
    });
  } catch (err) {
    next(err);
  }
};

const updateRecordAccess = async (req, res, next) => {
  try {
    const { tableId, recordId } = req.params;
    const { userIds, allUsers, access } = req.body;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });
    if (!table.recordAccessRules) {
      table.recordAccessRules = [];
    }
    table.recordAccessRules.push({
      recordId,
      userIds,
      allUsers,
      access,
      createdBy: req.user?._id,
    });

    await table.save();
    res.json({
      message: "Record access rule added",
      recordAccessRules: table.recordAccessRules,
    });
  } catch (err) {
    next(err);
  }
};

const updateCellAccess = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    const { userIds, allUsers, access, columnId, recordId } = req.body;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });
    if (!table.cellAccessRules) {
      table.cellAccessRules = [];
    }
    table.cellAccessRules.push({
      recordId,
      columnId,
      userIds,
      allUsers,
      access,
      createdBy: req.user?._id,
    });

    await table.save();
    res.json({
      message: "Cell access rule added",
      cellAccessRules: table.cellAccessRules,
    });
  } catch (err) {
    next(err);
  }
};

routerTable.post("/:tableId/access", updateTableAccess);
routerTable.post("/:tableId/columns/:columnId/access", updateColumnAccess);
routerTable.post("/:tableId/records/:recordId/access", updateRecordAccess);
routerTable.post("/:tableId/cell/access", updateCellAccess);

export default routerTable;
