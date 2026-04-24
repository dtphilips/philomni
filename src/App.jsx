import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

// Auth pages (public)
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Onboarding from '@/pages/Onboarding';
import OnboardingProfile from '@/pages/OnboardingProfile';

// App pages
import Feed from '@/pages/Feed';
import Discover from '@/pages/Discover';
import Explore from '@/pages/Explore';
import Marketplace from '@/pages/Marketplace';
import PitchVault from '@/pages/PitchVault';
import Creators from '@/pages/Creators';
import Directory from '@/pages/Directory';
import Messages from '@/pages/Messages';
import Community from '@/pages/Community';
import Groups from '@/pages/Groups';
import AITools from '@/pages/AITools';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import Admin from '@/pages/Admin';
import Upgrade from '@/pages/Upgrade';
import Analytics from '@/pages/Analytics';
import CreatorAnalytics from '@/pages/CreatorAnalytics';
import AudioStudio from '@/pages/AudioStudio';
import CreativeStudio from '@/pages/CreativeStudio';
import TemplateMarketplace from '@/pages/TemplateMarketplace';
import SharedProjectView from '@/pages/SharedProjectView';
import VideoStudio from '@/pages/VideoStudio';
import VideoMarketplace from '@/pages/VideoMarketplace';
import SharedVideoView from '@/pages/SharedVideoView';
import WorkflowAutomation from '@/pages/WorkflowAutomation';
import Gamification from '@/pages/Gamification';
import CollaborativeStudioPage from '@/pages/CollaborativeStudio';
import Billing from '@/pages/Billing';
import PodcastStudio from '@/pages/PodcastStudio';
import MonetizationHub from '@/pages/MonetizationHub';
import BookingCalendar from '@/pages/BookingCalendar';
import ContentPerformance from '@/pages/ContentPerformance';
import Drafts from '@/pages/Drafts';
import VideoMessages from '@/pages/VideoMessages';
import VideoAnalyticsDashboard from '@/pages/VideoAnalyticsDashboard';
import QualityReview from '@/pages/QualityReview';
import VideoCaptions from '@/pages/VideoCaptions';
import PostVideoEditorPage from '@/pages/PostVideoEditorPage';
import GlobalSearch from '@/pages/GlobalSearch';
import ProjectMatcher from '@/pages/ProjectMatcher';
import CollaborationFeed from '@/pages/CollaborationFeed';
import ContentCalendar from '@/pages/ContentCalendar';
import CreatorMarketplace from '@/pages/CreatorMarketplace';
import Reels from '@/pages/Reels';
import Rooms from '@/pages/Rooms';
import Meetings from '@/pages/Meetings';
import Stories from '@/pages/Stories';
import SkillExchange from '@/pages/SkillExchange';
import BusinessContentSuite from '@/pages/BusinessContentSuite';

// Loading screen
const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
        <span className="text-primary-foreground font-bold text-xl font-display">P</span>
      </div>
      <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
    </div>
  </div>
);

// Redirects to login page using client-side navigation (no full page reload).
// A full-page redirect re-sends all cookies including large Supabase JWTs,
// which can trigger HTTP 431 on the Vite dev server.
// Guards against looping: if already on a public auth page, renders nothing.
const PUBLIC_AUTH_PATHS = ['/login', '/signup', '/onboarding'];
const LoginRedirect = () => {
  const { DEV_MODE } = useAuth();
  const location = useLocation();
  if (DEV_MODE) return null;
  if (PUBLIC_AUTH_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) {
    return null;
  }
  const returnUrl = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding/profile" element={<OnboardingProfile />} />

      {/* Publicly viewable without login */}
      <Route element={<AppLayout />}>
        <Route path="/shared-project/:projectId" element={<SharedProjectView />} />
        <Route path="/shared-video/:videoId" element={<SharedVideoView />} />
      </Route>

      {/* All protected routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/pitch-vault" element={<PitchVault />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/community" element={<Community />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/user/:userId" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/creator-analytics" element={<CreatorAnalytics />} />
          <Route path="/audio-studio" element={<AudioStudio />} />
          <Route path="/creative-studio" element={<CreativeStudio />} />
          <Route path="/templates" element={<TemplateMarketplace />} />
          <Route path="/video-studio" element={<VideoStudio />} />
          <Route path="/video-marketplace" element={<VideoMarketplace />} />
          <Route path="/workflows" element={<WorkflowAutomation />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/collaborative" element={<CollaborativeStudioPage />} />
          <Route path="/collaborative/:workspaceId" element={<CollaborativeStudioPage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/podcast-studio" element={<PodcastStudio />} />
          <Route path="/monetization" element={<MonetizationHub />} />
          <Route path="/bookings" element={<BookingCalendar />} />
          <Route path="/content-performance" element={<ContentPerformance />} />
          <Route path="/drafts" element={<Drafts />} />
          <Route path="/video-messages" element={<VideoMessages />} />
          <Route path="/video-analytics" element={<VideoAnalyticsDashboard />} />
          <Route path="/quality-review/:draftId" element={<QualityReview />} />
          <Route path="/video-captions/:draftId" element={<VideoCaptions />} />
          <Route path="/edit-video/:postId" element={<PostVideoEditorPage />} />
          <Route path="/search" element={<GlobalSearch />} />
          <Route path="/project-matcher" element={<ProjectMatcher />} />
          <Route path="/collaboration-feed" element={<CollaborationFeed />} />
          <Route path="/content-calendar" element={<ContentCalendar />} />
          <Route path="/creator-marketplace" element={<CreatorMarketplace />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/skill-exchange" element={<SkillExchange />} />
          <Route path="/business-content" element={<BusinessContentSuite />} />
        </Route>
      </Route>

      {/* Redirect root for backwards compat */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Sonner richColors closeButton position="bottom-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
