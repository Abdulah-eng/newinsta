import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Users, Shield, Sparkles } from "lucide-react";

const Membership = () => {
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

  const handleJoinClick = () => {
    // TODO: Integrate with Stripe Checkout
    alert("Stripe integration coming soon!");
  };

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-serif text-gold mb-6">
            Join Echelon Texas
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Become part of an exclusive community that values sophistication, privacy, and meaningful connections.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Membership Card */}
          <Card className="bg-charcoal border-gold/30 shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-gold" />
              </div>
              <CardTitle className="text-3xl font-serif text-gold">
                Digital Membership
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Full access to the Echelon Texas community
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  $20<span className="text-lg font-normal text-white/70">/month</span>
                </div>
                <p className="text-white/60">Billed monthly, cancel anytime</p>
              </div>

              <Button 
                onClick={handleJoinClick}
                className="w-full bg-gold hover:bg-gold-light text-black font-semibold py-6 text-lg"
                size="lg"
              >
                Join Echelon TX Now
              </Button>

              <p className="text-xs text-white/50 text-center">
                By joining, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>

          {/* Features List */}
          <div className="space-y-8">
            <h3 className="text-2xl font-serif text-gold mb-6">
              What's Included
            </h3>
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-gold/20">
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