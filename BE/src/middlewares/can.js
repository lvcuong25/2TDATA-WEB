import { resolveEffectivePerms } from "../services/perms.service.js";
import Table from "../model/Table.js";
import BaseMember from "../model/BaseMember.js";
import BaseRole from "../model/BaseRole.js";

// can(action): attach req.perms nếu pass; 403 nếu fail
// Hỗ trợ 2 kiểu route:
//   - /bases/:baseId/tables/:tableId/...
//   - /bases/:baseId/tables/by-name/:tableName/...
export function can(action) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const orgId = req.user?.orgId;
      let { baseId, tableId, tableName } = req.params;

      // Nếu client đưa tableName, map nó sang tableId theo (baseId, name)
      if (!tableId && tableName) {
        const table = await Table.findOne({ baseId, name: tableName }).lean();
        if (!table) return res.status(404).json({ ok: false, error: "table_not_found" });
        tableId = String(table._id);
        req.params.tableId = tableId; // cho handler phía sau dùng
      }

      // Tính quyền hiệu lực theo role của user trong base + table
      const perms = await resolveEffectivePerms({ userId: user._id, orgId, baseId, tableId, action });
      if (!perms.allow) return res.status(403).json({ ok: false, error: perms.reason });

      req.perms = perms; // rowQuery, colPerms, cellRuleLocks, canCreate/Update/Delete
      next();
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false, error: "perm_error" });
    }
  };
}

export function canManageMembers() {
  return async (req, res, next) => {
    try {
      const { baseId } = req.params;
      if (!baseId) return res.status(400).json({ ok: false, error: "baseId_required" });

      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ ok: false, error: "unauthorized" });

      // 1. Kiểm tra membership
      const member = await BaseMember.findOne({ baseId, userId }).lean();
      if (!member) {
        return res.status(403).json({ ok: false, error: "not_a_member" });
      }

      // 2. Lấy role và check quyền
      const role = await BaseRole.findById(member.roleId).lean();
      if (!role) {
        return res.status(403).json({ ok: false, error: "role_not_found" });
      }

      if (role.canManageMembers !== true) {
        return res.status(403).json({ ok: false, error: "no_manage_permission" });
      }

      // OK => qua bước tiếp theo
      return next();
    } catch (e) {
      return next(e);
    }
  };
}

export function canCreateTable() {
  return async (req, res, next) => {
    try {
      const { baseId } = req.params;
      if (!baseId) return res.status(400).json({ ok: false, error: "baseId_required" });

      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ ok: false, error: "unauthorized" });

      const member = await BaseMember.findOne({ baseId, userId }).lean();
      if (!member) {
        return res.status(403).json({ ok: false, error: "not_a_member" });
      }
      const role = await BaseRole.findById(member.roleId).lean();
      if (!role) {
        return res.status(403).json({ ok: false, error: "role_not_found" });
      }
      //permission level
      if (!role.canCreateTables & !role.canManagerSchema) {
        return res.status(403).json({ ok: false, error: "Không có quyền tạo" });
      }
       return next();

    } catch (e) {
      return next(e);
    }
  }
}

// export function canManageMembers() {
//   return async (req, res, next) => {
//     try {
//       const { baseId } = req.params;
//       const userId = req.user?._id;
//       if (!baseId || !userId) {
//         return res.status(400).json({ ok: false, error: "baseId_and_userId_required" });
//       }

//       // 1. Kiểm tra membership
//       const member = await BaseMember.findOne({ baseId, userId }).lean();
//       if (!member) {
//         return res.status(403).json({ ok: false, error: "not_a_member" });
//       }
//       // 2. Lấy role và check quyền
//       const role = await BaseRole.findById(member.roleId).lean();
//       if (!role) {
//         return res.status(403).json({ ok: false, error: "role_not_found" });
//       }

//       //3. Check permission
//       if (role.canManageMembers !== true) {
//         return res.status(403).json({ ok: false, error: "no_manage_permission" });
//       }
//       // OK => qua bước tiếp theo
//       return next();


//     }
//     catch (e) {
//       return next(e);
//     }
//   }
// }