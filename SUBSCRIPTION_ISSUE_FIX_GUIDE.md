# Fix: Users Marked as Subscribed Immediately After Account Creation

## Problem
Users are being marked as `subscribed: true` in the subscribers table immediately after creating an account, even though they haven't paid for a subscription or started a trial.

## Root Cause Analysis
The issue occurs because:

1. **New users get subscriber records created** when `checkSubscription()` is called during signup/login
2. **The `check-subscription` function** creates subscriber records for all users, even those without Stripe subscriptions
3. **Some users might be incorrectly marked as subscribed** due to data inconsistencies

## Solution

### Step 1: Run Database Cleanup
Execute the cleanup script to fix existing data:

```sql
-- Run this in your Supabase SQL Editor
\i fix_subscription_issue.sql
```

Or manually run these commands:

```sql
-- Update incorrectly marked subscribers
UPDATE public.subscribers 
SET 
    subscribed = false,
    subscription_tier = null,
    subscription_end = null,
    updated_at = now()
WHERE 
    stripe_customer_id IS NULL 
    OR stripe_subscription_id IS NULL
    OR (stripe_customer_id IS NOT NULL AND subscription_end < now());

-- Update profiles to ensure consistency
UPDATE public.profiles 
SET 
    navigate_to_portfolio = false,
    updated_at = now()
WHERE 
    id NOT IN (
        SELECT user_id 
        FROM public.subscribers 
        WHERE subscribed = true 
        AND stripe_customer_id IS NOT NULL 
        AND stripe_subscription_id IS NOT NULL
        AND subscription_end > now()
    );
```

### Step 2: Deploy Updated Function
The `check-subscription` function has been updated to ensure proper logic:

```bash
supabase functions deploy check-subscription
```

### Step 3: Verify the Fix
Check that new users are not marked as subscribed:

```sql
-- Check recent subscriber records
SELECT 
    email,
    subscribed,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    created_at
FROM public.subscribers 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

## Expected Behavior After Fix

### ✅ Correct Behavior:
- **New users**: `subscribed = false`, no Stripe IDs
- **Trial users**: `subscribed = true`, `subscription_tier = 'trial'`, valid Stripe IDs
- **Paid users**: `subscribed = true`, `subscription_tier = 'premium'`, valid Stripe IDs
- **Expired users**: `subscribed = false`, expired Stripe subscription

### ❌ What Should NOT Happen:
- New users marked as subscribed without payment
- Users with `subscribed = true` but no Stripe customer ID
- Users with `subscribed = true` but no Stripe subscription ID

## Files Modified

1. `fix_subscription_issue.sql` - Database cleanup script
2. `supabase/functions/check-subscription/index.ts` - Updated function logic

## Testing

1. **Create a new test account**
2. **Check the subscribers table** - should show `subscribed = false`
3. **Start a trial** - should show `subscribed = true` with trial tier
4. **Complete payment** - should show `subscribed = true` with premium tier

After applying this fix, new users will only be marked as subscribed when they actually have a valid Stripe subscription or trial.
