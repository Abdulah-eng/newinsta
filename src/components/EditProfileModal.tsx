import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Edit, Upload, X } from "lucide-react";

interface EditProfileModalProps {
  children: React.ReactNode;
  onProfileUpdated?: () => void;
}

const EditProfileModal = ({ children, onProfileUpdated }: EditProfileModalProps) => {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile && open) {
      setFullName(profile.full_name || "");
      setBio(""); // We'll add bio field to profile later if needed
      setAvatarPreview(profile.avatar_url || "");
    }
  }, [profile, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to edit your profile.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        
        avatarUrl = data.publicUrl;
      }

      // Update profile
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
      });

      setOpen(false);
      
      if (onProfileUpdated) {
        onProfileUpdated();
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-charcoal border-gold/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold font-serif">Edit Profile</DialogTitle>
          <DialogDescription className="text-white/70">
            Update your profile information and avatar.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="space-y-3">
            <Label className="text-white">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20 border-2 border-gold/30">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-gold/20 text-gold text-lg">
                  {fullName.split(' ').map(n => n[0]).join('') || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="bg-black border-gold/30 text-white file:bg-gold file:text-black file:border-0 file:rounded file:px-3 file:py-1"
                />
                {avatarFile && (
                  <Button
                    type="button"
                    onClick={clearAvatar}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="bg-black border-gold/30 text-white focus:border-gold"
            />
          </div>

          {/* Bio (placeholder for future enhancement) */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white">Bio (Coming Soon)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-black border-gold/30 text-white focus:border-gold min-h-[80px]"
              disabled
            />
            <p className="text-white/50 text-xs">Bio functionality will be added in a future update.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold hover:bg-gold-light text-black font-semibold"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;