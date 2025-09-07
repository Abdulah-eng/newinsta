# Echelon Texas Portal

A premium member portal built with React, Vite, TypeScript, and Supabase. Features subscription management, exclusive content, and member community.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd echelon-portal
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

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your keys
3. Run the database migration:
   ```sql
   -- Copy and run the contents of schema.sql in Supabase SQL Editor
   ```
4. Configure authentication providers in Supabase Dashboard > Authentication > Providers
5. Set up Row Level Security policies (included in schema.sql)

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from Dashboard > Developers > API keys
3. Create subscription products and prices in Dashboard > Products
4. Configure webhook endpoints for production deployments
5. Test with Stripe test mode before going live

### Environment Variables

Required variables (see `.env.example` for details):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- Stripe keys for payment processing
- Additional configuration for production deployment

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe subscriptions and one-time payments
- **Deployment**: Vercel (recommended), Netlify, or any React hosting

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   └── ...             # Custom components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
│   └── portal/         # Member portal pages
└── assets/             # Static assets

supabase/
├── functions/          # Edge functions
├── config.toml         # Supabase configuration
└── migrations/         # Database migrations
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Custom Domain Setup

1. Add your domain in Vercel dashboard
2. Configure DNS records as instructed
3. Update `VITE_SITE_URL` environment variable
4. Update Stripe webhook URLs and redirect URLs

### Production Checklist

- [ ] Set all environment variables
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

## 📄 License

Private project for Echelon Texas.

## 🆘 Support

For issues or questions:
- Check the troubleshooting section in this README
- Review Supabase and Stripe documentation
- Contact the development team

---

**Note**: This is a React/Vite application, not Next.js. All routing is client-side using React Router.