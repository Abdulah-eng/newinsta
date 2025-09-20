# Fix 500 Errors Guide

## 🚨 **Issue Identified**
Multiple 500 server errors are occurring when trying to fetch data from various tables (stories, follows, profiles, posts). This is likely caused by:

1. **Missing tables** in the database
2. **Missing columns** in existing tables
3. **RLS policies** that are too restrictive or have syntax errors
4. **Foreign key constraint issues**

## 🔧 **Solution**

### **Step 1: Run the Comprehensive Fix**
Execute this SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of fix_500_errors_comprehensive.sql
```

This script will:
- ✅ Create all missing tables with proper structure
- ✅ Add missing columns to existing tables
- ✅ Create proper indexes for performance
- ✅ Set up very permissive RLS policies (we'll tighten these later)
- ✅ Create the admin delete user function
- ✅ Test basic access to all tables

### **Step 2: Verify the Fix**
After running the script, check the console logs. You should see:
- ✅ No more 500 errors
- ✅ Data loading successfully
- ✅ All features working normally

### **Step 3: Test the Delete User Function**
1. Go to admin panel
2. Try deleting a user
3. Verify it works and persists after page refresh

## 🔍 **What the Script Does**

### **Creates Missing Tables:**
- `profiles` - User profiles
- `posts` - User posts
- `stories` - User stories
- `follows` - Follow relationships
- `likes` - Post likes
- `comments` - Post comments
- `direct_messages` - Private messages
- `reports` - Content reports
- `user_restrictions` - User restrictions
- `audit_logs` - Admin action logs
- `message_reactions` - Message reactions
- `story_views` - Story views
- `story_reactions` - Story reactions

### **Adds Missing Columns:**
- All necessary columns for each table
- Proper data types and constraints
- Foreign key relationships

### **Creates Indexes:**
- Performance indexes on frequently queried columns
- Foreign key indexes for faster joins

### **Sets Up RLS:**
- Very permissive policies initially
- Allows all operations while we debug
- Can be tightened later for security

## 🚀 **Expected Results**

**Before (Broken):**
- ❌ 500 errors on multiple API calls
- ❌ Stories not loading
- ❌ Follows not loading
- ❌ Profiles not loading
- ❌ Posts not loading
- ❌ Delete user not working

**After (Fixed):**
- ✅ All API calls working
- ✅ Stories loading properly
- ✅ Follows working
- ✅ Profiles loading
- ✅ Posts loading
- ✅ Delete user working and persisting

## 🔧 **If Issues Persist**

### **Option 1: Run Diagnostic Script**
```sql
-- Copy and paste the contents of diagnose_database_errors.sql
```

### **Option 2: Run Minimal RLS Fix**
```sql
-- Copy and paste the contents of fix_rls_minimal.sql
```

### **Option 3: Check Missing Tables/Columns**
```sql
-- Copy and paste the contents of check_missing_tables_columns.sql
```

## 📊 **Monitoring**

After the fix, monitor the console for:
- ✅ No 500 errors
- ✅ Successful data loading
- ✅ All features working
- ✅ Delete user functionality working

## 🛡️ **Security Note**

The initial RLS policies are very permissive to fix the 500 errors. Once everything is working, we can tighten the security by:

1. Creating more restrictive RLS policies
2. Adding proper admin checks
3. Implementing user-specific data access controls

But for now, the priority is getting the application working without 500 errors.

## 🎯 **Next Steps**

1. **Run the comprehensive fix script**
2. **Test all functionality**
3. **Verify delete user works**
4. **Monitor for any remaining issues**
5. **Tighten security policies later**

The 500 errors should be completely resolved after running the comprehensive fix! 🎉
