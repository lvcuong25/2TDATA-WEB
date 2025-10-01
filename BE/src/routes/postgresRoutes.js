import express from 'express';
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable
} from '../controllers/tableControllerPostgres.js';

import {
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn
} from '../controllers/columnControllerPostgres.js';

import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  bulkCreateRecords
} from '../controllers/recordControllerPostgres.js';

const router = express.Router();

// Table routes (PostgreSQL)
router.post('/tables', createTable);
router.get('/tables', getTables);
router.get('/tables/:tableId', getTableById);
router.put('/tables/:tableId', updateTable);
router.delete('/tables/:tableId', deleteTable);

// Column routes (PostgreSQL)
router.post('/columns', createColumn);
router.get('/tables/:tableId/columns', getColumns);
router.put('/columns/:columnId', updateColumn);
router.delete('/columns/:columnId', deleteColumn);

// Record routes (PostgreSQL)
router.post('/records', createRecord);
router.get('/tables/:tableId/records', getRecords);
router.get('/records/:recordId', getRecordById);
router.put('/records/:recordId', updateRecord);
router.delete('/records/:recordId', deleteRecord);
router.post('/records/bulk', bulkCreateRecords);

export default router;
