# Supabase Setup Guide

## Account Creation

### 1. Register for Account

- Visit [supabase.com](https://supabase.com)
- Create account using email or GitHub
- Complete email verification process
- Sign in to Dashboard

### 2. Create New Project

- Click "New Project" or "New Organization" if needed
- Fill in project details:
  - Project name: `AreteLifeOS`
  - Region: Closest to your users (e.g., "United States" or "Europe")
  - Password: Secure password for database admin access
- Click "Create Project"
- Wait for deployment to complete (1-2 minutes)

## Project Configuration

### Access API Keys

1. Navigate to Project Settings → API
2. Copy these values for your `.env.local` file:
   - Project URL (PUBLIC_SUPABASE_URL)
   - Anonymous Key (PUBLIC_SUPABASE_ANON_KEY)
   - Service Role Key (SERVICE_ROLE_KEY) - **Keep secret, use only on server**

### Save Credentials Securely

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project_ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anonymous_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # Server-side only
```

## SQL Schema Deployment

### Option 1: SQL Editor (GUI Method)

1. In Supabase Dashboard, go to Database → SQL Editor
2. Create new query
3. Paste the schema SQL from your `sql/schema.sql` file
4. Click "Run" to execute

### Option 2: Command Line Interface

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Login to CLI:
   ```bash
   supabase login
   ```
3. Link to your project:
   ```bash
   supabase link --project-ref djxcbodwvbfuedkrvrgw
   ```
4. Reset database with schema:
   ```bash
   supabase db reset
   ```

Example schema file structure:

```sql
-- Users table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Other app-specific tables...
```

## Authentication Configuration

### Enable Auth Providers

1. Navigate to Authentication → Settings
2. Configure required auth providers (Email, Phone, OAuth)
3. Set up email templates if needed
4. Configure redirect URLs for local development:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/login` (or whatever your callback route is)

### Configure RLS (Row Level Security)

For user data protection:

```sql
-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view and update own profile
CREATE POLICY "Individuals can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Individuals can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
```

## API Rate Limits and Security

### Check Quotas

1. Review default limits on Database → Settings
2. Plan accordingly for your expected usage
3. Upgrade if needed

### Security Best Practices

- Use RLS policies for all user-specific data
- Store sensitive data on server only (never client side)
- Use service key only on backend/server functions

## Testing the Setup

### Connect from Frontend

Verify connection with Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Basic Queries

Test basic functionality:

```typescript
// Test read access
const { data, error } = await supabase.from('profiles').select('*').limit(1);

// For authenticated actions, make sure to handle authentication
```

## Troubleshooting

### Connection Errors

If connections fail:

- Verify API keys are correct
- Check CORS settings in Project Settings → API
- Ensure correct region in URL

### Auth Not Working

- Confirm auth providers are enabled
- Verify redirect URLs are properly configured
- Check if RLS policies are correctly set up
