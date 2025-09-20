import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SimpleRealtimeTest: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Create a simple subscription that logs ALL events
  const createSimpleSubscription = () => {
    if (!user) return;

    console.log('🔍 Creating SIMPLE real-time subscription...');
    
    const channel = supabase
      .channel('simple_test')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to ALL events
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          console.log('🎉 SIMPLE TEST: Real-time event received:', payload);
          setEvents(prev => [...prev, {
            id: Date.now(),
            event: payload.eventType,
            data: payload.new || payload.old,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      )
      .subscribe((status) => {
        console.log('Simple subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    setSubscription(channel);
  };

  // Send test message
  const sendTestMessage = async () => {
    if (!user) return;

    try {
      console.log('🧪 Sending test message...');
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: user.id,
          content: `Simple test message - ${new Date().toISOString()}`
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Test message failed:', error);
      } else {
        console.log('✅ Test message sent:', data);
      }
    } catch (err) {
      console.error('❌ Test message error:', err);
    }
  };

  // Cleanup
  const cleanup = () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  if (!user) {
    return <div>Please log in to test real-time messaging</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Simple Real-time Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={createSimpleSubscription}
            disabled={isSubscribed}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe to ALL Events'}
          </Button>
          <Button 
            onClick={sendTestMessage}
            className="bg-green-600 hover:bg-green-700"
          >
            Send Test Message
          </Button>
          <Button 
            onClick={cleanup}
            variant="outline"
          >
            Cleanup
          </Button>
        </div>

        <div>
          <h4 className="font-medium mb-2">Events Received ({events.length})</h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">No events received yet</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="text-xs bg-gray-100 p-2 rounded">
                  <div className="font-mono">
                    [{event.timestamp}] {event.event}: {JSON.stringify(event.data)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>This test listens to ALL events on direct_messages table.</p>
          <p>If you see events here but not in the main app, the issue is in the filtering logic.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleRealtimeTest;
