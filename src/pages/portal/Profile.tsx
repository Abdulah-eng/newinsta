import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Settings, Grid, Heart, MessageCircle, RefreshCw, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import EditProfileModal from "@/components/EditProfileModal";
import NSFWBlurOverlay from "@/components/NSFWBlurOverlay";
import { getUserMockPosts, mockProfiles, type MockPost } from "@/lib/mockData";

interface UserPost extends MockPost {}

const Profile = () => {
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [safeModeEnabled, setSafeModeEnabled] = useState(true);
  const { user, profile, subscribed, subscriptionTier, checkSubscription } = useAuth();
  const { toast } = useToast();
  
  // Get mock profile data
  const mockProfile = mockProfiles[0]; // Use first mock profile as current user's profile

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      // Use mock data for user's posts
      const mockUserPosts = getUserMockPosts(user.id, 15);
      setUserPosts(mockUserPosts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your posts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
    
    // Set user preferences from profile
    if (profile) {
      setAgeVerified(profile.age_verified || false);
      setSafeModeEnabled(profile.safe_mode_enabled !== false); // Default to true
    }
  }, [user, profile]);

  const handleProfileUpdated = () => {
    // Refresh subscription status and profile data
    checkSubscription();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getMembershipLevel = () => {
    if (!subscribed) return "Free Member";
    return subscriptionTier === "premium" ? "Premium Member" : "Elite Member";
  };

  const getMembershipBadgeColor = () => {
    if (!subscribed) return "bg-gray-500 text-white";
    return subscriptionTier === "premium" ? "bg-gold text-black" : "bg-gradient-to-r from-purple-400 to-purple-600 text-white";
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
    <div className="max-w-4xl mx-auto p-6">
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
                    {subscribed && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                        Verified Member
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/60">@{profile.full_name?.toLowerCase().replace(/\s+/g, '') || 'member'}</p>
                  <Badge className={`${getMembershipBadgeColor()} font-medium mt-2`}>
                    {getMembershipLevel()}
                  </Badge>
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

              <div className="flex space-x-8 text-center">
                <div>
                  <div className="text-xl font-bold text-white">{userPosts.length}</div>
                  <div className="text-white/60 text-sm">Posts</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{mockProfile.followers.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{mockProfile.following.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">Following</div>
                </div>
              </div>

              <div className="text-white/80">
                <p className="mb-2">{mockProfile.bio}</p>
                <p className="text-white/60 text-sm">
                  Member since {profile?.created_at ? formatDate(profile.created_at) : "Recently"}
                </p>
                {!subscribed && (
                  <div className="mt-4">
                    <Button 
                      onClick={() => window.location.href = '/membership'}
                      className="bg-gold hover:bg-gold-light text-black font-semibold"
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
              onClick={fetchUserPosts}
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
                <div key={post.id} className="relative group cursor-pointer">
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center">
                      <div className="flex items-center space-x-4 text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments}</span>
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
    </div>
  );
};

export default Profile;