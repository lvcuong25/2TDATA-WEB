import { Record as PostgresRecord } from '../models/postgres/index.js';
import mongoose from 'mongoose';

// Middleware to detect if a record is PostgreSQL or MongoDB
export const detectRecordType = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    
    // Skip if no recordId
    if (!recordId) {
      return next();
    }
    
    // Check if it's a UUID format (PostgreSQL)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(recordId)) {
      // It's a UUID, check if it exists in PostgreSQL
      try {
        const postgresRecord = await PostgresRecord.findByPk(recordId);
        if (postgresRecord) {
          console.log('🔍 Record detected as PostgreSQL type');
          req.recordType = 'postgres';
          req.record = postgresRecord;
          return next();
        }
      } catch (error) {
        console.log('🔍 Error checking PostgreSQL record:', error.message);
      }
    }
    
    // Check if it exists in MongoDB
    try {
      const Record = mongoose.model('Record');
      const mongoRecord = await Record.findOne({ _id: recordId });
      if (mongoRecord) {
        console.log('🔍 Record detected as MongoDB type');
        req.recordType = 'mongodb';
        req.record = mongoRecord;
        return next();
      }
    } catch (error) {
      console.log('🔍 Error checking MongoDB record:', error.message);
    }
    
    // If neither found, continue with default behavior
    console.log('🔍 Record type not detected, using default behavior');
    req.recordType = 'unknown';
    return next();
    
  } catch (error) {
    console.log('🔍 Error in detectRecordType middleware:', error.message);
    return next();
  }
};

