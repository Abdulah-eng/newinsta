import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

// Fallback messaging context that works with existing database structure
// This will use the direct_messages table that already exists

interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string | null;
    avatar_url?: string;
    handle?: string;
  };
}

interface Conversation {
  id: string;
  other_user: {
    id: string;
    full_name: string | null;
    avatar_url?: string;
    handle?: string;
  };
  last_message?: DirectMessage;
  unread_count: number;
}

interface MessagingContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: DirectMessage[];
  unreadCount: number;
  loading: boolean;
  messagesLoading: boolean;
  
  // Actions
  startConversation: (userId: string) => Promise<Conversation | null>;
  sendMessage: (recipientId: string, content: string, imageUrl?: string) => Promise<DirectMessage | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  uploadMessageMedia: (file: File) => Promise<string | null>;
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
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(*),
          recipient:profiles!direct_messages_recipient_id_fkey(*)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      
      data?.forEach((message) => {
        const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        const otherUser = message.sender_id === user.id ? message.recipient : message.sender;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            other_user: otherUser,
            unread_count: 0,
          });
        }
        
        const conversation = conversationMap.get(otherUserId)!;
        
        // Update last message
        if (!conversation.last_message || new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
          conversation.last_message = message;
        }
        
        // Count unread messages
        if (message.recipient_id === user.id && !message.is_read) {
          conversation.unread_count++;
        }
      });

      const conversationList = Array.from(conversationMap.values());
      setConversations(conversationList);
      
      // Calculate total unread count
      const totalUnread = conversationList.reduce((sum, conv) => sum + conv.unread_count, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setMessagesLoading(true);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(*)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', conversationId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, [user]);

  // Start a new conversation
  const startConversation = useCallback(async (userId: string): Promise<Conversation | null> => {
    if (!user || !profile) return null;

    try {
      // Get the other user
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!otherUser) throw new Error('User not found');

      const conversation: Conversation = {
        id: userId,
        other_user: otherUser,
        unread_count: 0,
      };

      setCurrentConversation(conversation);
      setMessages([]);
      
      // Reload conversations to include the new one
      await loadConversations();

      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
      return null;
    }
  }, [user, profile, loadConversations]);

  // Send a message
  const sendMessage = useCallback(async (
    recipientId: string, 
    content: string, 
    imageUrl?: string
  ): Promise<DirectMessage | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          image_url: imageUrl,
        })
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      // Add message to local state
      setMessages(prev => [...prev, data]);

      // Reload conversations to update the order
      await loadConversations();

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return null;
    }
  }, [user, loadConversations]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('recipient_id', user.id)
        .eq('sender_id', conversationId)
        .eq('is_read', false);

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.recipient_id === user.id && msg.sender_id === conversationId
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );

      // Reload conversations to update unread counts
      await loadConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user, loadConversations]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      // Delete all messages in the conversation
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${user.id})`);

      if (error) throw error;

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  }, [user, currentConversation, loadConversations]);

  // Upload message media
  const uploadMessageMedia = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/messages/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('posts') // Use existing posts bucket for now
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: "Error",
        description: "Failed to upload media",
        variant: "destructive",
      });
      return null;
    }
  }, [user]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  const value: MessagingContextType = {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loading,
    messagesLoading,
    startConversation,
    sendMessage,
    markAsRead,
    loadConversations,
    loadMessages,
    setCurrentConversation,
    deleteConversation,
    uploadMessageMedia,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
