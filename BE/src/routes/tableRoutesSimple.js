import { Router } from 'express';
import { createTableSimple, getTablesSimple } from '../controllers/tableControllerSimple.js';
import { 
  createColumnSimple, 
  getColumnsByTableIdSimple, 
  updateColumnSimple, 
  deleteColumnSimple 
} from '../controllers/columnControllerSimple.js';
import { 
  createRecordSimple, 
  getRecordsByTableIdSimple, 
  getRecordByIdSimple, 
  updateRecordSimple, 
  deleteRecordSimple,
  getTableStructureSimple 
} from '../controllers/recordControllerSimple.js';

const router = Router();

// Table routes
router.post('/tables', createTableSimple);
router.get('/databases/:databaseId/tables', getTablesSimple);

// Column routes
router.post('/columns', createColumnSimple);
router.get('/tables/:tableId/columns', getColumnsByTableIdSimple);
router.put('/columns/:columnId', updateColumnSimple);
router.delete('/columns/:columnId', deleteColumnSimple);

// Record routes
router.post('/records', createRecordSimple);
router.get('/tables/:tableId/records', getRecordsByTableIdSimple);
router.get('/records/:recordId', getRecordByIdSimple);
router.put('/records/:recordId', updateRecordSimple);
router.delete('/records/:recordId', deleteRecordSimple);

// Table structure route
router.get('/tables/:tableId/structure', getTableStructureSimple);

export default router;
