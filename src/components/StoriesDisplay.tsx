import React, { useState, useEffect } from 'react';
import { useStories } from '../contexts/StoriesContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Eye, 
  MoreVertical, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Shield,
  Plus,
  Smile
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';

const StoriesDisplay: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const {
    stories,
    myStories,
    isLoading,
    viewStory,
    addReaction,
    removeReaction,
    deleteStory
  } = useStories();

  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showViewerList, setShowViewerList] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [storyComments, setStoryComments] = useState<any[]>([]);
  const [storyReactions, setStoryReactions] = useState<any[]>([]);
  const [showCommentsList, setShowCommentsList] = useState(false);

  const emojis = ['❤️', '👍', '😂', '😢', '😡', '😍', '🤔', '👏'];

  // Filter stories based on user's age verification and safe mode, and exclude user's own stories
  const filteredStories = stories.filter(story => {
    if (story.is_nsfw && (!profile?.age_verified || profile?.safe_mode_enabled)) {
      return false;
    }
    // Exclude user's own stories from the "other stories" section
    if (story.author_id === user?.id) {
      return false;
    }
    return true;
  });

  // Group stories by author
  const storiesByAuthor = filteredStories.reduce((acc, story) => {
    if (!acc[story.author_id]) {
      acc[story.author_id] = [];
    }
    acc[story.author_id].push(story);
    return acc;
  }, {} as Record<string, any[]>);

  const allStories = Object.values(storiesByAuthor).flat();

  useEffect(() => {
    if (selectedStory && !isPaused) {
      // Start progress timer
      const startTime = Date.now();
      const duration = 5000; // 5 seconds per story

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          handleNextStory();
        }
      }, 100);

      return () => clearInterval(timer);
    }
  }, [selectedStory, currentStoryIndex, isPaused]);

  // Pause story when any interactive element is opened
  useEffect(() => {
    const shouldPause = showEmojiPicker || showViewerList || showCommentsList;
    setIsPaused(shouldPause);
  }, [showEmojiPicker, showViewerList, showCommentsList]);

  // Handle clicking outside to close interactive elements
  const handleOutsideClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if click is outside the interactive elements
    if (!target.closest('.comment-box') && 
        !target.closest('.emoji-picker') && 
        !target.closest('.viewer-list') &&
        !target.closest('.comment-input')) {
      
      // Close all interactive elements
      setShowCommentsList(false);
      setShowEmojiPicker(false);
      setShowViewerList(false);
    }
  };

  // Fetch comments and reactions when story is selected
  useEffect(() => {
    if (selectedStory) {
      console.log('Fetching comments and reactions for story:', selectedStory.id);
      fetchStoryComments(selectedStory.id);
      fetchStoryReactions(selectedStory.id);
    }
  }, [selectedStory]);

  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
    setCurrentStoryIndex(allStories.findIndex(s => s.id === story.id));
    setProgress(0);
    setIsPlaying(true);
    
    // Mark as viewed
    viewStory(story.id);
  };

  const handleNextStory = () => {
    if (currentStoryIndex < allStories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setSelectedStory(allStories[nextIndex]);
      setProgress(0);
      viewStory(allStories[nextIndex].id);
    } else {
      setSelectedStory(null);
      setIsPlaying(false);
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setSelectedStory(allStories[prevIndex]);
      setProgress(0);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedStory) return;

    if (selectedEmoji === emoji) {
      await removeReaction(selectedStory.id, emoji);
      setSelectedEmoji(null);
    } else {
      await addReaction(selectedStory.id, emoji);
      setSelectedEmoji(emoji);
      
      // Send to chat
      await sendStoryToChat('reaction', '', emoji);
    }
  };

  const fetchStoryComments = async (storyId: string) => {
    try {
      // First get the comments
      const { data: comments, error: commentsError } = await supabase
        .from('story_comments')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Then get the profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (comments || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, handle')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile
          };
        })
      );

      console.log('Fetched story comments:', commentsWithProfiles);
      setStoryComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching story comments:', error);
    }
  };

  const fetchStoryReactions = async (storyId: string) => {
    try {
      // First get the reactions
      const { data: reactions, error: reactionsError } = await supabase
        .from('story_reactions')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (reactionsError) throw reactionsError;

      // Then get the profiles for each reaction
      const reactionsWithProfiles = await Promise.all(
        (reactions || []).map(async (reaction) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, handle')
            .eq('id', reaction.user_id)
            .single();

          return {
            ...reaction,
            profiles: profile
          };
        })
      );

      console.log('Fetched story reactions:', reactionsWithProfiles);
      setStoryReactions(reactionsWithProfiles);
    } catch (error) {
      console.error('Error fetching story reactions:', error);
    }
  };

  const handleComment = async () => {
    if (!selectedStory || !commentText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('story_comments')
        .insert({
          story_id: selectedStory.id,
          user_id: user?.id,
          comment: commentText.trim()
        });

      if (error) throw error;

      setCommentText('');
      
      // Send to chat
      await sendStoryToChat('comment', commentText.trim());
      
      // Refresh comments
      await fetchStoryComments(selectedStory.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    await deleteStory(storyId);
    if (selectedStory?.id === storyId) {
      setSelectedStory(null);
    }
  };

  const sendStoryToChat = async (type: 'comment' | 'reaction', content: string, emoji?: string) => {
    if (!selectedStory || !user) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedStory.author_id,
          content: type === 'comment' 
            ? `💬 Commented on your story: "${content}"` 
            : `😊 Reacted ${emoji} to your story`,
          story_reference: selectedStory.id
        });

      if (error) throw error;

      // Show success message
      console.log('Story interaction sent to chat');
    } catch (error) {
      console.error('Error sending story to chat:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stories Bar */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {/* My Stories - Always show */}
        <div className="flex-shrink-0">
          <Card 
            className="w-20 h-20 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              if (myStories.length > 0) {
                // If user has stories, show the latest one
                handleStoryClick(myStories[0]);
              } else {
                // If no stories, navigate to create story
                navigate('/portal/create-story');
              }
            }}
          >
            <CardContent className="p-2 h-full flex flex-col items-center justify-center">
              {myStories.length > 0 ? (
                // Show user's avatar if they have stories
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                // Show plus icon if no stories
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  <Plus className="w-6 h-6" />
                </div>
              )}
              <p className="text-xs text-center mt-1">Your Story</p>
            </CardContent>
          </Card>
        </div>

        {/* Other Stories */}
        {Object.entries(storiesByAuthor).map(([authorId, authorStories]) => {
          const latestStory = authorStories[0];
          const hasUnviewed = authorStories.some(story => !story.has_viewed);
          
          return (
            <div key={authorId} className="flex-shrink-0">
              <Card 
                className={cn(
                  "w-20 h-20 cursor-pointer hover:shadow-md transition-shadow",
                  hasUnviewed && "ring-2 ring-blue-500"
                )}
                onClick={() => handleStoryClick(latestStory)}
              >
                <CardContent className="p-2 h-full flex flex-col items-center justify-center">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={latestStory.author.avatar_url || undefined} />
                    <AvatarFallback>
                      {latestStory.author.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-center mt-1 truncate w-full">
                    {latestStory.author.full_name || 'User'}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-md p-0 h-[80vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Story Viewer</DialogTitle>
            <DialogDescription>View and interact with stories</DialogDescription>
          </DialogHeader>
          {selectedStory && (
            <div className="relative h-full" onClick={handleOutsideClick}>
              {/* Story Header */}
              <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedStory.author.avatar_url || undefined} />
                      <AvatarFallback>
                        {selectedStory.author.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">
                        {selectedStory.author.full_name || 'User'}
                      </p>
                      <p className="text-white/70 text-sm">
                        {formatDistanceToNow(new Date(selectedStory.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedStory.is_nsfw && (
                      <Badge className="bg-red-600">
                        <Shield className="h-3 w-3 mr-1" />
                        NSFW
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <Progress value={progress} className="h-1" />
                </div>
              </div>

              {/* Story Content */}
              <div className="relative h-full flex items-center justify-center bg-black">
                {selectedStory.image_url && (
                  <img
                    src={selectedStory.image_url}
                    alt="Story"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
                {selectedStory.video_url && (
                  <video
                    src={selectedStory.video_url}
                    className="max-h-full max-w-full object-contain"
                    autoPlay
                    loop
                    muted
                  />
                )}
                {selectedStory.content && (
                  <div className="absolute bottom-20 left-4 right-4">
                    <p className="text-white text-lg font-medium bg-black/50 p-4 rounded-lg">
                      {selectedStory.content}
                    </p>
                  </div>
                )}
                
                {/* Pause Overlay */}
                {isPaused && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-black/60 rounded-full p-3">
                      <Pause className="h-8 w-8 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Story Footer */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowViewerList(true);
                          setShowEmojiPicker(false);
                          setShowCommentsList(false);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedStory.view_count}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCommentsList(!showCommentsList);
                          setShowEmojiPicker(false);
                          setShowViewerList(false);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {storyComments.length}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Reaction Picker */}
                  <div className="flex flex-col items-end space-y-2">
                    {/* Emoji Toggle Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowViewerList(false);
                        setShowCommentsList(false);
                      }}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-white/20 emoji-picker">
                        <div className="grid grid-cols-4 gap-1">
                          {emojis.map((emoji) => (
                            <Button
                              key={emoji}
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "text-white hover:bg-white/20 w-8 h-8 p-0",
                                selectedEmoji === emoji && "bg-white/30"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(emoji);
                                setShowEmojiPicker(false);
                              }}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>


                {/* Comments Display */}
                {showCommentsList && (
                  <div className="absolute bottom-16 left-4 right-4 z-20 max-h-64 overflow-y-auto comment-box">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="space-y-3">
                        {/* Comments List */}
                        {console.log('Rendering comments:', storyComments)}
                        {storyComments.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {storyComments.map((comment) => (
                              <div key={comment.id} className="bg-white/5 rounded-lg p-2">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-white font-medium text-xs">
                                    {comment.profiles?.full_name || 'User'}
                                  </span>
                                  <span className="text-white/50 text-xs">
                                    {new Date(comment.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                                <p className="text-white text-sm">{comment.comment}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/50 text-center py-4">
                            No comments yet
                          </p>
                        )}

                        {/* Add Comment Input */}
                        <div className="border-t border-white/20 pt-3 comment-input">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 bg-transparent text-white placeholder-white/60 border border-white/20 rounded px-3 py-2 text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComment();
                              }}
                              disabled={!commentText.trim()}
                              className="bg-gold text-black hover:bg-gold/80"
                            >
                              Send
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="absolute left-0 top-0 bottom-0 w-1/2 flex items-center justify-start">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 ml-4"
                  onClick={handlePreviousStory}
                  disabled={currentStoryIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 mr-4"
                  onClick={handleNextStory}
                  disabled={currentStoryIndex === allStories.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Viewer List Modal */}
      <Dialog open={showViewerList} onOpenChange={setShowViewerList}>
        <DialogContent className="viewer-list">
          <DialogHeader>
            <DialogTitle>Story Viewers</DialogTitle>
            <DialogDescription>People who have viewed this story</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto">
            {selectedStory?.story_views?.map((view: any) => (
              <div key={view.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={view.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {view.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{view.profiles?.full_name || 'User'}</p>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoriesDisplay;
