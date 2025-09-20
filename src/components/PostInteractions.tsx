import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ReportModalEnhanced from "./ReportModalEnhanced";

interface PostInteractionsProps {
  postId: string;
  authorId: string;
  initialLikes: number;
  initialComments: number;
  onComment: () => void;
  onShare: () => void;
  onReport?: () => void;
}

const PostInteractions = ({ 
  postId,
  authorId,
  initialLikes, 
  initialComments, 
  onComment, 
  onShare,
  onReport
}: PostInteractionsProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [loading, setLoading] = useState(false);
  const { user, profile, subscribed } = useAuth();
  const { toast } = useToast();

  // Check if user has liked or bookmarked this post
  useEffect(() => {
    if (!user) return;

    const checkUserInteractions = async () => {
      try {
        // Check if user liked this post
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsLiked(!!likeData);

        // Check if user bookmarked this post
        const { data: bookmarkData } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsBookmarked(!!bookmarkData);
      } catch (error) {
        console.error('Error checking user interactions:', error);
      }
    };

    checkUserInteractions();
  }, [user, postId]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to interact with posts.",
        variant: "destructive",
      });
      return;
    }

    // Allow users to like their own posts, but require subscription for others
    if (user.id !== authorId && !subscribed) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to interact with other users' posts.",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update like.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to interact with posts.",
        variant: "destructive",
      });
      return;
    }

    // Allow users to bookmark their own posts, but require subscription for others
    if (user.id !== authorId && !subscribed) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to interact with other users' posts.",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsBookmarked(false);
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        setIsBookmarked(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            disabled={loading || (user?.id !== authorId && !subscribed)}
            className={cn(
              "p-0 h-auto hover:bg-transparent",
              isLiked ? "text-red-500" : "text-white/60 hover:text-red-400",
              (user?.id !== authorId && !subscribed) && "opacity-50"
            )}
          >
            <Heart 
              className={cn("h-6 w-6", isLiked && "fill-current")} 
            />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            disabled={!subscribed}
            className={cn(
              "p-0 h-auto text-white/60 hover:text-white hover:bg-transparent",
              (user?.id !== authorId && !subscribed) && "opacity-50"
            )}
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
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={loading || (user?.id !== authorId && !subscribed)}
            className={cn(
              "p-0 h-auto hover:bg-transparent",
              isBookmarked ? "text-gold" : "text-white/60 hover:text-gold",
              (user?.id !== authorId && !subscribed) && "opacity-50"
            )}
          >
            <Bookmark 
              className={cn("h-6 w-6", isBookmarked && "fill-current")} 
            />
          </Button>

          {user && user.id !== authorId && (
            <ReportModalEnhanced
              reportedPostId={postId}
              reportedUserId={authorId}
            >
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-white/50 hover:text-red-400"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </ReportModalEnhanced>
          )}
        </div>
      </div>

      {/* Like Count */}
      {likeCount > 0 && (
        <div className="text-white font-medium text-sm">
          {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
        </div>
      )}

      {/* Comment Count */}
      {commentCount > 0 && (
        <Button
          variant="ghost"
          onClick={onComment}
          disabled={!subscribed}
          className={cn(
            "p-0 h-auto text-white/60 hover:text-white hover:bg-transparent text-sm",
            !subscribed && "opacity-50"
          )}
        >
          View {commentCount > 1 ? `all ${formatCount(commentCount)} comments` : '1 comment'}
        </Button>
      )}
    </div>
  );
};

export default PostInteractions;