import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

type Story = Database['public']['Tables']['stories']['Row'];
type StoryView = Database['public']['Tables']['story_views']['Row'];
type StoryReaction = Database['public']['Tables']['story_reactions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface StoryWithAuthor extends Story {
  author: Profile;
  views: StoryView[];
  reactions: StoryReaction[];
  has_viewed: boolean;
  view_count: number;
  reaction_count: number;
}

interface StoriesContextType {
  stories: StoryWithAuthor[];
  myStories: StoryWithAuthor[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadStories: () => Promise<void>;
  loadMyStories: () => Promise<void>;
  createStory: (content: string, imageUrl?: string, videoUrl?: string, isNsfw?: boolean) => Promise<void>;
  viewStory: (storyId: string) => Promise<void>;
  addReaction: (storyId: string, emoji: string) => Promise<void>;
  removeReaction: (storyId: string, emoji: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  cleanupExpiredStories: () => Promise<void>;
  
  // Real-time
  subscribeToStories: () => void;
  unsubscribeFromStories: () => void;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export const useStories = () => {
  const context = useContext(StoriesContext);
  if (!context) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};

interface StoriesProviderProps {
  children: React.ReactNode;
}

export const StoriesProvider: React.FC<StoriesProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const [stories, setStories] = useState<StoryWithAuthor[]>([]);
  const [myStories, setMyStories] = useState<StoryWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Load all active stories
  const loadStories = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!author_id(
            id,
            full_name,
            avatar_url,
            handle,
            membership_tier
          ),
          story_views(
            id,
            viewer_id,
            viewed_at
          ),
          story_reactions(
            id,
            user_id,
            created_at
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading stories:', error);
        // If it's a foreign key error, return empty array instead of crashing
        if (error.code === 'PGRST200') {
          console.warn('Foreign key relationship not found, returning empty stories');
          setStories([]);
          return;
        }
        throw error;
      }

      // Process stories to include computed fields
      const processedStories: StoryWithAuthor[] = (data || []).map(story => {
        const views = story.story_views || [];
        const reactions = story.story_reactions || [];
        const has_viewed = views.some(view => view.viewer_id === user.id);
        
        return {
          ...story,
          author: story.profiles as Profile,
          views,
          reactions,
          has_viewed,
          view_count: views.length,
          reaction_count: reactions.length
        };
      });

      setStories(processedStories);
    } catch (err) {
      console.error('Error loading stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user's own stories
  const loadMyStories = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!author_id(
            id,
            full_name,
            avatar_url,
            handle,
            membership_tier
          ),
          story_views(
            id,
            viewer_id,
            viewed_at
          ),
          story_reactions(
            id,
            user_id,
            created_at
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading my stories:', error);
        // If it's a foreign key error, return empty array instead of crashing
        if (error.code === 'PGRST200') {
          console.warn('Foreign key relationship not found, returning empty my stories');
          setMyStories([]);
          return;
        }
        throw error;
      }

      // Process stories to include computed fields
      const processedStories: StoryWithAuthor[] = (data || []).map(story => {
        const views = story.story_views || [];
        const reactions = story.story_reactions || [];
        const has_viewed = views.some(view => view.viewer_id === user.id);
        
        return {
          ...story,
          author: story.profiles as Profile,
          views,
          reactions,
          has_viewed,
          view_count: views.length,
          reaction_count: reactions.length
        };
      });

      setMyStories(processedStories);
    } catch (err) {
      console.error('Error loading my stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load my stories');
    }
  }, [user]);

  // Create new story
  const createStory = useCallback(async (content: string, imageUrl?: string, videoUrl?: string, isNsfw = false) => {
    if (!user) return;

    try {
      setError(null);

      // Check rate limit using the database function
      const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_story_rate_limit', {
        p_user_id: user.id,
        p_max_attempts: 10,
        p_window_hours: 1
      });

      if (rateLimitError) {
        console.warn('Rate limit check failed, using fallback:', rateLimitError);
        // Fallback: simple count check
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentStories } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id)
          .gte('created_at', oneHourAgo);

