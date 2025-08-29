// Test date formatting functionality

// Test the utility functions
const formatDateForDisplay = (dateValue, format = 'DD/MM/YYYY') => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    
    if (isNaN(date.getTime())) {
      return dateValue;
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      case 'DD MM YYYY':
        return `${day} ${month} ${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'MM-DD-YYYY':
        return `${month}-${day}-${year}`;
      case 'YYYY/MM/DD':
        return `${year}/${month}/${day}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateValue;
  }
};

// Test different date values and formats
const testCases = [
  { date: '2025-08-29', format: 'DD/MM/YYYY', expected: '29/08/2025' },
  { date: '2025-08-29T10:30:00Z', format: 'DD/MM/YYYY', expected: '29/08/2025' },
  { date: '2025-12-31', format: 'DD-MM-YYYY', expected: '31-12-2025' },
  { date: '2025-01-15', format: 'MM/DD/YYYY', expected: '01/15/2025' }
];

console.log('🧪 Testing date formatting...');
console.log('=====================================');

testCases.forEach((testCase, index) => {
  const result = formatDateForDisplay(testCase.date, testCase.format);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input: ${testCase.date}`);
  console.log(`  Format: ${testCase.format}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});

// Test default DD/MM/YYYY format specifically
console.log('🎯 Testing default DD/MM/YYYY format:');
console.log('=====================================');

const defaultTests = [
  '2025-08-29',
  '2025-12-25',
  '2025-01-01',
  '2025-06-15'
];

defaultTests.forEach(dateStr => {
  const result = formatDateForDisplay(dateStr, 'DD/MM/YYYY');
  console.log(`${dateStr} → ${result}`);
});

console.log('\n🎉 Date formatting test completed!');
