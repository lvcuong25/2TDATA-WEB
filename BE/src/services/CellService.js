import CellState from "../model/CellState.js";
import CellLockHistory from "../model/CellLockHistory.js";

export const checkCellPermission = (user, action) => {
  // user.orgRoles: [{ role, permissions }]
  return user.orgRoles.some(r =>
    r.permissions.some(p => p.scope === "cell" && p.actions.includes(action)) ||
    ["Owner", "Admin"].includes(r.role.name)
  );
};

export const updateCellState = async ({ resource, rowId, column, user, mode }) => {
  const cell = await CellState.findOneAndUpdate(
    { resource, rowId, column },
    {
      $set: {
        cellMode: mode,
        ...(mode === "hidden" ? { hiddenBy: user._id, hiddenAt: new Date() } : {}),
        ...(mode === "readonly" ? { lockedBy: user._id, lockedAt: new Date() } : {}),
        ...(mode === "editable" ? { lockedBy: null, lockedAt: null, hiddenBy: null, hiddenAt: null } : {})
      }
    },
    { upsert: true, new: true }
  );

  // Lưu lịch sử
  await CellLockHistory.create({
    resource,
    rowId,
    column,
    action: mode === "readonly" ? "lock" : mode === "editable" ? "unlock" : mode === "hidden" ? "hide" : "unhide",
    by: user._id
  });

  return cell;
};
