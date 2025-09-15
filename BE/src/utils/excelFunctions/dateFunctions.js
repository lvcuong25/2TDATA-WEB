/**
 * Date & Time Functions for Excel-like formula engine
 * Compatible with expr-eval library
 */

export const dateFunctions = {
  // Current Date & Time
  TODAY: () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  },

  NOW: () => {
    return new Date();
  },

  // Date Construction
  DATE: (year, month, day) => {
    const y = Number(year) || 1900;
    const m = Number(month) || 1;
    const d = Number(day) || 1;
    return new Date(y, m - 1, d);
  },

  TIME: (hour, minute, second) => {
    const h = Number(hour) || 0;
    const m = Number(minute) || 0;
    const s = Number(second) || 0;
    const date = new Date();
    date.setHours(h, m, s, 0);
    return date;
  },

  // Date Extraction
  YEAR: (date) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getFullYear();
  },

  MONTH: (date) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getMonth() + 1;
  },

  DAY: (date) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getDate();
  },

  HOUR: (date) => {
    // Handle time string format like "09:45" or "17:30"
    if (typeof date === 'string' && date.match(/^\d{1,2}:\d{2}$/)) {
      const [hours] = date.split(':');
      return parseInt(hours) || 0;
    }
    
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getHours();
  },

  MINUTE: (date) => {
    // Handle time string format like "09:45" or "17:30"
    if (typeof date === 'string' && date.match(/^\d{1,2}:\d{2}$/)) {
      const [, minutes] = date.split(':');
      return parseInt(minutes) || 0;
    }
    
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getMinutes();
  },

  SECOND: (date) => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getSeconds();
  },


  // Convert total minutes to HH:MM format
  TIMEVALUE: (totalMinutes) => {
    const minutes = Math.abs(Number(totalMinutes) || 0);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },
  // Convert HH:MM format back to total minutes
  TIMETOVALUE: (timeString) => {
    if (typeof timeString === 'string' && timeString.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = timeString.split(':');
      return parseInt(hours) * 60 + parseInt(minutes);
    }
    // If it's already a number, return as-is
    return Number(timeString) || 0;
  },


  // Date Calculations
  DATEDIF: (startDate, endDate, unit) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const unitUpper = String(unit || 'D').toUpperCase();
    
    switch (unitUpper) {
      case 'D': // Days
        return Math.floor((end - start) / (1000 * 60 * 60 * 24));
      
      case 'M': // Months
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      
      case 'Y': // Years
        return end.getFullYear() - start.getFullYear();
      
      case 'MD': // Days ignoring months and years
        return end.getDate() - start.getDate();
      
      case 'YM': // Months ignoring days and years
        return end.getMonth() - start.getMonth();
      
      case 'YD': // Days ignoring years
        const startThisYear = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endThisYear = new Date(start.getFullYear(), end.getMonth(), end.getDate());
        return Math.floor((endThisYear - startThisYear) / (1000 * 60 * 60 * 24));
      
      default:
        return Math.floor((end - start) / (1000 * 60 * 60 * 24));
    }
  },

  DATEADD: (date, days) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date();
    
    const numDays = Number(days) || 0;
    d.setDate(d.getDate() + numDays);
    return d;
  },

  // Date Information
  WEEKDAY: (date, returnType = 1) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 0;
    
    const day = d.getDay();
    const type = Number(returnType) || 1;
    
    switch (type) {
      case 1: // Sunday = 1, Saturday = 7
        return day === 0 ? 7 : day;
      case 2: // Monday = 1, Sunday = 7
        return day === 0 ? 7 : day;
      case 3: // Monday = 0, Sunday = 6
        return day === 0 ? 6 : day - 1;
      default:
        return day === 0 ? 7 : day;
    }
  },

  WEEKNUM: (date, returnType = 1) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 0;
    
    const year = d.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const daysDiff = Math.floor((d - firstDay) / (1000 * 60 * 60 * 24));
    
    return Math.ceil((daysDiff + firstDay.getDay() + 1) / 7);
  },

  // Month/Year End
  EOMONTH: (date, months) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date();
    
    const numMonths = Number(months) || 0;
    d.setMonth(d.getMonth() + numMonths + 1, 0); // Set to last day of month
    return d;
  },

  EDATE: (date, months) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date();
    
    const numMonths = Number(months) || 0;
    d.setMonth(d.getMonth() + numMonths);
    return d;
  },

  // Date Formatting
  DATESTR: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second);
  },

  // Date Validation
  ISDATE: (value) => {
    const d = new Date(value);
    return !isNaN(d.getTime());
  },

  // Working Days
  WORKDAY: (startDate, days, holidays = []) => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return new Date();
    
    const numDays = Number(days) || 0;
    const holidayDates = holidays.map(h => new Date(h)).filter(d => !isNaN(d.getTime()));
    
    let current = new Date(start);
    let addedDays = 0;
    
    while (addedDays < Math.abs(numDays)) {
      current.setDate(current.getDate() + (numDays > 0 ? 1 : -1));
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        // Skip holidays
        const isHoliday = holidayDates.some(h => 
          h.getFullYear() === current.getFullYear() &&
          h.getMonth() === current.getMonth() &&
          h.getDate() === current.getDate()
        );
        
        if (!isHoliday) {
          addedDays++;
        }
      }
    }
    
    return current;
  }
};

export default dateFunctions;
