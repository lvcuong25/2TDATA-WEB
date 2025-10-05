import { Router } from 'express';
import { createTableSimple, getTablesSimple } from '../controllers/tableControllerSimple.js';
import { 
  createColumnSimple, 
  getColumnsByTableIdSimple, 
  updateColumnSimple, 
  deleteColumnSimple 
} from '../controllers/columnControllerSimple.js';
import { getLookupData } from '../controllers/columnControllerPostgres.js';
import { 
  createRecordSimple, 
  getRecordsByTableIdSimple, 
  getRecordByIdSimple, 
  updateRecordSimple, 
  deleteRecordSimple,
  getTableStructureSimple 
} from '../controllers/recordControllerSimple.js';

import { deleteMultipleRecords } from '../controllers/recordControllerPostgres.js';
import { checkTableViewPermission, checkTablePermission } from '../middlewares/checkTablePermission.js';

import { authAndSiteDetectionMiddleware } from '../middlewares/authAndSiteDetection.js';


const router = Router();

// Table routes
router.post('/tables', createTableSimple);
router.get('/databases/:databaseId/tables', getTablesSimple);


// Column routes
router.post('/columns', checkTablePermission('canEditStructure'), createColumnSimple);
router.get('/tables/:tableId/columns', checkTableViewPermission, getColumnsByTableIdSimple);
router.get('/columns/:columnId/lookup-data', checkTableViewPermission, getLookupData);
router.put('/columns/:columnId', checkTablePermission('canEditStructure'), updateColumnSimple);
router.delete('/columns/:columnId', checkTablePermission('canEditStructure'), deleteColumnSimple);


// Record routes - WITH AUTHENTICATION AND PERMISSIONS
router.post('/records', authAndSiteDetectionMiddleware, checkTablePermission('canAddData'), createRecordSimple);
router.get('/tables/:tableId/records', authAndSiteDetectionMiddleware, checkTableViewPermission, getRecordsByTableIdSimple);

// Bulk delete route - MUST come before :recordId routes
router.delete('/records/bulk', authAndSiteDetectionMiddleware, deleteMultipleRecords);

router.get('/records/:recordId', authAndSiteDetectionMiddleware, getRecordByIdSimple);
router.put('/records/:recordId', authAndSiteDetectionMiddleware, checkTablePermission('canEditData'), updateRecordSimple);
router.delete('/records/:recordId', authAndSiteDetectionMiddleware, checkTablePermission('canEditData'), deleteRecordSimple);

// Table structure route - WITH AUTHENTICATION AND PERMISSIONS
router.get('/tables/:tableId/structure', authAndSiteDetectionMiddleware, checkTableViewPermission, getTableStructureSimple);

export default router;