        if (recentStories && recentStories >= 10) {
          toast.error('Rate limit exceeded. You can create up to 10 stories per hour.');
          return;
        }
      } else if (!rateLimitOk) {
        toast.error('Rate limit exceeded. You can create up to 10 stories per hour.');
        return;
      }

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('stories')
        .insert({
          author_id: user.id,
          content,
          image_url: imageUrl,
          video_url: videoUrl,
          is_nsfw: isNsfw,
          expires_at: expiresAt.toISOString()
        })
        .select(`
          *,
          profiles!author_id(
            id,
            full_name,
            avatar_url,
            handle,
            membership_tier
          ),
          story_views(
            id,
            viewer_id,
            viewed_at
          ),
          story_reactions(
            id,
            user_id,
            created_at
          )
        `)
        .single();

      if (error) throw error;

      // Add to local state
      const processedStory: StoryWithAuthor = {
        ...data,
        author: data.profiles as Profile,
        views: data.story_views || [],
        reactions: data.story_reactions || [],
        has_viewed: false,
        view_count: 0,
        reaction_count: 0
      };

      setStories(prev => [processedStory, ...prev]);
      setMyStories(prev => [processedStory, ...prev]);
      
      toast.success('Story created successfully');
    } catch (err) {
      console.error('Error creating story:', err);
      setError(err instanceof Error ? err.message : 'Failed to create story');
      toast.error('Failed to create story');
    }
  }, [user]);

  // View story
  const viewStory = useCallback(async (storyId: string) => {
    if (!user) return;

    try {
      // Check if already viewed
      const { data: existingView } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('viewer_id', user.id)
        .single();

      if (existingView) return; // Already viewed

      // Add view
      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        });

      if (error) throw error;

      // Update local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { 
                ...story, 
                has_viewed: true,
                view_count: story.view_count + 1,
                views: [...story.views, { id: '', story_id: storyId, viewer_id: user.id, viewed_at: new Date().toISOString() }]
              }
            : story
        )
      );
    } catch (err) {
      console.error('Error viewing story:', err);
    }
  }, [user]);

  // Add reaction to story
  const addReaction = useCallback(async (storyId: string, emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('story_reactions')
        .insert({
          story_id: storyId,
          user_id: user.id,
          emoji
        });

      if (error) throw error;

      // Update local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { 
                ...story, 
                reaction_count: story.reaction_count + 1,
                reactions: [...story.reactions, { id: '', story_id: storyId, user_id: user.id, emoji, created_at: new Date().toISOString() }]
              }
            : story
        )
      );

      toast.success('Reaction added');
    } catch (err) {
      console.error('Error adding reaction:', err);
      toast.error('Failed to add reaction');
    }
  }, [user]);

  // Remove reaction from story
  const removeReaction = useCallback(async (storyId: string, emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;

      // Update local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { 
                ...story, 
                reaction_count: Math.max(0, story.reaction_count - 1),
                reactions: story.reactions.filter(r => !(r.user_id === user.id && r.emoji === emoji))
              }
            : story
        )
      );

      toast.success('Reaction removed');
    } catch (err) {
      console.error('Error removing reaction:', err);
      toast.error('Failed to remove reaction');
    }
  }, [user]);

  // Delete story
  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('author_id', user.id);

      if (error) throw error;

      // Remove from local state
      setStories(prev => prev.filter(story => story.id !== storyId));
      setMyStories(prev => prev.filter(story => story.id !== storyId));
      
      toast.success('Story deleted');
    } catch (err) {
      console.error('Error deleting story:', err);
      toast.error('Failed to delete story');
    }
  }, [user]);

  // Cleanup expired stories
  const cleanupExpiredStories = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_stories');
      if (error) throw error;

      // Reload stories after cleanup
      await loadStories();
    } catch (err) {
      console.error('Error cleaning up expired stories:', err);
    }
  }, [loadStories]);

  // Subscribe to real-time story updates
  const subscribeToStories = useCallback(() => {
    if (!user) return;

    const channel = supabase
      .channel('stories')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories'
        },
        (payload) => {
          const newStory = payload.new as Story;
          
          // Only add if not expired
          if (new Date(newStory.expires_at) > new Date()) {
            loadStories();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories'
        },
        (payload) => {
          const updatedStory = payload.new as Story;
          
          // Update local state
          setStories(prev => 
            prev.map(story => 
              story.id === updatedStory.id ? { ...story, ...updatedStory } : story
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'stories'
        },
        (payload) => {
          const deletedStory = payload.old as Story;
          
          // Remove from local state
          setStories(prev => prev.filter(story => story.id !== deletedStory.id));
          setMyStories(prev => prev.filter(story => story.id !== deletedStory.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_views'
        },
        (payload) => {
          const newView = payload.new as StoryView;
          
          // Update story view count
          setStories(prev => 
            prev.map(story => 
              story.id === newView.story_id 
                ? { 
                    ...story, 
                    view_count: story.view_count + 1,
                    views: [...story.views, newView]
                  }
                : story
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_reactions'
        },
        (payload) => {
          const newReaction = payload.new as StoryReaction;
          
          // Update story reaction count
          setStories(prev => 
            prev.map(story => 
              story.id === newReaction.story_id 
                ? { 
                    ...story, 
                    reaction_count: story.reaction_count + 1,
                    reactions: [...story.reactions, newReaction]
                  }
                : story
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'story_reactions'
        },
        (payload) => {
          const deletedReaction = payload.old as StoryReaction;
          
          // Update story reaction count
          setStories(prev => 
            prev.map(story => 
              story.id === deletedReaction.story_id 
                ? { 
                    ...story, 
                    reaction_count: Math.max(0, story.reaction_count - 1),
                    reactions: story.reactions.filter(r => r.id !== deletedReaction.id)
                  }
                : story
            )
          );
        }
      )
      .subscribe();

    setSubscription(channel);
  }, [user, loadStories]);

  // Unsubscribe from real-time updates
  const unsubscribeFromStories = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [subscription]);

  // Load stories on mount
  useEffect(() => {
    if (user) {
      loadStories();
      loadMyStories();
    }
  }, [user, loadStories, loadMyStories]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (user) {
      subscribeToStories();
    }

    return () => {
      unsubscribeFromStories();
    };
  }, [user, subscribeToStories, unsubscribeFromStories]);

  // Cleanup expired stories every hour
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredStories();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [cleanupExpiredStories]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromStories();
    };
  }, [unsubscribeFromStories]);

  const value: StoriesContextType = {
    stories,
    myStories,
    isLoading,
    error,
    loadStories,
    loadMyStories,
    createStory,
    viewStory,
    addReaction,
    removeReaction,
    deleteStory,
    cleanupExpiredStories,
    subscribeToStories,
    unsubscribeFromStories
  };

  return (
    <StoriesContext.Provider value={value}>
      {children}
    </StoriesContext.Provider>
  );
};