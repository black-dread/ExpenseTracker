const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function testConnection() {
  console.log('Testing connection to NeonDB...\n');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('Host:', process.env.DATABASE_URL?.match(/@([^/]+)\//)?.[1]);
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT NOW() as current_time`;
    console.log('\n✅ Connection successful!');
    console.log('Server time:', result[0].current_time);
  } catch (error) {
    console.log('\n❌ Connection failed:', error.message);
    console.log('\nFull error:', error);
  }
}

testConnection();