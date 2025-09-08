import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NSFWBlurOverlayProps {
  isNSFW: boolean;
  ageVerified: boolean;
  safeModeEnabled: boolean;
  children: React.ReactNode;
  className?: string;
  onReveal?: () => void;
}

const NSFWBlurOverlay = ({
  isNSFW,
  ageVerified,
  safeModeEnabled,
  children,
  className,
  onReveal
}: NSFWBlurOverlayProps) => {
  const [isRevealed, setIsRevealed] = useState(false);

  // Show blur if content is NSFW and either safe mode is on or user is not age verified
  const shouldBlur = isNSFW && (safeModeEnabled || !ageVerified) && !isRevealed;

  const handleReveal = () => {
    if (ageVerified && !safeModeEnabled) {
      setIsRevealed(true);
      onReveal?.();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(shouldBlur && "blur-lg filter")}>
        {children}
      </div>
      
      {shouldBlur && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center">
            {!ageVerified ? (
              <>
                <EyeOff className="h-8 w-8 text-white/80 mx-auto mb-2" />
                <p className="text-white/90 font-medium mb-1">Age Verification Required</p>
                <p className="text-white/60 text-sm">Content restricted for unverified users</p>
              </>
            ) : safeModeEnabled ? (
              <>
                <EyeOff className="h-8 w-8 text-white/80 mx-auto mb-2" />
                <p className="text-white/90 font-medium mb-1">Safe Mode Enabled</p>
                <p className="text-white/60 text-sm">Turn off Safe Mode to view</p>
              </>
            ) : (
              <Button
                onClick={handleReveal}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20"
              >
                <Eye className="h-4 w-4 mr-2" />
                Tap to Reveal
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NSFWBlurOverlay;