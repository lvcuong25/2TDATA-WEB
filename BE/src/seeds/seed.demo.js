/*
 Mục tiêu seed:
 - Organization: "Demo Org" (baseLimit=5, perBaseUserLimit=50)
 - Users: owner@demo.com (Owner), editor@demo.com (Order Editor+), viewer@demo.com (Viewer)
 - Base: "Sales"
 - Table: "orders"
 - Columns:
    OrderNo (string, ro với Editor+),
    Status (string),
    Amount (number, deletable=true với Editor+),
    AssignedTo (string userId),
    Note (string),
    InternalNotes (string, hidden với Editor+)
 - Role custom: "Order Editor+" (xem rows do mình tạo hoặc được assign, exclude Status=Archived)
   + tablePerms: CRUD = true
   + columnPerms: như trên (InternalNotes hidden; Amount deletable)
   + rowPolicies: {
        $or: [{createdBy: $ctx.userId},{"data.AssignedTo": $ctx.userId}],
        "data.Status": {$ne:"Archived"}
     }
   + cellRuleLocks: if data.Status=="Approved" => Amount readOnly
 - Rows: 6 đơn hàng mẫu (Approved/Pending/Rejected/Archived ...),
   có row manual lock cell Amount (hidden) để test 🔒
*/

// NOTE: Đây là file riêng, KHÔNG được import vào app.js. Chạy độc lập.

