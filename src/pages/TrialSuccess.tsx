import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TrialSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, subscribed, isTrialActive, subscriptionLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const trialStarted = searchParams.get('trial_started');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const processTrialSuccess = async () => {
      if (trialStarted === 'true' || sessionId) {
        try {
          console.log('Processing trial success...');
          
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setError('User not authenticated');
            setIsProcessing(false);
            return;
          }

          // Update profile immediately
          const now = new Date().toISOString();
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              trial_started_at: now,
              trial_ended_at: null,
              navigate_to_portfolio: true,
              updated_at: now
            })
            .eq('id', user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
            setError('Failed to update profile');
          } else {
            console.log('Profile updated successfully');
          }

          // Update subscribers table - only if this is actually a trial start
          // The webhook should handle this, but we'll set it here for trial users
          const { error: subscriberError } = await supabase
            .from('subscribers')
            .upsert({
              email: user.email,
              user_id: user.id,
              subscribed: true, // This is correct for trial users
              subscription_tier: 'premium', // Use 'premium' to match webhook handlers
              subscription_end: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
              updated_at: now
            }, { onConflict: 'email' });

          if (subscriberError) {
            console.error('Error updating subscribers:', subscriberError);
          } else {
            console.log('Subscribers table updated successfully');
          }

          // Wait a moment for state to update
          setTimeout(async () => {
            await checkSubscription();
            setIsProcessing(false);
            
            // Redirect to portal after processing
            setTimeout(() => {
              navigate('/portal', { replace: true });
            }, 2000);
          }, 1000);

        } catch (err) {
          console.error('Error processing trial success:', err);
          setError('Failed to process trial');
          setIsProcessing(false);
        }
      } else {
        navigate('/membership');
      }
    };

    processTrialSuccess();
  }, [trialStarted, sessionId, checkSubscription, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <Card className="max-w-md w-full bg-charcoal border-red-500/30 shadow-xl">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              Error Processing Trial
            </h2>
            <p className="text-white/70 mb-4">
              {error}
            </p>
            <Button 
              onClick={() => navigate('/membership')}
              className="w-full"
            >
              Return to Membership
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <Card className="max-w-md w-full bg-charcoal border-green-500/30 shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-green-500 animate-spin" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Setting Up Your Trial
            </h2>
            <p className="text-white/70">
              Please wait while we activate your 3-day free trial...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <Card className="max-w-md w-full bg-charcoal border-green-500/30 shadow-xl">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-serif text-green-500">
            Trial Started Successfully!
          </CardTitle>
          <CardDescription className="text-white/70 text-lg">
            Your 3-day free trial has begun
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-white/80">
            Enjoy full access to all premium features during your trial period. 
            You won't be charged until the trial ends.
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
              ✓ Trial activated and account updated
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialSuccess;
