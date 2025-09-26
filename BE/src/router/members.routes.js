// ─────────────────────────────────────────────────────────────────────────────
// src/routes/members.routes.js — Thêm/đổi role cho thành viên base
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import BaseMember from "../model/BaseMember.js";
import Base from "../model/Base.js";
import Organization from "../model/Organization.js";
import BaseRole from "../model/BaseRole.js";
import { guardPerBaseUserLimit } from "../middlewares/limits.js";
import { canManageMembers } from "../middlewares/can.js";
import User from "../model/User.js";
const routerMembers = express.Router({ mergeParams: true });

// Add user to database with organization role
async function addUserToBase(req, res, next) {
  try {
    const { databaseId } = req.params; 
    const { userId, role } = req.body; // role: "owner", "manager", "member"
    
    const base = await Base.findById(databaseId).lean(); 
    if (!base) return res.status(404).json({ ok: false, error: "database_not_found" });
    
    const org = await Organization.findById(base.orgId).lean();
    if (!org) return res.status(404).json({ ok: false, error: "organization_not_found" });

    // Validate role
    const validRoles = ["owner", "manager", "member"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, error: "invalid_role" });
    }

    // Check if user is already a member of this database
    const existingMember = await BaseMember.findOne({ 
      databaseId: databaseId, 
      userId 
    });
    
    if (existingMember) {
      return res.status(400).json({ ok: false, error: "user_already_member" });
    }

    // Check user quota in database
    const count = await BaseMember.countDocuments({ databaseId: databaseId });
    if (count >= (org.perBaseUserLimit ?? 50)) return res.status(403).json({ ok: false, error: "per_database_user_limit" });

    // Create BaseMember with organization role
    const created = await BaseMember.create({ 
      databaseId: databaseId, 
      userId, 
      role: role // Save role directly instead of baseRoleId
    });
    
    res.json({ ok: true, data: created });
  } catch (e) { 
    console.error(e); 
    res.status(500).json({ ok: false, error: "member_add_error" }); 
  }
}


// Change member role
async function changeMemberRole(req, res, next) {
  try {
    const { databaseId, userId } = req.params; 
    const { role } = req.body; // role: "owner", "manager", "member"
    const currentUserId = req.user._id;
    
    // Validate role
    const validRoles = ["owner", "manager", "member"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, error: "invalid_role" });
    }
    
    // Check if target member exists
    const targetMember = await BaseMember.findOne({ 
      databaseId: databaseId, 
      userId 
    }).lean();
    
    if (!targetMember) {
      return res.status(404).json({ ok: false, error: "member_not_found" });
    }
    
    // Get current user's role in this base
    const currentUserMember = await BaseMember.findOne({ 
      databaseId: databaseId, 
      userId: currentUserId 
    }).lean();
    
    if (!currentUserMember) {
      return res.status(403).json({ ok: false, error: "not_a_member" });
    }
    
    // Check if current user is trying to change their own role
    if (userId === currentUserId) {
      return res.status(400).json({ ok: false, error: "cannot_change_own_role" });
    }
    
    // Check permissions based on current user's role
    if (currentUserMember.role === "member") {
      return res.status(403).json({ ok: false, error: "members_cannot_manage_roles" });
    }
    
    // Manager cannot change owner's role
    if (currentUserMember.role === "manager" && targetMember.role === "owner") {
      return res.status(403).json({ ok: false, error: "managers_cannot_change_owner_role" });
    }
    
    // Manager cannot promote anyone to owner
    if (currentUserMember.role === "manager" && role === "owner") {
      return res.status(403).json({ ok: false, error: "managers_cannot_promote_to_owner" });
    }
    
    // Only owner can change owner role
    if (targetMember.role === "owner" && currentUserMember.role !== "owner") {
      return res.status(403).json({ ok: false, error: "only_owner_can_change_owner_role" });
    }
    
    // Special logic for updating to owner role
    if (role === "owner") {
      // Find current owner
      const currentOwner = await BaseMember.findOne({ 
        databaseId: databaseId, 
        role: "owner" 
      }).lean();
      
      if (currentOwner) {
        // If there's already an owner and it's not the target user, demote current owner to manager
        if (currentOwner.userId !== userId) {
          await BaseMember.findOneAndUpdate(
            { baseId: databaseId, userId: currentOwner.userId }, 
            { role: "manager" }
          );
        }
      }
    }
    
    // Update the member role
    const updated = await BaseMember.findOneAndUpdate(
      { baseId: databaseId, userId }, 
      { role: role }, 
      { new: true }
    );
    
    res.json({ ok: true, data: updated });
  } catch (e) { 
    console.error("Error changing member role:", e); 
    res.status(500).json({ ok: false, error: "member_update_error" }); 
  }
}

routerMembers.post("/database/databases/:databaseId/members", canManageMembers(), addUserToBase);

