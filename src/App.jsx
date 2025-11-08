// Main App component - sets up routing for all pages
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import { Layout } from './components/Layout';
import { AuthProvider } from "./context/AuthContext";

// Import all page components
import { DashboardPage } from './pages/DashboardPage';
import { NewAuctionPage } from './pages/NewAuctionPage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { SearchAuctionsPage } from './pages/SearchAuctionsPage';
import { PlanPage } from './pages/PlanPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';

function App() {
  return (
    <BrowserRouter>
      {/* Wrap app with providers for auth and auction data */}
      <AuthProvider>
        <AuctionProvider>
          <Routes>
            {/* Public routes - no sidebar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* Protected routes - with sidebar layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<NewAuctionPage />} />
              <Route path="new" element={<NewAuctionPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="auction/:auction_id" element={<AuctionDetailPage />} />
              <Route path="search" element={<SearchAuctionsPage />} />
              <Route path="plans" element={<PlanPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="help" element={<HelpPage />} />
            </Route>
          </Routes>
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
