import XLSX from 'xlsx';
import Table from '../model/Table.js';
import Column from '../model/Column.js';
import Record from '../model/Record.js';
import Database from '../model/Database.js';

// Export database to Excel (all tables)
export const exportDatabaseToExcel = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Get database information
    const database = await Database.findOne({ _id: databaseId, userId, siteId });
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Get all tables in the database
    const tables = await Table.find({ databaseId, userId, siteId });
    if (tables.length === 0) {
      return res.status(400).json({ message: 'No tables found in this database' });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Process each table
    for (const table of tables) {
      // Get columns for this table
      const columns = await Column.find({ tableId: table._id }).sort({ order: 1 });
      if (columns.length === 0) continue;

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
          
          switch (col.dataType) {
            case 'checkbox':
              return value ? 'Yes' : 'No';
            case 'date':
            case 'datetime':
              return value ? new Date(value).toLocaleDateString('vi-VN') : '';
            case 'number':
            case 'currency':
              return typeof value === 'number' ? value : parseFloat(value) || 0;
            case 'multi_select':
              return Array.isArray(value) ? value.join(', ') : value;
            case 'single_select':
              return value;
            case 'rating':
              return typeof value === 'number' ? value : 0;
            default:
              return String(value);
          }
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

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, table.name);
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
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Import Excel to database (create new table automatically)
export const importExcelToDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;
    const { tableName, overwrite = false } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file uploaded' });
    }

    // Get database information
    const database = await Database.findOne({ _id: databaseId, userId, siteId });
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets:`, sheetNames);

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

      console.log(`Processing sheet "${currentSheetName}" with ${jsonData.length} rows`);

      if (jsonData.length < 2) {
        allErrors.push(`Sheet "${currentSheetName}": Must have at least a header row and one data row`);
        continue;
      }

      // Get headers from first row
      const excelHeaders = jsonData[0];
      const dataRows = jsonData.slice(1);

      // Generate table name for this sheet
      const finalTableName = sheetNames.length === 1 
        ? (tableName || `Table_${new Date().getTime()}`)
        : `${tableName || 'Sheet'}_${currentSheetName.replace(/[^a-zA-Z0-9]/g, '_')}`;

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

        // Analyze data to determine column type
        let dataType = 'text';
        let selectOptions = [];
        const sampleValues = dataRows.slice(0, 50).map(row => row[i]).filter(val => val !== null && val !== undefined && val !== '');
        
        if (sampleValues.length > 0) {
          const firstValue = sampleValues[0];
          
          // Check if it's a number
          if (!isNaN(firstValue) && !isNaN(parseFloat(firstValue))) {
            dataType = 'number';
          }
          // Check if it's a date
          else if (new Date(firstValue).toString() !== 'Invalid Date' && !isNaN(new Date(firstValue).getTime())) {
            dataType = 'date';
          }
          // Check if it's boolean-like
          else if (['yes', 'no', 'true', 'false', '1', '0'].includes(String(firstValue).toLowerCase())) {
            dataType = 'checkbox';
          }
          // Check if it's select options (limited unique values)
          else {
            // Check for multi-select patterns (comma or semicolon separated)
            const hasMultiSelectPattern = sampleValues.some(val => 
              String(val).includes(',') || String(val).includes(';') || String(val).includes('|')
            );
            
            console.log(`  - Has multi-select pattern: ${hasMultiSelectPattern}`);
            
            if (hasMultiSelectPattern) {
              // Extract all individual values from multi-select data
              const allValues = [];
              sampleValues.forEach(val => {
                const strVal = String(val);
                // Split by common separators
                const parts = strVal.split(/[,;|]/).map(part => part.trim()).filter(part => part);
                allValues.push(...parts);
              });
              
              const uniqueValues = [...new Set(allValues)];
              
              if (uniqueValues.length >= 2 && uniqueValues.length <= 20) {
                dataType = 'multi_select';
                selectOptions = uniqueValues.map(val => ({ label: val, value: val }));
              } else {
                dataType = 'text';
              }
            } else {
              // Single select detection
              const uniqueValues = [...new Set(sampleValues.map(val => String(val).trim()))];
              
              // If we have limited unique values (2-20), treat as select
              if (uniqueValues.length >= 2 && uniqueValues.length <= 20) {
                // Check if values look like select options (not too long, not numbers)
                const avgLength = uniqueValues.reduce((sum, val) => sum + val.length, 0) / uniqueValues.length;
                const hasNumbers = uniqueValues.some(val => !isNaN(val) && !isNaN(parseFloat(val)));
                
                // If average length is reasonable and not all numbers, treat as select
                if (avgLength <= 50 && !hasNumbers) {
                  dataType = 'single_select';
                  selectOptions = uniqueValues.map(val => ({ label: val, value: val }));
                } else {
                  dataType = 'text';
                }
              } else {
                dataType = 'text';
              }
            }
          }
        }

        const columnData = {
          name: columnName,
          dataType,
          isRequired: false,
          order: i,
          tableId: newTable._id,
          databaseId: databaseId,
          userId,
          siteId
        };

        // Add select options if it's a select type
        if (dataType === 'single_select' && selectOptions.length > 0) {
          columnData.singleSelectConfig = {
            options: selectOptions.map(opt => opt.value),
            defaultValue: ''
          };
        } else if (dataType === 'multi_select' && selectOptions.length > 0) {
          columnData.multiSelectConfig = {
            options: selectOptions.map(opt => opt.value),
            defaultValue: []
          };
        }

        console.log(`Column "${columnName}" detected as ${dataType} with ${selectOptions.length} options:`, selectOptions);
        console.log(`  - Sample values:`, sampleValues.slice(0, 5));
        console.log(`  - Unique values:`, [...new Set(sampleValues.map(val => String(val).trim()))].slice(0, 10));

        const column = new Column(columnData);

        await column.save();
        columns.push(column);
      }

      // Import data rows for this sheet
      const importedRecords = [];
      const errors = [];

      console.log(`Starting import of ${dataRows.length} rows for sheet "${currentSheetName}"`);
      console.log('Columns created:', columns.map(c => ({ name: c.name, type: c.dataType })));

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      console.log(`Processing row ${rowIndex + 1}:`, row);
      
      // Check if row has any meaningful data
      const hasRowData = row && row.some(cell => {
        return cell !== null && 
               cell !== undefined && 
               cell !== '' && 
               String(cell).trim() !== '';
      });
      
      if (!hasRowData) {
        console.log(`Skipping empty row ${rowIndex + 1}:`, row);
        continue; // Skip empty rows
      }

      const recordData = {};
      let hasValidData = false;

      // Map each cell to corresponding column
      for (let i = 0; i < Math.min(row.length, columns.length); i++) {
        const column = columns[i];
        const cellValue = row[i];
        
        console.log(`Processing cell [${rowIndex + 1}, ${i}]: "${cellValue}" for column "${column.name}" (type: ${column.dataType})`);
        
        // Check if cell has meaningful data (not just whitespace)
        const hasValue = cellValue !== null && 
                        cellValue !== undefined && 
                        cellValue !== '' && 
                        String(cellValue).trim() !== '';
        
        if (hasValue) {
          hasValidData = true;
          
          // Convert value based on column data type
          let convertedValue = cellValue;
          
          switch (column.dataType) {
            case 'number':
              convertedValue = parseFloat(cellValue);
              if (isNaN(convertedValue)) {
                errors.push(`Row ${rowIndex + 2}: Invalid number value "${cellValue}" for column "${column.name}"`);
                continue;
              }
              break;
            case 'checkbox':
              if (typeof cellValue === 'string') {
                convertedValue = ['yes', 'true', '1'].includes(cellValue.toLowerCase());
              } else {
                convertedValue = Boolean(cellValue);
              }
              break;
            case 'date':
              if (cellValue instanceof Date) {
                convertedValue = cellValue.toISOString();
              } else if (typeof cellValue === 'string') {
                const date = new Date(cellValue);
                if (!isNaN(date.getTime())) {
                  convertedValue = date.toISOString();
                } else {
                  errors.push(`Row ${rowIndex + 2}: Invalid date value "${cellValue}" for column "${column.name}"`);
                  continue;
                }
              }
              break;
            case 'single_select':
              // For single select, store the exact value from Excel
              convertedValue = String(cellValue).trim();
              console.log(`Single select value: "${convertedValue}" for column "${column.name}"`);
              break;
            case 'multi_select':
              // For multi select, split by common separators and store as array
              const strValue = String(cellValue).trim();
              if (strValue.includes(',') || strValue.includes(';') || strValue.includes('|')) {
                convertedValue = strValue.split(/[,;|]/).map(part => part.trim()).filter(part => part);
              } else {
                convertedValue = [strValue];
              }
              console.log(`Multi select value:`, convertedValue, `for column "${column.name}"`);
              break;
            default:
              convertedValue = String(cellValue);
          }
          
          console.log(`Converted value: "${cellValue}" -> "${convertedValue}" for column "${column.name}"`);
          recordData[column.name] = convertedValue;
        } else {
          console.log(`Skipping empty cell [${rowIndex + 1}, ${i}] for column "${column.name}"`);
        }
      }

      console.log(`Row ${rowIndex + 1} hasValidData: ${hasValidData}, recordData:`, recordData);
      
      if (hasValidData) {
        try {
          console.log(`Saving record for row ${rowIndex + 1}:`, recordData);
          
          const record = new Record({
            tableId: newTable._id,
            databaseId: databaseId,
            data: recordData,
            userId,
            siteId
          });
          
          await record.save();
          importedRecords.push(record);
          console.log(`Successfully saved record for row ${rowIndex + 1}`);
        } catch (saveError) {
          console.error(`Error saving record for row ${rowIndex + 1}:`, saveError);
          errors.push(`Row ${rowIndex + 2}: Failed to save record - ${saveError.message}`);
        }
      } else {
        console.log(`No valid data found in row ${rowIndex + 1}`);
      }
    }

      console.log(`Import completed for sheet "${currentSheetName}":`, {
        tableId: newTable._id,
        tableName: newTable.name,
        importedCount: importedRecords.length,
        totalRows: dataRows.length,
        columnsCreated: columns.length,
        errors: errors.length
      });

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

    console.log('All sheets import completed:', {
      totalSheets: sheetNames.length,
      totalTables: totalTables,
      totalImported: totalImported,
      totalRows: totalRows,
      totalErrors: allErrors.length
    });

    res.json({
      success: true,
      message: `Excel import completed: ${totalTables} tables created, ${totalImported} records imported`,
      data: {
        totalSheets: sheetNames.length,
        totalTables: totalTables,
        totalImported: totalImported,
        totalRows: totalRows,
        totalErrors: allErrors.length,
        results: importResults,
        errors: allErrors
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

// Get Excel template for database
export const getDatabaseExcelTemplate = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user._id;
    const siteId = req.siteId;

    // Get database information
    const database = await Database.findOne({ _id: databaseId, userId, siteId });
    if (!database) {
      return res.status(404).json({ message: 'Database not found' });
    }

    // Create template data with sample columns
    const templateData = [];
    
    // Add header row with sample column names
    const sampleHeaders = ['Name', 'Email', 'Phone', 'Age', 'Status'];
    templateData.push(sampleHeaders);

    // Add example data rows
    const exampleRows = [
      ['John Doe', 'john@example.com', '0123456789', 25, 'Active'],
      ['Jane Smith', 'jane@example.com', '0987654321', 30, 'Inactive'],
      ['Bob Johnson', 'bob@example.com', '0555666777', 28, 'Active']
    ];
    
    exampleRows.forEach(row => templateData.push(row));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const columnWidths = sampleHeaders.map(header => ({
      wch: Math.max(header.length, 15)
    }));
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${database.name}_template.xlsx"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating database Excel template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
