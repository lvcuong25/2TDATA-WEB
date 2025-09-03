const fs = require('fs');

// Read the file
let content = fs.readFileSync('FE/src/pages/DatabaseManagement/TableDetail.jsx', 'utf8');

// Add stopPropagation to dropdown container for multi-select (grouped)
content = content.replace(
  /(\/\* Dropdown Options \*\/\s*<div\s*style=\{\{\s*position: 'absolute',[\s\S]*?marginTop: '4px'\s*\}\})/,
  `$1\n                                          onClick={(e) => e.stopPropagation()}`
);

// Also need to add for the ungrouped version
// Find the second occurrence and add stopPropagation
const dropdownRegex = /(\/\* Dropdown Options \*\/\s*<div[\s\S]*?marginTop: '4px'\s*\}\})/g;
let matches = [];
let match;
while ((match = dropdownRegex.exec(content)) !== null) {
  matches.push(match);
}

// Replace both occurrences
if (matches.length >= 2) {
  // First replace the second occurrence (working backwards)
  content = content.substring(0, matches[1].index) + 
    matches[1][0] + '\n                                          onClick={(e) => e.stopPropagation()}' +
    content.substring(matches[1].index + matches[1][0].length);
    
  // Then replace the first occurrence (adjust index for previous replacement)
  const adjustment = '\n                                          onClick={(e) => e.stopPropagation()}'.length;
  content = content.substring(0, matches[0].index) + 
    matches[0][0] + '\n                                          onClick={(e) => e.stopPropagation()}' +
    content.substring(matches[0].index + matches[0][0].length + adjustment);
}

// Write back to file
fs.writeFileSync('FE/src/pages/DatabaseManagement/TableDetail.jsx', content);

console.log('✅ Added stopPropagation to multi-select dropdown containers');
