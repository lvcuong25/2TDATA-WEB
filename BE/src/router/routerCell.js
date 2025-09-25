

import { lockCell, unlockCell, hideCell, unhideCell } from "../controllers/CellController.js";
import { Router } from 'express';
const routerCell = new Router();


routerCell.post("/lock", lockCell);
routerCell.post("/unlock", unlockCell);
routerCell.post("/hide", hideCell);
routerCell.post("/unhide", unhideCell);

export default routerCell;
