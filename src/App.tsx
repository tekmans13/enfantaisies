import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Inscription from "./pages/Inscription";
import Bureau from "./pages/Bureau";
import RecapInscription from "./pages/RecapInscription";
import Tarifs from "./pages/Tarifs";
import Auth from "./pages/Auth";
import Users from "./pages/admin/Users";
import Configuration from "./pages/admin/Configuration";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/bureau" 
            element={
              <ProtectedRoute requireRole="both">
                <Bureau />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tarifs" 
            element={
              <ProtectedRoute requireRole="both">
                <Tarifs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireRole="both">
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/configuration" 
            element={
              <ProtectedRoute requireRole="admin">
                <Configuration />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recap-inscription/:id"
            element={
              <ProtectedRoute>
                <RecapInscription />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
