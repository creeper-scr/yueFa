const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'pgm-bp1oo9i5j0l08g82mo.rwlb.rds.aliyuncs.com',
  port: 5432,
  database: 'yuefa_staging',
  user: 'yuefa_user',
  password: '1919810_Homosexual@'
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    const migrationPath = './src/db/migrations/001_init.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nTables created:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
