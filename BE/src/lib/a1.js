// ─────────────────────────────────────────────────────────────────────────────
// src/lib/a1.js — Tiện ích parse A1 (nếu FE không gửi resolvedTargets)
// ─────────────────────────────────────────────────────────────────────────────
export function colLabelToIndex(label) {
  // "A" -> 1, "Z" -> 26, "AA" -> 27 ...
  let n = 0;
  for (const ch of label.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n; // 1-based
}
export function parseA1(a1) {
  // "A2:C10" -> { r1,c1,r2,c2 }
  const [l, r] = a1.split(":");
  const m = (s) => {
    const mm = s.match(/^([A-Z]+)(\d+)$/i);
    return { c: colLabelToIndex(mm[1]), r: parseInt(mm[2], 10) };
  };
  const L = m(l), R = m(r);
  const r1 = Math.min(L.r, R.r), r2 = Math.max(L.r, R.r);
  const c1 = Math.min(L.c, R.c), c2 = Math.max(L.c, R.c);
  return { r1, c1, r2, c2 };
}
