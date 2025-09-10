import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

// Fallback stories context that works with existing database structure
// This will use the stories table that already exists

interface Story {
  id: string;
  author_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  is_nsfw: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string | null;
    avatar_url?: string;
    handle?: string;
  };
  view_count: number;
  has_viewed: boolean;
}

interface StoriesContextType {
  stories: Story[];
  loading: boolean;
  createStory: (mediaUrl: string, mediaType: 'image' | 'video', caption?: string) => Promise<Story | null>;
  viewStory: (storyId: string) => Promise<void>;
  reactToStory: (storyId: string, emoji: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  loadStories: () => Promise<void>;
  cleanupExpiredStories: () => Promise<void>;
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
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  // Load stories
  const loadStories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all active stories with user info
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          *,
          user:profiles!stories_author_id_fkey(*)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!storiesData) {
        setStories([]);
        return;
      }

      // Get view counts for each story
      const storiesWithDetails = await Promise.all(
        storiesData.map(async (story) => {
          // Get view count from story_views table
          const { count: viewCount } = await supabase
            .from('story_views')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);

          // Check if current user has viewed this story
          const { data: hasViewed } = await supabase
            .from('story_views')
            .select('*')
            .eq('story_id', story.id)
            .eq('viewer_id', user.id)
            .single();

          return {
            ...story,
            view_count: viewCount || 0,
            has_viewed: !!hasViewed,
          };
        })
      );

      setStories(storiesWithDetails);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new story
  const createStory = useCallback(async (
    mediaUrl: string, 
    mediaType: 'image' | 'video', 
    caption?: string
  ): Promise<Story | null> => {
    if (!user) return null;

    try {
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('stories')
        .insert({
          author_id: user.id,
          content: caption || null,
          image_url: mediaType === 'image' ? mediaUrl : null,
          video_url: mediaType === 'video' ? mediaUrl : null,
          expires_at: expiresAt.toISOString(),
        })
        .select(`
          *,
          user:profiles!stories_author_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      const newStory: Story = {
        ...data,
        view_count: 0,
        has_viewed: false,
      };

      // Add to local state
      setStories(prev => [newStory, ...prev]);

      toast({
        title: "Story created!",
        description: "Your story will be visible for 24 hours",
      });

      return newStory;
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive",
      });
      return null;
    }
  }, [user]);

  // View a story
  const viewStory = useCallback(async (storyId: string) => {
    if (!user) return;

    try {
      // Check if already viewed
      const { data: existingView } = await supabase
        .from('story_views')
        .select('*')
        .eq('story_id', storyId)
        .eq('viewer_id', user.id)
        .single();

      if (existingView) return; // Already viewed

      // Add view
      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id,
        });

      if (error) throw error;

      // Update local state
      setStories(prev => 
        prev.map(story => 
          story.id === storyId 
            ? { 
                ...story, 
                view_count: story.view_count + 1,
                has_viewed: true,
              }
            : story
        )
      );
    } catch (error) {
      console.error('Error viewing story:', error);
    }
  }, [user]);

  // React to a story (placeholder - would need story_reactions table)
  const reactToStory = useCallback(async (storyId: string, emoji: string) => {
    // This would require a story_reactions table
    console.log('Story reaction not implemented yet:', storyId, emoji);
  }, []);

  // Delete a story
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

      toast({
        title: "Story deleted",
        description: "Your story has been removed",
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      });
    }
  }, [user]);

  // Cleanup expired stories
  const cleanupExpiredStories = useCallback(async () => {
    try {
      // Delete expired stories
      const { error } = await supabase
        .from('stories')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;

      // Reload stories after cleanup
      await loadStories();
    } catch (error) {
      console.error('Error cleaning up expired stories:', error);
    }
  }, [loadStories]);

  // Load stories on mount
  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user, loadStories]);

  // Cleanup expired stories every hour
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredStories();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [cleanupExpiredStories]);

  const value: StoriesContextType = {
    stories,
    loading,
    createStory,
    viewStory,
    reactToStory,
    deleteStory,
    loadStories,
    cleanupExpiredStories,
  };

  return (
    <StoriesContext.Provider value={value}>
      {children}
    </StoriesContext.Provider>
  );
};
