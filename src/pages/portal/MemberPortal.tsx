import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MemberPortalSidebar } from "@/components/MemberPortalSidebar";
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
      <div className="min-h-screen flex w-full bg-black">
        <MemberPortalSidebar />
        <main className="flex-1">
          <header className="h-16 flex items-center justify-between border-b border-gold/20 bg-charcoal px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="text-gold hover:text-gold-light" />
              <h2 className="text-xl font-serif text-gold">
                Welcome back, {profile?.full_name || user?.email}
              </h2>
            </div>
            
            {/* Subscription Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${subscribed ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className={`text-sm font-medium ${subscribed ? 'text-green-500' : 'text-yellow-500'}`}>
                {subscribed ? 'Premium Member' : 'Free Access'}
              </span>
            </div>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MemberPortal;