import fetch from 'node-fetch';
import https from 'https';

// Disable SSL verification for dev environment
const agent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = 'https://dev.2tdata.com/api';

async function testSingleSelectColumn() {
    try {
        console.log('🔐 Step 1: Authenticating...');
        
        const authResponse = await fetch(`${BASE_URL}/auth/sign-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
        
        // Test single select column creation
        console.log('\n🔄 Step 2: Creating single select column...');
        
        // First, let's get existing databases and tables
        const dbResponse = await fetch(`${BASE_URL}/database/databases`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            agent
        });
        
        const dbData = await dbResponse.json();
        if (!dbData.success || !dbData.data || dbData.data.length === 0) {
            console.error('❌ No databases found');
            return;
        }
        
        const database = dbData.data[0];
        console.log(`Using database: ${database.name}`);
        
        // Get tables
        const tablesResponse = await fetch(`${BASE_URL}/database/databases/${database._id}/tables`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            agent
        });
        
        const tablesData = await tablesResponse.json();
        if (!tablesData.success || !tablesData.data || tablesData.data.length === 0) {
            console.error('❌ No tables found');
            return;
        }
        
        const table = tablesData.data[0];
        console.log(`Using table: ${table.name}`);
        
        // Now try to create a single select column
        const singleSelectData = {
            tableId: table._id,
            name: 'Status Selection',
            dataType: 'single_select',
            isRequired: false,
            singleSelectConfig: {
                options: ['Active', 'Inactive', 'Pending'],
                defaultValue: 'Active'
            }
        };
        
        console.log('Sending single select column data:', JSON.stringify(singleSelectData, null, 2));
        
        const columnResponse = await fetch(`${BASE_URL}/database/columns`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(singleSelectData),
            agent
        });
        
        console.log('Response status:', columnResponse.status);
        console.log('Response headers:', Object.fromEntries(columnResponse.headers));
        
        const responseText = await columnResponse.text();
        console.log('Raw response:', responseText);
        
        let columnData;
        try {
            columnData = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e.message);
            return;
        }
        
        if (columnResponse.ok) {
            console.log('🎉 Single select column created successfully!');
            console.log('Column details:', columnData.data);
        } else {
            console.error('❌ Failed to create single select column:', columnData);
            
            // Let's also try to see what the actual error is
            if (columnResponse.status === 500) {
                console.error('Server returned 500 error. This suggests an internal server error.');
            }
        }
        
    } catch (error) {
        console.error('❌ Error during test:', error);
        console.error('Stack trace:', error.stack);
    }
}

testSingleSelectColumn();
