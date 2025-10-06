import { updateRecord as updateRecordMongoDB } from './recordController.js';
import { updateRecord as updateRecordPostgres } from './recordControllerPostgres.js';
import { updateRecordSimple } from './recordControllerSimple.js';

// Wrapper function to route to the correct controller based on record type
export const updateRecordWrapper = async (req, res) => {
  try {
    const { recordType } = req;
    
    console.log('🔍 updateRecordWrapper called with recordType:', recordType);
    
    switch (recordType) {
      case 'postgres':
        console.log('🔍 Routing to PostgreSQL controller (Simple)');
        return await updateRecordSimple(req, res);
        
      case 'mongodb':
        console.log('🔍 Routing to MongoDB controller');
        return await updateRecordMongoDB(req, res);
        
      default:
        console.log('🔍 Unknown record type, trying PostgreSQL first');
        // Try PostgreSQL first (for UUID format)
        const { recordId } = req.params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(recordId)) {
          console.log('🔍 UUID format detected, using PostgreSQL controller');
          return await updateRecordSimple(req, res);
        } else {
          console.log('🔍 Non-UUID format, using MongoDB controller');
          return await updateRecordMongoDB(req, res);
        }
    }
  } catch (error) {
    console.error('❌ Error in updateRecordWrapper:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};


