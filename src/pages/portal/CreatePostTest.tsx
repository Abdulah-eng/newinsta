import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const CreatePostTest = () => {
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
    console.log('Form submitted!', { content, image, isNsfw });
    
    toast({
      title: "Test Success!",
      description: `Content: "${content}", NSFW: ${isNsfw}, Image: ${image ? image.name : 'None'}`,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-charcoal border-gold/20">
        <CardHeader>
          <CardTitle className="text-gold font-serif">Create New Post - TEST</CardTitle>
          <CardDescription className="text-white/70">
            Test form to verify functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-2 bg-gray-800 rounded text-sm text-white">
            Debug: User: {user ? 'Logged in' : 'Not logged in'}, Subscribed: {subscribed ? 'Yes' : 'No'}
          </div>
          
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

            <div className="space-y-2">
              <p className="text-white/60 text-sm">
                NSFW Status: {isNsfw ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-black font-semibold disabled:opacity-50 py-3 text-lg transition-all duration-200"
            >
              {loading ? "Creating Post..." : "Create Post - TEST"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePostTest;
