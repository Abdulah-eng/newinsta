import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MemberPortalSidebar } from "@/components/MemberPortalSidebar";
import { Outlet } from "react-router-dom";

const MemberPortal = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-black">
        <MemberPortalSidebar />
        <main className="flex-1">
          <header className="h-16 flex items-center border-b border-gold/20 bg-charcoal px-6">
            <SidebarTrigger className="text-gold hover:text-gold-light" />
            <h2 className="ml-4 text-xl font-serif text-gold">Member Portal</h2>
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