// Main App component - sets up routing for all pages
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import { Layout } from './components/Layout';
import { AuthProvider } from "./context/AuthContext";

// Import all page components
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { NewAuctionPage } from './pages/NewAuctionPage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { SearchAuctionsPage } from './pages/SearchAuctionsPage';
import { PlanPage } from './pages/PlanPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';

// Wrapper to force re-render when auction_id changes
function AuctionDetailWrapper() {
  const { auction_id } = useParams();
  return <AuctionDetailPage key={auction_id} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuctionProvider>
          <Routes>
            {/* ====================== */}
            {/* PUBLIC ROUTES (no sidebar) */}
            {/* ====================== */}
            <Route path="/" element={<HomePage />} />         
            <Route path="/login" element={<LoginPage />} />    
            <Route path="/signup" element={<SignUpPage />} /> 

            {/* ====================== */}
            {/* PROTECTED ROUTES (with sidebar layout) */}
            {/* ====================== */}
            <Route element={<Layout />}>
              <Route path="/new" element={<NewAuctionPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/auction/:auction_id" element={<AuctionDetailWrapper />} />
              <Route path="/search" element={<SearchAuctionsPage />} />
              <Route path="/plans" element={<PlanPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>

          </Routes>
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
