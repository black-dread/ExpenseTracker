const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

/**
 * Migration script to import data from your existing Excel files
 * 
 * This script helps you import your existing data from Raw_Flows.xlsx and Accounts.xlsx
 * into the new database.
 * 
 * Instructions:
 * 1. Export your sheets to CSV or JSON format
 * 2. Modify the data parsing logic below to match your format
 * 3. Run: node scripts/migrate-data.js
 */

async function migrateData() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Starting data migration...');

    // Step 1: Import Accounts
    console.log('\n1. Importing accounts...');
    
    // Example: Add your accounts
    const accounts = [
      { name: 'ICICI', type: 'bank', balance: 0 },
      { name: 'HDFC', type: 'bank', balance: 0 },
      { name: 'HSBC', type: 'bank', balance: 0 },
      { name: 'Kotak', type: 'bank', balance: 0 },
      { name: 'Cash', type: 'cash', balance: 0 },
      { name: 'HDFC Credit', type: 'credit_card', balance: 0 },
      { name: 'HSBC Credit', type: 'credit_card', balance: 0 },
      { name: 'Mutual Funds(I)', type: 'investment', balance: 0 },
      // Add more accounts as needed
    ];

    for (const acc of accounts) {
      try {
        await sql`
          INSERT INTO accounts (name, account_type, balance, is_virtual)
          VALUES (${acc.name}, ${acc.type}, ${acc.balance}, false)
          ON CONFLICT (name) DO NOTHING
        `;
        console.log(`  ✓ Added account: ${acc.name}`);
      } catch (error) {
        console.log(`  ⚠ Skipped account ${acc.name} (may already exist)`);
      }
    }

    // Step 2: Import Categories
    console.log('\n2. Importing categories...');
    
    const categories = [
      'Salary', 'Travel', 'Lifestyle', 'Petrol', 'Subscriptions',
      'Groceries', 'Eat Out', 'Gifts', 'Rent', 'Utilities',
      'Investment', 'Interest', 'Dividend/Profit', 'Miscellaneous',
      'Entertainment', 'Healthcare', 'Education', 'Shopping'
    ];

    for (const cat of categories) {
      try {
        await sql`
          INSERT INTO categories (name)
          VALUES (${cat})
          ON CONFLICT (name) DO NOTHING
        `;
        console.log(`  ✓ Added category: ${cat}`);
      } catch (error) {
        console.log(`  ⚠ Skipped category ${cat} (may already exist)`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\nNext steps:');
    console.log('1. You can now manually import your transactions via the UI');
    console.log('2. Or modify this script to parse your CSV/JSON data and import transactions');
    console.log('\nTo import transactions programmatically:');
    console.log('- Parse your Raw_Flows.xlsx data');
    console.log('- Map each row to the appropriate transaction type');
    console.log('- Use the transactions API or SQL inserts');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

migrateData();
