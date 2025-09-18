// Simple test script to check database connection and table structure
// Run with: node test-db.js

const { neon } = require('@neondatabase/serverless');

async function testDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check if rooms table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'rooms'
      ) as exists
    `;
    console.log('📋 Rooms table exists:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      // Get table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'rooms' 
        ORDER BY ordinal_position
      `;
      console.log('📊 Table structure:');
      console.table(columns);
      
      // Check if there are any records
      const count = await sql`SELECT COUNT(*) as total FROM rooms`;
      console.log('📈 Total rooms:', count[0].total);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDatabase();
