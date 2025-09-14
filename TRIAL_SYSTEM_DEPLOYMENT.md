# Trial System Deployment Guide

This guide covers the complete setup of the 3-day free trial system with automatic Stripe charging.

## Overview

The trial system provides:
- 3-day free trial with full functionality
- Credit card required upfront (no charge during trial)
- Automatic charging after 3 days if not cancelled
- Real-time countdown and warnings
- Seamless conversion to paid subscription

## Prerequisites

1. **Supabase CLI installed and configured**
2. **Stripe account with webhook endpoint configured**
3. **Environment variables set in Supabase**

## Step 1: Database Migration

Run the trial system migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of trial_system_migration.sql
```

This migration adds:
- Trial tracking fields to profiles table
- Stripe customer/subscription IDs
- Helper functions for trial management
- Indexes for performance
- Views for active trials

## Step 2: Deploy Edge Functions

Deploy the new Stripe functions:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy create-trial-checkout
supabase functions deploy stripe-webhook
```

## Step 3: Configure Stripe Webhooks

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
3. **Select events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy webhook secret** and add to Supabase environment variables

## Step 4: Environment Variables

Add these to your Supabase project settings:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 5: Test the Trial Flow

### Test Scenario 1: New User Trial
1. Create a new user account
2. Go to membership page
3. Click "Start 3-Day Free Trial"
4. Complete Stripe checkout with test card
5. Verify user is redirected to portal
6. Check trial countdown is displayed

### Test Scenario 2: Trial Expiration
1. Use a test card that will fail after trial
2. Wait for trial to expire (or manually expire in database)
3. Verify user is redirected to membership page
4. Check that `navigate_to_portfolio` is set to false

### Test Scenario 3: Trial to Subscription
1. Start trial with valid test card
2. Wait for trial to convert to subscription
3. Verify user maintains access to portal
4. Check that subscription is active in Stripe

## Step 6: Monitor Trial Conversions

### Database Queries

```sql
-- View active trials
SELECT * FROM active_trials;

-- Check trial eligibility
SELECT is_trial_eligible('user-id-here');

-- Manually expire trials (for testing)
SELECT expire_trials();
```

### Stripe Dashboard
- Monitor subscriptions in Stripe Dashboard
- Check webhook delivery logs
- Review payment attempts and failures

## Step 7: Production Considerations

### Security
- Use production Stripe keys
- Enable webhook signature verification
- Set up proper error monitoring

### Performance
- Monitor database performance with trial queries
- Consider caching for frequently accessed data
- Set up alerts for failed webhook deliveries

### User Experience
- Test trial flow on mobile devices
- Ensure countdown updates in real-time
- Provide clear cancellation instructions

## Troubleshooting

### Common Issues

1. **"Function not found" error**
   - Functions not deployed
   - Run `supabase functions deploy`

2. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify webhook secret matches
   - Check Stripe webhook logs

3. **Trial not expiring**
   - Check `expire_trials()` function
   - Verify trial dates in database
   - Check webhook event processing

4. **Payment not processing**
   - Verify Stripe keys are correct
   - Check customer creation in Stripe
   - Review subscription status

### Debug Commands

```bash
# Check function logs
supabase functions logs create-trial-checkout
supabase functions logs stripe-webhook

# Test webhook locally
supabase functions serve stripe-webhook

# Check database
SELECT * FROM profiles WHERE trial_started_at IS NOT NULL;
```

## Monitoring and Alerts

Set up monitoring for:
- Failed trial conversions
- Webhook delivery failures
- Database performance issues
- Stripe API errors

## Support

For issues with:
- **Stripe integration**: Check Stripe Dashboard and logs
- **Database issues**: Review Supabase logs and queries
- **Function errors**: Check Edge Function logs
- **Webhook problems**: Verify endpoint configuration

## Next Steps

After successful deployment:
1. Monitor trial conversion rates
2. Optimize user experience based on feedback
3. Consider A/B testing trial duration
4. Implement additional trial features as needed
