const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function migrateFromRawFlows() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.log('Make sure you have a .env file with your DATABASE_URL');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const rawFlowsPath = path.join(__dirname, '..', 'Raw_Flows.xlsx');
  
  if (!fs.existsSync(rawFlowsPath)) {
    console.error(`ERROR: Raw_Flows.xlsx not found at ${rawFlowsPath}`);
    console.log('Please place your Raw_Flows.xlsx file in the expense-tracker folder');
    process.exit(1);
  }

  try {
    console.log('📖 Reading Raw_Flows.xlsx...\n');
    
    const workbook = XLSX.readFile(rawFlowsPath);
    const sheetName = 'Raw';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} transactions to import\n`);

    // Step 1: Extract and import unique accounts
    console.log('🏦 Step 1: Importing accounts...');
    const accountsSet = new Set();
    
    data.forEach(row => {
      if (row['Income Account']) accountsSet.add(row['Income Account']);
      if (row['Expense Account']) accountsSet.add(row['Expense Account']);
      if (row['Outflow Account']) accountsSet.add(row['Outflow Account']);
      if (row['Inflow Account']) accountsSet.add(row['Inflow Account']);
      if (row['Involved Account']) accountsSet.add(row['Involved Account']);
    });

    // Account type mapping (customize based on your accounts)
    const accountTypeMap = {
      'ICICI': 'bank',
      'HDFC': 'bank',
      'HSBC': 'bank',
      'Kotak': 'bank',
      'Cash': 'cash',
      'HDFC Credit': 'credit_card',
      'HSBC Credit': 'credit_card',
      'Mutual Funds(I)': 'investment',
    };

    for (const accountName of accountsSet) {
      if (!accountName) continue;
      
      const accountType = accountTypeMap[accountName] || 'bank';
      
      try {
        await sql`
          INSERT INTO accounts (name, account_type, balance, is_virtual)
          VALUES (${accountName}, ${accountType}, 0, false)
          ON CONFLICT (name) DO NOTHING
        `;
        console.log(`  ✓ Added account: ${accountName}`);
      } catch (error) {
        console.log(`  ⚠ Account ${accountName} already exists`);
      }
    }

    // Step 2: Extract and import unique categories
    console.log('\n📁 Step 2: Importing categories...');
    const categoriesSet = new Set();
    
    data.forEach(row => {
      if (row['Category']) categoriesSet.add(row['Category']);
    });

    for (const categoryName of categoriesSet) {
      if (!categoryName) continue;
      
      try {
        await sql`
          INSERT INTO categories (name)
          VALUES (${categoryName})
          ON CONFLICT (name) DO NOTHING
        `;
        console.log(`  ✓ Added category: ${categoryName}`);
      } catch (error) {
        console.log(`  ⚠ Category ${categoryName} already exists`);
      }
    }

    // Get account and category IDs for mapping
    const accounts = await sql`SELECT id, name FROM accounts`;
    const categories = await sql`SELECT id, name FROM categories`;
    
    const accountMap = {};
    accounts.forEach(acc => accountMap[acc.name] = acc.id);
    
    const categoryMap = {};
    categories.forEach(cat => categoryMap[cat.name] = cat.id);

    // Step 3: Import transactions
    console.log('\n💰 Step 3: Importing transactions...');
    console.log('This may take a while for large datasets...\n');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if ((i + 1) % 100 === 0) {
        console.log(`  Processed ${i + 1}/${data.length} transactions...`);
      }

      try {
          // Parse date - Excel stores dates as numbers
  let transactionDate = row['Date'];
  
  // Skip if no date at all
  if (!transactionDate && transactionDate !== 0) {
    skippedCount++;
    continue;
  }
  
  // Handle Excel date serial number
  if (typeof transactionDate === 'number') {
    // Excel dates are stored as days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (transactionDate - 2) * 86400000);
    transactionDate = date.toISOString().split('T')[0];
  } else if (transactionDate instanceof Date) {
    transactionDate = transactionDate.toISOString().split('T')[0];
  } else if (typeof transactionDate === 'string') {
    const parsed = new Date(transactionDate);
    if (isNaN(parsed.getTime())) {
      console.log(`  ⚠ Skipping row ${i + 1}: Invalid date format: ${transactionDate}`);
      skippedCount++;
      continue;
    }
    transactionDate = parsed.toISOString().split('T')[0];
  } else {
    console.log(`  ⚠ Skipping row ${i + 1}: Invalid date type: ${typeof transactionDate}`);
    skippedCount++;
    continue;
  }

        const name = row['Name'] || 'Unknown';
        const amount = parseFloat(row['Amount']) || 0;
        const transactionType = row['Type']?.toLowerCase();
        const categoryId = row['Category'] ? categoryMap[row['Category']] : null;
        const isBenki = row['Benki?'] === 'Yes';

        if (!transactionType || amount === 0) {
          skippedCount++;
          continue;
        }

        // Build transaction object based on type
        let transaction = {
          date: transactionDate,
          name: name,
          category_id: categoryId,
          amount: amount,
          transaction_type: transactionType,
          is_benki: isBenki,
          notes: null,
        };

        // Type-specific fields
        if (transactionType === 'income') {
          transaction.income_account_id = row['Income Account'] ? accountMap[row['Income Account']] : null;
        } else if (transactionType === 'expense') {
          transaction.expense_account_id = row['Expense Account'] ? accountMap[row['Expense Account']] : null;
          transaction.expense_instrument = row['Expense Instrument'] || null;
        } else if (transactionType === 'transfer') {
          transaction.outflow_account_id = row['Outflow Account'] ? accountMap[row['Outflow Account']] : null;
          transaction.inflow_account_id = row['Inflow Account'] ? accountMap[row['Inflow Account']] : null;
        } else if (transactionType === 'debt') {
          const debtType = row['Debt Type']?.toLowerCase();
          transaction.debt_type = debtType;
          transaction.involved_account_id = row['Involved Account'] ? accountMap[row['Involved Account']] : null;
          transaction.counterparty_name = name;
        } else {
          console.log(`  ⚠ Unknown transaction type: ${transactionType} at row ${i + 1}`);
          skippedCount++;
          continue;
        }

        // Insert transaction
        await sql`
          INSERT INTO transactions (
            date, name, category_id, amount, transaction_type,
            income_account_id, expense_account_id, expense_instrument,
            outflow_account_id, inflow_account_id,
            debt_type, involved_account_id, counterparty_name,
            is_benki, notes
          ) VALUES (
            ${transaction.date},
            ${transaction.name},
            ${transaction.category_id},
            ${transaction.amount},
            ${transaction.transaction_type},
            ${transaction.income_account_id || null},
            ${transaction.expense_account_id || null},
            ${transaction.expense_instrument || null},
            ${transaction.outflow_account_id || null},
            ${transaction.inflow_account_id || null},
            ${transaction.debt_type || null},
            ${transaction.involved_account_id || null},
            ${transaction.counterparty_name || null},
            ${transaction.is_benki},
            ${transaction.notes}
          )
        `;

        successCount++;

      } catch (error) {
        console.log(`  ❌ Error at row ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✓ Successfully imported: ${successCount} transactions`);
    console.log(`⚠ Skipped: ${skippedCount} transactions`);
    console.log(`❌ Errors: ${errorCount} transactions`);
    console.log('='.repeat(60));

    // Recalculate account balances
    console.log('\n🔄 Recalculating account balances...');
    
    await sql`UPDATE accounts SET balance = 0 WHERE is_virtual = false`;
    
    const transactions = await sql`SELECT * FROM transactions ORDER BY date, id`;
    
    for (const txn of transactions) {
      if (txn.transaction_type === 'income' && txn.income_account_id) {
        await sql`UPDATE accounts SET balance = balance + ${txn.amount} WHERE id = ${txn.income_account_id}`;
      } else if (txn.transaction_type === 'expense' && txn.expense_account_id) {
        await sql`UPDATE accounts SET balance = balance - ${txn.amount} WHERE id = ${txn.expense_account_id}`;
      } else if (txn.transaction_type === 'transfer') {
        if (txn.outflow_account_id) {
          await sql`UPDATE accounts SET balance = balance - ${txn.amount} WHERE id = ${txn.outflow_account_id}`;
        }
        if (txn.inflow_account_id) {
          await sql`UPDATE accounts SET balance = balance + ${txn.amount} WHERE id = ${txn.inflow_account_id}`;
        }
      } else if (txn.transaction_type === 'debt') {
        // Get virtual debt account
        const debtAccount = await sql`SELECT id FROM accounts WHERE is_virtual = TRUE LIMIT 1`;
        const debtAccountId = debtAccount[0]?.id;
        
        if (txn.debt_type === 'lending') {
            // Money leaves account, add to virtual debt (people owe you)
            if (txn.involved_account_id) {
                await sql`UPDATE accounts SET balance = balance - ${txn.amount} WHERE id = ${txn.involved_account_id}`;
            }   
            if (debtAccountId) {
                await sql`UPDATE accounts SET balance = balance + ${txn.amount} WHERE id = ${debtAccountId}`;
            }
            } 
            else if (txn.debt_type === 'borrowing') {
                // Subtract from virtual debt (you owe more = more negative)
                if (debtAccountId) {
                    await sql`UPDATE accounts SET balance = balance - ${txn.amount} WHERE id = ${debtAccountId}`;
                }
            } 
            else if (txn.debt_type === 'sending') {
                // Money leaves account, add to virtual debt (you owe less)
                if (txn.involved_account_id) {
                    await sql`UPDATE accounts SET balance = balance - ${txn.amount} WHERE id = ${txn.involved_account_id}`;
                }
                if (debtAccountId) {
                    await sql`UPDATE accounts SET balance = balance + ${txn.amount} WHERE id = ${debtAccountId}`;
                }
            } 
            else if (txn.debt_type === 'receiving') {
                // Money enters account, subtract from virtual debt (they owe less)
                if (txn.involved_account_id) {
                    await sql`UPDATE accounts SET balance = balance + ${txn.amount} WHERE id = ${txn.involved_account_id}`;
                }
                if (debtAccountId) {
                    await sql`UPDATE accounts SET balance = balance - ${txn.amount} WHERE id = ${debtAccountId}`;
                }
            }
        }
    }

    console.log('✓ Account balances updated\n');

    const finalBalances = await sql`
      SELECT name, balance 
      FROM accounts 
      WHERE is_virtual = false 
      ORDER BY name
    `;
    
    console.log('📊 Final Account Balances:');
    finalBalances.forEach(acc => {
      console.log(`  ${acc.name}: ₹${acc.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    });

    console.log('\n🎉 All done! Your data has been imported successfully!');
    console.log('You can now run: npm run dev');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

require('dotenv').config();
migrateFromRawFlows();