routerMembers.patch("/database/databases/:databaseId/members/:userId",canManageMembers(), guardPerBaseUserLimit({defaultLimit:100}), changeMemberRole);

/** GET: my role in this database */
routerMembers.get("/database/databases/:databaseId/me", async (req, res, next) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user?._id;
    const m = await BaseMember.findOne({ databaseId: databaseId, userId }).lean();
    if (!m) return res.status(200).json({ ok: true, isMember: false });
    
    return res.json({
      ok: true,
      isMember: true,
      member: {
        _id: m._id,
        role: m.role,
        canManageDatabase: m.role === "owner" || m.role === "manager",
      }
    });
  } catch (e) { return next(e); }
});

/** GET: list database members */
routerMembers.get("/database/databases/:databaseId/members", canManageMembers(), async (req, res, next) => {
  try {
    const { databaseId } = req.params;
    const members = await BaseMember.find({ databaseId: databaseId })
      .lean();

    // Get user information
    const userIds = [...new Set(members.map(m => String(m.userId)))];

    const users = await User.find({ _id: { $in: userIds } })
      .select("_id email name")
      .lean();

    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const data = members.map(m => ({
      _id: m._id,
      user: userMap[String(m.userId)] || { _id: m.userId },
      role: m.role, // role directly from BaseMember
      canManageDatabase: m.role === "owner" || m.role === "manager",
      //createdAt: m.createdAt,
    }));

    return res.json({ ok: true, data });
  } catch (e) { return next(e); }
});

/** GET: organization users not yet added to database */
routerMembers.get("/database/databases/:databaseId/available-users", async (req, res, next) => {
  try {
    const { databaseId } = req.params;
    const siteId = req.user.site_id;
    
    console.log('🔍 Available users request:', { databaseId, siteId, userId: req.user._id });
    
    if (!siteId) {
      return res.status(400).json({ ok: false, error: "site_id_required" });
    }

    // Get database to find orgId
    const database = await Base.findById(databaseId).lean();
    console.log('🔍 Database found:', { databaseId: database?._id, orgId: database?.orgId, name: database?.name });
    
    if (!database) {
      return res.status(404).json({ ok: false, error: "database_not_found" });
    }

    // Use database.orgId directly (should be organization._id)
    const orgId = database.orgId;
    console.log('🔍 Using orgId:', orgId);

    // Get organization to get members list
    const organization = await Organization.findById(orgId)
      .populate('members.user', '_id name email')
      .lean();
    
    console.log('🔍 Organization found:', { orgId, membersCount: organization?.members?.length });
    
    if (!organization) {
      return res.status(404).json({ ok: false, error: "organization_not_found" });
    }

    // Get users already added to this database
    const existingMembers = await BaseMember.find({ databaseId: databaseId })
      .select('userId')
      .lean();
    
    const existingUserIds = existingMembers.map(m => String(m.userId));
    
    console.log('🔍 Available users debug:', {
      orgId,
      organizationName: organization.name,
      orgMembersCount: organization.members?.length || 0,
      orgMembers: organization.members?.map(m => ({
        userId: m.user?._id,
        userName: m.user?.name,
        userEmail: m.user?.email,
        role: m.role
      })) || [],
      existingUserIds,
      existingMembersCount: existingMembers.length
    });

    // Filter organization users not yet added to database
    const availableUsers = organization.members
      .filter(member => {
        const isNotAdded = !existingUserIds.includes(String(member.user._id));
        console.log(`🔍 Filtering member:`, {
          userId: member.user?._id,
          userName: member.user?.name,
          userEmail: member.user?.email,
          isNotAdded,
          existingUserIds
        });
        return isNotAdded;
      })
      .map(member => ({
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        role: member.role // role in organization
      }));

    console.log('🔍 Final available users:', availableUsers);

    return res.json({ ok: true, data: availableUsers });
  } catch (e) { 
    console.error("Error getting available users:", e);
    return next(e); 
  }
});

/** DELETE: remove member from database */
routerMembers.delete("/database/databases/:databaseId/members/:userId", canManageMembers(), async (req, res, next) => {
  try {
    const { databaseId, userId } = req.params;
    
    // Check if member exists
    const member = await BaseMember.findOne({ databaseId: databaseId, userId });
    if (!member) {
      return res.status(404).json({ ok: false, error: "member_not_found" });
    }
    
    // Don't allow deleting owner
    if (member.role === "owner") {
      return res.status(403).json({ ok: false, error: "cannot_delete_owner" });
    }
    
    // Delete member
    await BaseMember.deleteOne({ databaseId: databaseId, userId });
    
    return res.json({ ok: true, message: "Member removed successfully" });
  } catch (e) { 
    console.error("Error removing member:", e);
    return next(e); 
  }
});

export default routerMembers;