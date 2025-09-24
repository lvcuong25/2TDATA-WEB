import CellLockHistory from "../model/CellLockHistory.js";

export class PermissionService {
  
  // Check if user can perform action on a cell
  static async canEditCell(user, baseId, resource, rowId, column) {
    // Owner/Admin always editable
    const rolesWithFull = user.orgRoles.filter(r => r.role.name === "Owner" || r.role.name === "Admin");
    if (rolesWithFull.length > 0) return true;

    // Check cell permission
    const perms = [];
    user.orgRoles.forEach(r => {
      r.permissions.forEach(p => {
        if (p.scope === "cell" && p.resource === resource) perms.push(p);
      });
    });

    const cellPerm = perms.find(p => p.cellRule?.rowId?.toString() === rowId?.toString() && p.cellRule?.column === column);
    if (!cellPerm) return false;

    if (cellPerm.cellMode === "hidden") return false;
    if (cellPerm.cellMode === "readonly") return false;
    if (cellPerm.cellMode === "editable") return true;

    return false;
  }

  // Check if user can see cell
  static async canSeeCell(user, baseId, resource, rowId, column) {
    const rolesWithFull = user.orgRoles.filter(r => r.role.name === "Owner" || r.role.name === "Admin");
    if (rolesWithFull.length > 0) return true;

    const perms = [];
    user.orgRoles.forEach(r => {
      r.permissions.forEach(p => {
        if (p.scope === "cell" && p.resource === resource) perms.push(p);
      });
    });

    const cellPerm = perms.find(p => p.cellRule?.rowId?.toString() === rowId?.toString() && p.cellRule?.column === column);
    if (!cellPerm) return true; // default visible

    if (cellPerm.cellMode === "hidden") return false;
    return true;
  }

  // Lock / Unlock a cell
  static async lockCell(user, resource, rowId, column) {
    const now = new Date();
    await CellLockHistory.create({
      cellResource: `${resource}.${column}`,
      lockedBy: user._id,
      lockedAt: now
    });
  }

  static async unlockCell(user, resource, rowId, column) {
    const now = new Date();
    const lock = await CellLockHistory.findOne({
      cellResource: `${resource}.${column}`,
      unlockedAt: null
    }).sort({ lockedAt: -1 });

    if (!lock) throw new Error("Cell not locked");

    lock.unlockedBy = user._id;
    lock.unlockedAt = now;
    await lock.save();
  }

  // Check if currently locked
  static async isCellLocked(resource, rowId, column) {
    const lock = await CellLockHistory.findOne({
      cellResource: `${resource}.${column}`,
      unlockedAt: null
    }).sort({ lockedAt: -1 });
    return lock;
  }
}
