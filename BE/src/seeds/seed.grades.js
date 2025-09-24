// src/seeds/seed.grades.js
// Tạo Base "Academics" + Table "student_grades" + Roles:
//  - Teacher: CRUD full, xem tất cả
//  - Student Viewer: chỉ READ, chỉ thấy row của chính mình (data.StudentUserId == $ctx.userId), ẩn cột StudentUserId
// Seed 2 sinh viên demo: s1@demo.com, s2@demo.com
 
import dotenv from "dotenv"; dotenv.config();
 


import { connectMongo, OID } from "../lib/mongo.js";
import Organization from "../model/Organization.js";
import User from "../model/User.js";
import Base from "../model/Base.js";
import BaseRole from "../model/BaseRole.js";
import BaseMember from "../model/BaseMember.js";
import Table from "../model/Table.js";
import Column from "../model/Column.js";
import Row from "../model/Row.js";
import ManualCellLock from "../model/ManualCellLock.js";
 
async function run() {
  const MONGO_URI = process.env.MONGODB_URI || "mongodb://hieu:admin@127.0.0.1:27017/2TDATA";
  const conn = await connectMongo(MONGO_URI);
  console.log("Connected:", conn.name);

  // 1) Lấy (hoặc tạo) Demo Org
  let org = await Organization.findOne({ name: "Demo Org" });
  if (!org) {
    org = await Organization.create({ name: "Demo Org", site_id: OID(), manager: OID(), members: [], baseLimit: 10, perBaseUserLimit: 200 });
  }
 
  // 2) Users: teacher + 2 students
  const [teacher] = await User.find({ email: "teacher@demo.com" });
  const [s1] = await User.find({ email: "s1@demo.com" });
  const [s2] = await User.find({ email: "s2@demo.com" });
 
  const teacherUser = teacher || (await User.create({ email: "teacher@demo.com", name: "Teacher", orgId: org._id }));
  const s1User = s1 || (await User.create({ email: "s1@demo.com", name: "Student One", orgId: org._id }));
  const s2User = s2 || (await User.create({ email: "s2@demo.com", name: "Student Two", orgId: org._id }));
 
  // Đảm bảo có trong org.members
  const ensureMember = (u, role) => {
    if (!(org.members || []).some(m => String(m.user) === String(u._id))) {
      org.members.push({ user: u._id, role });
    }
  };
  ensureMember(teacherUser, "manager");
  ensureMember(s1User, "member");
  ensureMember(s2User, "member");
  await org.save();
 
  // 3) Base Academics
  let base = await Base.findOne({ orgId: org._id, name: "Academics" });
  if (!base) base = await Base.create({ orgId: org._id, name: "Academics", ownerId: teacherUser._id });
 
  // 4) Table student_grades
  let table = await Table.findOne({ baseId: base._id, name: "student_grades" });
  if (!table) table = await Table.create({ baseId: base._id, name: "student_grades" });
 
  // 5) Columns: FullName, Math, Literature, English, StudentUserId
  //    StudentUserId dùng để map user -> row; sẽ ẩn với Student Viewer
  const want = [
    { name: "Full Name", key: "FullName", type: "string", dataType: "string", idx: 1 },
    { name: "Math", key: "Math", type: "number", dataType: "number",idx: 2 },
    { name: "Literature", key: "Literature", type: "number",dataType: "number", idx: 3 },
    { name: "English", key: "English", type: "number", dataType: "number",idx: 4 },
    { name: "Student User Id", key: "StudentUserId", type: "string",dataType: "string", idx: 5 },
  ];
 
  const existing = await Column.find({ baseId: base._id, tableId: table._id }).lean();
  const existsMap = new Map(existing.map(c => [c.key, c]));
  const toCreate = want.filter(c => !existsMap.has(c.key)).map(c => ({ ...c, baseId: base._id, tableId: table._id }));
  if (toCreate.length) await Column.insertMany(toCreate);
  const cols = await Column.find({ baseId: base._id, tableId: table._id }).lean();
  const colByKey = Object.fromEntries(cols.map(c => [c.key, c]));
 
  // 6) Roles
  // 6.1 Teacher: CRUD full, thấy tất cả
  let teacherRole = await BaseRole.findOne({ baseId: base._id, name: "Teacher" });
  if (!teacherRole) {
    teacherRole = await BaseRole.create({
      baseId: base._id,
      name: "Teacher",
      builtin: false,
      tablePerms: [ { tableId: table._id, create: true, read: true, update: true, delete: true } ],
      columnPerms: [
        { tableId: table._id, columnId: colByKey.FullName._id, columnKey: "FullName", visibility: "visible", edit: "rw" },
        { tableId: table._id, columnId: colByKey.Math._id, columnKey: "Math", visibility: "visible", edit: "rw" },
        { tableId: table._id, columnId: colByKey.Literature._id, columnKey: "Literature", visibility: "visible", edit: "rw" },
        { tableId: table._id, columnId: colByKey.English._id, columnKey: "English", visibility: "visible", edit: "rw" },
        { tableId: table._id, columnId: colByKey.StudentUserId._id, columnKey: "StudentUserId", visibility: "visible", edit: "rw" },
      ],
      rowPolicies: [],
      cellRuleLocks: [],
    });
  }
 
  // 6.2 Student Viewer: chỉ READ, chỉ thấy row của chính mình, ẩn StudentUserId
  let studentViewerRole = await BaseRole.findOne({ baseId: base._id, name: "Student Viewer" });
  if (!studentViewerRole) {
    studentViewerRole = await BaseRole.create({
      baseId: base._id,
      name: "Student Viewer",
      builtin: false,
      tablePerms: [ { tableId: table._id, create: false, read: true, update: false, delete: false } ],
      columnPerms: [
        { tableId: table._id, columnId: colByKey.FullName._id, columnKey: "FullName", visibility: "visible", edit: "none" },
        { tableId: table._id, columnId: colByKey.Math._id, columnKey: "Math", visibility: "visible", edit: "none" },
        { tableId: table._id, columnId: colByKey.Literature._id, columnKey: "Literature", visibility: "visible", edit: "none" },
        { tableId: table._id, columnId: colByKey.English._id, columnKey: "English", visibility: "visible", edit: "none" },
        { tableId: table._id, columnId: colByKey.StudentUserId._id, columnKey: "StudentUserId", visibility: "hidden", edit: "none" },
      ],
      rowPolicies: [
        { tableId: table._id, queryTemplate: { "data.StudentUserId": "$ctx.userId" } },
      ],
      cellRuleLocks: [],
    });
  }
 
  // 7) Base members
  const upsertMember = async (userId, roleId) => {
    const found = await BaseMember.findOne({ baseId: base._id, userId });
    if (!found) await BaseMember.create({ baseId: base._id, userId, roleId });
    else if (String(found.roleId) !== String(roleId)) await BaseMember.updateOne({ _id: found._id }, { $set: { roleId } });
  };
  await upsertMember(teacherUser._id, teacherRole._id);
  await upsertMember(s1User._id, studentViewerRole._id);
  await upsertMember(s2User._id, studentViewerRole._id);
 
  // 8) Rows (nếu chưa có)
  const count = await Row.countDocuments({ baseId: base._id, tableId: table._id });
  if (count === 0) {
    await Row.insertMany([
      { baseId: base._id, tableId: table._id, createdBy: teacherUser._id, data: { FullName: "Nguyen Van A", Math: 8.5, Literature: 7.8, English: 8.0, StudentUserId: String(s1User._id) } },
      { baseId: base._id, tableId: table._id, createdBy: teacherUser._id, data: { FullName: "Tran Thi B",  Math: 6.2, Literature: 8.9, English: 7.0, StudentUserId: String(s2User._id) } },
    ]);
  }
 
  console.log("=== Seed student_grades DONE ===\n",
    {
      org: org._id.toString(),
      base: base._id.toString(),
      table: table._id.toString(),
      users: { teacher: teacherUser.email, s1: s1User.email, s2: s2User.email },
      roles: { teacher: teacherRole.name, student: studentViewerRole.name },
      tableName: "student_grades"
    }
  );
  process.exit(0);
}
 
run().catch(e => { console.error(e); process.exit(1); });