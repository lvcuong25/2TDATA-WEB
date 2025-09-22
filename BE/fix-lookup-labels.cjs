// Tạo script để patch file columnController.js
const fs = require('fs');
const filePath = 'src/controllers/columnController.js';

let content = fs.readFileSync(filePath, 'utf8');

// Tìm và thay thế phần tạo label
const oldPattern = /const lookupValue = record\.data\?\[lookupColumn\.name\];\s*if \(lookupValue && String\(lookupValue\)\.trim\(\)\) \{\s*label = String\(lookupValue\);\s*\}/;

const newCode = `const lookupValue = record.data?.[lookupColumn.name];
      if (lookupValue && String(lookupValue).trim()) {
        label = String(lookupValue);
      } else {
        // Fallback: create meaningful label combining multiple fields
        const data = record.data || {};
        const meaningfulParts = [];
        
        // Priority order for display
        const priorityFields = ['Tên giao dịch', 'Loại giao dịch', 'chiến dịch'];
        
        for (const field of priorityFields) {
          if (data[field] && String(data[field]).trim()) {
            meaningfulParts.push(String(data[field]));
          }
        }
        
        // If no priority fields, use any non-empty field
        if (meaningfulParts.length === 0) {
          for (const [key, value] of Object.entries(data)) {
            if (value && String(value).trim()) {
              meaningfulParts.push(String(value));
              break;
            }
          }
        }
        
        if (meaningfulParts.length > 0) {
          label = meaningfulParts.join(' - ');
        }
      }`;

content = content.replace(oldPattern, newCode);

fs.writeFileSync(filePath, content);
console.log('✅ Updated columnController.js with improved lookup labels');
