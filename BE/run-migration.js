import FullMigration from './src/scripts/migrate-all.js';

console.log('🚀 Starting Full Migration...');
console.log('==============================');

const migration = new FullMigration();
migration.runMigration({ dryRun: false, skipExisting: true }).catch(console.error);
