# 🔍 Real-time Messaging Debug Guide

## 🚨 **Current Issue:**
Real-time subscription is being set up but messages are not being received in real-time.

## 🔧 **Enhanced Debugging Added:**

### **1. Enhanced Console Logging**
- ✅ Added detailed subscription setup logs
- ✅ Added message received logs with full details
- ✅ Added subscription status monitoring
- ✅ Added cleanup of existing subscriptions

### **2. Test Component Added**
- ✅ Created `RealtimeTest` component in `/portal/test`
- ✅ Manual subscription control
- ✅ Test message sending
- ✅ Status monitoring

### **3. Database Debug Script**
- ✅ Created `debug_realtime_messaging.sql`
- ✅ Comprehensive real-time publication check
- ✅ Automatic fix for missing publication

## 🧪 **Step-by-Step Debugging:**

### **Step 1: Check Console Logs**
Look for these specific logs in your browser console:

**Expected Success Logs:**
```
Setting up real-time subscription for user: [user-id]
Current conversation: [conversation-object]
Real-time subscription status: SUBSCRIBED
✅ Successfully subscribed to direct_messages real-time updates
```

**If you see errors:**
```
❌ Real-time subscription error
❌ Real-time subscription timed out
⚠️ Real-time subscription closed
```

### **Step 2: Test with Debug Component**
1. Go to `/portal/test` in your app
2. Look for "Real-time Messaging Test" section
3. Click "Subscribe to Real-time"
4. Click "Send Test Message"
5. Check console for real-time events

### **Step 3: Check Database Real-time Status**
Run `debug_realtime_messaging.sql` in Supabase SQL Editor:

**Expected Results:**
- ✅ Real-time Publication Check: ENABLED
- ✅ Table Structure: EXISTS
- ✅ RLS Policies: [count > 0]
- ✅ Final Status: REAL-TIME READY

### **Step 4: Manual Database Test**
If the debug script shows issues, run this in Supabase SQL Editor:

```sql
-- Enable real-time for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Verify it's enabled
SELECT * FROM pg_publication_tables WHERE tablename = 'direct_messages';
```

## 🐛 **Common Issues & Solutions:**

### **Issue 1: No "SUBSCRIBED" Status**
**Symptoms:** Console shows "Setting up real-time subscription" but no "SUBSCRIBED" status
**Solution:** 
- Check Supabase project settings
- Verify real-time is enabled in your project
- Check network connectivity

### **Issue 2: "CHANNEL_ERROR" Status**
**Symptoms:** Console shows "❌ Real-time subscription error"
**Solution:**
- Check Supabase project URL and keys
- Verify WebSocket connectivity
- Check browser console for network errors

### **Issue 3: Messages Not Received**
**Symptoms:** Subscription shows "SUBSCRIBED" but no message logs
**Solution:**
- Verify database real-time publication
- Check RLS policies
- Test with debug component

### **Issue 4: Messages Received But Not Displayed**
**Symptoms:** Console shows "🎉 Real-time message received" but UI doesn't update
**Solution:**
- Check current conversation filtering
- Verify message belongs to current conversation
- Check React state updates

## 🔍 **Advanced Debugging:**

### **Check WebSocket Connection:**
1. Open browser DevTools
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Look for Supabase real-time connection
5. Check for connection errors

### **Check Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Verify project URL and anon key
4. Check if real-time is enabled

### **Check Database Replication:**
1. Go to Database → Replication in Supabase dashboard
2. Verify `direct_messages` table is enabled
3. Check for any replication errors

## 🎯 **Expected Behavior After Fix:**

### **Console Logs Should Show:**
```
Setting up real-time subscription for user: 35acb5e6-278b-49f5-bf15-0d7be6c65bfc
Current conversation: null
Real-time subscription status: SUBSCRIBED
✅ Successfully subscribed to direct_messages real-time updates
🎉 Real-time message received: {new: {id: "...", content: "...", ...}}
Message details: {id: "...", sender_id: "...", recipient_id: "...", content: "...", current_conversation: "..."}
```

### **UI Should Show:**
- Messages appear instantly in current conversation
- Conversation list updates in real-time
- No page refresh needed

## 🚀 **Next Steps:**

1. **Run the debug script** (`debug_realtime_messaging.sql`)
2. **Test with the debug component** (`/portal/test`)
3. **Check console logs** for detailed information
4. **Report specific error messages** if issues persist

The enhanced debugging should help identify exactly where the real-time messaging is failing!
