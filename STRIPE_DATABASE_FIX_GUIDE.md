# Stripe Database Integration Fix

## Problem
The Stripe customer and subscription IDs are not being saved to the database because:
1. Missing `stripe_subscription_id` column in `subscribers` table
2. Missing `stripe_customer_id` and `stripe_subscription_id` columns in `profiles` table
3. Webhook functions not properly updating these fields

## Solution

### Step 1: Run Database Migration
Execute the migration script to add missing columns:

```sql
-- Run this in your Supabase SQL Editor
\i fix_stripe_columns_migration.sql
```

Or manually run these commands:

```sql
-- Add missing stripe_subscription_id column to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add missing Stripe columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for efficient Stripe lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_subscription 
ON public.subscribers (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON public.profiles (stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription 
ON public.profiles (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;
```

### Step 2: Deploy Updated Functions
The following functions have been updated to properly save Stripe IDs:

1. **stripe-webhook** - Now saves both customer and subscription IDs
2. **check-subscription** - Now includes subscription ID in updates

Deploy these functions:
```bash
supabase functions deploy stripe-webhook
supabase functions deploy check-subscription
```

### Step 3: Test the Fix
1. Create a new trial subscription
2. Check that both `stripe_customer_id` and `stripe_subscription_id` are saved in:
   - `public.subscribers` table
   - `public.profiles` table

### Step 4: Verify Database Schema
Run this query to verify all columns exist:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('subscribers', 'profiles') 
    AND column_name LIKE '%stripe%'
ORDER BY table_name, column_name;
```

Expected result:
- `subscribers.stripe_customer_id` (TEXT)
- `subscribers.stripe_subscription_id` (TEXT)
- `profiles.stripe_customer_id` (TEXT)
- `profiles.stripe_subscription_id` (TEXT)

## What This Fixes

✅ **Stripe Customer IDs** - Now saved to both tables  
✅ **Stripe Subscription IDs** - Now saved to both tables  
✅ **Webhook Updates** - All webhook events now update both tables  
✅ **Database Consistency** - Both tables stay in sync  
✅ **Subscription Renewals** - Automatic billing will work correctly  

## Files Modified

1. `fix_stripe_columns_migration.sql` - Database migration
2. `supabase/functions/stripe-webhook/index.ts` - Updated webhook handlers
3. `supabase/functions/check-subscription/index.ts` - Updated subscription checker

After applying this fix, all new subscriptions will properly save Stripe IDs to the database, and the automatic monthly billing will work correctly.
