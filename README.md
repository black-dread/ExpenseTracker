# Expense Tracker

A fullstack expense tracking application built with Next.js and NeonDB (PostgreSQL). Track your income, expenses, transfers, and debts with detailed analytics.

## Features

- 📊 **Dashboard**: Visual overview of your finances with charts and statistics
- 💰 **Transaction Management**: Track 4 types of transactions:
  - **Income**: Salary, dividends, interest, etc.
  - **Expense**: Daily expenses with payment method tracking
  - **Transfer**: Move money between your accounts
  - **Debt**: Manage lending, borrowing, and payments
- 🏦 **Account Management**: Track multiple bank accounts, credit cards, cash, and investments
- 📈 **Analytics**: Category-wise expense breakdown and account balance visualization
- 🎯 **Desktop-First**: Optimized for desktop usage

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **NeonDB Account**
   - Sign up at [neon.tech](https://neon.tech/)
   - Create a new project and database

## Installation Steps

### 1. Install Node.js

If you don't have Node.js installed:

**Windows:**
- Download the installer from [nodejs.org](https://nodejs.org/)
- Run the installer and follow the prompts
- Restart your terminal

**macOS:**
```bash
brew install node
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone/Download the Project

Navigate to the expense-tracker directory in your terminal.

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up NeonDB

1. Go to [console.neon.tech](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)

### 5. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your NeonDB connection string:
```
DATABASE_URL=postgresql://your-connection-string-here
```

### 6. Initialize Database

Push the schema to your database:

```bash
npm run db:push
```

You should see "✅ Schema pushed successfully!"

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Adding Your First Account

1. Click on **Accounts** tab
2. Click **Add Account**
3. Fill in:
   - Account Name (e.g., "ICICI Bank", "HDFC Credit Card")
   - Account Type (Bank, Credit Card, Cash, Investment)
   - Initial Balance
4. Click **Add Account**

### Adding Transactions

Click **New Transaction** and select the type:

#### Expense
- Enter date, amount, and description
- Select category (Groceries, Travel, etc.)
- Choose the account used
- Select payment method (UPI, Cash, Credit Card, etc.)
- Optional: Mark as "Benki" expense

#### Income
- Enter date, amount, and description
- Select category (Salary, Interest, etc.)
- Choose the account receiving money

#### Transfer
- Enter date, amount, and description
- Select "From Account" (money leaves)
- Select "To Account" (money enters)

#### Debt
Choose the debt type:
- **Lending**: You lend money to someone (select which account)
- **Borrowing**: You borrow money (no account needed, tracked virtually)
- **Sending**: You pay off your debt (select which account)
- **Receiving**: Someone pays you back (select which account)

## Deployment to Vercel

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Push to GitHub

Create a new repository on GitHub and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/expense-tracker.git
git push -u origin main
```

### 3. Deploy on Vercel

**Option A: Using Vercel Website**

1. Go to [vercel.com](https://vercel.com/)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: Your NeonDB connection string
6. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
vercel
```

Follow the prompts and add your `DATABASE_URL` when asked for environment variables.

### 4. Access Your App

Once deployed, Vercel will give you a URL like: `https://expense-tracker-yourname.vercel.app`

## Project Structure

```
expense-tracker/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page with tabs
├── components/            # React components
│   ├── Dashboard.tsx      # Dashboard with charts
│   ├── TransactionForm.tsx # Form to add transactions
│   ├── TransactionList.tsx # List all transactions
│   └── AccountsPanel.tsx   # Manage accounts
├── lib/                   # Utilities
│   ├── db.ts             # Database connection
│   └── types.ts          # TypeScript types
├── pages/api/            # API routes
│   ├── accounts/         # Account endpoints
│   ├── categories/       # Category endpoints
│   ├── transactions/     # Transaction endpoints
│   └── dashboard/        # Dashboard stats
├── scripts/              # Utility scripts
│   └── push-schema.js    # Database schema setup
├── schema.sql            # Database schema
├── package.json          # Dependencies
└── README.md            # This file
```

## Database Schema

### Tables

**accounts**
- Stores bank accounts, credit cards, cash, investments
- Tracks current balance
- Includes virtual "Debt Account" for borrowing tracking

**categories**
- Expense/Income categories
- Customizable

**transactions**
- Main transaction log
- Polymorphic design supporting all transaction types
- Automatically updates account balances via triggers

## Customization

### Adding Categories

Use the API or directly in your database:

```sql
INSERT INTO categories (name) VALUES ('New Category');
```

### Adding Accounts

Use the Accounts panel in the UI or API:

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"New Account","account_type":"bank","balance":1000}'
```

## Troubleshooting

### "DATABASE_URL is not set" error
- Make sure you created a `.env` file
- Verify your connection string is correct
- Restart the dev server after changing `.env`

### Schema push fails
- Check your NeonDB connection string
- Ensure your database exists
- Verify network connectivity

### Transactions not showing
- Refresh the page
- Check browser console for errors
- Verify database connection

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database schema
3. Check browser console for errors

## License

MIT License - Feel free to use and modify for your personal finance tracking needs!
