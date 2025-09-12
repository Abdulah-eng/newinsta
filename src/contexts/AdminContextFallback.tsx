import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

// Fallback admin context that works with existing database structure
// This provides basic admin functionality without the new tables

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  reporter: {
    id: string;
    full_name: string | null;
    avatar_url?: string;
    handle?: string;
  };
  reported_user?: {
    id: string;
    full_name: string | null;
    avatar_url?: string;
    handle?: string;
  };
  reported_post?: {
    id: string;
    content: string;
    author_id: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  bio: string | null;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  age_verified: boolean;
  safe_mode_enabled: boolean;
  created_at: string;
  updated_at: string;
  post_count: number;
  report_count: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalReports: number;
  openReports: number;
  bannedUsers: number;
}

interface AdminContextType {
  // Data
  reports: Report[];
  users: UserProfile[];
  stats: AdminStats | null;
  
  // Loading states
  loading: boolean;
  reportsLoading: boolean;
  usersLoading: boolean;
  
  // Actions
  loadReports: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadStats: () => Promise<void>;
  
  // Report management
  resolveReport: (reportId: string, status: 'actioned' | 'dismissed', adminNotes?: string) => Promise<void>;
  
  // User management
  banUser: (userId: string, reason: string, duration?: number) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  setAgeVerification: (userId: string, verified: boolean) => Promise<void>;
  setSafeMode: (userId: string, enabled: boolean) => Promise<void>;
  
  // Content moderation
  hidePost: (postId: string, reason: string) => Promise<void>;
  unhidePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  
  // Audit logging
  logAction: (actionType: string, targetType: string, targetId?: string, details?: any) => Promise<void>;
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
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Check if user is admin
  const isAdmin = profile?.is_admin || profile?.is_super_admin || profile?.is_moderator;

  // Load reports
  const loadReports = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setReportsLoading(true);
      
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(*),
          reported_user:profiles!reports_reported_user_id_fkey(*),
          reported_post:posts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setReportsLoading(false);
    }
  }, [isAdmin]);

  // Load users
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setUsersLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get additional stats for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          // Get post count
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', user.id);

          // Get report count
          const { count: reportCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('reported_user_id', user.id);

          return {
            ...user,
            post_count: postCount || 0,
            report_count: reportCount || 0,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  // Load admin stats
  const loadStats = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      
      // Get all stats in parallel
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalPosts },
        { count: totalReports },
        { count: openReports },
        { count: bannedUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPosts: totalPosts || 0,
        totalReports: totalReports || 0,
        openReports: openReports || 0,
        bannedUsers: bannedUsers || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "Failed to load admin statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Resolve report
  const resolveReport = useCallback(async (
    reportId: string, 
    status: 'actioned' | 'dismissed', 
    adminNotes?: string
  ) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          admin_notes: adminNotes,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      // Reload reports
      await loadReports();

      toast({
        title: "Report resolved",
        description: `Report has been ${status}`,
      });
    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: "Error",
        description: "Failed to resolve report",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, loadReports]);

  // Ban user
  const banUser = useCallback(async (userId: string, reason: string, duration?: number) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: reason,
        })
        .eq('id', userId);

      if (error) throw error;

      // Reload users
      await loadUsers();

      toast({
        title: "User banned",
        description: `User has been banned${duration ? ` for ${duration} days` : ' permanently'}`,
      });
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, loadUsers]);

  // Unban user
  const unbanUser = useCallback(async (userId: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
        })
        .eq('id', userId);

      if (error) throw error;

      // Reload users
      await loadUsers();

      toast({
        title: "User unbanned",
        description: "User has been unbanned",
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, loadUsers]);

  // Set age verification
  const setAgeVerification = useCallback(async (userId: string, verified: boolean) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ age_verified: verified })
        .eq('id', userId);

      if (error) throw error;

      // Reload users
      await loadUsers();

      toast({
        title: "Age verification updated",
        description: `Age verification ${verified ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error setting age verification:', error);
      toast({
        title: "Error",
        description: "Failed to update age verification",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, loadUsers]);

  // Set safe mode
  const setSafeMode = useCallback(async (userId: string, enabled: boolean) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ safe_mode_enabled: enabled })
        .eq('id', userId);

      if (error) throw error;

      // Reload users
      await loadUsers();

      toast({
        title: "Safe mode updated",
        description: `Safe mode ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error setting safe mode:', error);
      toast({
        title: "Error",
        description: "Failed to update safe mode",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, loadUsers]);

  // Hide post
  const hidePost = useCallback(async (postId: string, reason: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          is_hidden: true,
          hidden_reason: reason,
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post hidden",
        description: "Post has been hidden from public view",
      });
    } catch (error) {
      console.error('Error hiding post:', error);
      toast({
        title: "Error",
        description: "Failed to hide post",
        variant: "destructive",
      });
    }
  }, [user, isAdmin]);

  // Unhide post
  const unhidePost = useCallback(async (postId: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          is_hidden: false,
          hidden_reason: null,
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post unhidden",
        description: "Post has been restored to public view",
      });
    } catch (error) {
      console.error('Error unhiding post:', error);
      toast({
        title: "Error",
        description: "Failed to unhide post",
        variant: "destructive",
      });
    }
  }, [user, isAdmin]);

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Post has been permanently deleted",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  }, [user, isAdmin]);

  // Log admin action (placeholder)
  const logAction = useCallback(async (
    actionType: string, 
    targetType: string, 
    targetId?: string, 
    details?: any
  ) => {
    // This would require an audit_logs table
    console.log('Admin action logged:', { actionType, targetType, targetId, details });
  }, []);

  // Load data on mount
  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadReports();
      loadUsers();
    }
  }, [isAdmin, loadStats, loadReports, loadUsers]);

  const value: AdminContextType = {
    reports,
    users,
    stats,
    loading,
    reportsLoading,
    usersLoading,
    loadReports,
    loadUsers,
    loadStats,
    resolveReport,
    banUser,
    unbanUser,
    setAgeVerification,
    setSafeMode,
    hidePost,
    unhidePost,
    deletePost,
    logAction,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
