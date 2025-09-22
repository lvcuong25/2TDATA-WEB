// controllers/orderController.js
import Order from "../model/Order.js";
import OrgMember from "../model/OrgMember.js";
import Base from "../model/Base.js";
import { PermissionService } from "../services/PermissionService.js";
import CellState from "../model/CellState.js";
/**
 * GET /orders
 */
export const getOrders = async (req, res) => {
  try {
    const user = req.user;

    const orders = await Order.find().lean(); // lean để merge dễ hơn

    const rowIds = orders.map(o => o._id);
    const cells = await CellState.find({ resource: "orders", rowId: { $in: rowIds } })
      .populate("lockedBy hiddenBy", "name email");

    const ordersWithCellState = orders.map(order => {
      const cellStates = {};
      cells.forEach(c => {
        if (c.rowId.toString() === order._id.toString()) {
          cellStates[c.column] = {
            mode: c.cellMode,
            lockedBy: c.lockedBy,
            lockedAt: c.lockedAt,
            hiddenBy: c.hiddenBy,
            hiddenAt: c.hiddenAt
          };
        }
      });

      // Merge cell state vào order
      return { ...order, cellStates };
    });

    res.json({ orders: ordersWithCellState });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const { site, user } = req;
    const data = req.body;
    const order = await Order.create({
      ...data,
      site: site._id,
      createdBy: user._id
    });
    return res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { site, user } = req;
    const order = await Order.findOne({ _id: req.params.id, site: site._id })
      .populate("base")
      .populate("createdBy", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check row-level permission
    if (req.permissionFilter?.length) {
      const allowed = req.permissionFilter.some(f => Object.keys(f).every(k => order[k] === f[k]));
      if (!allowed) return res.status(403).json({ message: "Forbidden" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /orders/:id
 */
export const updateOrder = async (req, res, next) => {
  try {
    const { site } = req;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, site: site._id },
      req.body,
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /orders/:id
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { site } = req;
    const order = await Order.findOneAndDelete({ _id: req.params.id, site: site._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (error) {
    next(error);
  }
};
