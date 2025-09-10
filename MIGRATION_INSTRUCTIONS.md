# Database Migration Instructions

## 🚨 **IMPORTANT: Fix the "user_id" column error**

The error you're seeing is because the existing database schema uses `id` as the primary key for profiles (which references `auth.users(id)`), but the Milestone 2 schema was trying to use `user_id` as a separate column.

## 📋 **Step-by-Step Migration**

### 1. **Run the Fixed Schema**
Execute the `milestone2_schema_fixed.sql` file in your Supabase SQL Editor. This version:
- ✅ Works with your existing database structure
- ✅ Adds new columns to existing tables
- ✅ Creates new tables for messaging, stories, reports, etc.
- ✅ Sets up proper RLS policies
- ✅ Creates necessary functions and triggers

### 2. **Verify the Migration**
After running the schema, check that these tables exist:
```sql
-- Check if new tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations', 'messages', 'stories', 'reports', 
  'user_roles', 'audit_logs', 'likes', 'follows', 'bookmarks'
);
```

### 3. **Test the Application**
1. Start your development server: `npm run dev`
2. Try logging in and accessing the portal
3. Test the new features:
   - Direct Messages
   - Stories
   - Admin Panel
   - Reporting

## 🔧 **What the Fixed Schema Does**

### **Enhances Existing Tables**
- Adds new columns to `profiles` table (bio, handle, is_banned, etc.)
- Adds new columns to `posts` table (video_url, location, is_hidden, etc.)

### **Creates New Tables**
- `conversations` & `messages` - Real-time messaging
- `stories` & `story_viewers` - 24-hour stories
- `reports` - Content reporting system
- `user_roles` - Role-based access control
- `audit_logs` - Admin action logging
- `likes`, `follows`, `bookmarks` - Social features

### **Sets Up Security**
- Row Level Security (RLS) policies
- Rate limiting functions
- Audit logging functions
- Storage buckets for media

## 🚀 **After Migration**

Once the migration is complete, all Milestone 2 features will be available:

1. **Real-time Messaging** - Users can send DMs with file attachments
2. **Stories** - 24-hour disappearing content with viewer tracking
3. **Admin Panel** - Comprehensive moderation tools
4. **Reporting System** - Users can report inappropriate content
5. **Enhanced Profiles** - More user information and settings

## 🆘 **If You Still Get Errors**

If you encounter any issues after running the migration:

1. **Check the Supabase logs** for specific error messages
2. **Verify RLS policies** are working correctly
3. **Test with a fresh user account** to ensure everything works
4. **Check that all required environment variables** are set

The fixed schema is designed to work seamlessly with your existing database structure while adding all the new Milestone 2 features.
