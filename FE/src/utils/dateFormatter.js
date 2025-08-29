// Date formatting utilities
export const formatDateForDisplay = (dateValue, format = 'DD/MM/YYYY') => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateValue; // Return original value if not a valid date
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

export const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // HTML date input always expects YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

export const parseDateFromInput = (inputValue) => {
  if (!inputValue) return null;
  
  try {
    // Input is in YYYY-MM-DD format, create date and return as ISO string
    const date = new Date(inputValue + 'T00:00:00.000Z');
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date from input:', error);
    return null;
  }
};
