import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, subscribed } = useAuth();
  const success = searchParams.get('success');

  useEffect(() => {
    // Check subscription status when the page loads
    if (success === 'true') {
      // Small delay to ensure Stripe has processed the payment
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    }
  }, [success, checkSubscription]);

  if (success !== 'true') {
    navigate('/membership');
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <Card className="max-w-md w-full bg-charcoal border-green-500/30 shadow-xl">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-serif text-green-500">
            Welcome to Echelon Texas!
          </CardTitle>
          <CardDescription className="text-white/70 text-lg">
            Your subscription has been activated
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-white/80">
            Thank you for joining our exclusive community. You now have full access to all premium features and the member portal.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/portal')}
              className="w-full bg-gold hover:bg-gold-light text-black font-semibold py-4 text-lg"
              size="lg"
            >
              Enter Member Portal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-gold text-gold hover:bg-gold hover:text-black"
            >
              Return to Homepage
            </Button>
          </div>

          <div className="pt-4 border-t border-gold/20">
            <p className="text-white/60 text-sm">
              {subscribed 
                ? "✓ Subscription confirmed and active" 
                : "Verifying your subscription... This may take a moment."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;