// src/seeds/seed.demo.js
import dotenv from "dotenv";
dotenv.config();

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

  // 0) Cleanup demo data nếu đã có
  await Promise.all([
    // Organization.deleteMany({ name: "Demo Org" }),
    // User.deleteMany({ email: { $in: ["owner@demo.com", "editor@demo.com", "viewer@demo.com"] } }),
    Organization.deleteMany({}),
    User.deleteMany({}),
    Base.deleteMany({}),
    BaseRole.deleteMany({}),
    BaseMember.deleteMany({}),
    Table.deleteMany({}),
    Column.deleteMany({}),
    Row.deleteMany({}),
    Site.deleteMany({}),
  ]);

  const databaseId = OID()

   const site = await Site.create({
    name: "Default Site",
    domain: "localhost",
  });
  // 1) Org + Users
  const org = await Organization.create({
    name: "Demo Org",
    site_id: site._id,
    manager: OID(),
    members: [],
    baseLimit: 5,
    perBaseUserLimit: 50,
  });

  const [uOwner, uEditor, uViewer] = await User.insertMany([
    { email: "owner@demo.com", name: "Owner", orgId: org._id },
    { email: "editor@demo.com", name: "Editor", orgId: org._id },
    { email: "viewer@demo.com", name: "Viewer", orgId: org._id },
  ]);

  // Thêm vào org.members (đơn giản: owner là owner, các user khác member)
  org.members.push({ user: uOwner._id, role: "owner" });
  org.members.push({ user: uEditor._id, role: "member" });
  org.members.push({ user: uViewer._id, role: "member" });
  await org.save();

  // 2) Base + built-in roles
  const base = await Base.create({ orgId: org._id, name: "Sales", ownerId: uOwner._id });
  const [roleOwner, roleAdmin, roleEditor, roleViewer] = await BaseRole.insertMany([
    { baseId: base._id, name: "Owner", builtin: true },
    { baseId: base._id, name: "Admin", builtin: true },
    { baseId: base._id, name: "Editor", builtin: true },
    { baseId: base._id, name: "Viewer", builtin: true },
  ]);
  await BaseMember.create({ baseId: base._id, userId: uOwner._id, roleId: roleOwner._id });

  // 3) Table + Columns
  const table = await Table.create({ baseId: base._id, name: "orders", databaseId: databaseId });
  const cols = await Column.insertMany([
    { baseId: base._id, tableId: table._id, name: "Order No", key: "OrderNo", type: "string", dataType: 'string', idx: 1, databaseId: databaseId },
    { baseId: base._id, tableId: table._id, name: "Status", key: "Status", type: "string", dataType: "string", idx: 2, databaseId: databaseId },
    { baseId: base._id, tableId: table._id, name: "Amount", key: "Amount", type: "number", dataType: "number", idx: 3, databaseId: databaseId },
    { baseId: base._id, tableId: table._id, name: "Assigned To", key: "AssignedTo", type: "string", dataType: "string", idx: 4, databaseId: databaseId },
    { baseId: base._id, tableId: table._id, name: "Note", key: "Note", type: "string", dataType: "string", idx: 5, databaseId: databaseId },
    { baseId: base._id, tableId: table._id, name: "Internal Notes", key: "InternalNotes", type: "string", dataType: "string", idx: 6, databaseId: databaseId },
  ]);
  const colByKey = Object.fromEntries(cols.map(c => [c.key, c]));
  console.log('colByKey:', colByKey)

  // 6. Create roles (Owner, Admin, Editor, Viewer)
  const ownerRole = await BaseRole.updateMany(
    { baseId: base._id, name: { $in: ["Owner", "Admin"] } },
    {
      $addToSet: {
        tablePerms: [{ tableId: table._id, create: true, read: true, update: true, delete: true }],
        columnPerms: [
          // InternalNotes bị ẩn & không sửa
          { tableId: table._id, columnId: colByKey.InternalNotes._id, columnKey: "InternalNotes", visibility: "hidden", edit: "none", deletable: false, maskMode: "plain" },
          // Amount có thể delete column (deletable=true)
          { tableId: table._id, columnId: colByKey.Amount._id, columnKey: "Amount", visibility: "visible", edit: "rw", deletable: true, maskMode: "plain" },
          // Các cột còn lại visible
          { tableId: table._id, columnId: colByKey.OrderNo._id, columnKey: "OrderNo", visibility: "visible", edit: "ro" },
          { tableId: table._id, columnId: colByKey.Status._id, columnKey: "Status", visibility: "visible", edit: "rw" },
          { tableId: table._id, columnId: colByKey.AssignedTo._id, columnKey: "AssignedTo", visibility: "visible", edit: "rw" },
          { tableId: table._id, columnId: colByKey.Note._id, columnKey: "Note", visibility: "visible", edit: "rw" },
        ],
      }


    }

  );

  // 4) Role custom: Order Editor+
  const orderEditorRole = await BaseRole.create({
    baseId: base._id,
    name: "EDIT_CREATE",
    builtin: false,
    tablePerms: [
      { tableId: table._id, create: true, read: true, update: true, delete: true },
    ],
    columnPerms: [
      // InternalNotes bị ẩn & không sửa
      { tableId: table._id, columnId: colByKey.InternalNotes._id, columnKey: "InternalNotes", visibility: "hidden", edit: "none", deletable: false, maskMode: "plain" },
      // Amount có thể delete column (deletable=true)
      { tableId: table._id, columnId: colByKey.Amount._id, columnKey: "Amount", visibility: "visible", edit: "rw", deletable: true, maskMode: "plain" },
      // Các cột còn lại visible
      { tableId: table._id, columnId: colByKey.OrderNo._id, columnKey: "OrderNo", visibility: "visible", edit: "ro" },
      { tableId: table._id, columnId: colByKey.Status._id, columnKey: "Status", visibility: "visible", edit: "rw" },
      { tableId: table._id, columnId: colByKey.AssignedTo._id, columnKey: "AssignedTo", visibility: "visible", edit: "rw" },
      { tableId: table._id, columnId: colByKey.Note._id, columnKey: "Note", visibility: "visible", edit: "rw" },
    ],
    rowPolicies: [
      // Chỉ thấy row do mình tạo hoặc được assign
      { tableId: table._id, queryTemplate: { $or: [{ createdBy: "$ctx.userId" }, { "data.AssignedTo": "$ctx.userId" }] } },
      // Và không thấy Archived
      { tableId: table._id, queryTemplate: { "data.Status": { $ne: "Archived" } } },
    ],
    cellRuleLocks: [
      // Nếu Status=Approved thì Amount là readOnly
      { tableId: table._id, where: { "data.Status": "Approved" }, columns: ["Amount"], mode: "readOnly" },
    ],
  });

  // Gán role: editor -> Order Editor+, viewer -> Viewer
  await BaseMember.create({ baseId: base._id, userId: uEditor._id, roleId: orderEditorRole._id });
  await BaseMember.create({ baseId: base._id, userId: uViewer._id, roleId: roleViewer._id });

  // 5) Rows demo (6 dòng)
  const rows = await Row.insertMany([
    { baseId: base._id, tableId: table._id, createdBy: uOwner._id, data: { OrderNo: "SO-1001", Status: "Approved", Amount: 1200, AssignedTo: String(uEditor._id), Note: "Top customer", InternalNotes: "Margin 35%" } },
    { baseId: base._id, tableId: table._id, createdBy: uOwner._id, data: { OrderNo: "SO-1002", Status: "Pending", Amount: 300, AssignedTo: String(uEditor._id), Note: "Awaiting docs", InternalNotes: "Risk medium" } },
    { baseId: base._id, tableId: table._id, createdBy: uEditor._id, data: { OrderNo: "SO-1003", Status: "Rejected", Amount: 0, AssignedTo: String(uEditor._id), Note: "Rejected by finance", InternalNotes: "Reason: credit" } },
    { baseId: base._id, tableId: table._id, createdBy: uViewer._id, data: { OrderNo: "SO-1004", Status: "Approved", Amount: 750, AssignedTo: String(uViewer._id), Note: "VIP", InternalNotes: "Sensitive info" } },
    { baseId: base._id, tableId: table._id, createdBy: uOwner._id, data: { OrderNo: "SO-1005", Status: "Archived", Amount: 900, AssignedTo: String(uViewer._id), Note: "Old record", InternalNotes: "Archive test" } },
    { baseId: base._id, tableId: table._id, createdBy: uEditor._id, data: { OrderNo: "SO-1006", Status: "Pending", Amount: 1500, AssignedTo: String(uEditor._id), Note: "Urgent", InternalNotes: "Escalated" } },
  ]);

  // 6) Manual lock 1 cell bất kỳ: ẩn Amount của SO-1006
  const rowSO1006 = rows.find(r => r.data?.OrderNo === "SO-1006");
  await ManualCellLock.create({
    baseId: base._id,
    tableId: table._id,
    cells: [{ rowId: rowSO1006._id, columnId: colByKey.Amount._id, columnKey: "Amount" }],
    mode: "hidden",
    roles: [], users: [],
    lockedBy: uOwner._id,
    note: "Hide amount for demo"
  });

  console.log("Seeded demo successfully!\nSummary:");
  console.log({ org: org._id.toString(), base: base._id.toString(), table: table._id.toString(), users: { owner: uOwner.email, editor: uEditor.email, viewer: uViewer.email }, customRole: orderEditorRole.name });

  await conn.close();
}

