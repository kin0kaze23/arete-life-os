# Phase 0 - Foundation Setup Guide

## Supabase Project Setup

### 1. Create Supabase Account

- Go to https://supabase.com
- Sign up with your email or GitHub account
- Verify your account via email confirmation
- Log in to your dashboard

### 2. Create New Project

- Click "New Project"
- Choose a project name (e.g. "AreteLifeOS")
- Select your preferred region
- Choose free tier (sufficient for development)
- Add a secure password for your database
- Wait for project initialization (takes 1-2 minutes)

### 3. Configure Environment Variables

After the project is created:

- Navigate to Project Settings > API page
- Copy the "Project URL" and "API Keys"
- Update your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project_ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key_from_supabase]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key_from_supabase]
```

### 4. Apply Database Schema

- Navigate to Database > SQL Editor in your Supabase dashboard
- Execute the schema file by copying the SQL from the `sql/` directory
- Or connect locally using the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref [your-project-ref]
supabase db reset
```

### 5. Configure Row Level Security (RLS) Policies

- In the Supabase dashboard, go to Database > Tables
- For each table that requires user-based access:
  - Enable RLS
  - Create appropriate policies (typically: users can only access their own data)
- Example policy for user-specific data:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Allow users to only view their own data
CREATE POLICY "Users can view own data" ON table_name
FOR SELECT USING (auth.uid() = user_id);

-- Allow users to only modify their own data
CREATE POLICY "Users can update own data" ON table_name
FOR UPDATE USING (auth.uid() = user_id);
```

## Vercel Deployment Setup

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Project to Vercel

```bash
vercel link --yes
```

### 4. Set Vercel Environment Variables

Visit your project dashboard on vercel.com or use the CLI:

```bash
vercel env pull
```

Add these environment variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### 5. Deploy

Deploy your project to Vercel using:

```bash
vercel --prod
```

For local deployment, you can also just run:

```bash
npm run deploy
```

## Sync Testing Procedure

### 1. Local Environment Test

```bash
# Start local development:
npm run dev

# Test Supabase sync:
- Open Chrome DevTools console
- Verify no sync errors appear
- Test create/read/update/delete with local Supabase
```

### 2. Production Environment Test

```bash
# Deploy to production:
vercel --prod

# Test iOS sync functionality:
- Connect iOS simulator/device
- Verify sync works seamlessly
- Test with real data to ensure integrity
```

### 3. Data Consistency Test

- Verify that the same data is available in both Supabase and local iOS storage
- Test that deletions are properly synced in both directions
- Ensure offline functionality works correctly

## Troubleshooting Common Issues

### Issue: Connection Refused

**Solution:**

- Verify you have a stable internet connection
- Check if the project URL in your environment is correct
- Confirm firewall isn't blocking the connection

### Issue: Authentication Error

**Solution:**

- Ensure the anon key matches the Supabase project
- Restart your development server after making environment changes
- Clear browser cache or restart the app to refresh auth session

### Issue: Sync Failing

**Solution:**

- Check network connectivity
- Verify the sync service is properly initialized with correct configs
- Use browser dev tools to monitor failed API calls
- Check for schema mismatches between iOS and Supabase

### Issue: Deployment Failure

**Solution:**

- Ensure all required environment variables are set in Vercel dashboard
- Verify Node.js version matches project requirements
- Check the project build logs for errors
- Confirm Supabase project credentials are secure and properly scoped
