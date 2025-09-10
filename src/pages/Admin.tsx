import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  DollarSign,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  MessageSquare,
  Flag,
  UserCheck,
  UserX
} from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter: {
    full_name: string | null;
    email: string;
  };
  reported_user: {
    full_name: string | null;
    email: string;
  } | null;
  reported_post: {
    content: string;
    author_id: string;
  } | null;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  handle: string | null;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  last_active: string | null;
  post_count: number;
}

const Admin = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingReports: 0,
    monthlyRevenue: 0,
    postsThisMonth: 0,
    moderationQueue: 0
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [banReason, setBanReason] = useState("");
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Get total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active members (logged in within last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: activeMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', thirtyDaysAgo);

      // Get pending reports
      const { count: pendingReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get posts this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { count: postsThisMonth } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());

      // Get monthly revenue (mock calculation)
      const { count: subscribedUsers } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);

      setStats({
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        pendingReports: pendingReports || 0,
        monthlyRevenue: (subscribedUsers || 0) * 20, // $20 per month
        postsThisMonth: postsThisMonth || 0,
        moderationQueue: pendingReports || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey (
            full_name,
            email
          ),
          reported_user:profiles!reports_reported_user_id_fkey (
            full_name,
            email
          ),
          reported_post:posts!reports_reported_post_id_fkey (
            content,
            author_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: action === 'approve' ? 'resolved' : 'dismissed',
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report ${action === 'approve' ? 'resolved' : 'dismissed'} successfully.`,
      });

      setSelectedReport(null);
      setAdminNotes("");
      fetchReports();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update report.",
        variant: "destructive",
      });
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'verify') => {
    try {
      if (action === 'ban') {
        if (!banReason.trim()) {
          toast({
            title: "Error",
            description: "Please provide a reason for banning the user.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            is_banned: true,
            ban_reason: banReason.trim()
          })
          .eq('id', userId);

        if (error) throw error;

        toast({
          title: "User Banned",
          description: "User has been banned successfully.",
        });
      } else if (action === 'unban') {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_banned: false,
            ban_reason: null
          })
          .eq('id', userId);

        if (error) throw error;

        toast({
          title: "User Unbanned",
          description: "User has been unbanned successfully.",
        });
      } else if (action === 'verify') {
        const { error } = await supabase
          .from('profiles')
          .update({
            age_verified: true
          })
          .eq('id', userId);

        if (error) throw error;

        toast({
          title: "User Verified",
          description: "User has been age verified successfully.",
        });
      }

      setBanReason("");
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchReports(),
        fetchUsers()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gold text-xl font-serif">Loading admin dashboard...</div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif text-gold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Badge className="bg-gold text-black">Administrator</Badge>
          <Button
            onClick={() => {
              fetchStats();
              fetchReports();
              fetchUsers();
            }}
            variant="outline"
            size="sm"
            className="border-gold/30 text-gold hover:bg-gold/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-charcoal border-gold/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Members</CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalMembers.toLocaleString()}</div>
            <p className="text-xs text-green-400 mt-1">+{stats.activeMembers} active</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-gold/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-400 mt-1">From {Math.floor(stats.monthlyRevenue / 20)} subscribers</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-gold/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingReports}</div>
            <p className="text-xs text-red-400 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Moderation Queue */}
        <Card className="bg-charcoal border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold font-serif flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Moderation Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center text-white/60 py-8">No reports to review</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="border border-gold/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {report.reported_user?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-white/60">
                        Reported by {report.reporter.full_name || report.reporter.email}
                      </p>
                      <p className="text-sm text-red-400">{report.reason}</p>
                      {report.description && (
                        <p className="text-sm text-white/80 mt-1">{report.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">{formatDate(report.created_at)}</p>
                      <Badge 
                        variant={report.status === 'pending' ? 'destructive' : 'secondary'}
                        className="mt-1"
                      >
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => {
                        setSelectedReport(report);
                        setAdminNotes(report.admin_notes || '');
                      }}
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button 
                      onClick={() => handleReportAction(report.id, 'dismiss')}
                      variant="outline" 
                      size="sm"
                      className="border-gold/50 text-gold hover:bg-gold/20"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="bg-charcoal border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold font-serif">User Management</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black border-gold/30 text-white focus:border-gold"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-white/60 py-8">No users found</div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between border border-gold/20 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-white">{user.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-white/60">{user.email}</p>
                    <p className="text-xs text-white/40">
                      Joined: {formatDate(user.created_at)}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Badge 
                        variant={user.is_banned ? 'destructive' : 'default'}
                        className={user.is_banned ? 'bg-red-600' : 'bg-green-600'}
                      >
                        {user.is_banned ? 'Banned' : 'Active'}
                      </Badge>
                      {user.is_admin && (
                        <Badge className="bg-gold/20 text-gold">Admin</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!user.is_banned ? (
                      <Button 
                        onClick={() => {
                          setBanReason("");
                          handleUserAction(user.id, 'ban');
                        }}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleUserAction(user.id, 'unban')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-charcoal border-gold/30 text-white max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="text-gold font-serif">Review Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Report Details</Label>
                <div className="bg-black/30 p-3 rounded border border-gold/20">
                  <p><strong>Reason:</strong> {selectedReport.reason}</p>
                  <p><strong>Reported User:</strong> {selectedReport.reported_user?.full_name || 'Unknown'}</p>
                  <p><strong>Reporter:</strong> {selectedReport.reporter.full_name || selectedReport.reporter.email}</p>
                  {selectedReport.description && (
                    <p><strong>Description:</strong> {selectedReport.description}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="admin-notes" className="text-white">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  className="bg-black border-gold/30 text-white focus:border-gold"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setSelectedReport(null);
                    setAdminNotes("");
                  }}
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReportAction(selectedReport.id, 'approve')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Take Action
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Admin;