# 🚀 Milestone 2 Deployment Guide

## Overview
This guide will help you deploy the complete Milestone 2 features for your Echelon Texas social media platform, including messaging, stories, admin panel, reporting, and security features.

## 📋 Prerequisites
- Supabase project with existing database
- Stripe account with test/live keys
- Vercel account for deployment
- GitHub repository access

## 🗄️ Database Setup

### Step 1: Apply the Complete Schema
Run the `MILESTONE2_COMPLETE_SCHEMA.sql` script in your Supabase SQL Editor:

```sql
-- This will create all necessary tables, policies, functions, and indexes
-- for messaging, stories, admin panel, reporting, and security features
```

### Step 2: Verify Database Structure
After running the schema, verify these tables exist:
- ✅ `direct_messages` - Real-time messaging
- ✅ `stories` - 24-hour stories with auto-expire
- ✅ `reports` - Content reporting system
- ✅ `user_roles` - Role-based access control
- ✅ `admin_actions` - Audit logging
- ✅ `rate_limits` - Rate limiting
- ✅ `user_restrictions` - User restrictions

## 🔧 Environment Variables

### Supabase Configuration
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Stripe Configuration
```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_STRIPE_PRICE_ID=your_stripe_price_id
```

### Security Headers (Vercel)
Create `vercel.json` in your project root:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;"
        }
      ]
    }
  ]
}
```

## 🚀 Deployment Steps

### Step 1: Update Supabase Edge Functions
Deploy the updated Edge Functions:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy
```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# Go to Project Settings > Environment Variables
```

### Step 3: Configure Supabase Storage
1. Go to Supabase Dashboard > Storage
2. Create buckets:
   - `stories` (public)
   - `messages` (public)
3. Set up RLS policies for each bucket

### Step 4: Set Up Stripe Webhooks
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🧪 Testing Checklist

### Messaging Features
- [ ] Send and receive direct messages
- [ ] Real-time message updates
- [ ] Message reactions
- [ ] Unread message counts
- [ ] Message persistence

### Stories Features
- [ ] Create stories with images/videos
- [ ] 24-hour auto-expiration
- [ ] Story viewer tracking
- [ ] Story reactions
- [ ] NSFW content handling

### Admin Panel
- [ ] User management (ban/unban)
- [ ] Content moderation
- [ ] Report resolution
- [ ] Audit logging
- [ ] Stripe integration

### Reporting System
- [ ] Report posts/comments/users
- [ ] Admin resolution workflow
- [ ] Rate limiting on reports

### Security Features
- [ ] Rate limiting on actions
- [ ] CSP headers
- [ ] HSTS headers
- [ ] Authentication checks

## 🔒 Security Considerations

### Rate Limiting
The system includes rate limiting for:
- Message sending (50/hour)
- Story creation (10/hour)
- Report submission (10/hour)
- Post creation (20/hour)

### Content Moderation
- NSFW content blurring
- Age verification system
- Safe mode toggle
- Admin content hiding

### Data Protection
- Row Level Security (RLS) on all tables
- Encrypted data transmission
- Secure file uploads
- Audit logging for all actions

## 📊 Monitoring & Analytics

### Supabase Dashboard
- Monitor database performance
- View real-time connections
- Check storage usage
- Review audit logs

### Vercel Analytics
- Page performance metrics
- User engagement
- Error tracking
- Function execution times

## 🚨 Troubleshooting

### Common Issues

1. **"Multiple GoTrueClient instances" warning**
   - Ensure only one Supabase client instance
   - Check imports in all files

2. **Real-time not working**
   - Verify Supabase Realtime is enabled
   - Check RLS policies
   - Confirm subscription setup

3. **File uploads failing**
   - Check storage bucket permissions
   - Verify file size limits
   - Confirm CORS settings

4. **Stripe integration issues**
   - Verify webhook endpoints
   - Check API keys
   - Confirm price IDs

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG=true
```

## 📈 Performance Optimization

### Database
- Indexes on frequently queried columns
- Connection pooling
- Query optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

### CDN
- Static asset caching
- Global distribution
- Compression

## 🔄 Maintenance

### Regular Tasks
- Monitor error logs
- Update dependencies
- Review security patches
- Clean up expired data

### Database Maintenance
- Run `cleanup_expired_stories()` function
- Monitor storage usage
- Optimize queries

## 📞 Support

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [Stripe Community](https://discord.gg/stripe)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## ✅ Success Criteria

After deployment, verify:
- [ ] All Milestone 2 features working
- [ ] Real-time messaging functional
- [ ] Stories system operational
- [ ] Admin panel accessible
- [ ] Reporting system active
- [ ] Security measures in place
- [ ] Performance metrics acceptable
- [ ] No critical errors in logs

## 🎉 Next Steps

Once Milestone 2 is deployed:
1. Monitor user engagement
2. Gather feedback
3. Plan Milestone 3 features
4. Optimize performance
5. Scale infrastructure as needed

---

**Congratulations!** You now have a fully functional social media platform with advanced features including real-time messaging, stories, comprehensive admin tools, and robust security measures. 🚀
