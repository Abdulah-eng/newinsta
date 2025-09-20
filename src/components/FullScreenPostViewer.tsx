import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, Share2, X, ChevronLeft, ChevronRight, MapPin, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFollow } from '../contexts/FollowContext';
import { useNavigate } from 'react-router-dom';
import FollowButton from './FollowButton';
import CommentSection from './CommentSection';
import NSFWBlurOverlay from './NSFWBlurOverlay';
import PostInteractions from './PostInteractions';

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  is_nsfw: boolean;
  location?: string;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    membership_tier?: string;
  };
}

interface FullScreenPostViewerProps {
  posts: Post[];
  currentPostIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const FullScreenPostViewer: React.FC<FullScreenPostViewerProps> = ({
  posts,
  currentPostIndex,
  isOpen,
  onClose,
  onNavigate
}) => {
  const { user } = useAuth();
  const { isFollowing } = useFollow();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(currentPostIndex);
  const [showComments, setShowComments] = useState(false);

  const currentPost = posts[currentIndex];

  useEffect(() => {
    setCurrentIndex(currentPostIndex);
  }, [currentPostIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onNavigate(newIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < posts.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onNavigate(newIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };


  if (!currentPost) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-7xl w-full h-[90vh] p-0 bg-black border-gold/20"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="flex h-full">
          {/* Left Side - Image/Video */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            {currentIndex < posts.length - 1 && (
              <Button
                onClick={handleNext}
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}


            {/* Post Counter */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
              {currentIndex + 1} of {posts.length}
            </div>

            {/* Media Content */}
            <div className="relative w-full h-full flex items-center justify-center">
              {currentPost.image_url && (
                <div className="relative w-full h-full">
                  <img
                    src={currentPost.image_url}
                    alt="Post"
                    className="w-full h-full object-contain"
                  />
                  {currentPost.is_nsfw && (
                    <NSFWBlurOverlay />
                  )}
                </div>
              )}
              {currentPost.video_url && (
                <video
                  src={currentPost.video_url}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Right Side - Post Info */}
          <div className="w-96 bg-charcoal border-l border-gold/20 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gold/20">
              <div className="flex items-center space-x-3">
                <Avatar 
                  className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-gold/50 transition-all"
                  onClick={() => {
                    onClose();
                    navigate(`/portal/user/${currentPost.author_id}`);
                  }}
                >
                  <AvatarImage src={currentPost.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-gold text-black">
                    {currentPost.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/portal/user/${currentPost.author_id}`);
                      }}
                      className="text-white font-medium hover:text-gold transition-colors cursor-pointer"
                    >
                      {currentPost.profiles?.full_name || 'Anonymous'}
                    </button>
                    {currentPost.is_nsfw && (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>NSFW</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-white/60 text-sm">
                    <span>{formatDate(currentPost.created_at)}</span>
                    {currentPost.location && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{currentPost.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {currentPost.author_id !== user?.id && (
                  <FollowButton
                    userId={currentPost.author_id}
                    userName={currentPost.profiles?.full_name || 'Anonymous'}
                    variant="outline"
                    size="sm"
                    showIcon={false}
                  />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Post Content */}
              {currentPost.content && (
                <div className="p-4 border-b border-gold/20">
                  <p className="text-white whitespace-pre-wrap">{currentPost.content}</p>
                </div>
              )}

              {/* Comments */}
              <div className="flex-1">
                <CommentSection postId={currentPost.id} />
              </div>
            </div>

            {/* Footer - Interactions */}
            <div className="p-4 border-t border-gold/20">
              <PostInteractions
                post={currentPost}
                onShare={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Check out this post',
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenPostViewer;
