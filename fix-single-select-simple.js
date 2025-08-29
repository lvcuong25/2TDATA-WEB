// Simple fix script for single_select schema issue
// This script will test if the issue is resolved by just restarting the service

import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = 'https://dev.2tdata.com/api';

async function testSingleSelectFix() {
    try {
        console.log('🔐 Authenticating...');
        
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
        
        console.log(`Using database: ${database.name}, table: ${table.name}`);
        
        // Try to create single_select column with unique name
        const uniqueName = `SingleSelect_${Date.now()}`;
        const columnData = {
            tableId: table._id,
            name: uniqueName,
            dataType: 'single_select',
            singleSelectConfig: {
                options: ['Active', 'Inactive', 'Pending'],
                defaultValue: 'Active'
            }
        };
        
        console.log('🔄 Testing single_select column creation...');
        const columnResponse = await fetch(`${BASE_URL}/database/columns`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(columnData),
            agent
        });
        
        const result = await columnResponse.json();
        
        if (columnResponse.ok) {
            console.log('🎉 SUCCESS: Single select column created successfully!');
            console.log('Column details:', result.data);
        } else {
            console.log('❌ Still failing:', result);
            
            // If it's still the enum error, we need to manually update the database
            if (result.error && result.error.includes('is not a valid enum value')) {
                console.log('\n🔧 The enum validation is still blocking. Need to update database schema.');
                return false;
            }
        }
        
        return columnResponse.ok;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

testSingleSelectFix().then(success => {
    if (!success) {
        console.log('\n💡 Next steps: Need to update the database schema validation rules.');
    }
    process.exit(success ? 0 : 1);
});
