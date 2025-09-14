import express from "express";

import ColumnVisibilityRule from "../model/ColumnVisibilityRule.js";
import { canCreateTable } from "../middlewares/can.js";

const router = express.Router({ mergeParams: true });

/** 
 * POST /bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules
 * Body: { roles?:[], users?:[], visibility:"hidden|visible", note?}
 * - Tạo rule ẩn/hiện cột cho user/role cụ thể
 * - Nếu đã có rule cho cột+role+user thì ghi đè (update)
 * - Nếu roles/users trống thì áp dụng cho tất cả
 * */

router.post("/bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules", canCreateTable(), async (req, res, next) => {
  try {
    const { baseId, tableId, columnKey } = req.params;
    const { roles = [], users = [], visibility, note } = req.body || {};
    const { _id: userId } = req.user || {}; // người tạo rule

    if (!["hidden", "visible"].includes(visibility)) {
      return res.status(400).json({ ok: false, error: "invalid_visibility" });
    }       
    if (!Array.isArray(roles) || !Array.isArray(users)) {
      return res.status(400).json({ ok: false, error: "roles_users_must_be_array" });
    }
    if (roles.length === 0 && users.length === 0) {
      // không có role/user nào, áp dụng cho tất cả
      console.log("Rule applies to all users");
    }
    // Tìm xem đã có rule cho cột+role+user chưa
    const existingRule = await ColumnVisibilityRule.findOne({ baseId, tableId, columnKey, roles: { $all: roles }, users: { $all: users } }).lean();
    if (existingRule) {
      // Cập nhật rule
      const updated = await ColumnVisibilityRule.findByIdAndUpdate(existingRule._id, { visibility, note, createdBy: userId }, { new: true });
      return res.json({ ok: true, data: updated, message: "updated_existing_rule" });
    } else {
      // Tạo mới rule
      const created = await ColumnVisibilityRule.create({ baseId, tableId, columnKey, roles, users, visibility, note, createdBy: userId });
      return res.json({ ok: true, data: created, message: "created_new_rule" });
    } 
  } catch (e) { return next(e); }
})

/** 
 * PATCH: /bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules/:ruleId/users
 * Body: { add?: [], remove?: [] }
 * - Thêm/xoá user trong rule hiện có
 * */
router.patch("/bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules/:ruleId/users", canCreateTable(), async (req, res, next) => {
  try {
    const { baseId, tableId, columnKey, ruleId } = req.params;  

    const { add = [], remove = [] } = req.body || {};
    if (!Array.isArray(add) || !Array.isArray(remove)) {
      return res.status(400).json({ ok: false, error: "add_remove_must_be_array" });
    } 
    if (add.length === 0 && remove.length === 0) {
      return res.status(400).json({ ok: false, error: "add_or_remove_required" });
    }
    const rule = await ColumnVisibilityRule.findOne({ _id: ruleId, baseId, tableId, columnKey }).lean();
    if (!rule) {
      return res.status(404).json({ ok: false, error: "rule_not_found" });
    } 
    // Cập nhật rule: $addToSet + $pull
    const update = {};
    if (add.length > 0) {
      update.$addToSet = { users: { $each: add } };
    } 
    if (remove.length > 0) {
      update.$pull = { users: { $in: remove } };
    }
    const updated = await ColumnVisibilityRule.findByIdAndUpdate(ruleId, update, { new: true });
    return res.json({ ok: true, data: updated });
  } catch (e) { return next(e); }
});

/** 
 * PATCH /bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules/:ruleId/roles
 * Body: { add?: [], remove?: [] }
 * - Thêm/xoá role trong rule hiện có
 * */
router.patch("/bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules/:ruleId/roles", canCreateTable(), async (req, res, next) => {  
  try {
    const { baseId, tableId, columnKey, ruleId } = req.params;  
    const { add = [], remove = [] } = req.body || {}; 
    if (!Array.isArray(add) || !Array.isArray(remove)) {
      return res.status(400).json({ ok: false, error: "add_remove_must_be_array" });
    }
    if (add.length === 0 && remove.length === 0) {
      return res.status(400).json({ ok: false, error: "add_or_remove_required" });
    } 
    const rule = await ColumnVisibilityRule.findOne({ _id: ruleId, baseId, tableId, columnKey }).lean();
    if (!rule) {
      return res.status(404).json({ ok: false, error: "rule_not_found" });
    }
    // Cập nhật rule: $addToSet + $pull
    const update = {};  
    if (add.length > 0) {
      update.$addToSet = { roles: { $each: add } };
    }     
    if (remove.length > 0) {
      update.$pull = { roles: { $in: remove } };
    }
    const updated = await ColumnVisibilityRule.findByIdAndUpdate(ruleId, update, { new: true });
    return res.json({ ok: true, data: updated });
  }
  catch (e) { return next(e); }
});


/** 
 * DELETE /bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules/:ruleId
 * - Xoá rule hiện có   
 * */
router.delete("/bases/:baseId/tables/:tableId/columns/:columnKey/visibility-rules/:ruleId", canCreateTable(), async (req, res, next) => {
  try {   
    const { baseId, tableId, columnKey, ruleId } = req.params;
    const rule = await ColumnVisibilityRule.findOne({ _id: ruleId, baseId, tableId, columnKey }).lean();
    if (!rule) {
      return res.status(404).json({ ok: false, error: "rule_not_found" });
    }

    await ColumnVisibilityRule.deleteOne({ _id: ruleId });
    return res.json({ ok: true, message: "rule_deleted" });
  } catch (e) { return next(e); }
});

export default router;