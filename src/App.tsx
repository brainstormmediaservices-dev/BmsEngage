import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './lib/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OnboardingTour } from './components/onboarding/OnboardingTour';
import LandingPage from './app/LandingPage';
import AboutPage from './app/marketing/AboutPage';
import ServicesPage from './app/marketing/ServicesPage';
import FeaturesPage from './app/marketing/FeaturesPage';
import PricingPage from './app/marketing/PricingPage';
import CaseStudiesPage from './app/marketing/CaseStudiesPage';
import ContactPage from './app/marketing/ContactPage';
import SignInPage from './app/auth/SignInPage';
import SignUpPage from './app/auth/SignUpPage';
import ForgotPasswordPage from './app/auth/ForgotPasswordPage';
import VerifyEmailPage from './app/auth/VerifyEmailPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import DashboardOverview from './app/DashboardOverview';
import GalleryPage from './app/GalleryPage';
import SocialAccountsPage from './app/SocialAccountsPage';
import PostsPage from './app/PostsPage';
import ComposerPage from './app/ComposerPage';
import SchedulerPage from './app/SchedulerPage';
import AnalyticsPage from './app/AnalyticsPage';
import SettingsPage from './app/SettingsPage';
import NotificationsPage from './app/NotificationsPage';
import SharedAssetPage from './app/SharedAssetPage';
import AdminDashboard from './app/admin/AdminDashboard';
import { AdminLayout } from './components/layout/AdminLayout';

// Redirects /gallery/share/:id/edit → /gallery?editAsset=:id after login
function GalleryEditRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/gallery?editAsset=${id}`} replace />;
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const isLoggedIn = localStorage.getItem('token');
    
    if (isLoggedIn && !hasCompletedOnboarding) {
      // Small delay to let the dashboard load first
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              {showOnboarding && (
                <OnboardingTour 
                  onComplete={handleOnboardingComplete}
                  onSkip={handleOnboardingSkip}
                />
              )}
              <Routes>
            {/* Public Marketing Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/case-studies" element={<CaseStudiesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<SignInPage />} />
            <Route path="/register" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Public shared asset view */}
            <Route path="/gallery/share/:id" element={<SharedAssetPage />} />

            {/* Edit link — requires login, redirects to gallery with asset open for variant upload */}
            <Route path="/gallery/share/:id/edit" element={
              <ProtectedRoute><GalleryEditRedirect /></ProtectedRoute>
            } />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/social-accounts" element={<SocialAccountsPage />} />
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/composer" element={<ComposerPage />} />
              <Route path="/scheduler" element={<SchedulerPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Superadmin Routes */}
            <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
