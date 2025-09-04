import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Settings, Grid, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";

const Profile = () => {
  // TODO: Replace with actual user data from Supabase
  const [user] = useState({
    name: "Alexandra Stone",
    handle: "@alexandra",
    bio: "Entrepreneur • Art Collector • Wine Enthusiast\nMember since March 2024",
    avatar: "/api/placeholder/120/120",
    verified: true,
    membershipLevel: "Founder",
    posts: 42,
    following: 156,
    followers: 289
  });

  const [posts] = useState([
    {
      id: 1,
      image: "/api/placeholder/300/300",
      likes: 24,
      comments: 8,
      isNSFW: false
    },
    {
      id: 2,
      image: "/api/placeholder/300/300",
      likes: 45,
      comments: 12,
      isNSFW: true
    },
    {
      id: 3,
      image: "/api/placeholder/300/300",
      likes: 67,
      comments: 15,
      isNSFW: false
    },
    {
      id: 4,
      image: "/api/placeholder/300/300",
      likes: 33,
      comments: 6,
      isNSFW: false
    },
    {
      id: 5,
      image: "/api/placeholder/300/300",
      likes: 51,
      comments: 9,
      isNSFW: true
    },
    {
      id: 6,
      image: "/api/placeholder/300/300",
      likes: 78,
      comments: 21,
      isNSFW: false
    }
  ]);

  const handleEditProfile = () => {
    // TODO: Implement profile editing
    alert("Profile editing coming with backend integration!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <Card className="bg-charcoal border-gold/20 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-32 h-32 border-2 border-gold/30">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
                    {user.verified && (
                      <Badge className="bg-gold/20 text-gold border-gold/30">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/60">{user.handle}</p>
                  <Badge className="bg-gold text-black font-medium mt-2">
                    {user.membershipLevel} Member
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleEditProfile}
                    variant="outline"
                    className="border-gold/50 text-gold hover:bg-gold/20"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gold/50 text-gold hover:bg-gold/20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-8 text-center">
                <div>
                  <div className="text-xl font-bold text-white">{user.posts}</div>
                  <div className="text-white/60 text-sm">Posts</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{user.followers}</div>
                  <div className="text-white/60 text-sm">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{user.following}</div>
                  <div className="text-white/60 text-sm">Following</div>
                </div>
              </div>

              <div className="text-white/80 whitespace-pre-line">
                {user.bio}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      <Card className="bg-charcoal border-gold/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gold font-serif">Posts</CardTitle>
          <Grid className="w-5 h-5 text-gold" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="relative group cursor-pointer">
                <div className="aspect-square bg-black/30 rounded-lg overflow-hidden">
                  {post.isNSFW ? (
                    <div className="w-full h-full bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-white/60 text-sm mb-2">NSFW Content</div>
                        <div className="text-xs text-white/40">Tap to view</div>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={post.image} 
                      alt="Post" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center space-x-4 text-white">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-5 h-5" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;