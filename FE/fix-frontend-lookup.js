import fs from 'fs';

const filePath = '/home/dbuser/2TDATA-WEB-dev/FE/src/pages/DatabaseManagement/Components/TableBody.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the lookup display logic
const oldLookupLogic = `                                          // Hiển thị label đã được pull từ bảng liên kết
                                          return (
                                            <div style={{ cursor: 'pointer' }}
                                            onClick={() => handleCellClick(record._id, column.name, value)}
                                            >
                                              {value.label || value.data?.name || 'Lookup Value'}
                                            </div>
                                          );`;

const newLookupLogic = `                                          // Hiển thị label đã được pull từ bảng liên kết
                                          return (
                                            <div style={{ cursor: 'pointer' }}
                                            onClick={() => handleCellClick(record._id, column.name, value)}
                                            >
                                              {value.label || 'Lookup Value'}
                                            </div>
                                          );`;

content = content.replace(oldLookupLogic, newLookupLogic);

// Also fix the second occurrence (there might be duplicate code)
content = content.replace(
  `{value.label || value.data?.name || 'Lookup Value'}`,
  `{value.label || 'Lookup Value'}`
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed frontend lookup display logic');
