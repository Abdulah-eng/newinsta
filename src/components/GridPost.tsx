import React from 'react';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import NSFWBlurOverlay from './NSFWBlurOverlay';

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  is_nsfw: boolean;
  location?: string;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    membership_tier?: string;
  };
}

interface GridPostProps {
  post: Post;
  onClick: () => void;
  ageVerified: boolean;
  safeModeEnabled: boolean;
}

const GridPost: React.FC<GridPostProps> = ({ post, onClick, ageVerified, safeModeEnabled }) => {
  const getMembershipBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'elite': return 'bg-gold text-black';
      case 'premium': return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
      case 'basic': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const shouldShowNSFW = post.is_nsfw && (!ageVerified || safeModeEnabled);

  return (
    <div 
      className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg bg-charcoal border border-gold/20 hover:border-gold/40 transition-all duration-300 hover:scale-[1.02]"
      onClick={onClick}
    >
      {/* Media Content */}
      <div className="relative w-full h-full">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : post.video_url ? (
          <video
            src={post.video_url}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            muted
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gold/10">
            <p className="text-white/60 text-sm text-center p-4 line-clamp-3">
              {post.content}
            </p>
          </div>
        )}

        {/* NSFW Overlay */}
        {shouldShowNSFW && <NSFWBlurOverlay />}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-4">
            <div className="flex items-center space-x-1 text-white">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">{post.likes_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1 text-white">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1 text-white">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View</span>
            </div>
          </div>
        </div>

        {/* Top Right Corner - User Info */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.profiles?.avatar_url || ''} />
              <AvatarFallback className="bg-gold text-black text-xs">
                {post.profiles?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1">
              <span className="text-white text-xs font-medium truncate max-w-20">
                {post.profiles?.full_name || 'Anonymous'}
              </span>
              {post.profiles?.membership_tier && (
                <Badge className={`${getMembershipBadgeColor(post.profiles.membership_tier)} text-xs px-1 py-0`}>
                  {post.profiles.membership_tier.charAt(0).toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Left Corner - NSFW Badge */}
        {post.is_nsfw && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="destructive" className="text-xs px-2 py-1">
              NSFW
            </Badge>
          </div>
        )}

        {/* Video Play Indicator */}
        {post.video_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GridPost;