run().catch((e) => { console.error(e); process.exit(1); });


// ============================================================================
// QUICK TEST GUIDE (Postman/cURL)
// ----------------------------------------------------------------------------
// 1) Login: hệ thống auth của bạn tự cấp JWT. Với seed, bạn có thể giả lập JWT có payload:
//    { _id: <uEditor._id>, orgId: <org._id>, email: "editor@demo.com" }
//    hoặc Owner/Viewer tương tự. (Tuỳ cơ chế sign của bạn.)
//
// 2) List rows (Editor xem được row do mình tạo/assigned; ẩn InternalNotes; lock Amount):
//    GET /bases/:baseId/tables/by-name/orders/rows
//    Authorization: Bearer <token-of-editor>
//
// 3) Thử update Amount của row Approved -> sẽ 403 (cell_locked) vì rule readOnly
//    PATCH /bases/:baseId/tables/by-name/orders/rows/:rowId
//    { "data": { "Amount": 999 } }
//
// 4) Thử update Amount của SO-1006 -> sẽ 403 (hidden) do manual lock
//
// 5) Viewer gọi GET rows -> rowPolicy không cho xem hầu hết rows (tuỳ thiết lập)
//
// 6) Xoá cột Amount (chỉ role có deletable=true trên Amount mới được):
//    DELETE /bases/:baseId/tables/by-name/orders/columns/Amount
//
// 7) Lấy danh sách cột theo quyền hiện tại:
//    GET /bases/:baseId/tables/by-name/orders/columns
// ============================================================================
