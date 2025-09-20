import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

type DirectMessage = Database['public']['Tables']['direct_messages']['Row'];
type MessageReaction = Database['public']['Tables']['message_reactions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  last_message_content: string;
  last_message_created_at: string;
  unread_count: number;
}

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  handle: string | null;
  membership_tier: string | null;
}

interface MessagingContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: DirectMessage[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  users: User[];
  isSearchingUsers: boolean;
  
  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  sendMessage: (recipientId: string, content: string, imageUrl?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  startConversation: (userId: string) => Promise<void>;
  
  // Real-time
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  refreshSubscription: () => void;
  testRealtimeMessage: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: React.ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  
  // Use ref to track current conversation for real-time filtering
  const currentConversationRef = useRef<Conversation | null>(null);
  
  // Update ref when current conversation changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      const { data, error } = await supabase.rpc('get_user_conversations', {
        p_user_id: user.id
      });

      if (error) throw error;

      setConversations(data || []);
      
      // Calculate total unread count
      const totalUnread = data?.reduce((sum, conv) => sum + conv.unread_count, 0) || 0;
      console.log('📊 Conversations loaded:', data?.map(c => ({ user: c.other_user_id, unread: c.unread_count })));
      console.log('📊 Total unread count:', totalUnread);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    }
  }, [user]);

  // Mark entire conversation as read
  const markConversationAsRead = useCallback(async (otherUserId: string) => {
    if (!user) return;

    try {
      console.log('🔍 Marking conversation as read for user:', otherUserId);
      
      // First, let's check how many unread messages there are
      const { data: unreadMessages, error: countError } = await supabase
        .from('direct_messages')
        .select('id, content, is_read')
        .eq('recipient_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);
      
      console.log('📊 Found unread messages:', unreadMessages?.length || 0, unreadMessages);
      
      // Use the database function to mark messages as read
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_user_id: user.id,
        p_other_user_id: otherUserId
      });

      if (error) throw error;

      console.log('✅ Messages marked as read in database');

      // Update local state immediately
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.recipient_id === user.id && msg.sender_id === otherUserId
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        );
        console.log('🔄 Updated messages in local state:', updated.map(m => ({ id: m.id, is_read: m.is_read, content: m.content })));
        return updated;
      });

      // Update conversations list
      console.log('🔄 Reloading conversations...');
      await loadConversations();
      console.log('✅ Conversations reloaded');
      
      // Force a small delay and reload again to ensure database consistency
      setTimeout(async () => {
        console.log('🔄 Force reloading conversations after delay...');
        await loadConversations();
        console.log('✅ Force reload completed');
      }, 500);
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, [user, loadConversations]);

  // Select conversation and load messages
  const selectConversation = useCallback(async (conversation: Conversation) => {
    if (!user) return;

    try {
      console.log('🔍 Selecting conversation for user:', conversation.other_user_id);
      console.log('🔍 Current unread count before:', conversation.unread_count);
      
      setCurrentConversation(conversation);
      setError(null);

      // Load messages for this conversation
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          message_reactions(*)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversation.other_user_id}),and(sender_id.eq.${conversation.other_user_id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark conversation as read
      console.log('🔍 About to mark conversation as read...');
      await markConversationAsRead(conversation.other_user_id);
      console.log('✅ Conversation marked as read');
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, [user, markConversationAsRead]);

  // Send message
  const sendMessage = useCallback(async (recipientId: string, content: string, imageUrl?: string) => {
    if (!user) return;

    try {
      setError(null);

      // Check rate limit (with fallback if RPC fails)
      try {
        const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
          p_user_id: user.id,
          p_action_type: 'messaging',
          p_max_attempts: 50, // 50 messages per hour
          p_window_minutes: 60
        });

        if (rateLimitError) {
          console.warn('Rate limit check failed, proceeding without rate limiting:', rateLimitError);
        } else if (!rateLimitOk) {
          toast.error('Rate limit exceeded. Please wait before sending more messages.');
          return;
        }
      } catch (rateLimitErr) {
        console.warn('Rate limiting not available, proceeding without rate limiting:', rateLimitErr);
        // Continue without rate limiting if it fails
      }

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local messages
      setMessages(prev => [...prev, data]);
      
      // Update conversation list directly without loading state
      setConversations(prev => prev.map(conv => {
        if (conv.other_user_id === recipientId) {
          return {
            ...conv,
            last_message: content,
            last_message_at: data.created_at,
            unread_count: 0 // Reset unread count for sent messages
          };
        }
        return conv;
      }));
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Don't show error toast for better UX
    }
  }, [user, loadConversations]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [user]);


  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        });

      if (error) throw error;

      toast.success('Reaction added');
    } catch (err) {
      console.error('Error adding reaction:', err);
      toast.error('Failed to add reaction');
    }
  }, [user]);

  // Remove reaction from message
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;

      toast.success('Reaction removed');
    } catch (err) {
      console.error('Error removing reaction:', err);
      toast.error('Failed to remove reaction');
    }
  }, [user]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast.success('Message deleted');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
    }
  }, [user]);

  // Block user
  const blockUser = useCallback(async (userId: string) => {
    if (!user) return;

    try {
      // This would typically involve updating a blocked_users table
      // For now, we'll just show a toast
      toast.success('User blocked');
    } catch (err) {
      console.error('Error blocking user:', err);
      toast.error('Failed to block user');
    }
  }, [user]);

  // Unblock user
  const unblockUser = useCallback(async (userId: string) => {
    if (!user) return;

    try {
      // This would typically involve updating a blocked_users table
      // For now, we'll just show a toast
      toast.success('User unblocked');
    } catch (err) {
      console.error('Error unblocking user:', err);
      toast.error('Failed to unblock user');
    }
  }, [user]);

  // Subscribe to real-time messages
  const subscribeToMessages = useCallback(() => {
    if (!user) return;

    console.log('🔍 Setting up real-time subscription for user:', user.id);
    console.log('Current conversation:', currentConversation);
    console.log('Channel name:', 'messaging_context_' + user.id);

    // Clean up existing subscription first
    if (subscription) {
      console.log('Cleaning up existing subscription');
      supabase.removeChannel(subscription);
      setSubscription(null);
    }

    const channel = supabase
      .channel('messaging_context_' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          console.log('🎉 Real-time message received:', payload);
          const newMessage = payload.new as DirectMessage;
          
          // Filter messages for this user
          if (newMessage.sender_id !== user.id && newMessage.recipient_id !== user.id) {
            console.log('⚠️ Message not for this user, ignoring:', {
              sender_id: newMessage.sender_id,
              recipient_id: newMessage.recipient_id,
              user_id: user.id
            });
            return;
          }
          
          console.log('✅ Message is for this user, processing:', {
            id: newMessage.id,
            sender_id: newMessage.sender_id,
            recipient_id: newMessage.recipient_id,
            content: newMessage.content,
            current_conversation: currentConversationRef.current?.other_user_id
          });
          
          // Add to messages if it's for the current conversation
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            
            // Get current conversation from ref
            const currentConv = currentConversationRef.current;
            
            // Only add message if it belongs to the current conversation
            if (currentConv && 
                (newMessage.sender_id === currentConv.other_user_id || 
                 newMessage.recipient_id === currentConv.other_user_id)) {
              console.log('✅ Adding message to current conversation:', newMessage.content);
              return [...prev, newMessage];
            } else {
              console.log('⚠️ Message not added - no current conversation or not for current conversation');
              console.log('Current conversation:', currentConv);
              console.log('Message sender:', newMessage.sender_id);
              console.log('Message recipient:', newMessage.recipient_id);
            }
            
            return prev;
          });
          
          // Update conversations list by updating the specific conversation
          setConversations(prev => prev.map(conv => {
            if (conv.other_user_id === newMessage.sender_id || conv.other_user_id === newMessage.recipient_id) {
              return {
                ...conv,
                last_message: newMessage.content,
                last_message_at: newMessage.created_at,
                unread_count: newMessage.recipient_id === user.id ? conv.unread_count + 1 : conv.unread_count
              };
            }
            return conv;
          }));
          
          // Show notification for new messages
          if (newMessage.recipient_id === user.id) {
            // Get sender name from conversations using functional update
            setConversations(prev => {
              const sender = prev.find(conv => conv.other_user_id === newMessage.sender_id);
              const senderName = sender?.other_user_name || 'Unknown User';
              toast.info(`New message from ${senderName}`);
              return prev; // Don't actually change state, just get the name
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          console.log('Real-time message updated:', payload);
          const updatedMessage = payload.new as DirectMessage;
          
          // Filter messages for this user
          if (updatedMessage.sender_id !== user.id && updatedMessage.recipient_id !== user.id) {
            return;
          }
          
          // Update message in local state
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          console.log('Real-time message deleted:', payload);
          const deletedMessage = payload.old as DirectMessage;
          
          // Filter messages for this user
          if (deletedMessage.sender_id !== user.id && deletedMessage.recipient_id !== user.id) {
            return;
          }
          
          // Remove message from local state
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to direct_messages real-time updates');
          console.log('Subscription channel:', channel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Real-time subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Real-time subscription closed');
        }
      });

    setSubscription(channel);
    console.log('✅ Subscription created and set:', channel);
  }, [user]); // Removed currentConversation to prevent subscription recreation

  // Unsubscribe from real-time messages
  const unsubscribeFromMessages = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [subscription]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Track if auto-refresh has been done for current user
  const autoRefreshDoneRef = useRef<string | null>(null);

  // Force refresh subscription
  const refreshSubscription = useCallback(() => {
    console.log('🔄 Force refreshing subscription...');
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
    setTimeout(() => {
      subscribeToMessages();
    }, 100);
  }, [subscription]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (user) {
      // Initial subscription
      subscribeToMessages();
      
      // Auto-refresh only once per user session
      if (autoRefreshDoneRef.current !== user.id) {
        autoRefreshDoneRef.current = user.id;
        
        const timeoutId = setTimeout(() => {
          console.log('🔄 Auto-refreshing subscription on user login...');
          refreshSubscription();
        }, 1000);

        return () => {
          clearTimeout(timeoutId);
          unsubscribeFromMessages();
        };
      }

      return () => {
        unsubscribeFromMessages();
      };
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [user?.id]); // Only depend on user.id to prevent re-runs

  // Search users for starting new conversations
  const searchUsers = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setUsers([]);
      return;
    }

    try {
      setIsSearchingUsers(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, handle, membership_tier')
        .neq('id', user.id) // Exclude current user
        .or(`full_name.ilike.%${query}%,handle.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      setUsers(data || []);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError(err.message || 'Failed to search users');
      setUsers([]);
    } finally {
      setIsSearchingUsers(false);
    }
  }, [user]);

  // Start a new conversation with a user
  const startConversation = useCallback(async (userId: string) => {
    if (!user) return;

    try {
      setError(null);

      // Check if conversation already exists
      const existingConversation = conversations.find(
        conv => conv.other_user_id === userId
      );

      if (existingConversation) {
        // Select existing conversation
        selectConversation(existingConversation);
        return;
      }

      // Create a new empty conversation by creating a conversation entry
      // We'll create a minimal conversation object and add it to the state
      const newConversation = {
        id: `temp-${Date.now()}`, // Temporary ID
        other_user_id: userId,
        other_user: users.find(u => u.id === userId) || { id: userId, full_name: 'Unknown User', avatar_url: null, handle: null },
        last_message: null,
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);
      
      // Select the new conversation
      selectConversation(newConversation);
      
    } catch (err: any) {
      console.error('Error starting conversation:', err);
      setError(err.message || 'Failed to start conversation');
      // Don't show error toast for better UX
    }
  }, [user, conversations, users, selectConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromMessages();
    };
  }, []);

  // Test function to manually trigger a real-time message
  const testRealtimeMessage = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('🧪 Testing real-time message...');
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: user.id, // Send to self for testing
          content: `Test real-time message - ${new Date().toISOString()}`
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Test message failed:', error);
      } else {
        console.log('✅ Test message sent:', data);
      }
    } catch (err) {
      console.error('❌ Test message error:', err);
    }
  }, [user]);

  const value: MessagingContextType = {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isLoading,
    error,
    users,
    isSearchingUsers,
    loadConversations,
    selectConversation,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    addReaction,
    removeReaction,
    deleteMessage,
    blockUser,
    unblockUser,
    searchUsers,
    startConversation,
    subscribeToMessages,
    unsubscribeFromMessages,
    refreshSubscription,
    testRealtimeMessage
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};