import { ConditionalFormattingRule, Table, Column } from '../models/postgres/index.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';
import { isOwner } from '../utils/ownerUtils.js';
import BaseMember from '../model/BaseMember.js';
import { applyConditionalFormatting } from '../utils/formattingEngine.js';

/**
 * Lấy tất cả conditional formatting rules cho một table
 */
export const getTableFormattingRules = async (req, res) => {
  try {
    console.log('🔍 getTableFormattingRules called');
    const { tableId } = req.params;
    const currentUserId = req.user._id;

    console.log('📋 Request params:', { tableId, currentUserId });

    if (!tableId) {
      return res.status(400).json({ message: 'Table ID is required' });
    }

    // Kiểm tra table tồn tại
    console.log('🔍 Looking for table:', tableId);
    const table = await Table.findByPk(tableId);
    if (!table) {
      console.log('❌ Table not found');
      return res.status(404).json({ message: 'Table not found' });
    }
    console.log('✅ Table found:', table.name);

    // Kiểm tra quyền truy cập
    console.log('🔍 Checking permissions...');
    if (!isSuperAdmin(req.user)) {
      console.log('🔍 User is not super admin, checking owner...');
      // Kiểm tra owner bypass trước
      const userIsOwner = await isOwner(currentUserId, tableId, table.database_id);
      console.log('🔍 User is owner:', userIsOwner);
      if (!userIsOwner) {
        console.log('🔍 User is not owner, checking database membership...');
        const mongoose = (await import('mongoose')).default;
        const databaseObjectId = mongoose.Types.ObjectId.isValid(table.database_id)
          ? new mongoose.Types.ObjectId(table.database_id)
          : table.database_id;

        const baseMember = await BaseMember.findOne({
          userId: currentUserId,
          databaseId: databaseObjectId
        });

        if (!baseMember) {
          console.log('❌ User is not a database member');
          return res.status(403).json({ message: 'Access denied - you are not a member of this database' });
        }
        console.log('✅ User is database member');
      }
    } else {
      console.log('✅ User is super admin');
    }

    // Lấy tất cả formatting rules cho table
    console.log('🔍 Fetching formatting rules...');
    const rules = await ConditionalFormattingRule.findAll({
      where: { 
        tableId: tableId,
        isActive: true
      },
      include: [
        {
          model: Column,
          as: 'column',
          required: false
        }
      ],
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });

    console.log(`✅ Found ${rules.length} formatting rules`);
    res.status(200).json({
      success: true,
      data: rules
    });

  } catch (error) {
    console.error('Error getting table formatting rules:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Tạo conditional formatting rule mới
 */
export const createFormattingRule = async (req, res) => {
  try {
    console.log('🔍 createFormattingRule called');
    const { tableId } = req.params;
    const currentUserId = req.user._id;
    
    console.log('📋 Request params:', { tableId, currentUserId });
    console.log('📋 Request body:', req.body);
    const {
      columnId,
      ruleName,
      ruleType,
      conditions,
      formatting,
      priority = 1,
      targetType = 'all_members',
      targetUserId,
      targetRole
    } = req.body;

    if (!tableId || !ruleName || !ruleType || !conditions || !formatting) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Kiểm tra table tồn tại
    const table = await Table.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Kiểm tra quyền tạo rule (chỉ owner/manager)
    if (!isSuperAdmin(req.user)) {
      const userIsOwner = await isOwner(currentUserId, tableId, table.database_id);
      if (!userIsOwner) {
        const mongoose = (await import('mongoose')).default;
        const databaseObjectId = mongoose.Types.ObjectId.isValid(table.database_id)
          ? new mongoose.Types.ObjectId(table.database_id)
          : table.database_id;

        const baseMember = await BaseMember.findOne({
          userId: currentUserId,
          databaseId: databaseObjectId
        });

        if (!baseMember || baseMember.role === 'member') {
          return res.status(403).json({ message: 'Only owners and managers can create formatting rules' });
        }
      }
    }

    // Kiểm tra column tồn tại (nếu có)
    if (columnId) {
      const column = await Column.findByPk(columnId);
      if (!column || column.table_id !== tableId) {
        return res.status(404).json({ message: 'Column not found or does not belong to this table' });
      }
    }

    // Tạo rule mới
    console.log('🔍 Creating new rule...');
    const newRule = await ConditionalFormattingRule.create({
      tableId,
      columnId,
      databaseId: table.database_id,
      ruleName,
      ruleType,
      conditions,
      formatting,
      priority,
      targetType,
      targetUserId,
      targetRole,
      createdBy: currentUserId.toString() // Convert ObjectId to string
    });
    console.log('✅ Rule created:', newRule.id);

    // Populate column info
    await newRule.reload({
      include: [
        {
          model: Column,
          as: 'column',
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Conditional formatting rule created successfully'
    });

  } catch (error) {
    console.error('Error creating formatting rule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Cập nhật conditional formatting rule
 */
export const updateFormattingRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const currentUserId = req.user._id;
    const updateData = req.body;

    if (!ruleId) {
      return res.status(400).json({ message: 'Rule ID is required' });
    }

    // Tìm rule
    const rule = await ConditionalFormattingRule.findByPk(ruleId, {
      include: [
        {
          model: Table,
          as: 'table'
        }
      ]
    });

    if (!rule) {
      return res.status(404).json({ message: 'Formatting rule not found' });
    }

    // Kiểm tra quyền cập nhật
    if (!isSuperAdmin(req.user)) {
      const userIsOwner = await isOwner(currentUserId, rule.tableId, rule.databaseId);
      if (!userIsOwner) {
        const mongoose = (await import('mongoose')).default;
        const databaseObjectId = mongoose.Types.ObjectId.isValid(rule.databaseId)
          ? new mongoose.Types.ObjectId(rule.databaseId)
          : rule.databaseId;

        const baseMember = await BaseMember.findOne({
          userId: currentUserId,
          databaseId: databaseObjectId
        });

        if (!baseMember || baseMember.role === 'member') {
          return res.status(403).json({ message: 'Only owners and managers can update formatting rules' });
        }
      }
    }

    // Cập nhật rule
    await rule.update(updateData);

    // Reload với associations
    await rule.reload({
      include: [
        {
          model: Column,
          as: 'column',
          required: false
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: rule,
      message: 'Conditional formatting rule updated successfully'
    });

  } catch (error) {
    console.error('Error updating formatting rule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Xóa conditional formatting rule
 */
export const deleteFormattingRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const currentUserId = req.user._id;

    if (!ruleId) {
      return res.status(400).json({ message: 'Rule ID is required' });
    }

    // Tìm rule
    const rule = await ConditionalFormattingRule.findByPk(ruleId, {
      include: [
        {
          model: Table,
          as: 'table'
        }
      ]
    });

    if (!rule) {
      return res.status(404).json({ message: 'Formatting rule not found' });
    }

    // Kiểm tra quyền xóa
    if (!isSuperAdmin(req.user)) {
      const userIsOwner = await isOwner(currentUserId, rule.tableId, rule.databaseId);
      if (!userIsOwner) {
        const mongoose = (await import('mongoose')).default;
        const databaseObjectId = mongoose.Types.ObjectId.isValid(rule.databaseId)
          ? new mongoose.Types.ObjectId(rule.databaseId)
          : rule.databaseId;

        const baseMember = await BaseMember.findOne({
          userId: currentUserId,
          databaseId: databaseObjectId
        });

        if (!baseMember || baseMember.role === 'member') {
          return res.status(403).json({ message: 'Only owners and managers can delete formatting rules' });
        }
      }
    }

    // Xóa rule
    await rule.destroy();

    res.status(200).json({
      success: true,
      message: 'Conditional formatting rule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting formatting rule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Preview conditional formatting cho một table
 */
export const previewFormatting = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { records, columns } = req.body; // Frontend gửi data để preview

    if (!tableId || !records || !columns) {
      return res.status(400).json({ message: 'Table ID, records, and columns are required' });
    }

    // Lấy formatting rules
    const rules = await ConditionalFormattingRule.findAll({
      where: { 
        tableId: tableId,
        isActive: true
      },
      order: [['priority', 'DESC']]
    });

    // Apply formatting cho từng record sử dụng formatting engine
    const formattedRecords = records.map(record => {
      return applyConditionalFormatting(record, columns, rules, req.user);
    });

    res.status(200).json({
      success: true,
      data: {
        records: formattedRecords,
        rules: rules
      }
    });

  } catch (error) {
    console.error('Error previewing formatting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

