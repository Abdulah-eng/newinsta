import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Heart, Share2, AlertTriangle, RefreshCw, MapPin, Settings } from "lucide-react";
import CreatePost from "./CreatePost";
import CommentSection from "@/components/CommentSection";
import NSFWBlurOverlay from "@/components/NSFWBlurOverlay";
import PostInteractions from "@/components/PostInteractions";
import { mockPosts, type MockPost } from "@/lib/mockData";

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  is_nsfw: boolean;
  location?: string;
  likes: number;
  comments: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    membership_tier?: string;
  };
}

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNsfw, setShowNsfw] = useState(false);
  const [safeModeEnabled, setSafeModeEnabled] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const { user, subscribed, profile } = useAuth();
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      // Use mock data for demonstration
      const mockPostsData = mockPosts.map(post => ({
        ...post,
        profiles: {
          full_name: post.profiles.full_name,
          avatar_url: post.profiles.avatar_url,
          membership_tier: post.profiles.membership_tier
        }
      }));
      
      setPosts(mockPostsData);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Set user preferences from profile
    if (profile) {
      setAgeVerified(profile.age_verified || false);
      setSafeModeEnabled(profile.safe_mode_enabled !== false); // Default to true
    }
  }, [profile]);

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

  const getMembershipBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'elite': return 'bg-gold text-black';
      case 'premium': return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
      case 'basic': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredPosts = posts.filter(post => showNsfw || !post.is_nsfw);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl font-serif">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Section */}
      <CreatePost onPostCreated={fetchPosts} />

      {/* Feed Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-gold">Community Feed</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-white/60" />
            <span className="text-white/60 text-sm">Safe Mode</span>
            <Switch
              checked={safeModeEnabled}
              onCheckedChange={setSafeModeEnabled}
              className="data-[state=checked]:bg-gold"
            />
          </div>
          <Button
            onClick={fetchPosts}
            variant="outline"
            size="sm"
            className="border-gold/30 text-gold hover:bg-gold hover:text-black"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* User Status Info */}
      <div className="bg-charcoal/50 rounded-lg p-4 border border-gold/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${ageVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-white/80 text-sm">
                {ageVerified ? 'Age Verified' : 'Not Age Verified'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${safeModeEnabled ? 'bg-blue-500' : 'bg-gray-500'}`} />
              <span className="text-white/80 text-sm">
                Safe Mode {safeModeEnabled ? 'On' : 'Off'}
              </span>
            </div>
          </div>
          {!ageVerified && (
            <Button
              onClick={() => setAgeVerified(true)}
              variant="outline"
              size="sm"
              className="border-green-500/30 text-green-500 hover:bg-green-500/20"
            >
              Verify Age (Demo)
            </Button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="p-8 text-center">
              <p className="text-white/60">No posts yet. Be the first to share something!</p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="bg-charcoal border-gold/20 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-gold text-black">
                      {post.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-white font-medium">
                        {post.profiles?.full_name || 'Anonymous'}
                      </p>
                      {post.profiles?.membership_tier && (
                        <Badge className={getMembershipBadgeColor(post.profiles.membership_tier)}>
                          {post.profiles.membership_tier.toUpperCase()}
                        </Badge>
                      )}
                      {post.is_nsfw && (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>NSFW</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-white/60 text-sm">
                      <span>{formatDate(post.created_at)}</span>
                      {post.location && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{post.location}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="px-0">
                {/* Post Image/Video */}
                {post.image_url && (
                  <div className="mb-4">
                    <NSFWBlurOverlay
                      isNSFW={post.is_nsfw}
                      ageVerified={ageVerified}
                      safeModeEnabled={safeModeEnabled}
                      className="aspect-square"
                    >
                      <img 
                        src={post.image_url} 
                        alt="Post content" 
                        className="w-full h-full object-cover"
                      />
                    </NSFWBlurOverlay>
                  </div>
                )}

                <div className="px-6">
                  {/* Post Interactions */}
                  <PostInteractions
                    likes={post.likes}
                    comments={post.comments}
                    onLike={() => console.log('Liked post:', post.id)}
                    onComment={() => console.log('Comment on post:', post.id)}
                    onShare={() => console.log('Shared post:', post.id)}
                    onBookmark={() => console.log('Bookmarked post:', post.id)}
                  />

                  {/* Post Caption */}
                  <div className="mt-3">
                    <p className="text-white">
                      <span className="font-medium mr-2">{post.profiles?.full_name}</span>
                      <span className="whitespace-pre-wrap">{post.content}</span>
                    </p>
                  </div>
                  
                  {/* Comment Section */}
                  {subscribed && (
                    <div className="mt-4">
                      <CommentSection postId={post.id} />
                    </div>
                  )}
                  
                  {!subscribed && (
                    <div className="text-white/50 text-sm text-center py-4 mt-4 border-t border-gold/20">
                      <p>Subscribe to interact with posts and comments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;