const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');

async function backfillNetWorth() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('📊 Starting Net Worth Back-Calculation...\n');

    // Starting balances as of 17/12/2023
    const accountBalances = {
      'ICICI': 20900.85,
      'HDFC': 0.00,
      'HSBC': 1030.64,
      'Kotak': 0.00,
      'Cash': 1410.00,
      'Metro Card': 0.00,
      'Debt': 2091.15,
      'EPFO': 0.00,
      'HDFC Credit': 0.00,
      'HSBC Credit': -54619.24,
      'ICICI Credit': 0.00,
      'Apay Credit': 0.00,
      'Stocks': 0.00,
      'Stocks (V)': 0.00,
      'Zerodha': 0.80,
      'Mutual Funds(I)': 341001.00,
      'Mutual Funds(V)': 394582.00,
      'Qualcomm Shares': 0.00
    };

    console.log('Starting balances loaded (as of 17/12/2023)');
    console.log(`Total starting net worth: ₹${calculateNetWorth(accountBalances).toLocaleString('en-IN')}\n`);

    // Read investment history Excel files
    console.log('Reading investment data...');
    const mutualFundsPath = path.join(__dirname, '..', 'Mutual_Funds__V_.xlsx');
    const stocksPath = path.join(__dirname, '..', 'Stocks_V_.xlsx');

    const mfWorkbook = XLSX.readFile(mutualFundsPath);
    const mfSheet = mfWorkbook.Sheets[mfWorkbook.SheetNames[0]];
    const mfData = XLSX.utils.sheet_to_json(mfSheet);

    const stocksWorkbook = XLSX.readFile(stocksPath);
    const stocksSheet = stocksWorkbook.Sheets[stocksWorkbook.SheetNames[0]];
    const stocksData = XLSX.utils.sheet_to_json(stocksSheet);

    console.log(`✓ Loaded ${mfData.length} Mutual Funds records`);
    console.log(`✓ Loaded ${stocksData.length} Stocks records\n`);

    // Convert to maps for quick lookup
    const mfMap = {};
    mfData.forEach(row => {
      const date = parseExcelDate(row.Date);
      if (date) {
        mfMap[date] = parseFloat(row.Value) || 0;
      }
    });

    const stocksMap = {};
    stocksData.forEach(row => {
      const date = parseExcelDate(row.Date);
      if (date) {
        stocksMap[date] = parseFloat(row.Value) || 0;
      }
    });

    // Get all transactions from 17/12/2023 onwards
    console.log('Fetching transactions from 17/12/2023...');
    const transactions = await sql`
      SELECT * FROM transactions 
      WHERE date >= '2023-12-17'
      ORDER BY date ASC, id ASC
    `;
    console.log(`✓ Found ${transactions.length} transactions\n`);

    // Group transactions by date
    const transactionsByDate = {};
    transactions.forEach(txn => {
      const date = txn.date.toISOString().split('T')[0];
      if (!transactionsByDate[date]) {
        transactionsByDate[date] = [];
      }
      transactionsByDate[date].push(txn);
    });

    // Get account ID to name mapping
    console.log('Fetching account information...');
    const accounts = await sql`SELECT * FROM accounts`;
    const accountIdToName = {};
    const accountNameToInfo = {};
    
    accounts.forEach(acc => {
      accountIdToName[acc.id] = acc.name;
      accountNameToInfo[acc.name] = {
        id: acc.id,
        includeInNetWorth: acc.include_in_net_worth !== false
      };
    });
    console.log(`✓ Loaded ${accounts.length} accounts\n`);

    // Get all unique dates where we have data
    const allDates = new Set([
      ...Object.keys(transactionsByDate),
      ...Object.keys(mfMap),
      ...Object.keys(stocksMap)
    ]);

    // Convert to sorted array
    const sortedDates = Array.from(allDates).sort();
    
    // Filter to only dates from 17/12/2023 onwards
    const startDate = '2023-12-17';
    const datesToProcess = sortedDates.filter(date => date >= startDate);

    console.log(`Found ${datesToProcess.length} dates with data from ${datesToProcess[0]} to ${datesToProcess[datesToProcess.length - 1]}\n`);

    // Process each date
    console.log('Processing dates and calculating net worth...\n');
    let processedCount = 0;
    const netWorthRecords = [];

    for (const date of datesToProcess) {
      let hasData = false;

      // Apply transactions for this date
      if (transactionsByDate[date]) {
        hasData = true;
        for (const txn of transactionsByDate[date]) {
          applyTransaction(txn, accountBalances, accountIdToName);
        }
      }

      // Update Mutual Funds(V) if data exists for this date
      
      if (mfMap[date]) {
        hasData = true;
        accountBalances['Mutual Funds(V)'] = mfMap[date];
      }

      // Update Stocks(V) if data exists for this date
      if (stocksMap[date]) {
        hasData = true;
        accountBalances['Stocks (V)'] = stocksMap[date];
      }

      // Only record if we had data for this date
      if (hasData) {
        const netWorth = calculateNetWorth(accountBalances, accountNameToInfo);
        netWorthRecords.push({ date, netWorth });
        processedCount++;

        if (processedCount % 50 === 0) {
          console.log(`  Processed ${processedCount}/${datesToProcess.length} dates...`);
        }
      }
    }

    console.log(`✓ Calculated net worth for ${processedCount} dates\n`);

    // Clear existing records and insert new ones
    console.log('Clearing existing net worth history...');
    await sql`DELETE FROM net_worth_history WHERE date >= '2023-12-17'`;
    console.log('✓ Cleared\n');

    // Insert into database
    console.log('Inserting net worth history into database...');
    let insertedCount = 0;
    
    for (const record of netWorthRecords) {
      await sql`
        INSERT INTO net_worth_history (date, net_worth)
        VALUES (${record.date}, ${record.netWorth})
        ON CONFLICT (date) 
        DO UPDATE SET net_worth = ${record.netWorth}, recorded_at = CURRENT_TIMESTAMP
      `;
      insertedCount++;
      
      if (insertedCount % 50 === 0) {
        console.log(`  Inserted ${insertedCount}/${netWorthRecords.length} records...`);
      }
    }

    console.log(`✓ Inserted ${insertedCount} net worth records\n`);

    // Show summary
    console.log('='.repeat(60));
    console.log('✅ NET WORTH BACK-CALCULATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Date Range: ${netWorthRecords[0].date} to ${netWorthRecords[netWorthRecords.length - 1].date}`);
    console.log(`Total Records: ${insertedCount}`);
    console.log(`Starting Net Worth: ₹${netWorthRecords[0].netWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    console.log(`Ending Net Worth: ₹${netWorthRecords[netWorthRecords.length - 1].netWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    console.log(`Net Change: ₹${(netWorthRecords[netWorthRecords.length - 1].netWorth - netWorthRecords[0].netWorth).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

function applyTransaction(txn, accountBalances, accountIdToName) {
  const amount = parseFloat(txn.amount);

  if (txn.transaction_type === 'income' && txn.income_account_id) {
    const accountName = accountIdToName[txn.income_account_id];
    if (accountName && accountBalances[accountName] !== undefined) {
      accountBalances[accountName] += amount;
    }
  } else if (txn.transaction_type === 'expense' && txn.expense_account_id) {
    const accountName = accountIdToName[txn.expense_account_id];
    if (accountName && accountBalances[accountName] !== undefined) {
      accountBalances[accountName] -= amount;
    }
  } else if (txn.transaction_type === 'transfer') {
    if (txn.outflow_account_id) {
      const accountName = accountIdToName[txn.outflow_account_id];
      if (accountName && accountBalances[accountName] !== undefined) {
        accountBalances[accountName] -= amount;
      }
    }
    if (txn.inflow_account_id) {
      const accountName = accountIdToName[txn.inflow_account_id];
      if (accountName && accountBalances[accountName] !== undefined) {
        accountBalances[accountName] += amount;
      }
    }
  } else if (txn.transaction_type === 'debt') {
    const debtAccountName = 'Debt';
    
    if (txn.debt_type === 'lending') {
      if (txn.involved_account_id) {
        const accountName = accountIdToName[txn.involved_account_id];
        if (accountName && accountBalances[accountName] !== undefined) {
          accountBalances[accountName] -= amount;
        }
      }
      if (accountBalances[debtAccountName] !== undefined) {
        accountBalances[debtAccountName] += amount;
      }
    } else if (txn.debt_type === 'borrowing') {
      if (accountBalances[debtAccountName] !== undefined) {
        accountBalances[debtAccountName] -= amount;
      }
    } else if (txn.debt_type === 'sending') {
      if (txn.involved_account_id) {
        const accountName = accountIdToName[txn.involved_account_id];
        if (accountName && accountBalances[accountName] !== undefined) {
          accountBalances[accountName] -= amount;
        }
      }
      if (accountBalances[debtAccountName] !== undefined) {
        accountBalances[debtAccountName] += amount;
      }
    } else if (txn.debt_type === 'receiving') {
      if (txn.involved_account_id) {
        const accountName = accountIdToName[txn.involved_account_id];
        if (accountName && accountBalances[accountName] !== undefined) {
          accountBalances[accountName] += amount;
        }
      }
      if (accountBalances[debtAccountName] !== undefined) {
        accountBalances[debtAccountName] -= amount;
      }
    }
  }
}

function calculateNetWorth(accountBalances, accountNameToInfo = null) {
  let netWorth = 0;
  
  for (const [accountName, balance] of Object.entries(accountBalances)) {
    if (accountNameToInfo) {
      const info = accountNameToInfo[accountName];
      if (!info || !info.includeInNetWorth) {
        continue;
      }
    } else {
      if (accountName === 'Mutual Funds(I)' || accountName === 'Stocks') {
        continue;
      }
    }
    
    netWorth += balance;
  }
  
  return netWorth;
}

function parseExcelDate(excelDate) {
  try {
    if (typeof excelDate === 'number') {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    } else if (excelDate instanceof Date) {
      return excelDate.toISOString().split('T')[0];
    } else if (typeof excelDate === 'string') {
      const date = new Date(excelDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

require('dotenv').config();
backfillNetWorth();