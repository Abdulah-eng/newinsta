import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Plus, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const Feed = () => {
  const [posts] = useState([
    {
      id: 1,
      author: {
        name: "Alexandra Stone",
        handle: "@alexandra",
        avatar: "/api/placeholder/40/40"
      },
      content: "Excited about tonight's exclusive networking event! The connections here are incredible. 🥂",
      image: "/api/placeholder/600/400",
      isNSFW: false,
      likes: 24,
      comments: 8,
      timestamp: "2h ago"
    },
    {
      id: 2,
      author: {
        name: "Marcus Chen",
        handle: "@marcus",
        avatar: "/api/placeholder/40/40"
      },
      content: "Private content for verified members only...",
      image: "/api/placeholder/600/400",
      isNSFW: true,
      likes: 45,
      comments: 12,
      timestamp: "4h ago"
    },
    {
      id: 3,
      author: {
        name: "Isabella Rodriguez",
        handle: "@isabella",
        avatar: "/api/placeholder/40/40"
      },
      content: "The ambiance at our upcoming club location is going to be absolutely stunning. Can't wait to share more details with everyone! ✨",
      likes: 67,
      comments: 15,
      timestamp: "6h ago"
    }
  ]);

  const [revealedPosts, setRevealedPosts] = useState<Set<number>>(new Set());

  const toggleReveal = (postId: number) => {
    const newRevealed = new Set(revealedPosts);
    if (newRevealed.has(postId)) {
      newRevealed.delete(postId);
    } else {
      newRevealed.add(postId);
    }
    setRevealedPosts(newRevealed);
  };

  const handleCreatePost = () => {
    // TODO: Implement post creation
    alert("Post creation coming with backend integration!");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Create Post */}
      <Card className="bg-charcoal border-gold/20">
        <CardContent className="p-4">
          <Button 
            onClick={handleCreatePost}
            className="w-full bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Share with the community
          </Button>
        </CardContent>
      </Card>

      {/* Stories Placeholder */}
      <Card className="bg-charcoal border-gold/20">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gold">Member Stories</h3>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/50 flex items-center justify-center">
                  <span className="text-gold text-xs">Story {i}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm mt-2">Stories feature coming soon!</p>
        </CardContent>
      </Card>

      {/* Feed Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="bg-charcoal border-gold/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback className="bg-gold/20 text-gold">
                      {post.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-white">{post.author.name}</p>
                    <p className="text-sm text-white/60">{post.author.handle} • {post.timestamp}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-white/90">{post.content}</p>
              
              {post.image && (
                <div className="relative">
                  {post.isNSFW && !revealedPosts.has(post.id) ? (
                    <div className="aspect-video bg-black/50 border border-gold/30 rounded-lg flex flex-col items-center justify-center space-y-3">
                      <EyeOff className="w-8 h-8 text-white/60" />
                      <p className="text-white/80 font-medium">Age-Restricted Content</p>
                      <p className="text-white/60 text-sm text-center px-4">
                        This content is marked as NSFW. You must be 18+ to view.
                      </p>
                      <Button
                        onClick={() => toggleReveal(post.id)}
                        variant="outline"
                        className="border-gold/50 text-gold hover:bg-gold/20"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Tap to Reveal
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={post.image} 
                        alt="Post content" 
                        className="w-full rounded-lg"
                      />
                      {post.isNSFW && (
                        <Button
                          onClick={() => toggleReveal(post.id)}
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 border-gold/50 text-gold hover:bg-gold/20"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors">
                    <Heart className="w-5 h-5" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="text-white/60 hover:text-gold transition-colors">
                    <Share className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Feed;