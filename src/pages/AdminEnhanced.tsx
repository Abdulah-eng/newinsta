import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Flag, 
  Shield, 
  BarChart3, 
  Eye,
  Ban, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Calendar,
  MessageSquare,
  Image,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const AdminEnhanced: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const {
    reports,
    users,
    auditLogs,
    loadAuditLogs,
    stats,
    resolveReport,
    banUser,
    unbanUser,
    deleteUser,
    // Optional advanced admin APIs
    grantRole,
    revokeRole,
    setAgeVerification,
    setSafeMode,
    hidePost,
    unhidePost,
    deletePost,
  } = useAdmin() as any;

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [previewReport, setPreviewReport] = useState<any>(null);
  const [confirmDeleteReport, setConfirmDeleteReport] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Check admin access
  if (!profile?.is_admin && !profile?.is_super_admin && !profile?.is_moderator) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResolveReport = async (status: 'actioned' | 'dismissed') => {
    if (!selectedReport) return;
    
    await resolveReport(selectedReport.id, status, adminNotes);
    setSelectedReport(null);
    setAdminNotes('');
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return;
    
    await banUser(selectedUser.id, banReason, banDuration || undefined);
    setSelectedUser(null);
    setBanReason('');
    setBanDuration(null);
  };

  const handleUnbanUser = async (userId: string) => {
    await unbanUser(userId);
  };

  const handleDeleteUser = async () => {
    if (!deleteUserDialog || !deleteReason) return;
    
    await deleteUser(deleteUserDialog.id, deleteReason);
    setDeleteUserDialog(null);
    setDeleteReason('');
  };

  // Two-role handler: 'member' or 'admin' with fallback when grant/revoke blocked by RLS
  const handleSetSimpleRole = async (userId: string, role: 'member' | 'admin') => {
    try {
      if (role === 'admin') {
        if (typeof grantRole === 'function') {
          try {
            await grantRole(userId, 'admin');
          } catch (e) {
            const { error } = await supabase
              .from('profiles')
              .update({ is_admin: true })
              .eq('id', userId);
            if (error) throw error;
          }
        } else {
          const { error } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', userId);
          if (error) throw error;
        }
        toast({ title: 'Role updated', description: 'User is now Admin.' });
      } else {
        if (typeof revokeRole === 'function') {
          try {
            await revokeRole(userId, 'admin');
          } catch (e) {
            const { error } = await supabase
              .from('profiles')
              .update({ is_admin: false })
              .eq('id', userId);
            if (error) throw error;
          }
        } else {
          const { error } = await supabase
            .from('profiles')
            .update({ is_admin: false })
            .eq('id', userId);
          if (error) throw error;
        }
        toast({ title: 'Role updated', description: 'User set to Member.' });
      }
    } catch (err) {
      console.error('Error updating role:', err);
      toast({ title: 'Error', description: 'Failed to update role.', variant: 'destructive' });
    }
  };

  const handleSetAgeVerification = async (userId: string, verified: boolean) => {
    await setAgeVerification(userId, verified);
  };

  const handleSetSafeMode = async (userId: string, enabled: boolean) => {
    await setSafeMode(userId, enabled);
  };

  const handleHidePost = async (postId: string, reason: string) => {
    await hidePost(postId, reason);
  };

  const handleUnhidePost = async (postId: string) => {
    await unhidePost(postId);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
  };

  // Ensure audit logs load when page opens
  React.useEffect(() => {
    loadAuditLogs?.();
  }, [loadAuditLogs]);

  // Basic top-level loading is not provided by context; render directly
  const loading = false;
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal')}
              className="text-gold hover:text-gold/80 hover:bg-gold/10"
            >
              ← Back to Portal
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gold font-serif">Admin Dashboard</h1>
          <p className="text-white/70 text-sm md:text-base">Manage users, content, and platform settings</p>
        </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mb-2 sm:mb-0 sm:mr-3" />
                <div>
                  <p className="text-xs md:text-sm font-medium text-white/80">Total Users</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                <Flag className="h-6 w-6 md:h-8 md:w-8 text-red-500 mb-2 sm:mb-0 sm:mr-3" />
                <div>
                  <p className="text-xs md:text-sm font-medium text-white/80">Open Reports</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.openReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-green-500 mb-2 sm:mb-0 sm:mr-3" />
                <div>
                  <p className="text-xs md:text-sm font-medium text-white/80">Total Posts</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.totalPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                <Ban className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mb-2 sm:mb-0 sm:mr-3" />
                <div>
                  <p className="text-xs md:text-sm font-medium text-white/80">Banned Users</p>
                  <p className="text-lg md:text-2xl font-bold text-white">{stats.bannedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-charcoal border-gold/20">
          <TabsTrigger value="reports" className="text-xs md:text-sm">Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="users" className="text-xs md:text-sm">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs md:text-sm">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader>
              <CardTitle className="text-gold font-serif text-lg md:text-xl">Content Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reports found</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-gold/20 rounded-lg p-3 md:p-4 bg-black/50">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant={report.status === 'open' ? 'destructive' : report.status === 'actioned' ? 'default' : 'secondary'} className="text-xs">
                              {report.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{report.report_type}</Badge>
                          </div>
                          
                          <p className="text-xs md:text-sm text-white/70 mb-2 break-words">
                            Reported by {report.reporter.full_name || report.reporter.handle || 'Unknown'} on{' '}
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          
                          <p className="font-medium mb-2 text-white text-sm md:text-base break-words">Reason: {report.reason}</p>
                          
                          {report.reported_user && (
                            <p className="text-xs md:text-sm text-white/70 break-words">
                              Reported User: {report.reported_user.full_name || report.reported_user.handle || 'Unknown'}
                            </p>
                          )}
                          
                          {report.reported_post && (
                            <p className="text-xs md:text-sm text-white/70 break-words">
                              Reported Post: {report.reported_post.content.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Report Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Report Type</Label>
                                  <p className="font-medium">{report.report_type}</p>
                                </div>
                                <div>
                                  <Label>Reason</Label>
                                  <p className="font-medium">{report.reason}</p>
                                </div>
                                <div>
                                  <Label>Reporter</Label>
                                  <p className="font-medium">{report.reporter.full_name || report.reporter.handle || 'Unknown'}</p>
                                </div>
                                {report.admin_notes && (
                                  <div>
                                    <Label>Admin Notes</Label>
                                    <p className="font-medium">{report.admin_notes}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {report.reported_post && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewReport(report)}
                              >
                                View post
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setConfirmDeleteReport(report)}
                              >
                                Delete post
                              </Button>
                            </>
                          )}
                          
                          {report.status === 'open' && (
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setAdminNotes('');
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveReport('dismissed')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader>
              <CardTitle className="text-gold font-serif text-lg md:text-xl">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {
                <div className="space-y-3 md:space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border border-gold/20 rounded-lg p-3 md:p-4 bg-black/50">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-xs md:text-sm">
                              {user.full_name?.charAt(0) || user.handle?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-sm md:text-base truncate">
                              {user.full_name || user.handle || 'Unknown'}
                            </p>
                            <p className="text-xs md:text-sm text-white/70 truncate">{user.email}</p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {user.is_banned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                              {user.is_admin && <Badge variant="default" className="text-xs">Admin</Badge>}
                              {user.is_moderator && <Badge variant="secondary" className="text-xs">Moderator</Badge>}
                              {user.age_verified && <Badge variant="outline" className="text-xs">Age Verified</Badge>}
                              {user.safe_mode_enabled && <Badge variant="outline" className="text-xs">Safe Mode</Badge>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                          
                          <div className="flex flex-wrap gap-1 lg:flex-nowrap">
                            {!user.is_banned ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-xs">
                                    <Ban className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Ban User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will ban the user and prevent them from accessing the platform.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="ban-reason">Reason</Label>
                                      <Input
                                        id="ban-reason"
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                        placeholder="Enter ban reason..."
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="ban-duration">Duration (days, leave empty for permanent)</Label>
                                      <Input
                                        id="ban-duration"
                                        type="number"
                                        value={banDuration || ''}
                                        onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Permanent"
                                      />
                                    </div>
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        setSelectedUser(user);
                                        handleBanUser();
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Ban User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnbanUser(user.id)}
                                className="text-xs"
                              >
                                <UserCheck className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            )}
                            
                            {/* Two-role selector */}
                            <Select
                              value={user.is_admin ? 'admin' : 'member'}
                              onValueChange={(role) => handleSetSimpleRole(user.id, role as 'member' | 'admin')}
                            >
                              <SelectTrigger className="w-20 md:w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member" className="text-xs">Member</SelectItem>
                                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="flex flex-wrap gap-1 lg:flex-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDeleteUserDialog(user);
                                  setDeleteReason('');
                                }}
                                className="text-xs text-red-400 hover:text-red-300 hover:border-red-400"
                              >
                                <UserX className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader>
              <CardTitle className="text-gold font-serif text-lg md:text-xl">Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {
                auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="border border-gold/20 rounded-lg p-3 md:p-4 bg-black/50">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <div className="p-2 rounded-full bg-gold/20 flex-shrink-0">
                              <Settings className="h-3 w-3 md:h-4 md:w-4 text-gold" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white text-sm md:text-base">{log.action_type}</p>
                              <p className="text-xs md:text-sm text-white/70">
                                by {log.actor?.full_name || 'Unknown'} on {new Date(log.created_at).toLocaleString()}
                              </p>
                              {log.details && (
                                <p className="text-xs md:text-sm text-white/70 break-words mt-1">
                                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">{log.target_type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs yet</p>
                  </div>
                )
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Resolution Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about the resolution..."
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleResolveReport('actioned')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Action Taken
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolveReport('dismissed')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Reported Post */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reported Post</DialogTitle>
          </DialogHeader>
          {previewReport?.reported_post ? (
            <div className="space-y-3">
              {previewReport.reported_post.image_url && (
                <img
                  src={previewReport.reported_post.image_url}
                  alt="Post"
                  className="w-full rounded"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (t.src !== '/placeholder.svg') t.src = '/placeholder.svg';
                  }}
                />
              )}
              {previewReport.reported_post.content && (
                <p className="text-sm">{previewReport.reported_post.content}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No post payload available.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Reported Post */}
      <AlertDialog open={!!confirmDeleteReport} onOpenChange={() => setConfirmDeleteReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reported post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the post and mark the report as actioned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDeleteReport?.reported_post_id) return;
                await deletePost(confirmDeleteReport.reported_post_id);
                await resolveReport(confirmDeleteReport.id, 'actioned', 'Post deleted');
                setConfirmDeleteReport(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete User */}
      <AlertDialog open={!!deleteUserDialog} onOpenChange={() => setDeleteUserDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action will permanently remove the user and all their data including posts, messages, stories, and reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-reason">Reason for deletion</Label>
              <Input
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={!deleteReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

export default AdminEnhanced;
