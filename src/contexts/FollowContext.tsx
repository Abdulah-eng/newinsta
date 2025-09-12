import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/use-toast';

interface FollowContextType {
  // Follow state
  following: string[]; // Array of user IDs that current user is following
  followers: string[]; // Array of user IDs that follow current user
  isFollowing: (userId: string) => boolean;
  
  // Follow actions
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  
  // Follow stats
  getFollowStats: (userId: string) => Promise<{ followers: number; following: number }>;
  
  // Loading states
  isFollowingLoading: boolean;
  isUnfollowingLoading: boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};

interface FollowProviderProps {
  children: React.ReactNode;
}

export const FollowProvider: React.FC<FollowProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isUnfollowingLoading, setIsUnfollowingLoading] = useState(false);

  // Load current user's follow data
  const loadFollowData = async () => {
    if (!user) return;

    try {
      // Load who current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      // Load who follows current user
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id);

      if (followersError) throw followersError;

      setFollowing(followingData?.map(f => f.following_id) || []);
      setFollowers(followersData?.map(f => f.follower_id) || []);
    } catch (error: any) {
      console.error('Error loading follow data:', error);
    }
  };

  // Check if current user is following a specific user
  const isFollowing = (userId: string): boolean => {
    return following.includes(userId);
  };

  // Follow a user
  const followUser = async (userId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to follow users.",
        variant: "destructive",
      });
      return;
    }

    if (userId === user.id) {
      toast({
        title: "Error",
        description: "You cannot follow yourself.",
        variant: "destructive",
      });
      return;
    }

    if (isFollowing(userId)) {
      return; // Already following
    }

    try {
      setIsFollowingLoading(true);

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;

      // Update local state
      setFollowing(prev => [...prev, userId]);
      
      toast({
        title: "Success",
        description: "You are now following this user!",
      });
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow user.",
        variant: "destructive",
      });
    } finally {
      setIsFollowingLoading(false);
    }
  };

  // Unfollow a user
  const unfollowUser = async (userId: string) => {
    if (!user) return;

    if (!isFollowing(userId)) {
      return; // Not following
    }

    try {
      setIsUnfollowingLoading(true);

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      // Update local state
      setFollowing(prev => prev.filter(id => id !== userId));
      
      toast({
        title: "Success",
        description: "You have unfollowed this user.",
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user.",
        variant: "destructive",
      });
    } finally {
      setIsUnfollowingLoading(false);
    }
  };

  // Toggle follow/unfollow
  const toggleFollow = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  // Get follow stats for a specific user
  const getFollowStats = async (userId: string): Promise<{ followers: number; following: number }> => {
    try {
      // Get followers count
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (followersError) throw followersError;

      // Get following count
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      return {
        followers: followersCount || 0,
        following: followingCount || 0,
      };
    } catch (error: any) {
      console.error('Error getting follow stats:', error);
      return { followers: 0, following: 0 };
    }
  };

  // Load follow data when user changes
  useEffect(() => {
    loadFollowData();
  }, [user]);

  const value: FollowContextType = {
    following,
    followers,
    isFollowing,
    followUser,
    unfollowUser,
    toggleFollow,
    getFollowStats,
    isFollowingLoading,
    isUnfollowingLoading,
  };

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
};
