import React, { useState, useRef, useEffect } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, Eye, MessageCircle, MoreHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StoriesEnhancedProps {
  className?: string;
}

const StoriesEnhanced: React.FC<StoriesEnhancedProps> = ({ className }) => {
  const { user } = useAuth();
  const { stories, loading, viewStory, reactToStory, deleteStory } = useStories();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = [];
    }
    acc[story.user_id].push(story);
    return acc;
  }, {} as Record<string, any[]>);

  // Get current story
  const currentStory = selectedStory ? storiesByUser[selectedStory.user_id]?.[currentStoryIndex] : null;

  // Start progress animation
  const startProgress = () => {
    if (!currentStory) return;

    setProgress(0);
    setIsPlaying(true);

    const startTime = Date.now();
    const duration = 5000; // 5 seconds per story

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        nextStory();
      }
    }, 50);
  };

  // Stop progress animation
  const stopProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsPlaying(false);
  };

  // Next story
  const nextStory = () => {
    if (!selectedStory) return;

    const userStories = storiesByUser[selectedStory.user_id];
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      // Move to next user's stories
      const userIds = Object.keys(storiesByUser);
      const currentUserIndex = userIds.indexOf(selectedStory.user_id);
      if (currentUserIndex < userIds.length - 1) {
        const nextUserId = userIds[currentUserIndex + 1];
        setSelectedStory({ user_id: nextUserId });
        setCurrentStoryIndex(0);
      } else {
        // End of all stories
        closeStory();
      }
    }
  };

  // Previous story
  const prevStory = () => {
    if (!selectedStory) return;

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      // Move to previous user's stories
      const userIds = Object.keys(storiesByUser);
      const currentUserIndex = userIds.indexOf(selectedStory.user_id);
      if (currentUserIndex > 0) {
        const prevUserId = userIds[currentUserIndex - 1];
        const prevUserStories = storiesByUser[prevUserId];
        setSelectedStory({ user_id: prevUserId });
        setCurrentStoryIndex(prevUserStories.length - 1);
      }
    }
  };

  // Close story
  const closeStory = () => {
    setSelectedStory(null);
    setCurrentStoryIndex(0);
    setProgress(0);
    stopProgress();
  };

  // Handle story click
  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
    setCurrentStoryIndex(0);
    viewStory(story.id);
    startProgress();
  };

  // Handle reaction
  const handleReaction = (emoji: string) => {
    if (currentStory) {
      reactToStory(currentStory.id, emoji);
    }
  };

  // Handle story deletion
  const handleDeleteStory = async (storyId: string) => {
    await deleteStory(storyId);
    if (currentStory?.id === storyId) {
      nextStory();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedStory) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextStory();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStory();
          break;
        case 'Escape':
          e.preventDefault();
          closeStory();
          break;
      }
    };

    if (selectedStory) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedStory, currentStoryIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgress();
    };
  }, []);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-32", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (Object.keys(storiesByUser).length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">No stories available</p>
        <p className="text-sm text-muted-foreground">Be the first to share a story!</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex space-x-4 overflow-x-auto pb-4", className)}>
        {Object.entries(storiesByUser).map(([userId, userStories]) => {
          const user = userStories[0].user;
          const hasUnviewed = userStories.some(story => !story.has_viewed);
          
          return (
            <div key={userId} className="flex-shrink-0">
              <div
                className="relative cursor-pointer"
                onClick={() => handleStoryClick(userStories[0])}
              >
                <Avatar className={cn(
                  "h-16 w-16 border-2 transition-all hover:scale-105",
                  hasUnviewed ? "border-primary" : "border-muted"
                )}>
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.full_name?.charAt(0) || user.handle?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                {hasUnviewed && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-background"></div>
                )}
                <p className="text-xs text-center mt-1 truncate w-16">
                  {user.full_name || user.handle || 'Unknown'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedStory} onOpenChange={closeStory}>
        <DialogContent className="max-w-md p-0 bg-black border-none">
          {currentStory && (
            <div className="relative">
              {/* Progress bars */}
              <div className="absolute top-4 left-4 right-4 z-10 flex space-x-1">
                {storiesByUser[selectedStory.user_id]?.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div
                      className={cn(
                        "h-full bg-white rounded-full transition-all duration-100",
                        index < currentStoryIndex ? "w-full" : 
                        index === currentStoryIndex ? "w-0" : "w-0"
                      )}
                      style={{
                        width: index === currentStoryIndex ? `${progress}%` : undefined
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentStory.user.avatar_url} />
                    <AvatarFallback>
                      {currentStory.user.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {currentStory.user.full_name || currentStory.user.handle || 'Unknown'}
                    </p>
                    <p className="text-white/70 text-xs">
                      {new Date(currentStory.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentStory.user_id === user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Story</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this story? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStory(currentStory.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={closeStory}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Story Content */}
              <div className="relative aspect-[9/16] bg-black">
                {currentStory.media_type === 'image' ? (
                  <img
                    src={currentStory.media_url}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={currentStory.media_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                  />
                )}

                {/* Caption */}
                {currentStory.caption && (
                  <div className="absolute bottom-20 left-4 right-4">
                    <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg p-3">
                      {currentStory.caption}
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <div className="absolute inset-y-0 left-0 w-1/2" onClick={prevStory} />
                <div className="absolute inset-y-0 right-0 w-1/2" onClick={nextStory} />

                {/* Action Buttons */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleReaction('❤️')}
                    >
                      <Heart className={cn(
                        "h-5 w-5",
                        currentStory.has_reacted ? "fill-red-500 text-red-500" : ""
                      )} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setShowViewers(true)}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {currentStory.view_count} views
                    </Badge>
                    {currentStory.reaction_count > 0 && (
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {currentStory.reaction_count} reactions
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Viewers Modal */}
      <Dialog open={showViewers} onOpenChange={setShowViewers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Story Viewers</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentStory?.viewers.map((viewer) => (
              <div key={viewer.id} className="flex items-center space-x-3 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {viewer.viewer_id.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">User {viewer.viewer_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(viewer.viewed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoriesEnhanced;
