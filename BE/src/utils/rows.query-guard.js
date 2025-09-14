// ─────────────────────────────────────────────────────────────────────────────
// src/utils/rows.query-guard.js — Chặn filter/sort vào cột ẩn
// ─────────────────────────────────────────────────────────────────────────────
// Mục tiêu: client không thể sort/filter dựa trên cột họ KHÔNG được thấy
export function guardUserQuery({ userFilter, userSort, visibleKeys }) {
 // filter: chỉ cho phép match vào data.<visible>
  const safeFilter = {};
  for (const [k, v] of Object.entries(userFilter || {})) {
    // chỉ nhận "data.xxx"
    if (!k.startsWith("data.")) continue;
    const key = k.slice(5);
    if (visibleKeys.has(key)) safeFilter[k] = v;
  }
  // sort: chỉ cho phép sort theo data.<visible> hoặc _id/createdAt/updatedAt
  const allowedMeta = new Set(["_id", "createdAt", "updatedAt"]);
  const safeSort = {};
  for (const [k, v] of Object.entries(userSort || {})) {
    if (allowedMeta.has(k)) { safeSort[k] = v; continue; }
    if (k.startsWith("data.")) {
      const key = k.slice(5);
      if (visibleKeys.has(key)) safeSort[k] = v;
    }
  }
  // fallback sort
  if (Object.keys(safeSort).length === 0) safeSort["_id"] = 1;
  return { safeFilter, safeSort };
}