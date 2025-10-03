import Base from "../model/Base.js";
import BaseRole from "../model/BaseRole.js";
import BaseMember from "../model/BaseMember.js";
import Organization from "../model/Organization.js";
import responseHelper from "../utils/responseHelper.js";
import { extractQueryListParams, toObjectId } from "../utils/helper.js";
import { createDatabaseSchema } from "../services/schemaManager.js";
// Tạo Base mới trong org (chỉ owner/manager của org)
export async function createBase(req, res, next) {
  try {
    const { orgId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;
    const org = await Organization.findById(orgId).lean();
    if (!org)
      return res.status(404).json({ ok: false, error: "org_not_found" });

    // Kiểm tra vai trò ở org
    const isOrgAdmin = (org.members || []).some(
      (m) =>
        String(m.user) === String(userId) &&
        ["owner", "manager"].includes(m.role)
    );
    if (!isOrgAdmin)
      return res.status(403).json({ ok: false, error: "not_org_admin" });

    // Kiểm tra quota số base của org
    const count = await Base.countDocuments({ orgId });
    if (count >= (org.baseLimit ?? 5))
      return res.status(403).json({ ok: false, error: "org_base_limit" });

    // Tạo base và seed 4 role built-in (Owner/Admin/Editor/Viewer)
    const base = await Base.create({ orgId, name, ownerId: userId });
    const [ownerRole] = await BaseRole.insertMany([
      { databaseId: base._id, name: "Owner", builtin: true },
    ]);

    // Người tạo base -> Owner của base đó
    await BaseMember.create({
      databaseId: base._id,
      userId,
      baseRoleId: ownerRole._id,
    });

    // Create PostgreSQL schema for this base
    try {
      console.log(`🏗️ Creating PostgreSQL schema for base: ${base._id}`);
      const schemaResult = await createDatabaseSchema(base._id, userId);
      
      if (schemaResult.success) {
        console.log(`✅ Schema created successfully: ${schemaResult.schemaName}`);
        
        // Update base with schema information
        await Base.findByIdAndUpdate(base._id, {
          $set: {
            postgresSchema: schemaResult.schemaName,
            schemaCreatedAt: new Date()
          }
        });
      } else {
        console.error(`❌ Failed to create schema: ${schemaResult.error}`);
        // Don't fail the entire operation, but log the error
      }
    } catch (schemaError) {
      console.error('❌ Error creating schema:', schemaError);
      // Don't fail the entire operation, but log the error
    }

    res.json({ 
      ok: true, 
      data: {
        ...base.toObject(),
        schemaCreated: true
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "base_create_error" });
  }
}

export async function listBase(req, res, next) {
  try {
    const { orgId } = req.params;
    const { skip, page, limit } = extractQueryListParams(req.query);

    // Fetch data
    const [items, total] = await Promise.all([
      Base.find({ orgId })
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit),
      Base.countDocuments({ orgId }),
    ]);

    return responseHelper.sendReponseList(res, {
      items,
      metadata: { total, page, limit },
    });
  } catch (err) {
    next(err);
  }
}

export async function detailBase(req, res, next) {
  try {
    const { orgId, baseId } = req.params;

    const result = await Base.aggregate([
      // Match the base
      { $match: { _id: toObjectId(baseId) } },

      // Lookup members
      {
        $lookup: {
          from: "basemembers", // collection name (lowercased + plural usually)
          localField: "_id",
          foreignField: "databaseId",
          as: "members",
        },
      },

      // Unwind members to join with user + role
      { $unwind: { path: "$members", preserveNullAndEmptyArrays: true } },

      // Lookup user info
      {
        $lookup: {
          from: "users",
          let: { userId: "$members.userId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
            { $project: { name: 1, email: 1 } },
          ],
          as: "members.user",
        },
      },
      { $unwind: { path: "$members.user", preserveNullAndEmptyArrays: true } },

      // Lookup role info
      {
        $lookup: {
          from: "baseroles",
          let: { roleId: "$members.baseRoleId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$roleId"] } } },
            { $project: { name: 1, permissions: 1 } },
          ],
          as: "members.role",
        },
      },
      { $unwind: { path: "$members.role", preserveNullAndEmptyArrays: true } },

      // Group back members
      {
        $group: {
          _id: "$_id",
          orgId: { $first: "$orgId" },
          name: { $first: "$name" },
          ownerId: { $first: "$ownerId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          members: {
            $push: {
              user: "$members.user",
              role: "$members.role",
              joinedAt: "$members.createdAt",
            },
          },
        },
      },
    ]);

    return responseHelper.sendResponse(res, result[0]);
  } catch (err) {
    next(err);
  }
}
