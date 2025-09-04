import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  membership_tier: 'basic' | 'premium' | 'elite' | null
  is_admin: boolean
  created_at: string
  updated_at: string
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
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  checkSubscription: () => Promise<void>
  createCheckout: () => Promise<void>
  manageSubscription: () => Promise<void>
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
  const { toast } = useToast()

  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProfile:', error)
      return null
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
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

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setSession(null)

      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
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

  const checkSubscription = async () => {
    if (!session?.access_token) return

    try {
      setSubscriptionLoading(true)
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      setSubscribed(data.subscribed || false)
      setSubscriptionTier(data.subscription_tier || null)
      setSubscriptionEnd(data.subscription_end || null)
    } catch (error: any) {
      console.error('Error checking subscription:', error)
    } finally {
      setSubscriptionLoading(false)
    }
  }

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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank')

      toast({
        title: "Redirecting to checkout",
        description: "Opening Stripe checkout in a new tab.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session.",
        variant: "destructive",
      })
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
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        getProfile(session.user.id).then(profile => {
          if (!mounted) return;
          setProfile(profile);
        });
        // Check subscription status after setting user
        setTimeout(() => {
          if (!mounted) return;
          checkSubscription();
        }, 100);
      }
      
      setLoading(false);
    }).catch((error) => {
      console.error('AuthContext: Error getting session:', error);
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profile = await getProfile(session.user.id)
          setProfile(profile)
          // Check subscription status when user logs in
          setTimeout(() => {
            checkSubscription()
          }, 100)
        } else {
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
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkSubscription,
    createCheckout,
    manageSubscription,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}