import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MemberPortalSidebar } from "@/components/MemberPortalSidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const MemberPortal = () => {
  const { user, profile, loading } = useAuth();

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
          <header className="h-16 flex items-center border-b border-gold/20 bg-charcoal px-6">
            <SidebarTrigger className="text-gold hover:text-gold-light" />
            <h2 className="ml-4 text-xl font-serif text-gold">
              Welcome back, {profile?.full_name || user?.email}
            </h2>
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