CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    debt_account_id INTEGER;
BEGIN
    -- Get debt account ID once at the start
    SELECT id INTO debt_account_id FROM accounts WHERE is_virtual = TRUE LIMIT 1;
    
    IF NEW.transaction_type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.income_account_id;
        
    ELSIF NEW.transaction_type = 'expense' THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.expense_account_id;
        
    ELSIF NEW.transaction_type = 'transfer' THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.outflow_account_id;
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.inflow_account_id;
        
    ELSIF NEW.transaction_type = 'debt' THEN
        IF NEW.debt_type = 'lending' THEN
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.involved_account_id;
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = debt_account_id;
            
        ELSIF NEW.debt_type = 'borrowing' THEN
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = debt_account_id;
            
        ELSIF NEW.debt_type = 'paying' THEN
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.involved_account_id;
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = debt_account_id;
            
        ELSIF NEW.debt_type = 'receiving' THEN
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.involved_account_id;
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = debt_account_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_update_balance ON transactions;
CREATE TRIGGER trigger_update_balance
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();


-- Net Worth History table to track daily snapshots
CREATE TABLE IF NOT EXISTS net_worth_history (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    net_worth DECIMAL(12, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster date queries
CREATE INDEX IF NOT EXISTS idx_net_worth_history_date ON net_worth_history(date DESC);