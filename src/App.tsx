import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import RunningDeer from "./components/RunningDeer";
import WinterTreeline from "./components/WinterTreeline";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      {/* Winter scene along the bottom of every page — a small staggered herd */}
      <WinterTreeline zIndex={20} />
      <RunningDeer height={104} hopHeight={30} cycleSeconds={0.8} crossSeconds={13} crossDelay={-6.5} bottom={8} zIndex={33} />
      <RunningDeer height={92} hopHeight={28} cycleSeconds={0.86} crossSeconds={15} crossDelay={0} bottom={11} zIndex={32} />
      <RunningDeer height={82} hopHeight={26} cycleSeconds={0.9} crossSeconds={17} crossDelay={-12.75} bottom={13} zIndex={31} />
      <RunningDeer height={72} hopHeight={24} cycleSeconds={0.95} crossSeconds={20} crossDelay={-5} bottom={15} zIndex={30} />
      <RunningDeer height={98} hopHeight={29} cycleSeconds={0.83} crossSeconds={14} crossDelay={-8.4} bottom={9} zIndex={33} />
      <RunningDeer height={78} hopHeight={25} cycleSeconds={0.92} crossSeconds={18} crossDelay={-16.2} bottom={14} zIndex={31} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
