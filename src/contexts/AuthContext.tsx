import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  email: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  handle: string | null
  membership_tier: 'basic' | 'premium' | 'elite' | null
  is_admin: boolean
  is_banned: boolean
  ban_reason: string | null
  age_verified: boolean
  safe_mode_enabled: boolean
  last_active: string | null
  is_moderator: boolean
  is_super_admin: boolean
  messaging_enabled: boolean
  story_privacy: 'public' | 'followers' | 'close_friends'
  last_seen: string | null
  navigate_to_portfolio: boolean
  created_at: string
  updated_at: string
  sdc_username?: string | null
  mutual_profile?: string | null
  fb_profile?: string | null
  trial_started_at?: string | null
  trial_ended_at?: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  subscribed: boolean
  subscriptionTier: string | null
  subscriptionEnd: string | null
  subscriptionLoading: boolean
  isTrialActive: boolean
  trialDaysRemaining: number
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  checkSubscription: () => Promise<void>
  createCheckout: () => Promise<void>
  manageSubscription: () => Promise<void>
  startTrial: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [isTrialActive, setIsTrialActive] = useState(false)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0)
  const { toast } = useToast()

  const getProfile = async (userId: string) => {
    try {
      console.log('getProfile called for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      console.log('Profile fetched successfully:', {
        id: data?.id,
        email: data?.email,
        navigate_to_portfolio: data?.navigate_to_portfolio,
        trial_started_at: data?.trial_started_at,
        trial_ended_at: data?.trial_ended_at,
        fullProfile: data
      });

      // If navigate_to_portfolio field doesn't exist, set it to false as default
      if (data && data.navigate_to_portfolio === undefined) {
        console.log('navigate_to_portfolio field not found, setting default to false');
        data.navigate_to_portfolio = false;
      }

      return data
    } catch (error) {
      console.error('Error in getProfile:', error)
      return null
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            fullName: fullName, // Adding both variants to ensure compatibility
          }
        }
      })

      if (error) throw error

      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Supabase authentication not configured yet.",
        variant: "destructive",
      })
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('signIn called for email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log('Sign in successful, user:', data.user?.id);

      // Update state immediately after successful login
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        setLoading(false);
        
        // Fetch profile
        console.log('Fetching profile for user:', data.user.id);
        const profile = await getProfile(data.user.id);
        setProfile(profile);
        
        console.log('Profile set, checking subscription immediately...');
        // Check subscription status immediately with the current session
        await checkSubscriptionWithSession(data.session, profile);
        
        // Small delay to ensure state updates are reflected
        setTimeout(() => {
          console.log('State update delay completed');
        }, 50);
      }

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      })
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error", 
        description: error.message || "Supabase authentication not configured yet.",
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // Clear state immediately to prevent UI issues
      setUser(null)
      setProfile(null)
      setSession(null)
      setSubscribed(false)
      setSubscriptionTier(null)
      setSubscriptionEnd(null)
      setLoading(false)

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error);
        // Don't throw error here, just log it since we've already cleared state
        console.warn('Supabase sign out failed, but local state cleared');
      }

      console.log('Sign out completed');
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      })
    } catch (error: any) {
      console.error('Error in signOut:', error);
      // Even if there's an error, clear the state
      setUser(null)
      setProfile(null)
      setSession(null)
      setSubscribed(false)
      setSubscriptionTier(null)
      setSubscriptionEnd(null)
      setLoading(false)
      
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      })
    }
  }

  const checkSubscriptionWithSession = async (session: Session, profile: Profile | null) => {
    console.log('checkSubscriptionWithSession called', {
      hasSession: !!session?.access_token,
      profile: profile ? {
        id: profile.id,
        navigate_to_portfolio: profile.navigate_to_portfolio,
        trial_started_at: profile.trial_started_at,
        trial_ended_at: profile.trial_ended_at
      } : null
    });

    if (!session?.access_token) {
      console.log('No session access token, setting defaults');
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setIsTrialActive(false);
      setTrialDaysRemaining(0);
      return;
    }

    try {
      setSubscriptionLoading(true);
      
      let hasActiveTrial = false;
      let hasActiveSubscription = false;
      
      // Check if user has an active trial
      if (profile?.trial_started_at && !profile?.trial_ended_at) {
        const trialStart = new Date(profile.trial_started_at);
        const trialEnd = new Date(trialStart.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
        const now = new Date();
        
        console.log('Trial check:', {
          trialStart: trialStart.toISOString(),
          trialEnd: trialEnd.toISOString(),
          now: now.toISOString(),
          isActive: now < trialEnd
        });
        
        if (now < trialEnd) {
          // Trial is still active
          hasActiveTrial = true;
          setIsTrialActive(true);
          setTrialDaysRemaining(Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
          setSubscribed(true); // Give full access during trial
          setSubscriptionTier('trial');
          setSubscriptionEnd(trialEnd.toISOString());
          console.log('Trial is active, setting subscribed to true');
        } else {
          // Trial has expired, end it
          console.log('Trial expired, ending it');
          await supabase
            .from('profiles')
            .update({ trial_ended_at: now.toISOString() })
            .eq('id', profile.id);
        }
      }

      // Check regular subscription if no active trial
      if (!hasActiveTrial) {
        console.log('Checking regular subscription...');
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Subscription check error:', error);
          throw error;
        }

        hasActiveSubscription = data.subscribed || false;
        setSubscribed(hasActiveSubscription);
        setSubscriptionTier(data.subscription_tier || null);
        setSubscriptionEnd(data.subscription_end || null);
        setIsTrialActive(false);
        setTrialDaysRemaining(0);
        console.log('Subscription check result:', {
          hasActiveSubscription,
          subscriptionTier: data.subscription_tier,
          subscriptionEnd: data.subscription_end
        });
      }

      // Update navigate_to_portfolio based on subscription/trial status
      const shouldNavigateToPortfolio = hasActiveTrial || hasActiveSubscription;
      console.log('Navigation logic:', {
        hasActiveTrial,
        hasActiveSubscription,
        shouldNavigateToPortfolio,
        currentNavigateToPortfolio: profile?.navigate_to_portfolio
      });

      if (profile && profile.navigate_to_portfolio !== shouldNavigateToPortfolio) {
        console.log('Updating navigate_to_portfolio in database:', shouldNavigateToPortfolio);
        await supabase
          .from('profiles')
          .update({ navigate_to_portfolio: shouldNavigateToPortfolio })
          .eq('id', profile.id);
        
        // Update local profile state
        setProfile(prev => prev ? { ...prev, navigate_to_portfolio: shouldNavigateToPortfolio } : null);
        console.log('Updated local profile state with navigate_to_portfolio:', shouldNavigateToPortfolio);
      } else {
        console.log('No need to update navigate_to_portfolio, already correct');
      }
      
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      // Set defaults on error
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setIsTrialActive(false);
      setTrialDaysRemaining(0);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const checkSubscription = async () => {
    console.log('checkSubscription called', {
      hasSession: !!session?.access_token,
      profile: profile ? {
        id: profile.id,
        navigate_to_portfolio: profile.navigate_to_portfolio,
        trial_started_at: profile.trial_started_at,
        trial_ended_at: profile.trial_ended_at
      } : null
    });

    if (!session?.access_token) {
      console.log('No session access token, setting defaults');
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setIsTrialActive(false);
      setTrialDaysRemaining(0);
      return;
    }

    try {
      setSubscriptionLoading(true);
      
      let hasActiveTrial = false;
      let hasActiveSubscription = false;
      
      // Check if user has an active trial
      if (profile?.trial_started_at && !profile?.trial_ended_at) {
        const trialStart = new Date(profile.trial_started_at);
        const trialEnd = new Date(trialStart.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
        const now = new Date();
        
        console.log('Trial check:', {
          trialStart: trialStart.toISOString(),
          trialEnd: trialEnd.toISOString(),
          now: now.toISOString(),
          isActive: now < trialEnd
        });
        
        if (now < trialEnd) {
          // Trial is still active
          hasActiveTrial = true;
          setIsTrialActive(true);
          setTrialDaysRemaining(Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
          setSubscribed(true); // Give full access during trial
          setSubscriptionTier('trial');
          setSubscriptionEnd(trialEnd.toISOString());
          console.log('Trial is active, setting subscribed to true');
        } else {
          // Trial has expired, end it
          console.log('Trial expired, ending it');
          await supabase
            .from('profiles')
            .update({ trial_ended_at: now.toISOString() })
            .eq('id', profile.id);
        }
      }

      // Check regular subscription if no active trial
      if (!hasActiveTrial) {
        console.log('Checking regular subscription...');
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('Subscription check error:', error);
          throw error;
        }

        hasActiveSubscription = data.subscribed || false;
        setSubscribed(hasActiveSubscription);
        setSubscriptionTier(data.subscription_tier || null);
        setSubscriptionEnd(data.subscription_end || null);
        setIsTrialActive(false);
        setTrialDaysRemaining(0);
        console.log('Subscription check result:', {
          hasActiveSubscription,
          subscriptionTier: data.subscription_tier,
          subscriptionEnd: data.subscription_end
        });
      }

      // Update navigate_to_portfolio based on subscription/trial status
      const shouldNavigateToPortfolio = hasActiveTrial || hasActiveSubscription;
      console.log('Navigation logic:', {
        hasActiveTrial,
        hasActiveSubscription,
        shouldNavigateToPortfolio,
        currentNavigateToPortfolio: profile?.navigate_to_portfolio
      });

      if (profile && profile.navigate_to_portfolio !== shouldNavigateToPortfolio) {
        console.log('Updating navigate_to_portfolio in database:', shouldNavigateToPortfolio);
        await supabase
          .from('profiles')
          .update({ navigate_to_portfolio: shouldNavigateToPortfolio })
          .eq('id', profile.id);
        
        // Update local profile state
        setProfile(prev => prev ? { ...prev, navigate_to_portfolio: shouldNavigateToPortfolio } : null);
        console.log('Updated local profile state with navigate_to_portfolio:', shouldNavigateToPortfolio);
      } else {
        console.log('No need to update navigate_to_portfolio, already correct');
      }
      
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      // Set defaults on error
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setIsTrialActive(false);
      setTrialDaysRemaining(0);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const startTrial = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to start your trial.",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          trial_started_at: now,
          trial_ended_at: null,
          navigate_to_portfolio: true
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setIsTrialActive(true);
      setTrialDaysRemaining(3);
      setSubscribed(true);
      setSubscriptionTier('trial');
      setSubscriptionEnd(new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString());
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, navigate_to_portfolio: true } : null);

      toast({
        title: "Trial Started!",
        description: "Your 3-day free trial has begun. Enjoy full access to Echelon TX!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start trial.",
        variant: "destructive",
      });
    }
  };

  const createCheckout = async () => {
    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "Please log in to subscribe.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Creating checkout session...');
      console.log('Session access token:', session.access_token ? 'Present' : 'Missing');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Checkout creation error:', error);
        throw error;
      }

      if (!data?.url) {
        console.error('No checkout URL in response:', data);
        throw new Error('No checkout URL received');
      }

      console.log('Opening checkout URL:', data.url);
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank')

      toast({
        title: "Redirecting to checkout",
        description: "Opening Stripe checkout in a new tab.",
      })
    } catch (error: any) {
      console.error('Error in createCheckout:', error);
      
      // Check if it's a function not found error
      if (error.message?.includes('Function not found') || error.message?.includes('404')) {
        toast({
          title: "Setup Required",
          description: "Stripe integration not configured. Please deploy the Supabase Edge Functions.",
          variant: "destructive",
        })
        
        // Show setup instructions
        setTimeout(() => {
          alert(`To enable Stripe checkout, you need to:

1. Install Supabase CLI: npm install -g supabase
2. Login: supabase login
3. Link project: supabase link --project-ref khmytjiytpgpkccwncvj
4. Set environment variables in Supabase Dashboard
5. Deploy functions: supabase functions deploy

See deploy-functions.md for detailed instructions.`);
        }, 1000);
        
      } else if (error.message?.includes('STRIPE_SECRET_KEY')) {
        toast({
          title: "Configuration Error",
          description: "Stripe secret key not configured in Supabase Edge Functions.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create checkout session.",
          variant: "destructive",
        })
      }
    }
  }

  const manageSubscription = async () => {
    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "Please log in to manage your subscription.",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      // Open customer portal in a new tab
      window.open(data.url, '_blank')

      toast({
        title: "Redirecting to customer portal",
        description: "Opening Stripe customer portal in a new tab.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal.",
        variant: "destructive",
      })
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : null)

      toast({
        title: "Success!",
        description: "Profile updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    let mounted = true;
    let isInitialized = false;
    let initTimeout: NodeJS.Timeout | null = null;
    
    const completeInitialization = () => {
      if (!isInitialized && mounted) {
        isInitialized = true;
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }
        console.log('Auth initialization complete');
        setLoading(false);
      }
    };
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Add a timeout to prevent infinite loading
        initTimeout = setTimeout(() => {
          if (mounted && !isInitialized) {
            console.warn('Auth initialization timeout, forcing completion');
            completeInitialization();
          }
        }, 10000); // 10 second timeout
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) {
          if (initTimeout) {
            clearTimeout(initTimeout);
            initTimeout = null;
          }
          return;
        }
        
        console.log('Session found:', session ? 'Yes' : 'No');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User found, fetching profile...');
          try {
            const profile = await getProfile(session.user.id);
            if (!mounted) {
              if (initTimeout) {
                clearTimeout(initTimeout);
                initTimeout = null;
              }
              return;
            }
            setProfile(profile);
            
            // Check subscription status immediately
            if (mounted) {
              await checkSubscriptionWithSession(session, profile);
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            // If profile fetch fails, it might be due to invalid session
            if (profileError.message?.includes('JWT') || profileError.message?.includes('token')) {
              console.log('Invalid session detected, clearing auth state');
              setSession(null);
              setUser(null);
              setProfile(null);
              setSubscribed(false);
              setSubscriptionTier(null);
              setSubscriptionEnd(null);
            }
            // Continue with initialization even if profile fetch fails
          }
        } else {
          console.log('No user found');
          setProfile(null);
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
        }
        
        // Complete initialization
        completeInitialization();
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        completeInitialization();
      }
    };

    initializeAuth();

    return () => { 
      mounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
        initTimeout = null;
      }
    };
  }, []);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
        
        // Don't process initial session event as it's handled by initializeAuth
        if (event === 'INITIAL_SESSION') {
          console.log('Skipping initial session event');
          return;
        }
        
        // For SIGNED_IN events during initialization, let initializeAuth handle it
        if (event === 'SIGNED_IN' && loading) {
          console.log('Skipping SIGNED_IN event during initialization');
          return;
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('Processing login event, fetching profile...');
          const profile = await getProfile(session.user.id)
          setProfile(profile)
          // Check subscription status when user logs in
          await checkSubscriptionWithSession(session, profile)
        } else {
          console.log('Processing logout event, clearing state...');
          setProfile(null)
          setSubscribed(false)
          setSubscriptionTier(null)
          setSubscriptionEnd(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    subscribed,
    subscriptionTier,
    subscriptionEnd,
    subscriptionLoading,
    isTrialActive,
    trialDaysRemaining,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkSubscription,
    createCheckout,
    manageSubscription,
    startTrial,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}