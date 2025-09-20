import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useStories } from "@/contexts/StoriesContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database, Users, FileText, TestTube, Camera, Clock } from "lucide-react";
import RealtimeTest from "@/components/RealtimeTest";
import RealtimeDebugger from "@/components/RealtimeDebugger";
import SimpleRealtimeTest from "@/components/SimpleRealtimeTest";

const TestData = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createStory } = useStories();
  const { toast } = useToast();

  const samplePosts = [
    {
      content: "Welcome to Echelon TX Digital! This is a sample post to demonstrate the community feed functionality.",
      is_nsfw: false
    },
    {
      content: "Check out this amazing feature of our member portal. The real-time updates make discussions so much more engaging!",
      is_nsfw: false
    },
    {
      content: "This is an NSFW tagged post for testing the content filtering system. Members can toggle NSFW visibility in the feed.",
      is_nsfw: true
    },
    {
      content: "Pro tip: Use the create post feature to share your thoughts with the community. You can even add images to your posts!",
      is_nsfw: false
    },
    {
      content: "The member portal includes features like profile management, document access, and this community feed. Everything works in real-time!",
      is_nsfw: false
    }
  ];

  const sampleStories = [
    {
      content: "Just arrived at Echelon TX! The atmosphere here is incredible 🏛️",
      isNsfw: false
    },
    {
      content: "Testing the story feature - this will disappear in 24 hours!",
      isNsfw: false
    },
    {
      content: "NSFW test story - this should be marked appropriately",
      isNsfw: true
    },
    {
      content: "Story with emoji test 🎉✨💫",
      isNsfw: false
    }
  ];

  const createSamplePosts = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create test posts.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const postsToCreate = samplePosts.map(post => ({
        ...post,
        author_id: user.id
      }));

      const { error } = await supabase
        .from('posts')
        .insert(postsToCreate);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Created ${samplePosts.length} sample posts!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sample posts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllPosts = async () => {
    if (!user) {
      toast({
        title: "Error", 
        description: "You must be logged in to clear posts.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('author_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cleared all your posts!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear posts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSampleStories = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create test stories.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      for (const story of sampleStories) {
        await createStory(story.content, undefined, undefined, story.isNsfw);
      }

      toast({
        title: "Success",
        description: `Created ${sampleStories.length} sample stories!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sample stories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllStories = async () => {
    if (!user) {
      toast({
        title: "Error", 
        description: "You must be logged in to clear stories.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('author_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cleared all your stories!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear stories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Database,
      title: "Community Feed",
      description: "Real-time post sharing with NSFW filtering, like/share functionality, and live updates.",
      testAction: "Create sample posts to test the feed"
    },
    {
      icon: Camera,
      title: "Stories Feature",
      description: "Instagram-like 24-hour stories with NSFW filtering, auto-expire, and viewer tracking.",
      testAction: "Create sample stories to test the feature"
    },
    {
      icon: Users,
      title: "Profile Management", 
      description: "Edit profile information, view post history, and manage account settings.",
      testAction: "Visit your profile page to test features"
    },
    {
      icon: FileText,
      title: "Document Access",
      description: "Access membership documents, policies, and important information.",
      testAction: "Documents section has sample content ready"
    },
    {
      icon: TestTube,
      title: "Admin Features",
      description: "Admin dashboard with user management (only visible to admins).",
      testAction: "Admin status controls portal access"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-gold mb-4">Portal Test Environment</h1>
        <p className="text-white/70">
          This test environment lets you explore all member portal features with sample data and functionality.
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="bg-charcoal border-gold/20 mb-8">
        <CardHeader>
          <CardTitle className="text-gold flex items-center">
            <TestTube className="w-5 h-5 mr-2" />
            Quick Test Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-white font-medium">Posts Testing</h4>
              <div className="flex gap-2">
                <Button
                  onClick={createSamplePosts}
                  disabled={loading}
                  className="bg-gold text-black hover:bg-gold/90 flex-1"
                >
                  {loading ? "Creating..." : "Create Posts"}
                </Button>
                <Button
                  onClick={clearAllPosts}
                  disabled={loading}
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/20"
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-medium">Stories Testing</h4>
              <div className="flex gap-2">
                <Button
                  onClick={createSampleStories}
                  disabled={loading}
                  className="bg-gold text-black hover:bg-gold/90 flex-1"
                >
                  {loading ? "Creating..." : "Create Stories"}
                </Button>
                <Button
                  onClick={clearAllStories}
                  disabled={loading}
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/20"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-3">
            Use these actions to populate or clear test data for exploring portal features.
          </p>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature, index) => (
          <Card key={index} className="bg-charcoal border-gold/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <feature.icon className="w-5 h-5 mr-2 text-gold" />
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 mb-3">{feature.description}</p>
              <p className="text-gold text-sm font-medium">{feature.testAction}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Messaging Test */}
      <Card className="bg-charcoal border-gold/20 mt-8">
        <CardHeader>
          <CardTitle className="text-gold">Real-time Messaging Test</CardTitle>
        </CardHeader>
        <CardContent>
          <RealtimeTest />
        </CardContent>
      </Card>

      {/* Real-time Debugger */}
      <Card className="bg-charcoal border-gold/20 mt-8">
        <CardHeader>
          <CardTitle className="text-gold">Real-time Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <RealtimeDebugger />
        </CardContent>
      </Card>

      {/* Simple Real-time Test */}
      <Card className="bg-charcoal border-gold/20 mt-8">
        <CardHeader>
          <CardTitle className="text-gold">Simple Real-time Test</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleRealtimeTest />
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card className="bg-charcoal border-gold/20 mt-8">
        <CardHeader>
          <CardTitle className="text-gold">Testing Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">1. Feed Testing</h4>
            <p className="text-white/60 text-sm">
              Create sample posts above, then visit the Feed page to see real-time updates, NSFW filtering, and interaction features.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">2. Stories Testing</h4>
            <p className="text-white/60 text-sm">
              Create sample stories above, then visit the Feed page to see Instagram-like story functionality with 24-hour auto-expire and NSFW filtering.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">3. Profile Testing</h4>
            <p className="text-white/60 text-sm">
              Visit your Profile page to edit information, view your posts, and test the profile update functionality.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">4. Create Post/Story Testing</h4>
            <p className="text-white/60 text-sm">
              Use the Create Post and Create Story pages to test content creation, image uploads, and NSFW tagging features.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">5. Documents Testing</h4>
            <p className="text-white/60 text-sm">
              The Documents section has sample policy documents ready for testing download and view functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestData;