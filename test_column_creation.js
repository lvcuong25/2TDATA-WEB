import fetch from 'node-fetch';
import https from 'https';

// Disable SSL verification for dev environment
const agent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = 'https://dev.2tdata.com/api';

async function testColumnCreation() {
    try {
        console.log('🔐 Step 1: Authenticating with superadmin...');
        
        // Sign in with superadmin account
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
        console.log('Auth response status:', authResponse.status);
        console.log('Auth response:', authData);
        
        if (!authResponse.ok || !authData.accessToken) {
            console.error('❌ Authentication failed:', authData);
            return;
        }
        
        const token = authData.accessToken;
        console.log('✅ Authentication successful');
        
        console.log('\n📊 Step 2: Getting user databases...');
        
        // Get databases
        const dbResponse = await fetch(`${BASE_URL}/database/databases`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            agent
        });
        
        const dbData = await dbResponse.json();
        console.log('Databases response status:', dbResponse.status);
        console.log('Databases response:', dbData);
        
        if (!dbResponse.ok) {
            console.error('❌ Failed to get databases:', dbData);
            return;
        }
        
        let database;
        if (!dbData.success || !dbData.data || dbData.data.length === 0) {
            console.log('⚠️ No databases found, creating one...');
            
            // Create a test database
            const createDbResponse = await fetch(`${BASE_URL}/database/databases`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'Test Database',
                    description: 'Database for testing column creation'
                }),
                agent
            });
            
            const createDbData = await createDbResponse.json();
            console.log('Create database response:', createDbData);
            
            if (!createDbResponse.ok || !createDbData.success) {
                console.error('❌ Failed to create database:', createDbData);
                return;
            }
            
            database = createDbData.data;
        } else {
            database = dbData.data[0];
        }
        
        console.log(`✅ Using database: ${database.name} (${database._id})`);
        
        console.log('\n📋 Step 3: Getting/Creating tables...');
        
        // Get tables for the database
        const tablesResponse = await fetch(`${BASE_URL}/database/databases/${database._id}/tables`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            agent
        });
        
        const tablesData = await tablesResponse.json();
        console.log('Tables response status:', tablesResponse.status);
        console.log('Tables response:', tablesData);
        
        let table;
        if (!tablesResponse.ok || !tablesData.success || !tablesData.data || tablesData.data.length === 0) {
            console.log('⚠️ No tables found, creating one...');
            
            // Create a test table
            const createTableResponse = await fetch(`${BASE_URL}/database/tables`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'Test Table',
                    description: 'Table for testing column creation',
                    databaseId: database._id
                }),
                agent
            });
            
            const createTableData = await createTableResponse.json();
            console.log('Create table response:', createTableData);
            
            if (!createTableResponse.ok || !createTableData.success) {
                console.error('❌ Failed to create table:', createTableData);
                return;
            }
            
            table = createTableData.data;
        } else {
            table = tablesData.data[0];
        }
        
        console.log(`✅ Using table: ${table.name} (${table._id})`);
        
        console.log('\n✅ Step 4: Creating checkbox column...');
        
        // Now test creating a checkbox column
        const columnResponse = await fetch(`${BASE_URL}/database/columns`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tableId: table._id,
                name: 'Test Checkbox Column',
                dataType: 'checkbox',
                checkboxConfig: {
                    icon: 'check-circle',
                    color: '#52c41a',
                    defaultValue: false
                }
            }),
            agent
        });
        
        const columnData = await columnResponse.json();
        
        console.log('Column creation response:', {
            status: columnResponse.status,
            ok: columnResponse.ok,
            data: columnData
        });
        
        if (columnResponse.ok && columnData.success) {
            console.log('🎉 Checkbox column created successfully!');
            console.log('Column details:', columnData.data);
        } else {
            console.error('❌ Failed to create checkbox column:', columnData);
        }
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testColumnCreation();
