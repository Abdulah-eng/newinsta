import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Activity } from 'lucide-react';

const RealtimeDebugger: React.FC = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('Not connected');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<{
    databaseConnected: boolean;
    realtimeEnabled: boolean;
    subscriptionWorking: boolean;
    messagesReceived: number;
  }>({
    databaseConnected: false,
    realtimeEnabled: false,
    subscriptionWorking: false,
    messagesReceived: 0
  });

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('count')
        .limit(1);
      
      setTestResults(prev => ({ ...prev, databaseConnected: !error }));
      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      setTestResults(prev => ({ ...prev, databaseConnected: false }));
      return false;
    }
  };

  // Test real-time publication
  const testRealtimeEnabled = async () => {
    try {
      const { data, error } = await supabase
        .rpc('test_realtime_publication');
      
      setTestResults(prev => ({ ...prev, realtimeEnabled: !error }));
      return !error;
    } catch (error) {
      console.error('Real-time test failed:', error);
      setTestResults(prev => ({ ...prev, realtimeEnabled: false }));
      return false;
    }
  };

  // Create a test subscription
  const createTestSubscription = () => {
    if (!user) return;

    console.log('🔍 Creating test subscription...');
    
    const channel = supabase
      .channel('test_direct_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
        },
        (payload) => {
          console.log('🎉 TEST: Real-time message received:', payload);
          setEvents(prev => [...prev, {
            id: Date.now(),
            type: 'INSERT',
            data: payload.new,
            timestamp: new Date().toLocaleTimeString()
          }]);
          setTestResults(prev => ({ 
            ...prev, 
            subscriptionWorking: true,
            messagesReceived: prev.messagesReceived + 1
          }));
        }
      )
      .subscribe((status) => {
        console.log('Test subscription status:', status);
        setSubscriptionStatus(status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return channel;
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
          content: `Debug test message - ${new Date().toISOString()}`
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

  // Run all tests
  const runAllTests = async () => {
    console.log('🔍 Running comprehensive real-time tests...');
    await testDatabaseConnection();
    await testRealtimeEnabled();
    createTestSubscription();
  };

  // Clear events
  const clearEvents = () => {
    setEvents([]);
  };

  useEffect(() => {
    if (user) {
      runAllTests();
    }
  }, [user]);

  if (!user) {
    return <div>Please log in to test real-time messaging</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Real-time Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Results */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span>Database:</span>
              {testResults.databaseConnected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>Real-time:</span>
              {testResults.realtimeEnabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>Subscription:</span>
              {testResults.subscriptionWorking ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>Messages:</span>
              <Badge variant="outline">{testResults.messagesReceived}</Badge>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {subscriptionStatus}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button onClick={runAllTests} variant="outline">
              Run Tests
            </Button>
            <Button onClick={sendTestMessage} className="bg-green-600 hover:bg-green-700">
              Send Test Message
            </Button>
            <Button onClick={clearEvents} variant="outline">
              Clear Events
            </Button>
          </div>

          {/* Events Log */}
          <div>
            <h4 className="font-medium mb-2">Real-time Events ({events.length})</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {events.length === 0 ? (
                <p className="text-sm text-gray-500">No events received yet</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="text-xs bg-gray-100 p-2 rounded">
                    <div className="font-mono">
                      [{event.timestamp}] {event.type}: {event.data.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeDebugger;
