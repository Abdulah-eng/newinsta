import { NavLink, useLocation } from "react-router-dom";
import { User, Home, FileText, Settings, Shield, LogOut, Plus, Crown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const memberItems = [
  { title: "Feed", url: "/portal", icon: Home },
  { title: "Create Post", url: "/portal/create", icon: Plus },
  { title: "My Profile", url: "/portal/profile", icon: User },
  { title: "Documents", url: "/portal/documents", icon: FileText },
  { title: "Settings", url: "/portal/settings", icon: Settings },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
];

export function MemberPortalSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut, subscribed } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/portal") {
      return currentPath === "/portal";
    }
    return currentPath === path;
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-gold/20 text-gold" : "text-white/80 hover:text-gold hover:bg-gold/10";

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-charcoal border-r border-gold/20">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gold/80 font-serif">
            Member Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/portal"}
                      className={({ isActive }) => getNavClass({ isActive })}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.is_admin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gold/80 font-serif">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => getNavClass({ isActive })}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-auto p-4 space-y-3">
          {!subscribed && (
            <SidebarMenuButton
              onClick={() => window.location.href = '/membership'}
              className="w-full text-gold hover:text-gold-light hover:bg-gold/10 border border-gold/30"
            >
              <Crown className="mr-2 h-4 w-4" />
              {!collapsed && <span>Upgrade to Premium</span>}
            </SidebarMenuButton>
          )}
          <SidebarMenuButton
            onClick={handleLogout}
            className="w-full text-white/80 hover:text-gold hover:bg-gold/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}