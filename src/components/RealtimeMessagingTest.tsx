import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RealtimeMessagingTest: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    sendMessage, 
    selectConversation, 
    loadConversations,
    subscribeToMessages,
    unsubscribeFromMessages 
  } = useMessaging();
  
  const [testMessage, setTestMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('Not connected');
  const [realTimeEvents, setRealTimeEvents] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
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
      const { data, error } = await supabase.rpc('check_realtime_publication', {
        table_name: 'direct_messages'
      });
      
      setTestResults(prev => ({ ...prev, realtimeEnabled: !error && data }));
      return !error && data;
    } catch (error) {
      console.error('Real-time test failed:', error);
      setTestResults(prev => ({ ...prev, realtimeEnabled: false }));
      return false;
    }
  };

  // Send test message
  const sendTestMessage = async () => {
    if (!user || !testMessage.trim()) return;

    try {
      console.log('Sending test message:', testMessage);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: user.id, // Send to self for testing
          content: testMessage.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending test message:', error);
      } else {
        console.log('Test message sent successfully:', data);
        setTestMessage('');
        setTestResults(prev => ({ ...prev, messagesReceived: prev.messagesReceived + 1 }));
      }
    } catch (error) {
      console.error('Error in sendTestMessage:', error);
    }
  };

  // Test subscription manually
  const testSubscription = () => {
    if (!user) return;

    console.log('Testing real-time subscription...');
    
    const testChannel = supabase
      .channel('test_messaging_subscription')
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
          setRealTimeEvents(prev => [...prev, {
            id: Date.now(),
            type: 'INSERT',
            data: payload.new,
            timestamp: new Date().toLocaleTimeString()
          }]);
          setTestResults(prev => ({ ...prev, subscriptionWorking: true }));
        }
      )
      .subscribe((status) => {
        console.log('Test subscription status:', status);
        setSubscriptionStatus(status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    // Clean up after 10 seconds
    setTimeout(() => {
      testChannel.unsubscribe();
    }, 10000);
  };

  // Run all tests
  const runAllTests = async () => {
    console.log('Running comprehensive real-time messaging tests...');
    
    await testDatabaseConnection();
    await testRealtimeEnabled();
    testSubscription();
  };

  // Clear events
  const clearEvents = () => {
    setRealTimeEvents([]);
  };

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      runAllTests();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-gold flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Real-time Messaging Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/70">Please log in to test real-time messaging.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-charcoal border-gold/20">
      <CardHeader>
        <CardTitle className="text-gold flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Real-time Messaging Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            {testResults.databaseConnected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">Database</span>
          </div>
          <div className="flex items-center space-x-2">
            {testResults.realtimeEnabled ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">Real-time</span>
          </div>
          <div className="flex items-center space-x-2">
            {testResults.subscriptionWorking ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="text-sm">Subscription</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-gold">
              {testResults.messagesReceived} messages
            </Badge>
          </div>
        </div>

        {/* Status */}
        <div className="text-sm">
          <div><strong>User ID:</strong> {user.id}</div>
          <div><strong>Subscription Status:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              subscriptionStatus === 'SUBSCRIBED' ? 'bg-green-100 text-green-800' : 
              subscriptionStatus === 'CHANNEL_ERROR' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {subscriptionStatus}
            </span>
          </div>
          <div><strong>Conversations:</strong> {conversations.length}</div>
          <div><strong>Messages:</strong> {messages.length}</div>
        </div>

        {/* Test Controls */}
        <div className="flex gap-2">
          <Button onClick={runAllTests} className="bg-gold text-black hover:bg-gold/90">
            Run Tests
          </Button>
          <Button onClick={testSubscription} variant="outline" className="border-gold/50 text-gold">
            Test Subscription
          </Button>
          <Button onClick={clearEvents} variant="outline" className="border-gold/50 text-gold">
            Clear Events
          </Button>
        </div>

        {/* Test Message Input */}
        <div className="flex gap-2">
          <Input
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Type a test message..."
            className="flex-1 bg-white/10 border-gold/30 text-white placeholder:text-white/50"
            onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          />
          <Button 
            onClick={sendTestMessage} 
            disabled={!testMessage.trim()}
            className="bg-gold text-black hover:bg-gold/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Real-time Events */}
        {realTimeEvents.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-gold">Real-time Events ({realTimeEvents.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {realTimeEvents.map((event) => (
                <div key={event.id} className="p-3 bg-gray-800 rounded text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div><strong>Type:</strong> {event.type}</div>
                      <div><strong>Content:</strong> {event.data?.content}</div>
                      <div><strong>From:</strong> {event.data?.sender_id}</div>
                      <div><strong>To:</strong> {event.data?.recipient_id}</div>
                    </div>
                    <div className="text-xs text-gray-400">{event.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Messages */}
        {messages.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-gold">Recent Messages ({messages.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.slice(-5).map((message) => (
                <div key={message.id} className="p-3 bg-gray-800 rounded text-sm">
                  <div><strong>Content:</strong> {message.content}</div>
                  <div><strong>From:</strong> {message.sender_id}</div>
                  <div><strong>To:</strong> {message.recipient_id}</div>
                  <div><strong>Time:</strong> {new Date(message.created_at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400">
          <p>This test component verifies real-time messaging functionality.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeMessagingTest;
