import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  DollarSign,
  Eye,
  Ban,
  CheckCircle,
  XCircle
} from "lucide-react";

const Admin = () => {
  // TODO: Replace with actual data from Supabase
  const stats = {
    totalMembers: 1247,
    activeMembers: 892,
    pendingReports: 8,
    monthlyRevenue: 24940,
    postsThisMonth: 445,
    moderationQueue: 12
  };

  const pendingReports = [
    {
      id: 1,
      reportedUser: "user123",
      reportedBy: "member456", 
      reason: "Inappropriate Content",
      postId: "post789",
      timestamp: "2 hours ago",
      status: "pending"
    },
    {
      id: 2,
      reportedUser: "member789",
      reportedBy: "user321",
      reason: "Harassment",
      postId: null,
      timestamp: "4 hours ago", 
      status: "pending"
    },
    {
      id: 3,
      reportedUser: "user555",
      reportedBy: "member888",
      reason: "Spam",
      postId: "post456",
      timestamp: "6 hours ago",
      status: "pending"
    }
  ];

  const recentMembers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      joinDate: "2024-03-15",
      status: "active",
      verified: true
    },
    {
      id: 2,
      name: "Michael Chen", 
      email: "michael@example.com",
      joinDate: "2024-03-14",
      status: "active",
      verified: false
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      email: "emma@example.com", 
      joinDate: "2024-03-13",
      status: "pending",
      verified: false
    }
  ];

  const handleReportAction = (reportId: number, action: 'approve' | 'reject') => {
    // TODO: Implement with Supabase
    alert(`Report ${reportId} ${action}ed! Backend integration coming soon.`);
  };

  const handleUserAction = (userId: number, action: 'ban' | 'verify') => {
    // TODO: Implement with Supabase
    alert(`User ${userId} ${action}ed! Backend integration coming soon.`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif text-gold">Admin Dashboard</h1>
        <Badge className="bg-gold text-black">Administrator</Badge>
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
            <p className="text-xs text-green-400 mt-1">+12 this week</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-gold/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-400 mt-1">+8.2% from last month</p>
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
            {pendingReports.map((report) => (
              <div key={report.id} className="border border-gold/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">@{report.reportedUser}</p>
                    <p className="text-sm text-white/60">Reported by @{report.reportedBy}</p>
                    <p className="text-sm text-red-400">{report.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">{report.timestamp}</p>
                    {report.postId && (
                      <Button variant="ghost" size="sm" className="text-gold hover:bg-gold/20">
                        <Eye className="h-4 w-4 mr-1" />
                        View Post
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleReportAction(report.id, 'approve')}
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Take Action
                  </Button>
                  <Button 
                    onClick={() => handleReportAction(report.id, 'reject')}
                    variant="outline" 
                    size="sm"
                    className="border-gold/50 text-gold hover:bg-gold/20"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card className="bg-charcoal border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold font-serif">Recent Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between border border-gold/20 rounded-lg p-4">
                <div>
                  <p className="font-medium text-white">{member.name}</p>
                  <p className="text-sm text-white/60">{member.email}</p>
                  <p className="text-xs text-white/40">Joined: {member.joinDate}</p>
                  <div className="flex space-x-2 mt-2">
                    <Badge 
                      variant={member.status === 'active' ? 'default' : 'secondary'}
                      className={member.status === 'active' ? 'bg-green-600' : ''}
                    >
                      {member.status}
                    </Badge>
                    {member.verified && (
                      <Badge className="bg-gold/20 text-gold">Verified</Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!member.verified && (
                    <Button 
                      onClick={() => handleUserAction(member.id, 'verify')}
                      size="sm"
                      className="bg-gold hover:bg-gold-light text-black"
                    >
                      Verify
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleUserAction(member.id, 'ban')}
                    variant="outline" 
                    size="sm"
                    className="border-red-500 text-red-400 hover:bg-red-500/20"
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;