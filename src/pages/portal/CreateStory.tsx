import React, { useState, useRef } from 'react';
import { useStories } from '../../contexts/StoriesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { Upload, X, Image, Video, AlertTriangle } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

const CreateStory: React.FC = () => {
  const { user } = useAuth();
  const { createStory, isLoading } = useStories();
  
  const [content, setContent] = useState('');
  const [isNsfw, setIsNsfw] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image or video file (JPEG, PNG, GIF, MP4)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    const filePath = `stories/${fileName}`;

    const { data, error } = await supabase.storage
      .from('stories')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) {
      setError('Please add content or upload a file');
      return;
    }

    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      if (selectedFile) {
        setUploadProgress(25);
        const uploadedUrl = await uploadFile(selectedFile);
        setUploadProgress(50);

        if (selectedFile.type.startsWith('image/')) {
          imageUrl = uploadedUrl;
        } else if (selectedFile.type.startsWith('video/')) {
          videoUrl = uploadedUrl;
        }
        setUploadProgress(75);
      }

      await createStory(content.trim(), imageUrl, videoUrl, isNsfw);
      setUploadProgress(100);

      // Reset form
      setContent('');
      setIsNsfw(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Story created successfully!');
    } catch (err) {
      console.error('Error creating story:', err);
      setError(err instanceof Error ? err.message : 'Failed to create story');
      toast.error('Failed to create story');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isVideo = selectedFile?.type.startsWith('video/');
  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gold font-serif">Create Story</h1>
          <p className="text-white/70">Share a moment that disappears in 24 hours</p>
        </div>

        <Card className="bg-charcoal border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold font-serif">New Story</CardTitle>
            <CardDescription className="text-white/70">
              Your story will be visible to other members for 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* File Upload */}
            <div className="space-y-4">
              <Label className="text-white">Add Media (Optional)</Label>
              <div className="border-2 border-dashed border-gold/30 rounded-lg p-6 text-center hover:border-gold/50 transition-colors bg-black/20">
                {previewUrl ? (
                  <div className="space-y-4">
                    {isImage && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    )}
                    {isVideo && (
                      <video
                        src={previewUrl}
                        controls
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    )}
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Change File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-gold/60">
                      {isVideo ? (
                        <Video className="h-12 w-12 mx-auto" />
                      ) : (
                        <Image className="h-12 w-12 mx-auto" />
                      )}
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gold/50 text-gold hover:bg-gold/20"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image or Video
                      </Button>
                    </div>
                    <p className="text-sm text-white/60">
                      Supports JPEG, PNG, GIF, MP4 up to 50MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white">Story Content</Label>
              <Textarea
                id="content"
                placeholder="What's happening? Share your moment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={500}
                className="bg-black border-gold/30 text-white focus:border-gold"
              />
              <div className="text-right text-sm text-white/60">
                {content.length}/500 characters
              </div>
            </div>

            {/* NSFW Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="nsfw"
                checked={isNsfw}
                onCheckedChange={setIsNsfw}
              />
              <Label htmlFor="nsfw" className="text-sm text-white">
                Mark NSFW content appropriately
              </Label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setContent('');
                  setIsNsfw(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="border-gold/50 text-gold hover:bg-gold/20"
              >
                Clear
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading || isLoading || (!content.trim() && !selectedFile)}
                className="bg-gold hover:bg-gold-light text-black font-semibold"
              >
                {isUploading ? 'Creating...' : 'Create Story'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Story Guidelines */}
        <Card className="mt-6 bg-charcoal border-gold/20">
          <CardHeader>
            <CardTitle className="text-lg text-gold font-serif">Story Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/70">
              Mark NSFW content appropriately
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateStory;