import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { CalendarIcon, Ban, Shield, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Users, Flag, Activity, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    users,
    reports,
    auditLogs,
    userRestrictions,
    isLoading,
    error,
    loadUsers,
    loadReports,
    loadAuditLogs,
    banUser,
    unbanUser,
    setAgeVerified,
    resolveReport,
    hidePost,
    unhidePost,
    deletePost,
    addRestriction,
    removeRestriction,
    openCustomerPortal
  } = useAdmin();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [previewReport, setPreviewReport] = useState<any>(null);
  const [deleteReport, setDeleteReport] = useState<any>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restrictionDialogOpen, setRestrictionDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<number | undefined>();
  const [reportAction, setReportAction] = useState<'actioned' | 'dismissed'>('actioned');
  const [reportNotes, setReportNotes] = useState('');
  const [restrictionType, setRestrictionType] = useState<'posting' | 'messaging' | 'commenting' | 'all'>('all');
  const [restrictionReason, setRestrictionReason] = useState('');
  const [restrictionExpires, setRestrictionExpires] = useState<Date | undefined>();

  // Check if user is admin
  if (!profile?.is_admin && !profile?.is_moderator && !profile?.is_super_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return;
    
    await banUser(selectedUser.id, banReason, banDuration);
    setBanDialogOpen(false);
    setBanReason('');
    setBanDuration(undefined);
    setSelectedUser(null);
  };

  const handleUnbanUser = async (userId: string) => {
    await unbanUser(userId);
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;
    
    await resolveReport(selectedReport.id, reportAction, reportNotes);
    setReportDialogOpen(false);
    setReportAction('actioned');
    setReportNotes('');
    setSelectedReport(null);
  };

  const handleDeleteReportedPost = async () => {
    if (!deleteReport?.reported_post_id) return;
    await deletePost(deleteReport.reported_post_id);
    await resolveReport(deleteReport.id, 'actioned', 'Post deleted');
    setDeleteDialogOpen(false);
    setDeleteReport(null);
  };

  const handleAddRestriction = async () => {
    if (!selectedUser || !restrictionReason) return;
    
    await addRestriction(
      selectedUser.id, 
      restrictionType, 
      restrictionReason, 
      restrictionExpires?.toISOString()
    );
    setRestrictionDialogOpen(false);
    setRestrictionType('all');
    setRestrictionReason('');
    setRestrictionExpires(undefined);
    setSelectedUser(null);
  };

  const handleOpenCustomerPortal = async (customerId: string) => {
    try {
      const url = await openCustomerPortal(customerId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>;
      case 'actioned':
        return <Badge className="bg-green-100 text-green-800">Actioned</Badge>;
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, content, and platform settings</p>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.filter(r => r.status === 'open').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.is_banned).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Restrictions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userRestrictions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Followers</TableHead>
                      <TableHead>Age Verified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.avatar_url || '/placeholder-avatar.png'}
                              alt={user.full_name || 'User'}
                              className="h-8 w-8 rounded-full"
                            />
                            <div>
                              <div className="font-medium">{user.full_name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">@{user.handle || user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.is_banned ? (
                            <Badge className="bg-red-100 text-red-800">Banned</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.post_count}</TableCell>
                        <TableCell>{user.follower_count}</TableCell>
                        <TableCell>
                          {user.age_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {user.is_banned ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnbanUser(user.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanDialogOpen(true);
                                }}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setRestrictionDialogOpen(true);
                              }}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Restrict
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAgeVerified(user.id, !user.age_verified)}
                            >
                              {user.age_verified ? (
                                <EyeOff className="h-4 w-4 mr-1" />
                              ) : (
                                <Eye className="h-4 w-4 mr-1" />
                              )}
                              {user.age_verified ? 'Unverify' : 'Verify'}
                            </Button>

                            {user.stripe_customer_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCustomerPortal(user.stripe_customer_id)}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Stripe
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <CardDescription>
                  Review and resolve user reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reported Content</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="font-medium">{report.reporter?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">@{report.reporter?.handle || report.reporter?.email}</div>
                        </TableCell>
                        <TableCell>
                          {report.reported_post ? (
                            <div>
                              <div className="font-medium">Post</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {report.reported_post.content}
                              </div>
                            </div>
                          ) : report.reported_user ? (
                            <div>
                              <div className="font-medium">User</div>
                              <div className="text-sm text-gray-500">
                                {report.reported_user.full_name || 'Unknown User'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500">Unknown</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.reason}</Badge>
                        </TableCell>
                        <TableCell>
                          {getReportStatusBadge(report.status)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {report.reported_post && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPreviewReport(report);
                                    setPreviewDialogOpen(true);
                                  }}
                                >
                                  View post
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setDeleteReport(report);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  Delete post
                                </Button>
                              </>
                            )}
                            {report.status === 'open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setReportDialogOpen(true);
                                }}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Track all admin actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {log.user?.full_name || 'System'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.target_type} {log.target_id && `#${log.target_id.slice(0, 8)}`}
                        </TableCell>
                        <TableCell>
                          {log.details ? (
                            <div className="text-sm text-gray-600">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restrictions Tab */}
          <TabsContent value="restrictions">
            <Card>
              <CardHeader>
                <CardTitle>User Restrictions</CardTitle>
                <CardDescription>
                  Manage user restrictions and limitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRestrictions.map((restriction) => (
                      <TableRow key={restriction.id}>
                        <TableCell>
                          <div className="font-medium">{restriction.user?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">@{restriction.user?.handle || restriction.user?.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{restriction.restriction_type}</Badge>
                        </TableCell>
                        <TableCell>{restriction.reason}</TableCell>
                        <TableCell>
                          {restriction.expires_at ? (
                            format(new Date(restriction.expires_at), 'MMM dd, yyyy')
                          ) : (
                            <span className="text-gray-400">Permanent</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {restriction.created_by_user?.full_name || 'System'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeRestriction(restriction.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ban User Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Ban {selectedUser?.full_name || 'this user'} from the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ban-reason">Reason for ban</Label>
                <Textarea
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter the reason for banning this user..."
                />
              </div>
              <div>
                <Label htmlFor="ban-duration">Duration (days, optional)</Label>
                <Input
                  id="ban-duration"
                  type="number"
                  value={banDuration || ''}
                  onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Leave empty for permanent ban"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBanUser}>
                Ban User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Report</DialogTitle>
              <DialogDescription>
                Resolve this report and take appropriate action.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-action">Action</Label>
                <Select value={reportAction} onValueChange={(value: 'actioned' | 'dismissed') => setReportAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actioned">Actioned</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="report-notes">Admin Notes</Label>
                <Textarea
                  id="report-notes"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter notes about the resolution..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResolveReport}>
                Resolve Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Reported Post */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reported Post</DialogTitle>
              <DialogDescription>
                Preview the reported content before taking action.
              </DialogDescription>
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
              <p className="text-sm text-gray-500">No post payload available.</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Post */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete reported post?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The post will be permanently removed and the report will be marked actioned.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteReportedPost}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Restriction Dialog */}
        <Dialog open={restrictionDialogOpen} onOpenChange={setRestrictionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Restriction</DialogTitle>
              <DialogDescription>
                Add a restriction to {selectedUser?.full_name || 'this user'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="restriction-type">Restriction Type</Label>
                <Select value={restrictionType} onValueChange={(value: 'posting' | 'messaging' | 'commenting' | 'all') => setRestrictionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posting">Posting</SelectItem>
                    <SelectItem value="messaging">Messaging</SelectItem>
                    <SelectItem value="commenting">Commenting</SelectItem>
                    <SelectItem value="all">All Activities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="restriction-reason">Reason</Label>
                <Textarea
                  id="restriction-reason"
                  value={restrictionReason}
                  onChange={(e) => setRestrictionReason(e.target.value)}
                  placeholder="Enter the reason for this restriction..."
                />
              </div>
              <div>
                <Label htmlFor="restriction-expires">Expires (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !restrictionExpires && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {restrictionExpires ? format(restrictionExpires, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={restrictionExpires}
                      onSelect={setRestrictionExpires}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRestrictionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRestriction}>
                Add Restriction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
