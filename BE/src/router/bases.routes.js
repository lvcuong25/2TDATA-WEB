// ─────────────────────────────────────────────────────────────────────────────
// src/routes/bases.routes.js — Tạo Base + seed roles built-in
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import { guardOrgBaseLimit } from "../middlewares/limits.js";
import {
  createBase,
  detailBase,
  listBase,
} from "../controllers/baseController.js";

const router = express.Router();

router.post(
  "/orgs/:orgId/bases",
  guardOrgBaseLimit({ defaultLimit: 20 }),
  createBase
);

router.get("/orgs/:orgId/bases", listBase);
router.get("/orgs/:orgId/bases/:baseId", detailBase);

export default router;
