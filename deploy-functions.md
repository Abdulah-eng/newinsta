# Deploy Supabase Edge Functions for Stripe Integration

## Prerequisites

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref khmytjiytpgpkccwncvj
   ```

## Environment Variables Setup

You need to set the following environment variables in your Supabase project:

1. **Go to Supabase Dashboard** → **Settings** → **Edge Functions**
2. **Add the following secrets**:

   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   SUPABASE_URL=https://khmytjiytpgpkccwncvj.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobXl0aml5dHBncGtjY3duY3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTUxOTMsImV4cCI6MjA3MjU5MTE5M30.Mtat_70w7LW-jHsuVicCsywVxU49kgQ0t15fXPq2Wxs
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Deploy Functions

1. **Deploy all functions**:
   ```bash
   supabase functions deploy
   ```

2. **Or deploy individual functions**:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy check-subscription
   supabase functions deploy customer-portal
   ```

## Verify Deployment

1. **Check deployed functions**:
   ```bash
   supabase functions list
   ```

2. **Test the function**:
   ```bash
   supabase functions serve create-checkout
   ```

## Troubleshooting

### Common Issues:

1. **"Function not found" error**:
   - Functions are not deployed
   - Run `supabase functions deploy`

2. **"STRIPE_SECRET_KEY is not set" error**:
   - Environment variables not set in Supabase
   - Add secrets in Supabase Dashboard → Settings → Edge Functions

3. **Authentication errors**:
   - Check if user is properly authenticated
   - Verify session token is valid

### Manual Testing:

You can test the function manually by calling:
```bash
curl -X POST https://khmytjiytpgpkccwncvj.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Next Steps

After deploying the functions:

1. Test the "Join Echelon TX Now" button
2. Verify Stripe checkout opens in new tab
3. Test subscription flow end-to-end
4. Check subscription status updates

## Production Deployment

For production:

1. Use production Stripe keys (`sk_live_...`)
2. Update success/cancel URLs to your production domain
3. Test thoroughly before going live

