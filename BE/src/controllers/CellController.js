// controllers/cellController.js
import CellState from "../model/CellState.js";
import CellLockHistory from "../model/CellLockHistory.js";

function hasPermission(user, action) {
  // Owner, Admin: full quyền
  if (user.roles.some(r => ["Owner", "Admin"].includes(r.role.name))) return true;

  return user.roles.some(r =>
    r.permissions.some(p =>
      p.scope === "cell" && p.actions.includes(action)
    )
  );
}

export const lockCell = async (req, res) => {
  try {
    const { resource, rowId, column } = req.body;
    const user = req.user;

    if (!hasPermission(user, "lock")) {
      return res.status(403).json({ message: "No permission to lock" });
    }

    const cell = await CellState.findOneAndUpdate(
      { resource, rowId, column },
      { mode: "readonly", lockedBy: user._id, lockedAt: new Date() },
      { upsert: true, new: true }
    );

    await CellLockHistory.create({
      resource,
      rowId,
      column,
      action: "lock",
      user: user._id,
      org: user.currentOrg,
      timestamp: new Date(),
    });

    res.json({ message: "Cell locked", cell });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unlockCell = async (req, res) => {
  try {
    const { resource, rowId, column } = req.body;
    const user = req.user;

    if (!hasPermission(user, "lock")) {
      return res.status(403).json({ message: "No permission to unlock" });
    }

    const cell = await CellState.findOneAndUpdate(
      { resource, rowId, column },
      { mode: "editable", lockedBy: null, lockedAt: null },
      { new: true }
    );

    await CellLockHistory.create({
      resource,
      rowId,
      column,
      action: "unlock",
      user: user._id,
      org: user.currentOrg,
      timestamp: new Date(),
    });

    res.json({ message: "Cell unlocked", cell });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const hideCell = async (req, res) => {
  try {
    const { resource, rowId, column } = req.body;
    const user = req.user;

    if (!hasPermission(user, "hide")) {
      return res.status(403).json({ message: "No permission to hide" });
    }

    const cell = await CellState.findOneAndUpdate(
      { resource, rowId, column },
      { mode: "hidden", hiddenBy: user._id, hiddenAt: new Date() },
      { upsert: true, new: true }
    );

    await CellLockHistory.create({
      resource,
      rowId,
      column,
      action: "hide",
      user: user._id,
      org: user.currentOrg,
      timestamp: new Date(),
    });

    res.json({ message: "Cell hidden", cell });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unhideCell = async (req, res) => {
  try {
    const { resource, rowId, column } = req.body;
    const user = req.user;

    if (!hasPermission(user, "hide")) {
      return res.status(403).json({ message: "No permission to unhide" });
    }

    const cell = await CellState.findOneAndUpdate(
      { resource, rowId, column },
      { mode: "editable", hiddenBy: null, hiddenAt: null },
      { new: true }
    );

    await CellLockHistory.create({
      resource,
      rowId,
      column,
      action: "unhide",
      user: user._id,
      org: user.currentOrg,
      timestamp: new Date(),
    });

    res.json({ message: "Cell unhidden", cell });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
