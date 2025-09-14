// src/middleware/limits.js
import Organization from "../model/Organization.js";
import Base from "../model/Base.js";
import BaseMember from "../model/BaseMember.js";
 
/**
* Guard A: Giới hạn số lượng Base trong Organization
* - Kiểm tra org.active
* - Lấy baseLimit (nếu undefined => dùng DEFAULT_BASE_LIMIT)
* - Đếm số Base hiện tại của org
* - Nếu >= limit => 403
* - Cho phép bypass nếu req.user.isSuperAdmin === true (tuỳ bạn có flag này không)
*/
export function guardOrgBaseLimit({ defaultLimit = 10, bypassForSuperAdmin = true } = {}) {
  return async (req, res, next) => {
    try {
      const { orgId } = req.params; // tạo base theo /orgs/:orgId/bases
      if (!orgId) return res.status(400).json({ ok: false, error: "orgId_required" });
 
      // (tuỳ chọn) bypass super admin
      if (bypassForSuperAdmin && req.user?.isSuperAdmin) return next();
 
      const org = await Organization.findById(orgId).lean();
      if (!org) return res.status(404).json({ ok: false, error: "org_not_found" });
      if (org.active === false) return res.status(403).json({ ok: false, error: "org_inactive" });
 
      // lấy limit từ org hoặc default
      const baseLimit = Number.isInteger(org.baseLimit) ? org.baseLimit : defaultLimit;
 
      // đếm số base hiện tại
      const current = await Base.countDocuments({ orgId: org._id });
 
      if (current >= baseLimit) {
        return res.status(403).json({
          ok: false,
          error: "org_base_limit_reached",
          meta: { current, limit: baseLimit }
        });
      }
 
      return next();
    } catch (e) {
      return next(e);
    }
  };
  
}

async function getOrgByBaseId(baseId) {
  const base = await Base.findById(baseId).lean();
  if (!base) return { base: null, org: null };
  const org = await Organization.findById(base.orgId).lean();
  return { base, org };
}
 
/**
* Guard B: Giới hạn số member trên mỗi Base
* - Lấy org của base
* - Lấy limit: ưu tiên org.perBaseUserLimit (hoặc base.userLimit nếu có)
* - Đếm member hiện tại
* - Nếu user đã là member thì cho pass (idempotent)
* - Nếu thêm mới vượt limit => 403
*/
export function guardPerBaseUserLimit({ defaultLimit = 200, bypassForSuperAdmin = true } = {}) {
  return async (req, res, next) => {
    try {
      const { baseId } = req.params;
      const { userId } = req.body || {};
 
      if (!baseId) return res.status(400).json({ ok: false, error: "baseId_required" });
      if (!userId) return res.status(400).json({ ok: false, error: "userId_required" });
 
      // (tuỳ chọn) bypass super admin
      if (bypassForSuperAdmin && req.user?.isSuperAdmin) return next();
 
      const { base, org } = await getOrgByBaseId(baseId);
      if (!base) return res.status(404).json({ ok: false, error: "base_not_found" });
      if (!org)  return res.status(404).json({ ok: false, error: "org_not_found" });
      if (org.active === false) return res.status(403).json({ ok: false, error: "org_inactive" });
 
      // nếu đã là member -> cho qua (không tính vào limit lần nữa)
      const existed = await BaseMember.findOne({ baseId: base._id, userId }).lean();
      if (existed) return next();
 
      // xác định limit
      const orgLimit  = Number.isInteger(org.perBaseUserLimit) ? org.perBaseUserLimit : undefined;
      const baseLimit = Number.isInteger(base.userLimit) ? base.userLimit : undefined; // nếu bạn có trường này
      const finalLimit = baseLimit ?? orgLimit ?? defaultLimit;
 
      const current = await BaseMember.countDocuments({ baseId: base._id });
 
      if (current >= finalLimit) {
        return res.status(403).json({
          ok: false,
          error: "base_member_limit_reached",
          meta: { current, limit: finalLimit }
        });
      }
 
      return next();
    } catch (e) {
      return next(e);
    }
  };
}