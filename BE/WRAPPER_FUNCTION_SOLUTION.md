# Wrapper Function Solution

## Problem Summary
User requested not to change the mount order in `index.js` as it could cause other errors. Instead, we need to fix the code within the files to handle both PostgreSQL and MongoDB records correctly.

## Solution Implemented

### 1. Reverted Mount Order in index.js

#### Restored Original Order:
```javascript
router.use("/database", routerDatabase); // Database routes with permission checks
router.use("/database", tableRoutesSimple); // Simple PostgreSQL routes for testing (fallback)
```

**Reason**: Changing mount order could affect other routes and cause unexpected side effects.

### 2. Created Record Type Detection Middleware

#### File: `BE/src/middlewares/detectRecordType.js`
```javascript
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
```

**Features**:
- ✅ **UUID Detection**: Detects PostgreSQL records by UUID format
- ✅ **Database Verification**: Verifies record exists in the detected database
- ✅ **Fallback Logic**: Handles cases where record type cannot be determined
- ✅ **Error Handling**: Graceful error handling for database connection issues

### 3. Created Wrapper Function

#### File: `BE/src/controllers/recordControllerWrapper.js`
```javascript
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
```

**Features**:
- ✅ **Smart Routing**: Routes to correct controller based on record type
- ✅ **Fallback Logic**: Uses UUID format as fallback detection method
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Controller Selection**: Chooses appropriate controller (Simple vs Full)

### 4. Updated Router Configuration

#### File: `BE/src/router/routerDatabase.js`
```javascript
import { updateRecordWrapper } from "../controllers/recordControllerWrapper.js";
import { detectRecordType } from "../middlewares/detectRecordType.js";

// Individual record routes - MUST come after bulk routes
router.get("/records/:recordId", getRecordById);
router.put("/records/:recordId", detectRecordType, updateRecordWrapper);
router.delete("/records/:recordId", deleteRecord);
```

**Changes**:
- ✅ **Added Middleware**: `detectRecordType` middleware to detect record type
- ✅ **Added Wrapper**: `updateRecordWrapper` to route to correct controller
- ✅ **Preserved Order**: Maintained original route order and structure

## How It Works

### 1. Request Flow:
```
Frontend: PUT /api/database/records/:recordId
    ↓
Route: routerDatabase.js
    ↓
Middleware: detectRecordType (detects PostgreSQL/MongoDB)
    ↓
Wrapper: updateRecordWrapper (routes to correct controller)
    ↓
Controller: updateRecordSimple (PostgreSQL) or updateRecordMongoDB (MongoDB)
    ↓
Database: PostgreSQL or MongoDB update
    ↓
Response: Success with updated data
```

### 2. Record Type Detection:
```
Record ID: c9aaaa44-56ba-406d-87df-0eed472c912c
    ↓
UUID Format Check: ✅ (matches UUID pattern)
    ↓
PostgreSQL Check: ✅ (record exists in PostgreSQL)
    ↓
Result: recordType = 'postgres'
    ↓
Route to: updateRecordSimple
```

### 3. Fallback Logic:
```
Record ID: 507f1f77bcf86cd799439011
    ↓
UUID Format Check: ❌ (doesn't match UUID pattern)
    ↓
MongoDB Check: ✅ (record exists in MongoDB)
    ↓
Result: recordType = 'mongodb'
    ↓
Route to: updateRecordMongoDB
```

## Benefits

### 1. **No Route Order Changes**:
- ✅ Preserves original mount order in `index.js`
- ✅ Avoids potential side effects on other routes
- ✅ Maintains backward compatibility

### 2. **Smart Record Detection**:
- ✅ Automatically detects PostgreSQL vs MongoDB records
- ✅ Uses UUID format as primary detection method
- ✅ Verifies record existence in detected database

### 3. **Flexible Routing**:
- ✅ Routes to appropriate controller based on record type
- ✅ Handles both PostgreSQL and MongoDB records seamlessly
- ✅ Provides fallback logic for edge cases

### 4. **Error Handling**:
- ✅ Graceful handling of database connection issues
- ✅ Clear logging for debugging
- ✅ Proper error responses

## Testing

### Test Results:
```
✅ Record c9aaaa44-56ba-406d-87df-0eed472c912c: Found in PostgreSQL
✅ Record edd49066-465e-4363-adea-6396a0e9a6ef: Found in PostgreSQL
✅ Record 67654f4c-8958-4859-8d2f-0b876b6c288d: Found in PostgreSQL
✅ Record a202b17c-4f84-4551-8f6b-29b1e80de5a0: Found in PostgreSQL
```

**All test records are PostgreSQL records** and should be routed to `updateRecordSimple`.

### Expected Behavior:
1. **UUID Records**: Route to PostgreSQL controller
2. **ObjectId Records**: Route to MongoDB controller
3. **Unknown Records**: Use UUID format as fallback
4. **Error Cases**: Graceful error handling

## Conclusion

✅ **Wrapper function solution implemented successfully!**

The system now:
1. **Preserves original route order** in `index.js`
2. **Automatically detects record type** using middleware
3. **Routes to correct controller** using wrapper function
4. **Handles both PostgreSQL and MongoDB records** seamlessly
5. **Provides robust error handling** and fallback logic

This solution avoids the risks of changing mount order while providing the same functionality for handling both database types.



