import fs from 'fs';
import path from 'path';

console.log('🔍 Checking Controller Routes and Metabase Sync...');

function checkControllerRoutes() {
  try {
    // Check router files
    const routerPath = './src/router';
    const routerFiles = fs.readdirSync(routerPath);
    
    console.log('\n📋 Router Files:');
    routerFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    
    // Check main router file
    const mainRouterPath = path.join(routerPath, 'index.js');
    if (fs.existsSync(mainRouterPath)) {
      console.log('\n🔍 Main Router Configuration:');
      const routerContent = fs.readFileSync(mainRouterPath, 'utf8');
      
      // Look for record-related routes
      const recordRoutes = routerContent.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`][^'"`]*record[^'"`]*['"`]/gi);
      if (recordRoutes) {
        console.log('\n📝 Record Routes Found:');
        recordRoutes.forEach(route => {
          console.log(`   ${route}`);
        });
      }
      
      // Look for controller imports
      const controllerImports = routerContent.match(/import.*from\s*['"`][^'"`]*controller[^'"`]*['"`]/gi);
      if (controllerImports) {
        console.log('\n📦 Controller Imports:');
        controllerImports.forEach(import_ => {
          console.log(`   ${import_}`);
        });
      }
    }
    
    // Check individual router files
    console.log('\n🔍 Individual Router Files:');
    routerFiles.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(routerPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for record routes in this file
        const recordRoutes = content.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`][^'"`]*record[^'"`]*['"`]/gi);
        if (recordRoutes && recordRoutes.length > 0) {
          console.log(`\n📝 ${file}:`);
          recordRoutes.forEach(route => {
            console.log(`   ${route}`);
          });
        }
      }
    });
    
    // Check controllers for Metabase sync
    console.log('\n🔍 Checking Controllers for Metabase Sync:');
    
    const controllerPath = './src/controllers';
    const controllerFiles = fs.readdirSync(controllerPath);
    
    const recordControllers = controllerFiles.filter(file => 
      file.includes('record') && file.endsWith('.js')
    );
    
    recordControllers.forEach(file => {
      console.log(`\n📄 ${file}:`);
      const filePath = path.join(controllerPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for updateMetabaseTable usage
      const metabaseSync = content.includes('updateMetabaseTable');
      const metabaseImport = content.includes('metabaseTableCreator');
      
      console.log(`   - updateMetabaseTable usage: ${metabaseSync ? '✅ YES' : '❌ NO'}`);
      console.log(`   - metabaseTableCreator import: ${metabaseImport ? '✅ YES' : '❌ NO'}`);
      
      if (metabaseSync) {
        // Find functions that use updateMetabaseTable
        const functions = content.match(/export\s+(?:const|function)\s+(\w+)/g);
        if (functions) {
          console.log(`   - Functions: ${functions.map(f => f.replace('export const ', '').replace('export function ', '')).join(', ')}`);
        }
      }
    });
    
    // Check for any missing sync
    console.log('\n🔍 Summary:');
    console.log('Controllers with Metabase sync:');
    recordControllers.forEach(file => {
      const filePath = path.join(controllerPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const hasSync = content.includes('updateMetabaseTable');
      console.log(`   ${file}: ${hasSync ? '✅ HAS SYNC' : '❌ MISSING SYNC'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking routes:', error.message);
  }
}

// Run the check
checkControllerRoutes();



