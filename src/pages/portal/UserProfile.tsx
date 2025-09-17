import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Grid, Heart, MessageCircle, RefreshCw, User, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NSFWBlurOverlay from "@/components/NSFWBlurOverlay";
import FollowButton from "@/components/FollowButton";
import { Database } from "@/integrations/supabase/types";

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserPost extends Post {
  profiles?: Profile;
  likes_count?: number;
  comments_count?: number;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { getFollowStats } = useFollow();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [safeModeEnabled, setSafeModeEnabled] = useState(true);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    }
  };

  const fetchUserPosts = async () => {
    if (!userId) return;

    try {
      // Fetch user's posts from database
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
        .eq('author_id', userId)
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
      console.error('Error loading user posts:', error);
      toast({
        title: "Error",
        description: "Failed to load user posts.",
        variant: "destructive",
      });
    }
  };

  const fetchFollowStats = async () => {
    if (!userId) return;

    try {
      const stats = await getFollowStats(userId);
      setFollowersCount(stats.followers);
      setFollowingCount(stats.following);
    } catch (error: any) {
      console.error('Error loading follow stats:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([
        fetchUserProfile(),
        fetchUserPosts(),
        fetchFollowStats()
      ]).finally(() => setLoading(false));
    }
  }, [userId]);

  // Set user preferences from current user's profile
  useEffect(() => {
    if (currentUser) {
      setAgeVerified(currentUser.age_verified || false);
      setSafeModeEnabled(currentUser.safe_mode_enabled !== false);
    }
  }, [currentUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getMembershipLevel = () => {
    if (!userProfile?.membership_tier) return "Free Member";
    return "Verified Member";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading user profile...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">User not found</div>
      </div>
    );
  }

  // Don't show follow button for own profile
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="text-gold hover:text-gold-light"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="bg-charcoal border-gold/20">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-6">
              {/* Profile Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6 space-y-4 sm:space-y-0">
                <Avatar className="w-24 h-24 border-2 border-gold/30 self-center sm:self-auto">
                  <AvatarImage src={userProfile.avatar_url || ''} />
                  <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                    {userProfile.full_name?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                        <h1 className="text-2xl font-semibold text-white">
                          {userProfile.full_name || userProfile.email}
                        </h1>
                        {userProfile.membership_tier && (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 w-max mt-1 sm:mt-0">
                            Verified Member
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/60 break-all">@{userProfile.handle || userProfile.full_name?.toLowerCase().replace(/\s+/g, '') || 'member'}</p>
                      <Badge className="bg-gold/20 text-gold border-gold/30 font-medium mt-2 w-max">
                        {getMembershipLevel()}
                      </Badge>
                    </div>
                    {!isOwnProfile && (
                      <div className="sm:self-start">
                        <FollowButton
                          userId={userId!}
                          userName={userProfile.full_name || userProfile.email}
                          variant="default"
                          size="default"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center mt-6 sm:flex sm:justify-start sm:space-x-8">
                    <div className="hover:bg-white/5 rounded-lg p-2 transition-colors w-full sm:flex-none">
                      <div className="text-xl font-bold text-white">{userPosts.length}</div>
                      <div className="text-white/60 text-sm">Posts</div>
                    </div>
                    <button
                      onClick={() => navigate(`/portal/user/${userId}/followers`)}
                      className="hover:bg-white/5 rounded-lg p-2 transition-colors w-full sm:flex-none"
                    >
                      <div className="text-xl font-bold text-white hover:text-gold transition-colors">
                        {followersCount.toLocaleString()}
                      </div>
                      <div className="text-white/60 text-sm">Followers</div>
                    </button>
                    <button
                      onClick={() => navigate(`/portal/user/${userId}/following`)}
                      className="hover:bg-white/5 rounded-lg p-2 transition-colors w-full sm:flex-none"
                    >
                      <div className="text-xl font-bold text-white hover:text-gold transition-colors">
                        {followingCount.toLocaleString()}
                      </div>
                      <div className="text-white/60 text-sm">Following</div>
                    </button>
                  </div>

                  <div className="text-white/80 mt-4">
                    <p className="mb-2">{userProfile.bio || "No bio yet"}</p>
                    <p className="text-white/60 text-sm">
                      Member since {userProfile.created_at ? formatDate(userProfile.created_at) : "Recently"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Grid */}
        <Card className="bg-charcoal border-gold/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gold font-serif">Posts</CardTitle>
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
                <div className="text-white/60 mb-4">This user hasn't created any posts yet.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPosts.map((post) => (
                  <div key={post.id} className="relative group cursor-pointer">
                    {post.image_url && (
                      <div className="relative aspect-square overflow-hidden rounded-lg">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {post.is_nsfw && !ageVerified && (
                          <NSFWBlurOverlay />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-4">
                            <div className="flex items-center space-x-1 text-white">
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">{post.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-white">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{post.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {post.content && !post.image_url && (
                      <div className="p-4 bg-gold/10 rounded-lg border border-gold/20">
                        <p className="text-white text-sm line-clamp-3">{post.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
