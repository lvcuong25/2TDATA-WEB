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
import { deleteMultipleRecords } from '../controllers/recordController.js';
import { checkTableViewPermission, checkTablePermission } from '../middlewares/checkTablePermission.js';

const router = Router();

// Table routes
router.post('/tables', createTableSimple);
router.get('/databases/:databaseId/tables', getTablesSimple);

// Column routes
router.post('/columns', checkTablePermission('canEditStructure'), createColumnSimple);
router.get('/tables/:tableId/columns', checkTableViewPermission, getColumnsByTableIdSimple);
router.put('/columns/:columnId', checkTablePermission('canEditStructure'), updateColumnSimple);
router.delete('/columns/:columnId', checkTablePermission('canEditStructure'), deleteColumnSimple);

// Record routes
router.post('/records', checkTablePermission('canAddData'), createRecordSimple);
router.get('/tables/:tableId/records', checkTableViewPermission, getRecordsByTableIdSimple);

// Bulk delete route - MUST come before :recordId routes
router.delete('/records/bulk', deleteMultipleRecords);

router.get('/records/:recordId', getRecordByIdSimple);
router.put('/records/:recordId', checkTablePermission('canEditData'), updateRecordSimple);
router.delete('/records/:recordId', checkTablePermission('canEditData'), deleteRecordSimple);

// Table structure route
router.get('/tables/:tableId/structure', checkTableViewPermission, getTableStructureSimple);

export default router;
