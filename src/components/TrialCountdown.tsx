import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrialCountdown = () => {
  const { isTrialActive, trialDaysRemaining, subscriptionEnd, createCheckout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (!isTrialActive || !subscriptionEnd) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(subscriptionEnd).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`);
        } else if (hours > 0) {
          setTimeLeft(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`);
        } else {
          setTimeLeft(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }

        // Show warning if less than 24 hours remaining
        setIsExpiringSoon(difference < 24 * 60 * 60 * 1000);
      } else {
        setTimeLeft('Trial expired');
        setIsExpiringSoon(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isTrialActive, subscriptionEnd]);

  if (!isTrialActive) return null;

  return (
    <Card className={`mb-6 ${isExpiringSoon ? 'border-orange-500/50 bg-orange-500/10' : 'border-blue-500/50 bg-blue-500/10'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isExpiringSoon ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
              {isExpiringSoon ? (
                <AlertTriangle className={`w-5 h-5 ${isExpiringSoon ? 'text-orange-500' : 'text-blue-500'}`} />
              ) : (
                <Clock className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${isExpiringSoon ? 'text-orange-500' : 'text-blue-500'}`}>
                {isExpiringSoon ? 'Trial Expiring Soon!' : 'Free Trial Active'}
              </h3>
              <p className="text-white/80 text-sm">
                {isExpiringSoon 
                  ? `Your trial ends in ${timeLeft}. Add payment method to continue.`
                  : `${timeLeft} remaining in your free trial`
                }
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={createCheckout}
              size="sm"
              className={`${isExpiringSoon 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isExpiringSoon ? 'Add Payment' : 'Subscribe Now'}
            </Button>
            
            <Link to="/membership">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialCountdown;
