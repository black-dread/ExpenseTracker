-- Database Schema for Expense Tracker

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    account_type VARCHAR(50) NOT NULL, -- 'bank', 'credit_card', 'cash', 'investment', 'virtual'
    balance DECIMAL(12, 2) DEFAULT 0,
    is_virtual BOOLEAN DEFAULT FALSE, -- for debt account
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50), -- for grouping (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'expense', 'income', 'transfer', 'debt'
    
    -- For Income transactions
    income_account_id INTEGER REFERENCES accounts(id),
    
    -- For Expense transactions
    expense_account_id INTEGER REFERENCES accounts(id),
    expense_instrument VARCHAR(50), -- 'UPI', 'Cash', 'Credit Card', etc.
    
    -- For Transfer transactions
    outflow_account_id INTEGER REFERENCES accounts(id),
    inflow_account_id INTEGER REFERENCES accounts(id),
    
    -- For Debt transactions
    debt_type VARCHAR(20), -- 'lending', 'borrowing', 'sending', 'receiving'
    involved_account_id INTEGER REFERENCES accounts(id),
    counterparty_name VARCHAR(255), -- person/entity involved in debt
    
    -- Special flags
    is_benki BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_expense_account ON transactions(expense_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_income_account ON transactions(income_account_id);

-- Function to update account balances
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle different transaction types
    IF NEW.transaction_type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.income_account_id;
    
    ELSIF NEW.transaction_type = 'expense' THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.expense_account_id;
    
    ELSIF NEW.transaction_type = 'transfer' THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.outflow_account_id;
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.inflow_account_id;
    
    ELSIF NEW.transaction_type = 'debt' THEN
        -- Get the virtual debt account ID
        DECLARE debt_account_id INTEGER;
        SELECT id INTO debt_account_id FROM accounts WHERE is_virtual = TRUE LIMIT 1;
        
        IF NEW.debt_type = 'lending' THEN
            -- You lend money: money leaves your account, add to virtual debt (people owe you)
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.involved_account_id;
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = debt_account_id;
            
        ELSIF NEW.debt_type = 'borrowing' THEN
            -- You borrow money: subtract from virtual debt account (you owe more = more negative)
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = debt_account_id;
            
        ELSIF NEW.debt_type = 'sending' THEN
            -- You pay off debt: money leaves account, add to virtual debt (you owe less)
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.involved_account_id;
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = debt_account_id;
            
        ELSIF NEW.debt_type = 'receiving' THEN
            -- They pay you back: money enters account, subtract from virtual debt (they owe less)
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.involved_account_id;
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = debt_account_id;
        END IF;
    END IF;
    
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update balances
CREATE TRIGGER trigger_update_balance
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();

-- Insert default virtual debt account
INSERT INTO accounts (name, account_type, balance, is_virtual) 
VALUES ('Debt Account', 'virtual', 0, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Sample categories (you can add more)
INSERT INTO categories (name) VALUES
    ('Salary'), ('Travel'), ('Lifestyle'), ('Petrol'), ('Subscriptions'),
    ('Groceries'), ('Eat Out'), ('Gifts'), ('Rent'), ('Utilities'),
    ('Investment'), ('Interest'), ('Dividend/Profit'), ('Miscellaneous')
ON CONFLICT (name) DO NOTHING;
