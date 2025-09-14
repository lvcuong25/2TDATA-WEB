// // ─────────────────────────────────────────────────────────────────────────────
// // src/routes/locks.routes.js — Manual cell locks (by-id + by-name)
// // ─────────────────────────────────────────────────────────────────────────────
// import express from "express";
// import ManualCellLock from "../model/ManualCellLock.js";
// import { can } from "../middlewares/can.js";

// const routerLocks = express.Router({ mergeParams: true });

// // Tạo lock thủ công cho bảng (dựa vào tableId)
// routerLocks.post("/bases/:baseId/tables/:tableId/locks", can("update"), async (req, res, next) => {
//   try {
//     const { baseId, tableId } = req.params;
//     const { cells = [], a1Ranges = [], resolvedTargets = [], mode, roles = [], users = [], note } = req.body;
//     const created = await ManualCellLock.create({ baseId, tableId, cells, a1Ranges, resolvedTargets, mode, roles, users, lockedBy: req.user._id, note });
//     res.json({ ok: true, data: created });
//   } catch (e) { console.error(e); res.status(500).json({ ok: false, error: "lock_create_error" }); }
// });

// // Xem danh sách lock
// routerLocks.get("/bases/:baseId/tables/:tableId/locks", can("read"), async (req, res) => {
//   const { baseId, tableId } = req.params; const items = await ManualCellLock.find({ baseId, tableId }).lean(); res.json({ ok: true, data: items });
// });

// // Xoá lock
// routerLocks.delete("/bases/:baseId/tables/:tableId/locks/:lockId", can("update"), async (req, res) => {
//   const { lockId } = req.params; await ManualCellLock.findByIdAndDelete(lockId); res.json({ ok: true });
// });

// // Bản by-name: tái sử dụng can() để resolve tableName -> tableId, rồi điều hướng
// routerLocks.post("/bases/:baseId/tables/by-name/:tableName/locks", can("update"), async (req, res) => {
//   req.url = `/bases/${req.params.baseId}/tables/${req.params.tableId}/locks`;
//   return routerLocks.handle(req, res);
// });
// routerLocks.get("/bases/:baseId/tables/by-name/:tableName/locks", can("read"), async (req, res) => {
//   req.url = `/bases/${req.params.baseId}/tables/${req.params.tableId}/locks`;
//   return routerLocks.handle(req, res);
// });

// export default routerLocks;




import express from "express";
import ManualCellLock from "../model/ManualCellLock.js";
import { can } from "../middlewares/can.js";
 
const router = express.Router({ mergeParams: true });
 
// Helper: rule áp dụng cho user/role hiện tại?
function appliesToCurrentPrincipal(rule, { roleId, userId }) {
  const hasRoleList = Array.isArray(rule.roles) && rule.roles.length > 0;
  const hasUserList = Array.isArray(rule.users) && rule.users.length > 0;
  const roleOk = !hasRoleList || rule.roles.some(r => String(r) === String(roleId));
  const userOk = !hasUserList || rule.users.some(u => String(u) === String(userId));
  return roleOk && userOk;
}
 
/** Controller: tạo lock */
async function createLock(req, res, next) {
  try {
    const baseId  = req.params.baseId;
    const tableId = req.params.tableId;        // đã có nếu là route by-id
    // nếu là by-name, middleware can() của bạn đã resolve tableId vào req.params rồi
    if (!tableId) return res.status(400).json({ ok:false, error:"tableId_required" });
 
    const { cells = [], a1Ranges = [], resolvedTargets = [], mode, roles = [], users = [], note } = req.body || {};
    if (!mode) return res.status(400).json({ ok:false, error:"mode_required" });
    if (!Array.isArray(cells) && !Array.isArray(resolvedTargets) && !Array.isArray(a1Ranges)) {
      return res.status(400).json({ ok:false, error:"targets_required" });
    }
 
    const doc = await ManualCellLock.create({
      baseId, tableId, cells, a1Ranges, resolvedTargets, mode, roles, users,
      lockedBy: req.user._id, note
    });
    return res.json({ ok:true, data: doc });
  } catch (e) { return next(e); }
}
 
