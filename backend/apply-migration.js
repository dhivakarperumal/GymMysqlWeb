require('dotenv').config();
const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    const migrationFile = path.join(__dirname, 'src/config/migrations/0005_add_gym_facilities_table.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    console.log('Applying migration 0005_add_gym_facilities_table.sql...');
    await db.query(sql);
    
    // Record the migration as applied
    await db.query(
      `INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
      ['0005_add_gym_facilities_table.sql']
    );
    
    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

applyMigration();
