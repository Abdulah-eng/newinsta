import React from 'react';
import { Button } from './ui/button';
import { useFollow } from '../contexts/FollowContext';
import { User, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  userId: string;
  userName?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  userName,
  variant = 'default',
  size = 'default',
  showIcon = true,
  className = '',
}) => {
  const { isFollowing, toggleFollow, isFollowingLoading, isUnfollowingLoading } = useFollow();

  const isCurrentlyFollowing = isFollowing(userId);
  const isLoading = isFollowingLoading || isUnfollowingLoading;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFollow(userId);
  };

  const getButtonText = () => {
    if (isLoading) {
      return isCurrentlyFollowing ? 'Unfollowing...' : 'Following...';
    }
    return isCurrentlyFollowing ? 'Unfollow' : 'Follow';
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return isCurrentlyFollowing ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (isCurrentlyFollowing) {
      return variant === 'default' ? 'outline' : variant;
    }
    return variant;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={getButtonVariant()}
      size={size}
      className={`${isCurrentlyFollowing ? 'text-gold border-gold hover:bg-gold hover:text-white' : 'bg-gold hover:bg-gold-dark text-white'} ${className}`}
    >
      {showIcon && getButtonIcon()}
      <span className={showIcon ? 'ml-2' : ''}>{getButtonText()}</span>
    </Button>
  );
};

export default FollowButton;