/** Controller: liệt kê lock */
async function listLocks(req, res, next) {
  try {
    const { baseId, tableId } = req.params;
    if (!tableId) return res.status(400).json({ ok:false, error:"tableId_required" });
    const docs = await ManualCellLock.find({ baseId, tableId }).lean();
    return res.json({ ok:true, data: docs });
  } catch (e) { return next(e); }
}
 
/** Controller: xoá lock */
async function deleteLock(req, res, next) {
  try {
    const { baseId, tableId, lockId } = req.params;
    if (!tableId) return res.status(400).json({ ok:false, error:"tableId_required" });
    const ok = await ManualCellLock.deleteOne({ _id: lockId, baseId, tableId });
    return res.json({ ok:true, deleted: ok.deletedCount || 0 });
  } catch (e) { return next(e); }
}

 
/* ----------------- ROUTES ----------------- */
/* By-ID */
router.post(  "/bases/:baseId/tables/:tableId/locks",        can("update"), createLock);
router.get(   "/bases/:baseId/tables/:tableId/locks",        can("read"),   listLocks);
router.delete("/bases/:baseId/tables/:tableId/locks/:lockId",can("update"), deleteLock);
 
/* By-NAME (KHÔNG forward handle; dùng cùng controller) */
router.post(  "/bases/:baseId/tables/by-name/:tableName/locks",        can("update"), createLock);
router.get(   "/bases/:baseId/tables/by-name/:tableName/locks",        can("read"),   listLocks);
router.delete("/bases/:baseId/tables/by-name/:tableName/locks/:lockId",can("update"), deleteLock);

/**
 * PATCH: bases/:baseId/tables/:tableId/locks/:lockId/users
 * Body: { add?: [], remove?: [] }
 * - Thêm/xoá user trong lock hiện có
 */

router.patch("/bases/:baseId/tables/:tableId/locks/:lockId/users", can("update"), async (req, res, next) => {
  try {
    const { baseId, tableId, lockId } = req.params; 

    const { add = [], remove = [] } = req.body || {};
    if (!Array.isArray(add) || !Array.isArray(remove)) {
      return res.status(400).json({ ok: false, error: "add_remove_must_be_array" });
    }
    if (add.length === 0 && remove.length === 0) {
      return res.status(400).json({ ok: false, error: "add_or_remove_required" });
    }
    const lock = await ManualCellLock.findOne({ _id: lockId, baseId, tableId }).lean();
    if (!lock) {
      return res.status(404).json({ ok: false, error: "lock_not_found" });
    }   
    // Cập nhật lock: $addToSet + $pull
    const update = {};    
    if (add.length > 0) {
      update.$addToSet = { users: { $each: add } };
    }

    if (remove.length > 0) {
      update.$pull = { users: { $in: remove } };
    }
    const updated = await ManualCellLock.findByIdAndUpdate(lockId, update, { new: true });
    return res.json({ ok: true, data: updated });
  } catch (e) { return next(e); }
});
 
/**
 * PATCH: bases/:baseId/tables/:tableId/locks/:lockId/roles
 * Body: { add?: [], remove?: [] }
 * - Thêm/xoá role trong lock hiện có
 * 
 */
router.patch("/bases/:baseId/tables/:tableId/locks/:lockId/roles", can("update"), async (req, res, next) => {  
  try {
    const { baseId, tableId, lockId } = req.params;     
    const { add = [], remove = [] } = req.body || {}; 
    if (!Array.isArray(add) || !Array.isArray(remove)) {
      return res.status(400).json({ ok: false, error: "add_remove_must_be_array" });
    }   
    if (add.length === 0 && remove.length === 0) {
      return res.status(400).json({ ok: false, error: "add_or_remove_required" });
    }   
    const lock = await ManualCellLock.findOne({ _id: lockId, baseId, tableId }).lean();
    if (!lock) {
      return res.status(404).json({ ok: false, error: "lock_not_found" });
    }   
    // Cập nhật lock: $addToSet + $pull
    const update = {};
    if (add.length > 0) {
      update.$addToSet = { roles: { $each: add } };
    }     
    if (remove.length > 0) {
      update.$pull = { roles: { $in: remove } };
    }   
    const updated = await ManualCellLock.findByIdAndUpdate(lockId, update, { new: true });
    return res.json({ ok: true, data: updated });
  } 
  catch (e) { return next(e); }
});


export default router;