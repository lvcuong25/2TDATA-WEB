import express from "express";
import Base from "../model/Base.js";
import BaseMember from "../model/BaseMember.js";
import BaseRole from "../model/BaseRole.js";
import { canCreateTable } from "../middlewares/can.js";


const router = express.Router({ mergeParams: true });


/**
 * Path: /bases/:baseId/roles/:roleId/columns/:columnKey/visibility
 * Body: {visibility: "hidden|visible",]}
 * - Ẩn hiện cột ở cập Role (Update vào BaseRole.columnPerms.visibility)
 */
router.post("/bases/:baseId/roles/:roleId/columns/:columnKey/visibility", canCreateTable(), async (req, res, next) => {
  try {
    const { baseId, roleId, columnKey } = req.params;
    const { visibility } = req.body || {};
    if (!["hidden", "visible"].includes(visibility)) {
      return res.status(400).json({ ok: false, error: "invalid_visibility" });
    }
    const role = await BaseRole.findOne({ _id: roleId, baseId }).lean();
    if (!role) return res.status(404).json({ ok: false, error: "role_not_found_in_base" });
    const update = {};
    const r1 = await BaseRole.updateOne(
      { _id: roleId, "columnPerms.columnKey": columnKey },
      { $set: { "columnPerms.$.visibility": visibility } }
    );

    if (r1.matchedCount === 0) {
      // không tìm thấy columnKey trong columnPerms, thêm mới
      const r2 = await BaseRole.updateOne(
        { _id: roleId },
        { $addToSet: { columnPerms: { columnKey, visibility, edit: 'rw' } } }
      );

      if (r2.modifiedCount === 0) {
        return res.status(500).json({ ok: false, error: "update_failed" });
      }
    }


  } catch (e) { return next(e); }
})

export default router;