import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = 'https://dev.2tdata.com/api';

async function testDateColumnAndDisplay() {
    try {
        console.log('🔐 Authenticating...');
        
        const authResponse = await fetch(`${BASE_URL}/auth/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'superadmin@2tdata.com',
                password: 'admin123'
            }),
            agent
        });
        
        const authData = await authResponse.json();
        if (!authResponse.ok) {
            console.error('❌ Auth failed:', authData);
            return;
        }
        
        const token = authData.accessToken;
        console.log('✅ Authenticated');
        
        // Get databases and tables
        const dbResponse = await fetch(`${BASE_URL}/database/databases`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            agent
        });
        const dbData = await dbResponse.json();
        const database = dbData.data[0];
        
        const tablesResponse = await fetch(`${BASE_URL}/database/databases/${database._id}/tables`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            agent
        });
        const tablesData = await tablesResponse.json();
        const table = tablesData.data[0];
        
        console.log(`Using table: ${table.name}`);
        
        // Create a date column with DD/MM/YYYY format
        console.log('🗓️ Creating date column with DD/MM/YYYY format...');
        const uniqueName = `DateColumn_${Date.now()}`;
        const columnData = {
            tableId: table._id,
            name: uniqueName,
            dataType: 'date',
            dateConfig: {
                format: 'DD/MM/YYYY'
            }
        };
        
        const columnResponse = await fetch(`${BASE_URL}/database/columns`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(columnData),
            agent
        });
        
        const columnResult = await columnResponse.json();
        
        if (!columnResponse.ok) {
            console.error('❌ Failed to create date column:', columnResult);
            return;
        }
        
        console.log('✅ Date column created successfully!');
        console.log('Column details:', {
            name: columnResult.data.name,
            dataType: columnResult.data.dataType,
            dateConfig: columnResult.data.dateConfig
        });
        
        // Now add a record with date data
        console.log('📝 Adding record with date data...');
        const recordData = {
            tableId: table._id,
            data: {
                [uniqueName]: '2025-08-29' // ISO date format
            }
        };
        
        const recordResponse = await fetch(`${BASE_URL}/database/records`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(recordData),
            agent
        });
        
        const recordResult = await recordResponse.json();
        
        if (recordResponse.ok) {
            console.log('✅ Record with date added successfully!');
            console.log('Date value stored:', recordResult.data.data[uniqueName]);
            
            // Test how it would be displayed with our new formatter
            const storedDateValue = recordResult.data.data[uniqueName];
            console.log('📊 Display formatting test:');
            console.log(`  Stored: ${storedDateValue}`);
            console.log(`  Would display as DD/MM/YYYY: ${formatDateForDisplay(storedDateValue, 'DD/MM/YYYY')}`);
            console.log(`  Would display as YYYY-MM-DD: ${formatDateForDisplay(storedDateValue, 'YYYY-MM-DD')}`);
            
        } else {
            console.error('❌ Failed to add record:', recordResult);
        }
        
        console.log('🎉 Date column test completed!');
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

// Include the formatter function for testing
const formatDateForDisplay = (dateValue, format = 'DD/MM/YYYY') => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    switch (format) {
      case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
      case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
      case 'DD MM YYYY': return `${day} ${month} ${year}`;
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'MM-DD-YYYY': return `${month}-${day}-${year}`;
      case 'YYYY/MM/DD': return `${year}/${month}/${day}`;
      case 'YYYY-MM-DD':
      default: return `${year}-${month}-${day}`;
    }
  } catch (error) {
    return dateValue;
  }
};

testDateColumnAndDisplay();
