import React, { useState, useEffect, useCallback } from 'react';
import { useMessaging } from '../../contexts/MessagingContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Send, Search, MoreVertical, Smile, Image, X, Heart, ThumbsUp, Laugh, Angry, Sad } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    error,
    users,
    isSearchingUsers,
    loadConversations,
    selectConversation,
    sendMessage,
    markAsRead,
    addReaction,
    removeReaction,
    deleteMessage,
    searchUsers,
    startConversation
  } = useMessaging();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  // Removed isLoadingUsers state for better UX

  const emojis = ['❤️', '👍', '😂', '😢', '😡', '😍', '🤔', '👏'];

  // Load all users
  const loadAllUsers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, handle, membership_tier')
        .neq('id', user.id) // Exclude current user
        .order('full_name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
    loadAllUsers();
  }, [loadConversations, loadAllUsers]);

  const handleSendMessage = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!messageText.trim() || !selectedUserId) return;

    await sendMessage(selectedUserId, messageText.trim());
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const message = messages.find(m => m.id === messageId);
    if (message) {
      // This would need to be implemented with message_reactions table
      await addReaction(messageId, emoji);
    }
  };

  // Filter users based on search query
  const filteredUsers = allUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.handle && user.handle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle user selection
  const handleUserSelect = async (userId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setSelectedUserId(userId);
    
    // Check if conversation already exists
    const existingConversation = conversations.find(
      conv => conv.other_user_id === userId
    );

    if (existingConversation) {
      // Select existing conversation
      selectConversation(existingConversation);
    } else {
      // Start new conversation
      await startConversation(userId);
    }
  };

  // Get current user info for display
  const currentUser = selectedUserId ? allUsers.find(u => u.id === selectedUserId) : null;

  // Removed loading screen for better UX

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gold font-serif">Messages</h1>
          <p className="text-white/70">Connect with other members</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Users List */}
          <Card className="lg:col-span-1 bg-charcoal border-gold/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gold font-serif">All Members</CardTitle>
                <Badge variant="secondary" className="bg-gold/20 text-gold border-gold/30">{allUsers.length} members</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black border-gold/30 text-white focus:border-gold"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors",
                          selectedUserId === user.id && "bg-blue-50 border-blue-200"
                        )}
                        onClick={(e) => handleUserSelect(user.id, e)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.full_name}
                              </p>
                              {user.membership_tier && (
                                <Badge variant="secondary" className="text-xs">
                                  {user.membership_tier}
                                </Badge>
                              )}
                            </div>
                            {user.handle && (
                              <p className="text-sm text-gray-500 truncate">
                                @{user.handle}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-gray-400">Online</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <div className="text-white/40 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">No members found</h3>
                      <p className="text-white/60">Try adjusting your search terms</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2 bg-charcoal border-gold/20">
            {currentUser ? (
              <>
                <CardHeader className="border-b border-gold/20">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar_url || undefined} />
                      <AvatarFallback>
                        {currentUser.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg text-gold font-serif">{currentUser.full_name}</CardTitle>
                      <CardDescription className="text-white/70">
                        {currentUser.handle ? `@${currentUser.handle}` : 'Online'}
                      </CardDescription>
                    </div>
                    {currentUser.membership_tier && (
                      <Badge variant="secondary" className="ml-auto bg-gold/20 text-gold border-gold/30">
                        {currentUser.membership_tier}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-400px)] p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            message.sender_id === user?.id ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                            message.sender_id === user?.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-900"
                          )}>
                            {message.image_url && (
                              <img
                                src={message.image_url}
                                alt="Message attachment"
                                className="mb-2 rounded-lg max-w-full h-auto"
                              />
                            )}
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs opacity-70">
                                {format(new Date(message.created_at), 'HH:mm')}
                              </p>
                              {message.sender_id === user?.id && (
                                <div className="flex space-x-1">
                                  {message.is_read ? (
                                    <span className="text-xs opacity-70">✓✓</span>
                                  ) : (
                                    <span className="text-xs opacity-70">✓</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={(e) => handleSendMessage(e)} disabled={!messageText.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="mt-2 p-2 bg-white border rounded-lg shadow-lg">
                        <div className="flex space-x-2">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              className="text-lg hover:bg-gray-100 p-1 rounded"
                              onClick={() => {
                                setMessageText(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-[calc(100vh-400px)]">
                <div className="text-center">
                  <div className="text-white/40 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Select a member to start chatting</h3>
                  <p className="text-white/60">Choose a member from the list to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
