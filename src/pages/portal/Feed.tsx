import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, AlertTriangle } from "lucide-react";
import CreatePost from "./CreatePost";

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  is_nsfw: boolean;
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
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (
            full_name,
            avatar_url,
            membership_tier
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
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
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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

      {/* NSFW Filter Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-gold">Community Feed</h2>
        <Button
          variant="outline"
          onClick={() => setShowNsfw(!showNsfw)}
          className="border-gold/30 text-gold hover:bg-gold hover:text-black"
        >
          {showNsfw ? "Hide NSFW" : "Show NSFW"}
        </Button>
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
            <Card key={post.id} className="bg-charcoal border-gold/20">
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-gold text-black">
                      {post.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
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
                    <p className="text-white/60 text-sm">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white whitespace-pre-wrap mb-4">{post.content}</p>
                
                {post.image_url && (
                  <div className="mb-4">
                    <img 
                      src={post.image_url} 
                      alt="Post image" 
                      className="rounded-lg max-w-full h-auto"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-6 pt-4 border-t border-gold/20">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-gold">
                    <Heart className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-gold">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-gold">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
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