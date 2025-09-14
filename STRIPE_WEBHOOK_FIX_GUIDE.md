# Fix: Stripe Webhook Not Updating Subscription Status Correctly

## Problem
After successful payment (trial or subscription), Stripe customer ID is saved but `subscribed` is not set to `true` and other fields are not updated correctly.

## Root Causes Found

### 1. **Critical Bug in `handleSubscriptionCreated`**
```typescript
// WRONG - This was setting subscribed: false for trial users!
subscribed: !isTrial,  // This means trial users get subscribed: false
```

### 2. **Missing `user_id` in Some Handlers**
- `handleSubscriptionUpdated` and `handleSubscriptionDeleted` were missing `user_id`
- This could cause database constraint issues

### 3. **Inconsistent Subscription Tier Logic**
- TrialSuccess page was setting `subscription_tier: 'trial'`
- Webhook handlers were setting `subscription_tier: 'premium'`
- This inconsistency could cause confusion

## Fixes Applied

### ✅ **Fixed `handleSubscriptionCreated`**
```typescript
// FIXED - Both trial and active subscriptions should be subscribed
subscribed: true, // Both trial and active subscriptions should be subscribed
```

### ✅ **Added Missing `user_id` to All Handlers**
- `handleSubscriptionUpdated` now fetches profile and includes `user_id`
- `handleSubscriptionDeleted` now fetches profile and includes `user_id`

### ✅ **Fixed Subscription Logic**
```typescript
// FIXED - Consistent logic for active/trialing
subscribed: isActive || isTrialing, // Both active and trialing should be subscribed
```

### ✅ **Fixed TrialSuccess Page**
```typescript
// FIXED - Use 'premium' to match webhook handlers
subscription_tier: 'premium', // Use 'premium' to match webhook handlers
```

## Files Modified
- `supabase/functions/stripe-webhook/index.ts` - Fixed all webhook handlers
- `src/pages/TrialSuccess.tsx` - Fixed subscription tier consistency

## Expected Behavior After Fix

### **Trial Users:**
1. Complete trial checkout → `checkout.session.completed` webhook
2. Stripe creates subscription → `customer.subscription.created` webhook
3. **Both webhooks now set `subscribed: true`** ✅
4. User gets portal access immediately

### **Regular Subscribers:**
1. Complete subscription checkout → `checkout.session.completed` webhook
2. Stripe creates subscription → `customer.subscription.created` webhook
3. **Both webhooks now set `subscribed: true`** ✅
4. User gets portal access

### **Subscription Updates:**
1. Subscription status changes → `customer.subscription.updated` webhook
2. **Now includes `user_id` and proper logic** ✅
3. Database updated correctly

## Deployment Steps

### 1. Deploy Updated Webhook Function
```bash
supabase functions deploy stripe-webhook
```

### 2. Test the Fix
1. **Start a new trial** - should set `subscribed: true` immediately
2. **Check subscribers table** - should show correct values
3. **Verify portal access** - user should be redirected to portal

### 3. Verify Webhook Events
Check your Stripe dashboard webhook logs to ensure events are being received and processed correctly.

## Verification Queries

After testing, run these queries to verify the fix:

```sql
-- Check recent subscription records
SELECT 
    email,
    subscribed,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_end,
    updated_at
FROM public.subscribers 
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;

-- Check that trial users are properly marked as subscribed
SELECT 
    email,
    subscribed,
    subscription_tier,
    trial_started_at
FROM public.profiles p
JOIN public.subscribers s ON p.id = s.user_id
WHERE p.trial_started_at IS NOT NULL
AND p.trial_ended_at IS NULL;
```

This fix should resolve the issue where Stripe customer IDs were saved but subscription status wasn't updated correctly.
