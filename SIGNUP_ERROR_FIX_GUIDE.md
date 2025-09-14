# Fix: Database Error During User Signup

## Problem
Getting "Database error saving new user" error during signup, likely caused by the new trigger we created.

## Root Cause
The new trigger `create_subscriber_for_new_user_trigger` might have syntax issues or conflicts with existing triggers.

## Step-by-Step Fix

### Step 1: Remove Problematic Triggers
Run this first to remove any problematic triggers:

```sql
-- Run this in your Supabase SQL Editor
\i REMOVE_PROBLEMATIC_TRIGGERS.sql
```

### Step 2: Apply Simple Fix
Run the core fix without complex triggers:

```sql
-- Run this in your Supabase SQL Editor  
\i SIMPLE_SUBSCRIPTION_FIX.sql
```

### Step 3: Test Signup
1. Try creating a new account
2. Check if signup works without errors
3. Verify user is redirected to membership page (not portal)

## What This Fix Does

### ✅ **Removes Complex Triggers:**
- Drops any problematic triggers that might cause signup errors
- Keeps the existing `handle_new_user` trigger (which works fine)

### ✅ **Fixes Core Issues:**
- Removes `DEFAULT 'premium'` from `subscription_tier`
- Cleans up existing incorrect data
- Sets proper defaults

### ✅ **Simpler Approach:**
- Instead of automatic subscriber creation, the `check-subscription` function will create records when needed
- This is safer and less likely to cause signup errors

## Expected Behavior After Fix

### **New User Signup:**
1. User creates account → Profile created (via existing trigger)
2. User logs in → `check-subscription` function creates subscriber record with correct defaults
3. User redirected to `/membership` (not portal)

### **No More Errors:**
- Signup should work without database errors
- No more "Database error saving new user" messages

## Verification

After applying the fix:

1. **Test signup** - should work without errors
2. **Check subscribers table** - new users should have `subscribed = false`
3. **Check navigation** - new users should go to membership page

If you still get errors, the issue might be elsewhere. Let me know what specific error you see.
