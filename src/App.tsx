import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessagingProvider } from "@/contexts/MessagingContext";
import { StoriesProvider } from "@/contexts/StoriesContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { FollowProvider } from "@/contexts/FollowContext";
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
import UserProfile from "./pages/portal/UserProfile";
import FollowersList from "./pages/portal/FollowersList";
import Documents from "./pages/portal/Documents";
import CreatePost from "./pages/portal/CreatePostPage";
import CreatePostTest from "./pages/portal/CreatePostTest";
import CreateStory from "./pages/portal/CreateStory";
import Messages from "./pages/portal/Messages";
import TestData from "./pages/portal/TestData";
import AdminEnhanced from "./pages/AdminEnhanced";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MessagingProvider>
        <StoriesProvider>
          <AdminProvider>
            <FollowProvider>
              <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
              <Route path="/terms" element={
                <>
                  <Header />
                  <TermsOfService />
                </>
              } />
              <Route path="/privacy" element={
                <>
                  <Header />
                  <PrivacyPolicy />
                </>
              } />
              
              {/* Member portal routes */}
              <Route path="/portal" element={
                <ProtectedRoute requireSubscription>
                  <MemberPortal />
                </ProtectedRoute>
              }>
                <Route index element={<Feed />} />
                <Route path="create" element={<CreatePost />} />
                <Route path="create-test" element={<CreatePostTest />} />
                <Route path="create-story" element={<CreateStory />} />
                <Route path="messages" element={<Messages />} />
                <Route path="profile" element={<Profile />} />
                <Route path="user/:userId" element={<UserProfile />} />
                <Route path="user/:userId/:type" element={<FollowersList />} />
                <Route path="documents" element={<Documents />} />
                <Route path="test" element={<TestData />} />
              </Route>
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminEnhanced />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
              </TooltipProvider>
            </FollowProvider>
          </AdminProvider>
        </StoriesProvider>
      </MessagingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
