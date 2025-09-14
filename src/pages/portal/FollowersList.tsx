import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/contexts/FollowContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FollowButton from "@/components/FollowButton";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface FollowerUser extends Profile {
  follow_created_at: string;
}

const FollowersList = () => {
  const { userId, type } = useParams<{ userId: string; type: 'followers' | 'following' }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isFollowing } = useFollow();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
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

  const fetchFollowers = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          profiles!follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const followers = data?.map(follow => ({
        ...follow.profiles,
        follow_created_at: follow.created_at
      })) || [];

      setUsers(followers);
    } catch (error: any) {
      console.error('Error loading followers:', error);
      toast({
        title: "Error",
        description: "Failed to load followers.",
        variant: "destructive",
      });
    }
  };

  const fetchFollowing = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          profiles!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const following = data?.map(follow => ({
        ...follow.profiles,
        follow_created_at: follow.created_at
      })) || [];

      setUsers(following);
    } catch (error: any) {
      console.error('Error loading following:', error);
      toast({
        title: "Error",
        description: "Failed to load following list.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (userId && type) {
      setLoading(true);
      Promise.all([
        fetchUserProfile(),
        type === 'followers' ? fetchFollowers() : fetchFollowing()
      ]).finally(() => setLoading(false));
    }
  }, [userId, type]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading {type}...</span>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const title = type === 'followers' ? 'Followers' : 'Following';
  const icon = type === 'followers' ? Users : UserPlus;

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-gold hover:text-gold-light"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            {React.createElement(icon, { className: "h-6 w-6 text-gold" })}
            <h1 className="text-2xl font-serif text-gold">
              {userProfile?.full_name || userProfile?.email}'s {title}
            </h1>
          </div>
        </div>

        {/* Users List */}
        <Card className="bg-charcoal border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold font-serif">
              {users.length} {title.toLowerCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-white/60 mb-4">
                  {isOwnProfile 
                    ? `You don't have any ${title.toLowerCase()} yet.`
                    : `This user doesn't have any ${title.toLowerCase()} yet.`
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-charcoal/50 rounded-lg border border-gold/10">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-gold/50 transition-all"
                        onClick={() => navigate(`/portal/user/${user.id}`)}
                      >
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-gold text-black">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <button
                          onClick={() => navigate(`/portal/user/${user.id}`)}
                          className="text-white font-medium hover:text-gold transition-colors cursor-pointer text-left"
                        >
                          {user.full_name || user.email}
                        </button>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-white/60 text-sm">
                            @{user.handle || user.full_name?.toLowerCase().replace(/\s+/g, '') || 'member'}
                          </p>
                        </div>
                        <p className="text-white/40 text-xs">
                          {type === 'followers' ? 'Started following' : 'Followed'} {formatDate(user.follow_created_at)}
                        </p>
                      </div>
                    </div>
                    {!isOwnProfile && user.id !== currentUser?.id && (
                      <FollowButton
                        userId={user.id}
                        userName={user.full_name || user.email}
                        variant="outline"
                        size="sm"
                        showIcon={false}
                      />
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

export default FollowersList;
