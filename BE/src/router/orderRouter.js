


import Order from "../model/Order.js";
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder
} from "../controllers/orderController.js";
import { Router } from 'express';
import { PermissionService } from "../services/PermissionService.js";
const routerOrder = Router();

routerOrder.get("/", getOrders);


export default routerOrder;
