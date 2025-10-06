import BaseMember from '../model/BaseMember.js';
import { Table as PostgresTable } from '../models/postgres/index.js';

/**
 * Kiểm tra user có phải database owner không
 * @param {string} userId - User ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<boolean>} - True nếu user là database owner
 */
export const isDatabaseOwner = async (userId, databaseId) => {
  try {
    console.log('🔍 isDatabaseOwner called:', { userId, databaseId, type: typeof databaseId });
    
    // Check if databaseId is a valid MongoDB ObjectId
    const mongoose = (await import('mongoose')).default;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(databaseId);
    
    if (!isValidObjectId) {
      console.log('🔍 databaseId is not a valid ObjectId, skipping database owner check');
      return false;
    }
    
    const baseMember = await BaseMember.findOne({
      databaseId: new mongoose.Types.ObjectId(databaseId),
      userId: userId
    });
    
    console.log('🔍 BaseMember found:', baseMember ? 'Yes' : 'No');
    if (baseMember) {
      console.log('🔍 BaseMember role:', baseMember.role);
    }
    
    return baseMember && baseMember.role === 'owner';
  } catch (error) {
    console.error('Error checking database owner:', error);
    return false;
  }
};

/**
 * Kiểm tra user có phải table owner không
 * @param {string} userId - User ID
 * @param {string} tableId - Table ID
 * @returns {Promise<boolean>} - True nếu user là table owner
 */
export const isTableOwner = async (userId, tableId) => {
  try {
    console.log('🔍 isTableOwner called:', { userId, tableId, type: typeof tableId });
    
    // Check if tableId is a valid MongoDB ObjectId
    const mongoose = (await import('mongoose')).default;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(tableId);
    
    let table = null;
    
    if (isValidObjectId) {
      // Try MongoDB first
      try {
        const TableMongo = (await import('../model/Table.js')).default;
        table = await TableMongo.findById(tableId);
        console.log('🔍 MongoDB table found:', table ? 'Yes' : 'No');
      } catch (error) {
        console.log('🔍 Error checking MongoDB table:', error.message);
      }
    }
    
    // If not found in MongoDB or not a valid ObjectId, try PostgreSQL
    if (!table) {
      try {
        table = await PostgresTable.findByPk(tableId);
        console.log('🔍 PostgreSQL table found:', table ? 'Yes' : 'No');
      } catch (error) {
        console.log('🔍 Error checking PostgreSQL table:', error.message);
      }
    }
    
    if (!table) {
      console.log('🔍 No table found in either database');
      return false;
    }
    
    // Check if user is the table owner
    const isOwner = table.user_id && table.user_id.toString() === userId.toString();
    console.log('🔍 Is table owner:', isOwner);
    
    return isOwner;
  } catch (error) {
    console.error('Error checking table owner:', error);
    return false;
  }
};

/**
 * Kiểm tra user có phải owner (database owner hoặc table owner) không
 * @param {string} userId - User ID
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @returns {Promise<boolean>} - True nếu user là owner
 */
export const isOwner = async (userId, tableId, databaseId) => {
  try {
    console.log('🔍 isOwner called:', { userId, tableId, databaseId });
    
    // Kiểm tra database owner
    const isDbOwner = await isDatabaseOwner(userId, databaseId);
    console.log('🔍 isDatabaseOwner result:', isDbOwner);
    if (isDbOwner) {
      return true;
    }

    // Kiểm tra table owner
    const isTbOwner = await isTableOwner(userId, tableId);
    console.log('🔍 isTableOwner result:', isTbOwner);
    if (isTbOwner) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking owner:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId,
      tableId,
      databaseId
    });
    return false;
  }
};
