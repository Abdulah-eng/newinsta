import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Users, Shield, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Membership = () => {
  const { 
    user, 
    subscribed, 
    subscriptionTier, 
    subscriptionEnd, 
    subscriptionLoading,
    createCheckout, 
    manageSubscription,
    checkSubscription 
  } = useAuth();
  const features = [
    "Exclusive member community access",
    "Premium networking opportunities", 
    "Early access to events and announcements",
    "Private member feed and interactions",
    "Secure, verified member directory",
    "Priority booking for club amenities",
    "Access to member-only content",
    "24/7 concierge support"
  ];

  const handleSubscribe = () => {
    if (!user) {
      alert("Please log in first to subscribe");
      return;
    }
    createCheckout();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-serif text-primary mb-6">
            {subscribed ? "Your Membership" : "Join Echelon Texas"}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {subscribed 
              ? "Manage your exclusive membership and enjoy all premium benefits."
              : "Become part of an exclusive community that values sophistication, privacy, and meaningful connections."
            }
          </p>
          
          {/* Subscription Status Display */}
          {user && (
            <div className="mt-8 p-4 rounded-lg bg-card/50 border border-primary/20 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${subscribed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-white font-medium">
                  {subscribed ? 'Active Member' : 'Not Subscribed'}
                </span>
              </div>
              {subscribed && subscriptionEnd && (
                <p className="text-white/60 text-sm">
                  Renews on {formatDate(subscriptionEnd)}
                </p>
              )}
              <Button
                onClick={checkSubscription}
                disabled={subscriptionLoading}
                variant="ghost"
                size="sm"
                className="mt-2 text-primary hover:text-primary/80"
              >
                {subscriptionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Membership Card */}
          <Card className={`bg-card shadow-xl ${subscribed ? 'border-green-500/30' : 'border-primary/30'}`}>
            <CardHeader className="text-center pb-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                subscribed ? 'bg-green-500/20' : 'bg-primary/20'
              }`}>
                <Crown className={`w-8 h-8 ${subscribed ? 'text-green-500' : 'text-primary'}`} />
              </div>
              <CardTitle className={`text-3xl font-serif ${subscribed ? 'text-green-500' : 'text-primary'}`}>
                {subscribed ? '✓ Active Member' : 'Digital Membership'}
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                {subscribed 
                  ? 'You have full access to the Echelon Texas community'
                  : 'Full access to the Echelon Texas community'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  $20<span className="text-lg font-normal text-white/70">/month</span>
                </div>
                <p className="text-white/60">Billed monthly, cancel anytime</p>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <Link to="/login">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg">
                      Sign In to Subscribe
                    </Button>
                  </Link>
                  <p className="text-white/60 text-center text-sm">
                    Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up here</Link>
                  </p>
                </div>
              ) : subscribed ? (
                <div className="space-y-4">
                  <Button 
                    onClick={manageSubscription}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                    size="lg"
                  >
                    Manage Subscription
                  </Button>
                  <Link to="/portal">
                    <Button 
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Go to Member Portal
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button 
                  onClick={handleSubscribe}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                  size="lg"
                >
                  Join Echelon TX Now
                </Button>
              )}

              <p className="text-xs text-white/50 text-center">
                By joining, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>

          {/* Features List */}
          <div className="space-y-8">
            <h3 className="text-2xl font-serif text-primary mb-6">
              What's Included
            </h3>
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-primary/20">
              <h4 className="text-lg font-semibold text-white mb-4">
                Coming Soon: Physical Club
              </h4>
              <p className="text-white/70">
                Members will receive exclusive early access and special rates when our luxury physical location opens in Texas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;