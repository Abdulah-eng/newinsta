import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MemberPortalSidebar } from "@/components/MemberPortalSidebar";
import TrialCountdown from "@/components/TrialCountdown";
import NotificationCenter from "@/components/NotificationCenter";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const MemberPortal = () => {
  const { user, profile, loading, subscribed } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl font-serif">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-black flex flex-col md:flex-row">
        <MemberPortalSidebar />
        <main className="flex-1">
          <header className="h-16 flex items-center justify-between border-b border-gold/20 bg-charcoal px-4 md:px-6">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
              <SidebarTrigger className="text-gold hover:text-gold-light shrink-0" />
              <h2 className="text-base md:text-xl font-serif text-gold truncate">
                Welcome back, {profile?.full_name || user?.email}
              </h2>
            </div>
            
            {/* Notifications */}
            <div className="flex items-center space-x-3 shrink-0">
              <NotificationCenter />
            </div>
          </header>
          <div className="p-4 md:p-6">
            <TrialCountdown />
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MemberPortal;