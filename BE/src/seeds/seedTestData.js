// seed/seedTestData.js — Script tạo dữ liệu kiểm thử cho hệ thống
// ---------------------------------------------------------------------------
// Mục tiêu: Tạo dữ liệu demo cho Organization, Base, Table, Columns, Rows
//   - Organization: "Demo Org"
//   - Users: adminUser, editorUser, viewerUser
//   - Base: "Sales Base"
//   - Table: "orders"
//   - Columns: OrderId, Customer, Amount, Status, AssignedTo
//   - Rows: 5 đơn hàng mẫu
//   - Roles: Owner, Admin, Editor, Viewer với quyền khác nhau
// ---------------------------------------------------------------------------

import mongoose from "mongoose";
import { connectMongo } from "../lib/mongo.js";
import Organization from "../model/Organization.js";
import User from "../model/User.js";
import Base from "../model/Base.js";
import BaseRole from "../model/BaseRole.js";
import BaseMember from "../model/BaseMember.js";
import Table from "../model/Table.js";
import Column from "../model/Column.js";
import Row from "../model/Row.js";

async function seed() {
  await connectMongo("mongodb://hieu:admin@127.0.0.1:27017/2TDATA");

  console.log("⚡ Clearing old data...");
  await Promise.all([
    Organization.deleteMany({}),
    User.deleteMany({}),
    Base.deleteMany({}),
    BaseRole.deleteMany({}),
    BaseMember.deleteMany({}),
    Table.deleteMany({}),
    Column.deleteMany({}),
    Row.deleteMany({})
  ]);

  // 1. Create organization
  const org = await Organization.create({
    name: "Demo Org",
    site_id: new mongoose.Types.ObjectId(),
    manager: new mongoose.Types.ObjectId(),
    baseLimit: 5,
    perBaseUserLimit: 20
  });

  // 2. Create users
  const [adminUser, editorUser, viewerUser] = await User.insertMany([
    { email: "admin@example.com", name: "Admin", orgId: org._id },
    { email: "editor@example.com", name: "Editor", orgId: org._id },
    { email: "viewer@example.com", name: "Viewer", orgId: org._id }
  ]);

  // Add them to organization members
  org.members = [
    { user: adminUser._id, role: "owner" },
    { user: editorUser._id, role: "member" },
    { user: viewerUser._id, role: "member" }
  ];
  await org.save();

  // 3. Create base
  const base = await Base.create({
    orgId: org._id,
    name: "Sales Base",
    ownerId: adminUser._id
  });

  // 4. Create table "orders"
  const table = await Table.create({ baseId: base._id, name: "orders" });

  // 5. Create columns
  const [cOrderId, cCustomer, cAmount, cStatus, cAssignedTo] = await Column.insertMany([
    { baseId: base._id, tableId: table._id, name: "Order Id", key: "orderId", type: "string",  idx: 0 },
    { baseId: base._id, tableId: table._id, name: "Customer", key: "customer", type: "string", idx: 1 },
    { baseId: base._id, tableId: table._id, name: "Amount", key: "amount", type: "number", idx: 2 },
    { baseId: base._id, tableId: table._id, name: "Status", key: "status", type: "string", idx: 3 },
    { baseId: base._id, tableId: table._id, name: "Assigned To", key: "assignedTo", type: "string", idx: 4 }
  ]);

  // 6. Create roles (Owner, Admin, Editor, Viewer)
  const ownerRole = await BaseRole.create({
    baseId: base._id,
    name: "Owner",
    builtin: true,
    tablePerms: [{ tableId: table._id, create: true, read: true, update: true, delete: true }],
    columnPerms: [cOrderId, cCustomer, cAmount, cStatus, cAssignedTo].map(c => ({
      tableId: table._id,
      columnId: c._id,
      columnKey: c.key,
      visibility: "visible",
      edit: "rw",
      deletable: true
    }))
  });

  const editorRole = await BaseRole.create({
    baseId: base._id,
    name: "Editor",
    builtin: true,
    tablePerms: [{ tableId: table._id, create: true, read: true, update: true, delete: false }],
    columnPerms: [
      { tableId: table._id, columnId: cOrderId._id, columnKey: cOrderId.key, visibility: "visible", edit: "rw" },
      { tableId: table._id, columnId: cCustomer._id, columnKey: cCustomer.key, visibility: "visible", edit: "rw" },
      { tableId: table._id, columnId: cAmount._id, columnKey: cAmount.key, visibility: "visible", edit: "ro" },
      { tableId: table._id, columnId: cStatus._id, columnKey: cStatus.key, visibility: "visible", edit: "rw" },
      { tableId: table._id, columnId: cAssignedTo._id, columnKey: cAssignedTo.key, visibility: "visible", edit: "rw" }
    ],
    rowPolicies: [{ tableId: table._id, queryTemplate: { "data.assignedTo": "$ctx.userId" } }]
  });

  const viewerRole = await BaseRole.create({
    baseId: base._id,
    name: "Viewer",
    builtin: true,
    tablePerms: [{ tableId: table._id, create: false, read: true, update: false, delete: false }],
    columnPerms: [cOrderId, cCustomer, cAmount, cStatus, cAssignedTo].map(c => ({
      tableId: table._id,
      columnId: c._id,
      columnKey: c.key,
      visibility: "visible",
      edit: "ro"
    }))
  });

  // 7. Assign members to roles
  await BaseMember.insertMany([
    { baseId: base._id, userId: adminUser._id, roleId: ownerRole._id },
    { baseId: base._id, userId: editorUser._id, roleId: editorRole._id },
    { baseId: base._id, userId: viewerUser._id, roleId: viewerRole._id }
  ]);

  // 8. Create sample rows
  await Row.insertMany([
    { baseId: base._id, tableId: table._id, createdBy: adminUser._id, data: { orderId: "O-1001", customer: "John Doe", amount: 500, status: "Pending", assignedTo: String(editorUser._id) } },
    { baseId: base._id, tableId: table._id, createdBy: adminUser._id, data: { orderId: "O-1002", customer: "Jane Smith", amount: 750, status: "Approved", assignedTo: String(editorUser._id) } },
    { baseId: base._id, tableId: table._id, createdBy: adminUser._id, data: { orderId: "O-1003", customer: "Bob Lee", amount: 200, status: "Rejected", assignedTo: String(editorUser._id) } },
    { baseId: base._id, tableId: table._id, createdBy: editorUser._id, data: { orderId: "O-1004", customer: "Alice", amount: 400, status: "Pending", assignedTo: String(editorUser._id) } },
    { baseId: base._id, tableId: table._id, createdBy: editorUser._id, data: { orderId: "O-1005", customer: "Eve", amount: 650, status: "Pending", assignedTo: String(editorUser._id) } }
  ]);

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });