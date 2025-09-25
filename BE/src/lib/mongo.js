// ─────────────────────────────────────────────────────────────────────────────
// src/lib/mongo.js — Kết nối Mongo + helper ObjectId
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

export async function connectMongo(uri) {
  // strictQuery để Mongoose không permissive quá ở các truy vấn tự do
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { maxPoolSize: 20 });
  return mongoose.connection;
}

// Helper tạo ObjectId an toàn từ string
export const OID = (id) => new mongoose.Types.ObjectId(id);