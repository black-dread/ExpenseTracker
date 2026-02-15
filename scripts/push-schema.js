const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function pushSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.log('Please create a .env file with your NeonDB connection string');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Pushing schema to database...');
    
    // Smart SQL splitting that respects $$ delimiters
    const statements = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    
    const lines = schema.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines when not in dollar quote
      if (!inDollarQuote && (trimmedLine.startsWith('--') || trimmedLine === '')) {
        continue;
      }
      
      // Check for dollar quote delimiters
      const dollarMatches = line.match(/\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$/g);
      if (dollarMatches) {
        for (const match of dollarMatches) {
          if (!inDollarQuote) {
            inDollarQuote = true;
            dollarTag = match;
          } else if (match === dollarTag) {
            inDollarQuote = false;
            dollarTag = '';
          }
        }
      }
      
      currentStatement += line + '\n';
      
      // Only split on semicolon if not in dollar quote
      if (!inDollarQuote && trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Execute each statement
    for (const statement of statements) {
      if (statement && !statement.startsWith('--')) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await sql(statement);
      }
    }
    
    console.log('✅ Schema pushed successfully!');
    console.log('Your database is ready to use.');
  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    process.exit(1);
  }
}

require('dotenv').config();
pushSchema();