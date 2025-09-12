import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface ReportWithRelations extends Report {
  reporter?: Profile | null;
  reported_user?: Profile | null;
  reported_post?: {
    id: string;
    content: string;
    image_url?: string | null;
    author_id: string;
    created_at: string;
  } | null;
  resolved_by_user?: Profile | null;
}
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type AdminAction = Database['public']['Tables']['admin_actions']['Row'];
type UserRestriction = Database['public']['Tables']['user_restrictions']['Row'];
type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

interface UserWithStats extends Profile {
  post_count: number;
  follower_count: number;
  following_count: number;
  last_login: string;
  subscription_status: string;
  stripe_customer_id?: string | null;
}

interface AdminContextType {
  // Data
  users: UserWithStats[];
  reports: ReportWithRelations[];
  adminActions: AdminAction[];
  auditLogs: AuditLog[];
  userRestrictions: UserRestriction[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // User management
  loadUsers: () => Promise<void>;
  banUser: (userId: string, reason: string, duration?: number) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  hideUser: (userId: string, reason: string) => Promise<void>;
  unhideUser: (userId: string) => Promise<void>;
  setAgeVerified: (userId: string, verified: boolean) => Promise<void>;
  grantRole: (userId: string, role: 'admin' | 'moderator' | 'super_admin', expiresAt?: string) => Promise<void>;
  revokeRole: (userId: string, role: string) => Promise<void>;
  
  // Report management
  loadReports: () => Promise<void>;
  resolveReport: (reportId: string, action: 'actioned' | 'dismissed', adminNotes?: string) => Promise<void>;
  
  // Content management
  hidePost: (postId: string, reason: string) => Promise<void>;
  unhidePost: (postId: string) => Promise<void>;
  deletePost: (postId: string, reason: string) => Promise<void>;
  
  // Restrictions
  loadUserRestrictions: () => Promise<void>;
  addRestriction: (userId: string, type: 'posting' | 'messaging' | 'commenting' | 'all', reason: string, expiresAt?: string) => Promise<void>;
  removeRestriction: (restrictionId: string) => Promise<void>;
  
  // Audit logging
  loadAuditLogs: () => Promise<void>;
  logAction: (actionType: string, targetType: string, targetId?: string, details?: any) => Promise<void>;
  
  // Stripe integration
  getStripeCustomer: (customerId: string) => Promise<any>;
  openCustomerPortal: (customerId: string) => Promise<string>;
  
  // Real-time
  subscribeToAdminUpdates: () => void;
  unsubscribeFromAdminUpdates: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [reports, setReports] = useState<ReportWithRelations[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userRestrictions, setUserRestrictions] = useState<UserRestriction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Check if user is admin
  const isAdmin = profile?.is_admin || profile?.is_moderator || profile?.is_super_admin;

  // Load users with stats
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process users with stats by fetching counts separately
      const processedUsers: UserWithStats[] = await Promise.all(
        (data || []).map(async (user) => {
          // Get post count
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', user.id);

          // Get follower count
          const { count: followerCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user.id);

          // Get following count
          const { count: followingCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id);

          return {
            ...user,
            post_count: postCount || 0,
            follower_count: followerCount || 0,
            following_count: followingCount || 0,
            last_login: user.last_active || user.created_at,
            subscription_status: 'active' // This would come from Stripe integration
          };
        })
      );

      setUsers(processedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Ban user
  const banUser = useCallback(async (userId: string, reason: string, duration?: number) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const expiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null;

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      // Add restriction
      if (expiresAt) {
        await supabase
          .from('user_restrictions')
          .insert({
            user_id: userId,
            restriction_type: 'all',
            reason: `Banned: ${reason}`,
            expires_at: expiresAt,
            created_by: user.id
          });
      }

      // Log admin action
      await logAction('ban_user', 'user', userId, { reason, duration });

      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, is_banned: true, ban_reason: reason }
            : u
        )
      );

