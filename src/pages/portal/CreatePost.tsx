import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const CreatePost = ({ onPostCreated }: { onPostCreated?: () => void }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isNsfw, setIsNsfw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, subscribed } = useAuth();
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleNsfwChange = (checked: boolean) => {
    console.log('NSFW toggle clicked:', checked);
    setIsNsfw(checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post.",
        variant: "destructive",
      });
      return;
    }

    if (!subscribed) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to create posts.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your post.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, image);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        
        imageUrl = data.publicUrl;
      }

      // Create post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
          is_nsfw: isNsfw,
        });

      if (postError) throw postError;

      toast({
        title: "Success!",
        description: "Your post has been created.",
      });

      // Reset form
      setContent("");
      setImage(null);
      setIsNsfw(false);
      
      // Reset file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-charcoal border-gold/20">
      <CardHeader>
        <CardTitle className="text-gold font-serif">Create New Post</CardTitle>
        <CardDescription className="text-white/70">
          Share your thoughts with the Echelon Texas community
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!subscribed ? (
          <div className="text-center py-8">
            <p className="text-white/60 mb-4">
              You need an active subscription to create posts and interact with the community.
            </p>
            <Button 
              onClick={() => window.location.href = '/membership'}
              className="bg-gold hover:bg-gold-light text-black font-semibold"
            >
              Subscribe to Echelon Texas
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white font-medium">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-black border-gold/30 text-white focus:border-gold min-h-[120px] resize-none"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-upload" className="text-white font-medium">Image (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-black border-gold/30 text-white focus:border-gold file:bg-gold file:text-black file:border-0 file:rounded file:px-3 file:py-1 file:mr-3"
                />
                <Upload className="text-gold h-4 w-4" />
              </div>
              {image && (
                <p className="text-white/60 text-sm">Selected: {image.name}</p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox 
                id="nsfw" 
                checked={isNsfw}
                onCheckedChange={handleNsfwChange}
                className="border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:text-black data-[state=checked]:border-gold"
              />
              <Label 
                htmlFor="nsfw" 
                className="text-white text-sm cursor-pointer select-none"
              >
                Mark as NSFW (Not Safe For Work)
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-black font-semibold disabled:opacity-50 py-3 text-lg transition-all duration-200"
            >
              {loading ? "Creating Post..." : "Create Post"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatePost;