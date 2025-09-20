import React, { useState } from 'react';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RealtimeTest: React.FC = () => {
  const { user } = useAuth();
  const { testRealtimeMessage, subscribeToMessages, unsubscribeFromMessages } = useMessaging();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = () => {
    subscribeToMessages();
    setIsSubscribed(true);
  };

  const handleUnsubscribe = () => {
    unsubscribeFromMessages();
    setIsSubscribed(false);
  };

  const handleTestMessage = () => {
    testRealtimeMessage();
  };

  if (!user) {
    return <div>Please log in to test real-time messaging</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Real-time Messaging Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <span>Status:</span>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Subscribed" : "Not Subscribed"}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handleSubscribe} 
            disabled={isSubscribed}
            className="w-full"
          >
            Subscribe to Real-time
          </Button>
          
          <Button 
            onClick={handleUnsubscribe} 
            disabled={!isSubscribed}
            variant="outline"
            className="w-full"
          >
            Unsubscribe
          </Button>
          
          <Button 
            onClick={handleTestMessage}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Send Test Message
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>1. Click "Subscribe to Real-time"</p>
          <p>2. Click "Send Test Message"</p>
          <p>3. Check console for real-time events</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeTest;
