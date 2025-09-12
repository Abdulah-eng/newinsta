# Echelon Texas Portal

A premium member portal built with React, Vite, TypeScript, and Supabase. Features subscription management, exclusive content, member community, stories, direct messaging, and comprehensive admin controls.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd echelon-tx-luxe
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Fill in your environment variables (see .env.example)
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:8080

4. **Build for production**
   ```bash
   npm run build
   npm run preview  # Preview production build locally
   ```

## 🔧 Configuration

### Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Get your API keys** from Settings > API

3. **Run the enhanced database schema**:
   ```sql
   -- Copy and run the contents of enhanced_schema.sql in Supabase SQL Editor
   -- This includes all tables for posts, stories, messages, reports, etc.
   ```

4. **Add the conversation function**:
   ```sql
   -- Copy and run the contents of conversation_function.sql in Supabase SQL Editor
   ```

5. **Configure authentication providers** in Supabase Dashboard > Authentication > Providers

6. **Set up storage buckets** (automatically created by schema):
   - `posts` - for post images and videos
   - `avatars` - for user profile pictures
   - `stories` - for story content
   - `messages` - for direct message attachments

### Stripe Setup

1. **Create a Stripe account** at [stripe.com](https://stripe.com)

2. **Get your API keys** from Dashboard > Developers > API keys

3. **Deploy Supabase Edge Functions**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Deploy functions
   supabase functions deploy
   ```

4. **Configure webhook endpoints** for production deployments

5. **Test with Stripe test mode** before going live

### Environment Variables

Required variables (see `.env.example` for details):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `STRIPE_SECRET_KEY` - Stripe secret key (for Edge Functions)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for Edge Functions)

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe subscriptions ($20/month)
- **Deployment**: Vercel (recommended), Netlify, or any React hosting

## ✨ Features

### Core Features
- **User Authentication** - Secure login/signup with email verification
- **Subscription Management** - $20/month Stripe integration with gated access
- **Member Portal** - Exclusive content area for paying members
- **Profile Management** - Avatar upload, bio, handle, age verification

### Social Features
- **Feed System** - Chronological post feed with real-time interactions
- **Post Creation** - Image/video uploads with captions and NSFW toggles
- **Stories** - 24-hour disappearing content with image/video support
- **Direct Messages** - Private messaging between members
- **Likes & Comments** - Real-time engagement system
- **Bookmarks** - Save posts for later viewing

### Content Moderation
- **NSFW Handling** - Per-post toggles with age verification
- **Safe Mode** - User-controlled content filtering
- **Reporting System** - Report posts and users with admin review
- **Admin Dashboard** - Comprehensive moderation tools

### Admin Features
- **User Management** - Ban/unban users, verify age, view statistics
- **Content Moderation** - Review reports, hide posts, manage violations
- **Analytics Dashboard** - Member stats, revenue tracking, activity metrics
- **Role-based Access** - Separate admin login with elevated permissions

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── PostInteractions.tsx    # Enhanced post interactions
│   ├── Stories.tsx             # Stories component
│   ├── ReportModal.tsx         # Content reporting
│   └── ...             # Other custom components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
│   ├── portal/         # Member portal pages
│   │   ├── Feed.tsx            # Enhanced feed with stories
│   │   ├── CreateStory.tsx     # Story creation
│   │   ├── DirectMessages.tsx  # Private messaging
│   │   └── ...
│   └── Admin.tsx       # Comprehensive admin dashboard
└── assets/             # Static assets

supabase/
├── functions/          # Edge functions
│   ├── create-checkout/    # Stripe checkout creation
│   ├── check-subscription/ # Subscription verification
│   └── customer-portal/    # Stripe customer portal
├── config.toml         # Supabase configuration
└── migrations/         # Database migrations
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repo** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Custom Domain Setup

1. **Add your domain** in Vercel dashboard
2. **Configure DNS records** as instructed
3. **Update environment variables** for production
4. **Update Stripe webhook URLs** and redirect URLs

### Production Checklist

- [ ] Set all environment variables
- [ ] Run enhanced database schema in Supabase
- [ ] Deploy Supabase Edge Functions
- [ ] Configure Supabase production settings
- [ ] Set up Stripe webhook endpoints
- [ ] Test payment flows in Stripe test mode
- [ ] Switch to Stripe live mode
- [ ] Configure custom domain
- [ ] Set up monitoring and error tracking

## 🔐 Security Notes

- Never commit `.env` files or secrets to git
- Use Supabase service role key only in server environments
- Configure proper CORS settings in Supabase
- Set up Row Level Security policies for all tables
- Use Stripe webhook validation in production
- Admin access is role-based and separate from member accounts

## 📊 Database Schema

The enhanced schema includes:

- **profiles** - User profiles with handles, age verification, safe mode
- **posts** - Community posts with media, NSFW flags, reporting
- **stories** - 24-hour disappearing content
- **direct_messages** - Private messaging between users
- **likes** - Post likes with real-time counts
- **comments** - Post comments
- **bookmarks** - Saved posts
- **follows** - User following system
- **reports** - Content and user reporting
- **subscribers** - Stripe subscription management

## 🎯 User Flow

1. **Signup** → Email verification
2. **Subscription** → Stripe checkout ($20/month)
3. **Profile Setup** → Avatar, bio, handle, age verification
4. **Community Access** → Feed, stories, messaging, interactions
5. **Content Creation** → Posts, stories, comments
6. **Moderation** → Reporting, admin review, enforcement

## 🆘 Support

For issues or questions:
- Check the troubleshooting section in this README
- Review Supabase and Stripe documentation
- Contact the development team

---

**Note**: This is a React/Vite application with comprehensive social features, subscription gating, and admin controls. All routing is client-side using React Router.