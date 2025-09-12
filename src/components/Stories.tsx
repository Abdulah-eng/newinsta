import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NSFWBlurOverlay from "./NSFWBlurOverlay";

interface Story {
  id: string;
  author_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  is_nsfw: boolean;
  expires_at: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    handle: string | null;
  };
  view_count: number;
  has_viewed: boolean;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, subscribed } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Fetch active stories with author profiles and view counts
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_author_id_fkey (
            full_name,
            avatar_url,
            handle
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get view counts and check if current user has viewed each story
      const storiesWithViews = await Promise.all(
        (data || []).map(async (story) => {
          // Get view count
          const { count: viewCount } = await supabase
            .from('story_views')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          // Check if current user has viewed this story
          let hasViewed = false;
          if (user) {
            const { data: viewData } = await supabase
              .from('story_views')
              .select('id')
              .eq('story_id', story.id)
              .eq('viewer_id', user.id)
              .maybeSingle();
            
            hasViewed = !!viewData;
          }

          return {
            ...story,
            view_count: viewCount || 0,
            has_viewed: hasViewed
          };
        })
      );

      setStories(storiesWithViews);
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      toast({
        title: "Error",
        description: "Failed to load stories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  const markStoryAsViewed = async (storyId: string) => {
    if (!user || !subscribed) return;

    try {
      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        });

      if (error) throw error;

      // Update local state
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, has_viewed: true, view_count: story.view_count + 1 }
          : story
      ));
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInHours < 1) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      return '1d';
    }
  };

  if (loading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-20 space-y-2">
            <div className="w-16 h-16 bg-charcoal/50 rounded-full animate-pulse" />
            <div className="w-16 h-3 bg-charcoal/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-gold">Stories</h3>
        <Button
          onClick={() => navigate('/portal/create-story')}
          variant="outline"
          size="sm"
          className="border-gold/30 text-gold hover:bg-gold/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Story
        </Button>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4">
        {/* Create Story Button */}
        {subscribed && (
          <div className="flex-shrink-0 w-20 space-y-2">
            <Button
              onClick={() => navigate('/portal/create-story')}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light text-black hover:from-gold-light hover:to-gold transition-all duration-300"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
            <p className="text-xs text-white/60 text-center">Your Story</p>
          </div>
        )}

        {/* Stories */}
        {stories.length === 0 ? (
          <div className="flex-1 text-center py-8">
            <p className="text-white/60">No stories yet. Be the first to share!</p>
          </div>
        ) : (
          stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 w-20 space-y-2">
              <div className="relative">
                <Button
                  onClick={() => {
                    markStoryAsViewed(story.id);
                    // TODO: Open story viewer modal
                  }}
                  className={`w-16 h-16 rounded-full p-0 border-2 transition-all duration-300 ${
                    story.has_viewed 
                      ? 'border-white/30' 
                      : 'border-gold hover:border-gold-light'
                  }`}
                  variant="ghost"
                >
                  <Avatar className="w-full h-full">
                    <AvatarImage src={story.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-gold/20 text-gold text-lg">
                      {story.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {/* Story Content Indicator */}
                {story.image_url || story.video_url ? (
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                      {story.video_url ? (
                        <Play className="h-3 w-3 text-black" />
                      ) : (
                        <Eye className="h-3 w-3 text-black" />
                      )}
                    </div>
                  </div>
                ) : null}

                {/* NSFW Indicator */}
                {story.is_nsfw && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">18</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-white/80 truncate">
                  {story.profiles?.handle || story.profiles?.full_name || 'Anonymous'}
                </p>
                <p className="text-xs text-white/50">
                  {formatTimeAgo(story.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Stories;
