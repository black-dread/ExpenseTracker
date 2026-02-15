# Quick Start Guide

Follow these steps to get your expense tracker running in minutes!

## 🚀 Super Quick Setup (5 minutes)

### 1. Install Node.js
**Don't have Node.js?** Download from https://nodejs.org/ (get the LTS version)

**Check if you have it:**
```bash
node --version
```
Should show v18 or higher.

### 2. Get NeonDB Connection String
1. Go to https://console.neon.tech/
2. Sign up (it's free!)
3. Create a new project
4. Click "Connection String" and copy the full URL
   - It looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 3. Setup Project
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 4. Add Your Database URL
Edit `.env` file and paste your NeonDB connection string:
```
DATABASE_URL=postgresql://your-connection-string-here
```

### 5. Initialize Database
```bash
npm run db:push
```

### 6. Start the App
```bash
npm run dev
```

Open http://localhost:3000 in your browser! 🎉

## 📝 First Steps in the App

### Add Your First Account
1. Click "Accounts" tab
2. Click "Add Account"
3. Enter details (e.g., "ICICI Bank", balance: 10000)
4. Click "Add Account"

### Add Your First Transaction
1. Click "New Transaction"
2. Select "Expense"
3. Fill in:
   - Date: Today
   - Amount: 500
   - Name: "Groceries"
   - Category: Groceries
   - Account: ICICI Bank
   - Payment: UPI
4. Click "Add Transaction"

### View Dashboard
Click "Dashboard" to see your stats and charts!

## 🚀 Deploy to Vercel (5 more minutes)

### Option 1: GitHub + Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com/
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Add Environment Variable:
     - Name: `DATABASE_URL`
     - Value: Your NeonDB connection string
   - Click "Deploy"

3. **Done!** Your app is live at `https://expense-tracker-xxx.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and add DATABASE_URL when asked
```

## ⚡ Tips

- **Desktop Only**: This app is optimized for desktop/laptop use
- **Data Backup**: Your data is safely stored in NeonDB cloud
- **Custom Categories**: Add categories via the categories API
- **Account Types**: Bank, Credit Card, Cash, Investment

## 🆘 Troubleshooting

**"DATABASE_URL is not set"**
- Check your `.env` file exists
- Make sure it has the correct connection string
- Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again

**"Cannot connect to database"**
- Verify your NeonDB connection string is correct
- Check your internet connection
- Make sure you copied the entire connection string (including `?sslmode=require`)

**Page not loading**
- Make sure dev server is running (`npm run dev`)
- Try opening http://localhost:3000 in a new incognito window
- Check terminal for any error messages

## 📚 Learn More

See the full README.md for:
- Detailed feature documentation
- Database schema information
- API documentation
- Migration guide for existing data

---

**Need Help?** Check README.md or review the code comments!
