import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Settings, Grid, Heart, MessageCircle, RefreshCw, Play, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EditProfileModal from "@/components/EditProfileModal";
import NSFWBlurOverlay from "@/components/NSFWBlurOverlay";
import { Database } from "@/integrations/supabase/types";

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserPost extends Post {
  profiles?: Profile;
  likes_count?: number;
  comments_count?: number;
}

const Profile = () => {
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [safeModeEnabled, setSafeModeEnabled] = useState(true);
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);
  const { user, profile, subscribed, subscriptionTier, checkSubscription, isTrialActive, trialDaysRemaining, startTrial } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePostClick = (post: UserPost) => {
    setSelectedPost(post);
  };

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch real posts from database
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey(
            id,
            full_name,
            avatar_url,
            handle
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Process posts to include counts
      const processedPosts = await Promise.all(
        (posts || []).map(async (post) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Get comments count
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0
          };
        })
      );

      setUserPosts(processedPosts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load your posts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowStats = async () => {
    if (!user) return;

    try {
      // Fetch followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      if (followersError) throw followersError;

      // Fetch following count
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      setFollowersCount(followersCount || 0);
      setFollowingCount(followingCount || 0);
    } catch (error: any) {
      console.error('Error loading follow stats:', error);
      // Don't show error toast for follow stats as it's not critical
    }
  };

  useEffect(() => {
    fetchUserPosts();
    fetchFollowStats();
    
    // Set user preferences from profile
    if (profile) {
      setAgeVerified(profile.age_verified || false);
      setSafeModeEnabled(profile.safe_mode_enabled !== false); // Default to true
    }
  }, [user, profile]);

  const handleProfileUpdated = () => {
    // Refresh subscription status and profile data
    checkSubscription();
    // Refresh posts and follow stats
    fetchUserPosts();
    fetchFollowStats();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl font-serif">Loading profile...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-gold text-xl font-serif mb-4">Profile not found</div>
          <p className="text-white/60">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      {/* Floating Create Post Button */}
      <Button
        onClick={() => navigate('/portal/create')}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-white hover:bg-gray-100 shadow-2xl hover:shadow-white/50 transition-all duration-300 border-4 border-white/20 hover:scale-110"
        size="icon"
      >
        <Plus className="h-8 w-8 text-black font-bold" />
      </Button>
      {/* Profile Header */}
      <Card className="bg-charcoal border-gold/20 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-32 h-32 border-2 border-gold/30">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                {profile.full_name?.split(' ').map(n => n[0]).join('') || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-semibold text-white">
                      {profile.full_name || user.email}
                    </h1>
                  </div>
                  <p className="text-white/60">@{profile.handle || profile.full_name?.toLowerCase().replace(/\s+/g, '') || 'member'}</p>
                </div>
                
                <div className="flex space-x-2">
                  <EditProfileModal onProfileUpdated={handleProfileUpdated}>
                    <Button
                      variant="outline"
                      className="border-gold/50 text-gold hover:bg-gold/20"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </EditProfileModal>
                  <Button
                    onClick={checkSubscription}
                    variant="outline"
                    className="border-gold/50 text-gold hover:bg-gold/20"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-center space-x-8 text-center">
                <div className="hover:bg-white/5 rounded-lg p-2 transition-colors">
                  <div className="text-xl font-bold text-white">{userPosts.length}</div>
                  <div className="text-white/60 text-sm">Posts</div>
                </div>
                <button
                  onClick={() => navigate(`/portal/user/${user?.id}/followers`)}
                  className="hover:bg-white/5 rounded-lg p-2 transition-colors"
                >
                  <div className="text-xl font-bold text-white hover:text-gold transition-colors">
                    {followersCount.toLocaleString()}
                  </div>
                  <div className="text-white/60 text-sm">Followers</div>
                </button>
                <button
                  onClick={() => navigate(`/portal/user/${user?.id}/following`)}
                  className="hover:bg-white/5 rounded-lg p-2 transition-colors"
                >
                  <div className="text-xl font-bold text-white hover:text-gold transition-colors">
                    {followingCount.toLocaleString()}
                  </div>
                  <div className="text-white/60 text-sm">Following</div>
                </button>
              </div>

              <div className="text-white/80">
                <p className="mb-2">{profile?.bio || "No bio yet"}</p>
                
                {/* Social Media Profiles */}
                {(profile?.sdc_username || profile?.mutual_profile || profile?.fb_profile) && (
                  <div className="mb-4">
                    <h4 className="text-gold font-semibold mb-2">Social Profiles</h4>
                    <div className="space-y-1 text-sm">
                      {profile?.sdc_username && (
                        <div className="flex items-center space-x-2">
                          <span className="text-white/60">SDC:</span>
                          <span className="text-gold">@{profile.sdc_username}</span>
                        </div>
                      )}
                      {profile?.mutual_profile && (
                        <div className="flex items-center space-x-2">
                          <span className="text-white/60">MUTUAL/S:</span>
                          <span className="text-gold">@{profile.mutual_profile}</span>
                        </div>
                      )}
                      {profile?.fb_profile && (
                        <div className="flex items-center space-x-2">
                          <span className="text-white/60">Facebook:</span>
                          <span className="text-gold">{profile.fb_profile}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-white/60 text-sm">
                  Member since {profile?.created_at ? formatDate(profile.created_at) : "Recently"}
                </p>
                {!subscribed && (
                  <div className="mt-4 space-y-3">
                    <Button 
                      onClick={startTrial}
                      className="bg-gold hover:bg-gold-light text-black font-semibold w-full"
                    >
                      Start 3-Day Free Trial
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/membership'}
                      variant="outline"
                      className="border-gold/50 text-gold hover:bg-gold/20 w-full"
                    >
                      Subscribe for $20/month
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <Card className="bg-charcoal border-gold/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gold font-serif">Your Posts</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                fetchUserPosts();
                fetchFollowStats();
              }}
              variant="ghost"
              size="sm"
              className="text-gold hover:text-gold-light"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Grid className="w-5 h-5 text-gold" />
          </div>
        </CardHeader>
        <CardContent>
          {userPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/60 mb-4">You haven't created any posts yet.</div>
              <Button
                onClick={() => window.location.href = '/portal/create'}
                className="bg-gold hover:bg-gold-light text-black font-semibold"
              >
                Create Your First Post
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {userPosts.map((post) => (
                <div key={post.id} className="relative group cursor-pointer" onClick={() => handlePostClick(post)}>
                  <div className="aspect-square bg-black/30 overflow-hidden">
                    {post.image_url ? (
                      <NSFWBlurOverlay
                        isNSFW={post.is_nsfw}
                        ageVerified={ageVerified}
                        safeModeEnabled={safeModeEnabled}
                        className="w-full h-full"
                      >
                        <img 
                          src={post.image_url} 
                          alt="Your post" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </NSFWBlurOverlay>
                    ) : (
                      <div className="w-full h-full bg-charcoal/50 flex items-center justify-center p-4">
                        <p className="text-white/80 text-sm text-center line-clamp-4">
                          {post.content}
                        </p>
                      </div>
                    )}
                    
                    {/* Video Indicator */}
                    {post.video_url && (
                      <div className="absolute top-2 right-2">
                        <Play className="h-4 w-4 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Overlay with Stats */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center">
                      <div className="flex items-center space-x-4 text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-charcoal rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex">
              {/* Image/Content Section */}
              <div className="flex-1 relative">
                {selectedPost.image_url ? (
                  <img
                    src={selectedPost.image_url}
                    alt="Post"
                    className="w-full h-full object-contain max-h-[80vh]"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 p-8">
                    <p className="text-white text-lg text-center">{selectedPost.content}</p>
                  </div>
                )}
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Post Details Section */}
              <div className="w-80 border-l border-gold/20 p-6 flex flex-col">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-gold text-black">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{profile?.full_name || 'You'}</p>
                    <p className="text-white/60 text-sm">@{profile?.handle || 'user'}</p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-white mb-4">{selectedPost.content}</p>
                  
                  <div className="flex items-center space-x-6 text-white/60 text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{selectedPost.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{selectedPost.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-white/40 text-xs">
                  {new Date(selectedPost.created_at).toLocaleDateString()} at{' '}
                  {new Date(selectedPost.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;