const { neon } = require('@neondatabase/serverless');
async function recalculateBalances() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔄 Recalculating account balances...\n');

    // ========== DEFINE YOUR STARTING BALANCES HERE ==========
    // Set the initial balance for each account (as of your first transaction date)
    const startingBalances = {

      // Add any other accounts here with their starting balances

        'ICICI':20900.85,
        'HDFC':0.00,
        'HSBC':1030.64,
        'Kotak':0.00,
        'Cash':1410.00,
        'Metro Card':0.00,
        'Debt':2091.15,
        'EPFO':0.00,
        'HDFC Credit':0.00,
        'HSBC Credit':-54619.24,
        'ICICI Credit':0.00,
        'Apay Credit':0.00,
        'Stocks':0.00,
        'Stocks (V)':0.00,
        'Zerodha':0.80,
        'Mutual Funds(I)':341001.00,
        'Mutual Funds(V)':394582.00,
        'Qualcomm Shares':0.00
    };
    // ========================================================

    // Step 1: Get all accounts
    console.log('Step 1: Setting initial balances...');
    const accounts = await sql`SELECT id, name, is_virtual FROM accounts`;
    const accountMap = {};
    let debtAccountId = null;
    
    accounts.forEach(acc => {
      // Use starting balance if defined, otherwise use 0
      const startBalance = startingBalances[acc.name] !== undefined 
        ? startingBalances[acc.name] 
        : 0;
      
      accountMap[acc.id] = { 
        name: acc.name, 
        balance: startBalance, 
        is_virtual: acc.is_virtual 
      };
      
      if (acc.is_virtual) {
        debtAccountId = acc.id;
      }
      
      console.log(`  ${acc.name}: Starting balance = ₹${startBalance.toLocaleString('en-IN')}`);
    });

    console.log(`\n✓ Set starting balances for ${accounts.length} accounts\n`);

    // Step 2: Fetch all transactions and calculate in memory
    console.log('Step 2: Fetching all transactions...');
    const transactions = await sql`
      SELECT id, transaction_type, amount, 
             income_account_id, expense_account_id,
             outflow_account_id, inflow_account_id,
             debt_type, involved_account_id
      FROM transactions 
      ORDER BY date, id
    `;
    
    console.log(`Processing ${transactions.length} transactions...\n`);

    // Step 3: Calculate balances in memory
    console.log('Step 3: Calculating balances from transactions...');
    let processedCount = 0;

    for (const txn of transactions) {
      processedCount++;
      
      if (processedCount % 500 === 0) {
        console.log(`  Processed ${processedCount}/${transactions.length} transactions...`);
      }

      if (txn.transaction_type === 'income' && txn.income_account_id) {
        accountMap[txn.income_account_id].balance += parseFloat(txn.amount);
        
      } else if (txn.transaction_type === 'expense' && txn.expense_account_id) {
        accountMap[txn.expense_account_id].balance -= parseFloat(txn.amount);
        
      } else if (txn.transaction_type === 'transfer') {
        if (txn.outflow_account_id) {
          accountMap[txn.outflow_account_id].balance -= parseFloat(txn.amount);
        }
        if (txn.inflow_account_id) {
          accountMap[txn.inflow_account_id].balance += parseFloat(txn.amount);
        }
        
      } else if (txn.transaction_type === 'debt') {
        const amount = parseFloat(txn.amount);
        
        if (txn.debt_type === 'lending') {
          // Money leaves account, add to virtual debt
          if (txn.involved_account_id) {
            accountMap[txn.involved_account_id].balance -= amount;
          }
          if (debtAccountId) {
            accountMap[debtAccountId].balance += amount;
          }
          
        } else if (txn.debt_type === 'borrowing') {
          // Subtract from virtual debt
          if (debtAccountId) {
            accountMap[debtAccountId].balance -= amount;
          }
          
        } else if (txn.debt_type === 'paying') {
          // Money leaves account, add to virtual debt
          if (txn.involved_account_id) {
            accountMap[txn.involved_account_id].balance -= amount;
          }
          if (debtAccountId) {
            accountMap[debtAccountId].balance += amount;
          }
          
        } else if (txn.debt_type === 'receiving') {
          // Money enters account, subtract from virtual debt
          if (txn.involved_account_id) {
            accountMap[txn.involved_account_id].balance += amount;
          }
          if (debtAccountId) {
            accountMap[debtAccountId].balance -= amount;
          }
        }
      }
    }

    console.log(`✓ Calculated balances for ${processedCount} transactions\n`);

    // Step 4: Update database with calculated balances (one query per account)
    console.log('Step 4: Updating account balances in database...');
    
    for (const [accountId, accountData] of Object.entries(accountMap)) {
      await sql`
        UPDATE accounts 
        SET balance = ${accountData.balance} 
        WHERE id = ${parseInt(accountId)}
      `;
      
      const balanceStr = accountData.balance.toLocaleString('en-IN', { 
        maximumFractionDigits: 2,
        minimumFractionDigits: 2 
      });
      
      console.log(`  ✓ ${accountData.name}: ₹${balanceStr}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ BALANCE RECALCULATION COMPLETE!');
    console.log('='.repeat(60));
    
    // Display summary
    const realAccounts = Object.values(accountMap).filter(acc => !acc.is_virtual);
    const totalBalance = realAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    console.log(`\n📊 Summary:`);
    console.log(`Total Real Accounts Balance: ₹${totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    
    if (debtAccountId) {
      const debtBalance = accountMap[debtAccountId].balance;
      if (debtBalance > 0) {
        console.log(`Net Debt: People owe you ₹${debtBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
      } else if (debtBalance < 0) {
        console.log(`Net Debt: You owe ₹${Math.abs(debtBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
      } else {
        console.log(`Net Debt: All settled (₹0)`);
      }
    }
    
    console.log('\n🎉 All done! Run: npm run dev');

  } catch (error) {
    console.error('\n❌ Balance recalculation failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

require('dotenv').config();
recalculateBalances();