import XLSX from 'xlsx';
import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Record from '../model/Record.js';
import Database from '../model/Database.js';
import BaseMember from '../model/BaseMember.js';
import Organization from '../model/Organization.js';
import { isSuperAdmin } from '../utils/permissionUtils.js';

// Export database to Excel (all tables)
export const exportDatabaseToExcel = async (req, res) => {
  try {
    const { databaseId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;

    // Get database information

    let database = await Database.findById(databaseId);
    
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }
    
    // Check if user has access to this database
    if (database.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied to this database' });
    }
    
    // Check if database belongs to the current site
    if (database.orgId.toString() !== siteId.toString()) {
      return res.status(403).json({ message: 'Database does not belong to current site' });
    }

    // Check if user has access to this database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: databaseId, 
        userId 
      });

      if (!baseMember) {
        // Check if user is organization member
        const organization = await Organization.findOne({ 
          _id: database.orgId,
          'members.user': userId 
        });
        
        if (!organization) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    // Get all tables in the database

    const tables = await Table.find({ databaseId, userId, siteId });

    if (tables.length === 0) {
      return res.status(400).json({ message: 'No tables found in this database' });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const usedSheetNames = new Set(); // Track used sheet names to avoid duplicates

    // Process each table
    for (const table of tables) {
      
      // Get columns for this table
      const columns = await Column.find({ tableId: table._id }).sort({ order: 1 });
      
      if (columns.length === 0) {
        continue;
      }

      // Get records for this table
      const records = await Record.find({ tableId: table._id });

      // Prepare data for Excel
      const excelData = [];
      
      // Add header row
      const headers = columns.map(col => col.name);
      excelData.push(headers);

      // Add data rows
      records.forEach(record => {
        const row = columns.map(col => {
          const value = record.data[col.name];
          
          if (value === null || value === undefined) {
            return '';
          }
          
          // Since all data is now stored as text, just return the string value
          return String(value);
        });
        excelData.push(row);
      });

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths
      const columnWidths = columns.map(col => ({
        wch: Math.max(col.name.length, 15)
      }));
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook - ensure sheet name is within 31 char limit and unique
      let sheetName = table.name.length > 31 ? table.name.substring(0, 31) : table.name;
      
      // Handle duplicate sheet names
      let counter = 1;
      while (usedSheetNames.has(sheetName)) {
        const suffix = `_${counter}`;
        const maxLength = 31 - suffix.length;
        sheetName = (table.name.length > maxLength ? table.name.substring(0, maxLength) : table.name) + suffix;
        counter++;
      }
      
      usedSheetNames.add(sheetName);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${database.name}_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting database to Excel:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Import Excel to database (create new table automatically)
export const importExcelToDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.user._id;
    const siteId = req.siteId;
    const { tableName, overwrite = false } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file uploaded' });
    }

    // Get database information
    // For super admin, allow access to any database they own
    let database;
    if (isSuperAdmin(req.user)) {
      database = await Database.findOne({ _id: databaseId, ownerId: userId });
    } else {
      database = await Database.findOne({ _id: databaseId, ownerId: userId, orgId: siteId });
    }

    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Check if user has access to this database
    if (!isSuperAdmin(req.user)) {
      const baseMember = await BaseMember.findOne({ 
        databaseId: databaseId, 
        userId 
      });

      if (!baseMember) {
        // Check if user is organization member
        const organization = await Organization.findOne({ 
          _id: database.orgId,
          'members.user': userId 
        });
        
        if (!organization) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    

    if (sheetNames.length === 0) {
      return res.status(400).json({ message: 'Excel file has no sheets' });
    }

    const importResults = [];
    const allErrors = [];

    // Process each sheet
    for (let sheetIndex = 0; sheetIndex < sheetNames.length; sheetIndex++) {
      const currentSheetName = sheetNames[sheetIndex];
      const worksheet = workbook.Sheets[currentSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });


      if (jsonData.length < 2) {
        allErrors.push(`Sheet "${currentSheetName}": Must have at least a header row and one data row`);
        continue;
      }

      // Get headers from first row
      const excelHeaders = jsonData[0];
      const dataRows = jsonData.slice(1);

      // Generate table name for this sheet - use only sheet name, no file name prefix
      const finalTableName = currentSheetName || `Table_${new Date().getTime()}`;

      // Check if table already exists
      const existingTable = await Table.findOne({ 
        name: finalTableName, 
        databaseId, 
        userId, 
        siteId 
      });

      if (existingTable && !overwrite) {
        allErrors.push(`Table "${finalTableName}" already exists. Use overwrite option to replace it.`);
        continue;
      }

      // Delete existing table if overwrite
      if (existingTable && overwrite) {
        await Column.deleteMany({ tableId: existingTable._id });
        await Record.deleteMany({ tableId: existingTable._id });
        await Table.deleteOne({ _id: existingTable._id });
      }

      // Create new table for this sheet
      const newTable = new Table({
        name: finalTableName,
        description: `Imported from Excel sheet "${currentSheetName}" on ${new Date().toLocaleDateString('vi-VN')}`,
        databaseId,
        userId,
        siteId
      });

      await newTable.save();

      // Create columns based on Excel headers for this sheet
      const columns = [];
      const usedColumnNames = new Set(); // Track used column names to avoid duplicates
      
      for (let i = 0; i < excelHeaders.length; i++) {
        const header = excelHeaders[i];
        if (!header || String(header).trim() === '') continue;
        
        // Handle duplicate column names
        let columnName = String(header).trim();
        let counter = 1;
        while (usedColumnNames.has(columnName)) {
          columnName = `${String(header).trim()}_${counter}`;
          counter++;
        }
        usedColumnNames.add(columnName);

        // Import everything as text to preserve all data
        let dataType = 'text';
        let selectOptions = [];

        const columnData = {
          name: columnName,
          key: columnName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_'), // Generate key from name
          dataType,
          isRequired: false,
          order: i,
          tableId: newTable._id,
          databaseId: databaseId,
          userId,
          siteId
        };

        // No special config needed - everything is text


        const column = new Column(columnData);

        await column.save();
        columns.push(column);
      }

      // Import data rows for this sheet
      const importedRecords = [];
      const errors = [];


    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      
      // Check if row has any meaningful data
      const hasRowData = row && row.some(cell => {
        return cell !== null && 
               cell !== undefined && 
               cell !== '' && 
               String(cell).trim() !== '';
      });
      
      if (!hasRowData) {
        continue; // Skip empty rows
      }

      const recordData = {};
      let hasValidData = false;

      // Map each cell to corresponding column
      for (let i = 0; i < Math.min(row.length, columns.length); i++) {
        const column = columns[i];
        const cellValue = row[i];
        
        
        // Check if cell has meaningful data (not just whitespace)
        const hasValue = cellValue !== null && 
                        cellValue !== undefined && 
                        cellValue !== '' && 
                        String(cellValue).trim() !== '';
        
        if (hasValue) {
          hasValidData = true;
          
          // Convert everything to text to preserve original data
          let convertedValue = String(cellValue);
          
          recordData[column.name] = convertedValue;
        } else {
        }
      }

      
      if (hasValidData) {
        try {
          
          const record = new Record({
            tableId: newTable._id,
            databaseId: databaseId,
            data: recordData,
            userId,
            siteId
          });
          
          await record.save();
          importedRecords.push(record);
        } catch (saveError) {
          console.error(`Error saving record for row ${rowIndex + 1}:`, saveError);
          errors.push(`Row ${rowIndex + 2}: Failed to save record - ${saveError.message}`);
        }
      } else {
      }
    }


      // Add result for this sheet
      importResults.push({
        sheetName: currentSheetName,
        tableId: newTable._id,
        tableName: newTable.name,
        importedCount: importedRecords.length,
        totalRows: dataRows.length,
        columnsCreated: columns.length,
        errors: errors
      });

      // Add errors to all errors
      allErrors.push(...errors.map(error => `Sheet "${currentSheetName}": ${error}`));
    }

    // Calculate totals
    const totalImported = importResults.reduce((sum, result) => sum + result.importedCount, 0);
    const totalRows = importResults.reduce((sum, result) => sum + result.totalRows, 0);
    const totalTables = importResults.length;


    // Create detailed success message
    const tableNames = importResults.map(result => result.tableName).join(', ');
    const successMessage = totalTables > 0 
      ? `Successfully imported ${totalImported} records into ${totalTables} table(s): ${tableNames}`
      : 'No data was imported';

    res.json({
      success: true,
      message: successMessage,
      data: {
        totalSheets: sheetNames.length,
        totalTables: totalTables,
        totalImported: totalImported,
        totalRows: totalRows,
        totalErrors: allErrors.length,
        results: importResults,
        errors: allErrors,
        tableNames: tableNames
      }
    });

  } catch (error) {
    console.error('Error importing Excel to database:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Template functionality removed as requested
