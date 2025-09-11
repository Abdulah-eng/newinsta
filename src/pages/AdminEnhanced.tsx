import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
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
  EyeOff, 
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

const AdminEnhanced: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    reports,
    users,
    auditLogs,
    loadAuditLogs,
    stats,
    resolveReport,
    banUser,
    unbanUser,
    // The following advanced admin APIs may not exist in the current context;
    // gate optional calls in handlers where used.
    setUserRole,
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

  const handleSetUserRole = async (userId: string, role: string) => {
    await setUserRole(userId, role as any);
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, content, and platform settings</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Open Reports</p>
                  <p className="text-2xl font-bold">{stats.openReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Banned Users</p>
                  <p className="text-2xl font-bold">{stats.bannedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reports found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={report.status === 'open' ? 'destructive' : report.status === 'actioned' ? 'default' : 'secondary'}>
                              {report.status}
                            </Badge>
                            <Badge variant="outline">{report.report_type}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            Reported by {report.reporter.full_name || report.reporter.handle || 'Unknown'} on{' '}
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          
                          <p className="font-medium mb-2">Reason: {report.reason}</p>
                          
                          {report.reported_user && (
                            <p className="text-sm text-muted-foreground">
                              Reported User: {report.reported_user.full_name || report.reported_user.handle || 'Unknown'}
                            </p>
                          )}
                          
                          {report.reported_post && (
                            <p className="text-sm text-muted-foreground">
                              Reported Post: {report.reported_post.content.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
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
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.full_name?.charAt(0) || user.handle?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <p className="font-medium">
                              {user.full_name || user.handle || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                              {user.is_admin && <Badge variant="default">Admin</Badge>}
                              {user.is_moderator && <Badge variant="secondary">Moderator</Badge>}
                              {user.age_verified && <Badge variant="outline">Age Verified</Badge>}
                              {user.safe_mode_enabled && <Badge variant="outline">Safe Mode</Badge>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{user.post_count} posts</p>
                            <p>{user.story_count} stories</p>
                            <p>{user.report_count} reports</p>
                          </div>
                          
                          <div className="flex space-x-1">
                            {!user.is_banned ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Ban className="h-4 w-4" />
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
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Select
                              value={user.user_roles?.find(r => r.is_active)?.role || 'member'}
                              onValueChange={(role) => handleSetUserRole(user.id, role)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetAgeVerification(user.id, !user.age_verified)}
                              >
                                {user.age_verified ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetSafeMode(user.id, !user.safe_mode_enabled)}
                              >
                                {user.safe_mode_enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {
                auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-4">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-full bg-muted">
                              <Settings className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{log.action_type}</p>
                              <p className="text-sm text-muted-foreground">
                                by {log.actor?.full_name || 'Unknown'} on {new Date(log.created_at).toLocaleString()}
                              </p>
                              {log.details && (
                                <p className="text-sm text-muted-foreground break-all">
                                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">{log.target_type}</Badge>
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
    </div>
  );
};

export default AdminEnhanced;
