# HomeOwner Portal — Phase 1 Setup Guide

## Step 1: Run the SQL Schema in Supabase
1. Go to https://supabase.com → your project
2. Click **SQL Editor** → **New Query**
3. Paste the entire contents of `SUPABASE_SCHEMA.sql`
4. Click **Run**

## Step 2: Enable Email Auth in Supabase
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Under **Email** settings, you can disable "Confirm email" for faster testing

## Step 3: Install Dependencies
```bash
cd homeowner-portal
npm install
```

## Step 4: Run Locally
```bash
npm run dev
```
Open http://localhost:3000

## Step 5: Deploy to Vercel
1. Push the project to a GitHub repo
2. Go to https://vercel.com → New Project → Import repo
3. Add Environment Variables (same as .env.local):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - RENTCAST_API_KEY
4. Click Deploy

## What's in Phase 1
✅ SQL schema with all tables + RLS policies
✅ Auto profile creation on signup
✅ Login page (dark branded UI)
✅ Signup page (role selection: Homeowner / Agent / Lender)
✅ Email verification callback
✅ Protected dashboard routes (middleware)
✅ Role-based navigation sidebar

## Coming in Phase 2
- Homeowner dashboard with live AVM value
- Equity meter & loan stats
- Add property form
- Messages preview
- Team (agent + lender) display

## Coming in Phase 3
- Agent portal: client list, send market updates
- Add clients by email

## Coming in Phase 4
- Lender portal: equity monitoring, rate alerts
- Broadcast messages

## Notes
- .env.local already has your real credentials — do NOT commit this to GitHub
- Add .env.local to your .gitignore before pushing
