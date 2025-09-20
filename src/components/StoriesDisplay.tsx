import React, { useState, useEffect } from 'react';
import { useStories } from '../contexts/StoriesContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
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
  Plus
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

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
    if (selectedStory) {
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
  }, [selectedStory, currentStoryIndex]);

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
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    await deleteStory(storyId);
    if (selectedStory?.id === storyId) {
      setSelectedStory(null);
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
          </DialogHeader>
          {selectedStory && (
            <div className="relative h-full">
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
              <div className="h-full flex items-center justify-center bg-black">
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
                        onClick={() => setShowViewerList(true)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedStory.view_count}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {selectedStory.reaction_count}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Reaction Picker */}
                  <div className="flex space-x-1">
                    {emojis.map((emoji) => (
                      <Button
                        key={emoji}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "text-white hover:bg-white/20",
                          selectedEmoji === emoji && "bg-white/30"
                        )}
                        onClick={() => handleReaction(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Story Viewers</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto">
            {selectedStory?.views?.map((view: any) => (
              <div key={view.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={view.viewer?.avatar_url || undefined} />
                  <AvatarFallback>
                    {view.viewer?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{view.viewer?.full_name || 'User'}</p>
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