      toast.success('User banned successfully');
    } catch (err) {
      console.error('Error banning user:', err);
      setError(err instanceof Error ? err.message : 'Failed to ban user');
      toast.error('Failed to ban user');
    }
  }, [isAdmin, user]);

  // Unban user
  const unbanUser = useCallback(async (userId: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null
        })
        .eq('id', userId);

      if (error) throw error;

      // Remove restrictions
      await supabase
        .from('user_restrictions')
        .delete()
        .eq('user_id', userId)
        .eq('restriction_type', 'all');

      // Log admin action
      await logAction('unban_user', 'user', userId);

      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, is_banned: false, ban_reason: null }
            : u
        )
      );

      toast.success('User unbanned successfully');
    } catch (err) {
      console.error('Error unbanning user:', err);
      setError(err instanceof Error ? err.message : 'Failed to unban user');
      toast.error('Failed to unban user');
    }
  }, [isAdmin, user]);

  // Hide user
  const hideUser = useCallback(async (userId: string, reason: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await logAction('hide_user', 'user', userId, { reason });

      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, is_banned: true, ban_reason: reason }
            : u
        )
      );

      toast.success('User hidden successfully');
    } catch (err) {
      console.error('Error hiding user:', err);
      setError(err instanceof Error ? err.message : 'Failed to hide user');
      toast.error('Failed to hide user');
    }
  }, [isAdmin, user]);

  // Unhide user
  const unhideUser = useCallback(async (userId: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null
        })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await logAction('unhide_user', 'user', userId);

      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, is_banned: false, ban_reason: null }
            : u
        )
      );

      toast.success('User unhidden successfully');
    } catch (err) {
      console.error('Error unhiding user:', err);
      setError(err instanceof Error ? err.message : 'Failed to unhide user');
      toast.error('Failed to unhide user');
    }
  }, [isAdmin, user]);

  // Set age verified
  const setAgeVerified = useCallback(async (userId: string, verified: boolean) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          age_verified: verified
        })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await logAction('set_age_verified', 'user', userId, { verified });

      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, age_verified: verified }
            : u
        )
      );

      toast.success(`User age verification ${verified ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error setting age verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to set age verification');
      toast.error('Failed to set age verification');
    }
  }, [isAdmin, user]);

  // Grant role
  const grantRole = useCallback(async (userId: string, role: 'admin' | 'moderator' | 'super_admin', expiresAt?: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          granted_by: user.id,
          expires_at: expiresAt
        });

      if (error) throw error;

      // Log admin action
      await logAction('grant_role', 'user', userId, { role, expiresAt });

      toast.success(`Role ${role} granted successfully`);
    } catch (err) {
      console.error('Error granting role:', err);
      setError(err instanceof Error ? err.message : 'Failed to grant role');
      toast.error('Failed to grant role');
    }
  }, [isAdmin, user]);

  // Revoke role
  const revokeRole = useCallback(async (userId: string, role: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      // Log admin action
      await logAction('revoke_role', 'user', userId, { role });

      toast.success(`Role ${role} revoked successfully`);
    } catch (err) {
      console.error('Error revoking role:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke role');
      toast.error('Failed to revoke role');
    }
  }, [isAdmin, user]);

  // Load reports
  const loadReports = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(*),
          reported_user:profiles!reported_user_id(*),
          reported_post:posts!reported_post_id(*),
          resolved_by_user:profiles!resolved_by(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, just set empty array
        if (error.code === 'PGRST116' || error.message?.includes('relation "reports" does not exist')) {
          console.warn('Reports table does not exist, skipping...');
          setReports([]);
          return;
        }
        throw error;
      }

      setReports((data as ReportWithRelations[]) || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      // Don't set error for missing tables, just log and continue
      if (err instanceof Error && err.message?.includes('relation "reports" does not exist')) {
        console.warn('Reports table does not exist, skipping...');
        setReports([]);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Resolve report
  const resolveReport = useCallback(async (reportId: string, action: 'actioned' | 'dismissed', adminNotes?: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('reports')
        .update({
          status: action,
          admin_notes: adminNotes,
          resolved_by: user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Log admin action
      await logAction('resolve_report', 'report', reportId, { action, adminNotes });

      // Update local state
      setReports(prev => 
        prev.map(r => 
          r.id === reportId 
            ? { 
                ...r, 
                status: action, 
                admin_notes: adminNotes, 
                resolved_by: user.id, 
                resolved_at: new Date().toISOString() 
              }
            : r
        )
      );

      toast.success(`Report ${action} successfully`);
    } catch (err) {
      console.error('Error resolving report:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve report');
      toast.error('Failed to resolve report');
    }
  }, [isAdmin, user]);

  // Hide post
  const hidePost = useCallback(async (postId: string, reason: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('posts')
        .update({
          is_hidden: true,
          hidden_reason: reason
        })
        .eq('id', postId);

      if (error) throw error;

      // Log admin action
      await logAction('hide_post', 'post', postId, { reason });

      toast.success('Post hidden successfully');
    } catch (err) {
      console.error('Error hiding post:', err);
      setError(err instanceof Error ? err.message : 'Failed to hide post');
      toast.error('Failed to hide post');
    }
  }, [isAdmin, user]);

  // Unhide post
  const unhidePost = useCallback(async (postId: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('posts')
        .update({
          is_hidden: false,
          hidden_reason: null
        })
        .eq('id', postId);

      if (error) throw error;

      // Log admin action
      await logAction('unhide_post', 'post', postId);

      toast.success('Post unhidden successfully');
    } catch (err) {
      console.error('Error unhiding post:', err);
      setError(err instanceof Error ? err.message : 'Failed to unhide post');
      toast.error('Failed to unhide post');
    }
  }, [isAdmin, user]);

  // Delete post
  const deletePost = useCallback(async (postId: string, reason: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Log admin action
      await logAction('delete_post', 'post', postId, { reason });

      toast.success('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      toast.error('Failed to delete post');
    }
  }, [isAdmin, user]);

  // Load user restrictions
  const loadUserRestrictions = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('user_restrictions')
        .select(`
          *,
          user:profiles!user_id(*),
          created_by_user:profiles!created_by(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, just set empty array
        if (error.code === 'PGRST116' || error.message?.includes('relation "user_restrictions" does not exist')) {
          console.warn('User restrictions table does not exist, skipping...');
          setUserRestrictions([]);
          return;
        }
        throw error;
      }

      setUserRestrictions(data || []);
    } catch (err) {
      console.error('Error loading user restrictions:', err);
      // Don't set error for missing tables, just log and continue
      if (err instanceof Error && err.message?.includes('relation "user_restrictions" does not exist')) {
        console.warn('User restrictions table does not exist, skipping...');
        setUserRestrictions([]);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load user restrictions');
    }
  }, [isAdmin]);

  // Add restriction
  const addRestriction = useCallback(async (userId: string, type: 'posting' | 'messaging' | 'commenting' | 'all', reason: string, expiresAt?: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('user_restrictions')
        .insert({
          user_id: userId,
          restriction_type: type,
          reason,
          expires_at: expiresAt,
          created_by: user.id
        });

      if (error) throw error;

      // Log admin action
      await logAction('add_restriction', 'user', userId, { type, reason, expiresAt });

      toast.success('Restriction added successfully');
    } catch (err) {
      console.error('Error adding restriction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add restriction');
      toast.error('Failed to add restriction');
    }
  }, [isAdmin, user]);

  // Remove restriction
  const removeRestriction = useCallback(async (restrictionId: string) => {
    if (!isAdmin || !user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('user_restrictions')
        .delete()
        .eq('id', restrictionId);

      if (error) throw error;

      // Log admin action
      await logAction('remove_restriction', 'restriction', restrictionId);

      // Update local state
      setUserRestrictions(prev => prev.filter(r => r.id !== restrictionId));

      toast.success('Restriction removed successfully');
    } catch (err) {
      console.error('Error removing restriction:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove restriction');
      toast.error('Failed to remove restriction');
    }
  }, [isAdmin, user]);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          actor:profiles!actor_id(*),
          target:profiles!target_user_id(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // If table doesn't exist, just set empty array
        if (error.code === 'PGRST116' || error.message?.includes('relation "audit_logs" does not exist')) {
          console.warn('Audit logs table does not exist, skipping...');
          setAuditLogs([]);
          return;
        }
        throw error;
      }

      setAuditLogs(data || []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      // Don't set error for missing tables, just log and continue
      if (err instanceof Error && err.message?.includes('relation "audit_logs" does not exist')) {
        console.warn('Audit logs table does not exist, skipping...');
        setAuditLogs([]);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    }
  }, [isAdmin]);

  // Log action
  const logAction = useCallback(async (actionType: string, targetType: string, targetId?: string, details?: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: user.id,
          action_type: actionType,
          target_type: targetType,
          target_id: targetId,
          details: details
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error logging action:', err);
    }
  }, [user]);

  // Get Stripe customer
  const getStripeCustomer = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-customer', {
        body: { customer_id: customerId }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting Stripe customer:', err);
      throw err;
    }
  }, []);

  // Open customer portal
  const openCustomerPortal = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { customer_id: customerId }
      });

      if (error) throw error;
      return data.url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      throw err;
    }
  }, []);

  // Subscribe to admin updates
  const subscribeToAdminUpdates = useCallback(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          loadReports();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs'
        },
        () => {
          loadAuditLogs();
        }
      )
      .subscribe();

    setSubscription(channel);
  }, [isAdmin, loadReports, loadUsers, loadAuditLogs]);

  // Unsubscribe from admin updates
  const unsubscribeFromAdminUpdates = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [subscription]);

  // Load data on mount
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadReports();
      loadUserRestrictions();
      loadAuditLogs();
    }
  }, [isAdmin, loadUsers, loadReports, loadUserRestrictions, loadAuditLogs]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (isAdmin) {
      subscribeToAdminUpdates();
    }

    return () => {
      unsubscribeFromAdminUpdates();
    };
  }, [isAdmin, subscribeToAdminUpdates, unsubscribeFromAdminUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromAdminUpdates();
    };
  }, [unsubscribeFromAdminUpdates]);

  const value: AdminContextType = {
    users,
    reports,
    adminActions,
    auditLogs,
    userRestrictions,
    isLoading,
    error,
    loadUsers,
    banUser,
    unbanUser,
    hideUser,
    unhideUser,
    setAgeVerified,
    grantRole,
    revokeRole,
    loadReports,
    resolveReport,
    hidePost,
    unhidePost,
    deletePost,
    loadUserRestrictions,
    addRestriction,
    removeRestriction,
    loadAuditLogs,
    logAction,
    getStripeCustomer,
    openCustomerPortal,
    subscribeToAdminUpdates,
    unsubscribeFromAdminUpdates
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};