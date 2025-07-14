// Migration to add footer_config field to sites collection
db.sites.updateMany(
  { footer_config: { $exists: false } },
  { $set: { footer_config: {} } }
);

print("Migration completed: Added footer_config field to all sites");
