import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "./components/Header";
import Index from "./pages/Index";
import Membership from "./pages/Membership";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import PaymentSuccess from "./pages/PaymentSuccess";
import MemberPortal from "./pages/portal/MemberPortal";
import Feed from "./pages/portal/Feed";
import Profile from "./pages/portal/Profile";
import Documents from "./pages/portal/Documents";
import CreatePost from "./pages/portal/CreatePostPage";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-black">
            <Routes>
              {/* Public routes with header */}
              <Route path="/" element={
                <>
                  <Header />
                  <Index />
                </>
              } />
              <Route path="/membership" element={
                <>
                  <Header />
                  <Membership />
                </>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              
              {/* Member portal routes */}
              <Route path="/portal" element={
                <ProtectedRoute>
                  <MemberPortal />
                </ProtectedRoute>
              }>
                <Route index element={<Feed />} />
                <Route path="create" element={<CreatePost />} />
                <Route path="profile" element={<Profile />} />
                <Route path="documents" element={<Documents />} />
              </Route>
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
