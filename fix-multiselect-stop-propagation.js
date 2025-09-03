const fs = require('fs');

// Read the file
let content = fs.readFileSync('FE/src/pages/DatabaseManagement/TableDetail.jsx', 'utf8');

// Fix first multi-select dropdown (grouped view)
content = content.replace(
  /onClick=\{\(\) => \{\s*console\.log\('Multi-select option clicked:', option\);/g,
  "onClick={(e) => {\n                                                e.stopPropagation();\n                                                console.log('Multi-select option clicked:', option);"
);

// Fix second multi-select dropdown (ungrouped view)  
content = content.replace(
  /onClick=\{\(\) => \{\s*console\.log\('Multi-select option clicked \(ungrouped\):', option\);/g,
  "onClick={(e) => {\n                                          e.stopPropagation();\n                                          console.log('Multi-select option clicked (ungrouped):', option);"
);

// Write back to file
fs.writeFileSync('FE/src/pages/DatabaseManagement/TableDetail.jsx', content);

console.log('✅ Added stopPropagation to multi-select option clicks');
