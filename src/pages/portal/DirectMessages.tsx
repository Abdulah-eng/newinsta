import React, { useState, useEffect, useRef } from 'react';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Smile, Trash2, Search, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const DirectMessages: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loading,
    messagesLoading,
    startConversation,
    sendMessage,
    markAsRead,
    loadMessages,
    setCurrentConversation,
    deleteConversation,
    uploadMessageMedia,
    // Added for user search
    users,
    isSearchingUsers,
    searchUsers,
  } = useMessaging();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newChatQuery, setNewChatQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (currentConversation) {
      markAsRead(currentConversation.id);
    }
  }, [currentConversation, markAsRead]);

  // Trigger user search when query changes
  useEffect(() => {
    const q = newChatQuery.trim();
    if (q.length === 0) return;
    const id = setTimeout(() => searchUsers(q), 250);
    return () => clearTimeout(id);
  }, [newChatQuery, searchUsers]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !user) return;

    try {
      setSending(true);
      
      let mediaUrl: string | null = null;
      if (selectedFile) {
        mediaUrl = await uploadMessageMedia(selectedFile, currentConversation.id);
        if (!mediaUrl) {
          toast({
            title: "Error",
            description: "Failed to upload file",
            variant: "destructive",
          });
          return;
        }
      }

      const messageType = selectedFile ? 
        (selectedFile.type.startsWith('image/') ? 'image' : 
         selectedFile.type.startsWith('video/') ? 'video' : 'file') : 'text';

      await sendMessage(currentConversation.id, newMessage.trim(), messageType, mediaUrl);
      
      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: any) => {
    setCurrentConversation(conversation);
    loadMessages(conversation.id);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.other_user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Direct Messages</h1>
            <p className="text-muted-foreground">Connect with other members privately</p>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {unreadCount} unread
              </Badge>
            )}
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members by name or handle..."
                      value={newChatQuery}
                      onChange={(e) => setNewChatQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-72 overflow-auto border rounded-md">
                    {isSearchingUsers ? (
                      <div className="p-4 text-sm text-muted-foreground">Searching...</div>
                    ) : users.length === 0 && newChatQuery.trim().length > 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No members found</div>
                    ) : (
                      users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback>{u.full_name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{u.full_name || u.handle || 'Unknown'}</div>
                              {u.handle && <div className="text-xs text-muted-foreground">@{u.handle}</div>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={async () => {
                              await startConversation(u.id);
                              setShowNewChat(false);
                            }}
                          >
                            Start
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 p-0 h-auto focus-visible:ring-0"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No conversations found</p>
                  <p className="text-sm">Start a conversation with another member!</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 border-b relative group ${
                      currentConversation?.id === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.other_user.avatar_url} />
                        <AvatarFallback>
                          {conversation.other_user.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conversation.other_user.full_name || conversation.other_user.handle || 'Unknown'}
                          </p>
                          <div className="flex items-center space-x-2">
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this conversation? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteConversation(conversation.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2 flex flex-col">
          {currentConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={currentConversation.other_user.avatar_url} />
                      <AvatarFallback>
                        {currentConversation.other_user.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {currentConversation.other_user.full_name || currentConversation.other_user.handle || 'Unknown'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {currentConversation.other_user.messaging_enabled ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages List */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="text-center text-muted-foreground py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.media_url && (
                            <div className="mb-2">
                              {message.message_type === 'image' ? (
                                <img
                                  src={message.media_url}
                                  alt="Message attachment"
                                  className="max-w-full h-auto rounded"
                                />
                              ) : message.message_type === 'video' ? (
                                <video
                                  src={message.media_url}
                                  controls
                                  className="max-w-full h-auto rounded"
                                />
                              ) : (
                                <a
                                  href={message.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  📎 File attachment
                                </a>
                              )}
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${
                              message.sender_id === user?.id
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                            {message.sender_id === user?.id && message.is_read && (
                              <span className="text-xs text-primary-foreground/70">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                      <span className="text-sm">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="icon" asChild>
                        <span>
                          <Paperclip className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sending || (!newMessage.trim() && !selectedFile)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the list to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DirectMessages;