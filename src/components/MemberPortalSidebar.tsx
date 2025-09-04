import { NavLink, useLocation } from "react-router-dom";
import { User, Home, FileText, Settings, Shield, LogOut } from "lucide-react";
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

const memberItems = [
  { title: "Feed", url: "/portal", icon: Home },
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

  // TODO: Replace with actual auth check
  const isAdmin = true; // Placeholder

  const handleLogout = () => {
    // TODO: Implement logout with Supabase
    alert("Logout functionality coming with Supabase integration!");
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

        {isAdmin && (
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

        <div className="mt-auto p-4">
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