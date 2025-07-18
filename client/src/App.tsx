import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import UserPastesPage from "@/pages/user-pastes";
import PublicPasteList from "@/pages/public-paste-list";
import AuthPage from "@/pages/auth-page";
import UsersPage from "@/pages/users-page";
import TermsPage from "@/pages/terms-page";
import PastePage from "@/pages/paste-page";
import SettingsPage from "@/pages/settings-page";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {user && <Navbar />}
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={() => <HomePage />} />
        <Route path="/p/:urlId" component={PastePage} />
        <Route path="/p" component={PublicPasteList} />
        <ProtectedRoute path="/users" component={() => <UsersPage />} />
        <ProtectedRoute path="/my-pastes" component={() => <UserPastesPage />} />
        <ProtectedRoute path="/terms" component={() => <TermsPage />} />
        <ProtectedRoute path="/settings" component={() => <SettingsPage />} />
        <ProtectedRoute path="/admin" component={() => <AdminPage />} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;