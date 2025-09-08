import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostInteractionsProps {
  likes: number;
  comments: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

const PostInteractions = ({
  likes,
  comments,
  isLiked = false,
  isBookmarked = false,
  onLike,
  onComment,
  onShare,
  onBookmark
}: PostInteractionsProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike?.();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "p-0 h-auto hover:bg-transparent",
              liked ? "text-red-500" : "text-white/60 hover:text-red-400"
            )}
          >
            <Heart 
              className={cn("h-6 w-6", liked && "fill-current")} 
            />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            className="p-0 h-auto text-white/60 hover:text-white hover:bg-transparent"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="p-0 h-auto text-white/60 hover:text-white hover:bg-transparent"
          >
            <Share2 className="h-6 w-6" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={cn(
            "p-0 h-auto hover:bg-transparent",
            bookmarked ? "text-gold" : "text-white/60 hover:text-gold"
          )}
        >
          <Bookmark 
            className={cn("h-6 w-6", bookmarked && "fill-current")} 
          />
        </Button>
      </div>

      {/* Like Count */}
      {likeCount > 0 && (
        <div className="text-white font-medium text-sm">
          {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
        </div>
      )}

      {/* Comment Count */}
      {comments > 0 && (
        <Button
          variant="ghost"
          onClick={onComment}
          className="p-0 h-auto text-white/60 hover:text-white hover:bg-transparent text-sm"
        >
          View {comments > 1 ? `all ${formatCount(comments)} comments` : '1 comment'}
        </Button>
      )}
    </div>
  );
};

export default PostInteractions;