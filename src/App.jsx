import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ModeProvider } from './context/ModeContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { MusicProvider } from './context/MusicContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DebugHUD from './components/DebugHUD'

// ─── Lazy-loaded pages — each becomes its own JS chunk ────────────────────────
// Auth
const Login    = lazy(() => import('./pages/Login'))
const Signup   = lazy(() => import('./pages/Signup'))

// Core
const Feed             = lazy(() => import('./pages/Feed'))
const ProFeed          = lazy(() => import('./pages/ProFeed'))
const Profile          = lazy(() => import('./pages/Profile'))
const EditProfile      = lazy(() => import('./pages/EditProfile'))
const Settings         = lazy(() => import('./pages/Settings'))
const Notifications    = lazy(() => import('./pages/Notifications'))
const GlobalSearch     = lazy(() => import('./pages/GlobalSearch'))

// Social
const Community         = lazy(() => import('./pages/Community'))
const Groups            = lazy(() => import('./pages/Groups'))
const GroupChat         = lazy(() => import('./pages/GroupChat'))
const Discover          = lazy(() => import('./pages/Discover'))
const Explore           = lazy(() => import('./pages/Explore'))
const Directory         = lazy(() => import('./pages/Directory'))
const Creators          = lazy(() => import('./pages/Creators'))
const CollaborationFeed = lazy(() => import('./pages/CollaborationFeed'))

// Messaging
const Messages      = lazy(() => import('./pages/Messages'))
const VideoMessages  = lazy(() => import('./pages/VideoMessages'))

// Content
const Reels           = lazy(() => import('./pages/Reels'))
const Stories         = lazy(() => import('./pages/Stories'))
const Drafts          = lazy(() => import('./pages/Drafts'))
const ContentCalendar = lazy(() => import('./pages/ContentCalendar'))

// Studios
const AudioStudio         = lazy(() => import('./pages/AudioStudio'))
const CreativeStudio      = lazy(() => import('./pages/CreativeStudio'))
const CreatorStudio       = lazy(() => import('./pages/CreatorStudio'))
const VideoStudio         = lazy(() => import('./pages/VideoStudio'))
const PodcastStudio       = lazy(() => import('./pages/PodcastStudio'))
const CollaborativeStudio = lazy(() => import('./pages/CollaborativeStudio'))
const UGCCreatorSuite     = lazy(() => import('./pages/UGCCreatorSuite'))
const BusinessContentSuite = lazy(() => import('./pages/BusinessContentSuite'))

// Media
const MusicLibrary           = lazy(() => import('./pages/MusicLibrary'))
const Podcasts               = lazy(() => import('./pages/Podcasts'))
const VideoCaptions          = lazy(() => import('./pages/VideoCaptions'))
const VideoAnalyticsDashboard = lazy(() => import('./pages/VideoAnalyticsDashboard'))

// Analytics & AI
const Analytics          = lazy(() => import('./pages/Analytics'))
const ContentSuite       = lazy(() => import('./pages/ContentSuite'))
const ContentPerformance = lazy(() => import('./pages/ContentPerformance'))
const CreatorAnalytics   = lazy(() => import('./pages/CreatorAnalytics'))
const AITools            = lazy(() => import('./pages/AITools'))
const WorkflowAutomation = lazy(() => import('./pages/WorkflowAutomation'))

// Jobs, Learning, Store
const Jobs         = lazy(() => import('./pages/Jobs'))
const Learning     = lazy(() => import('./pages/Learning'))
const Certificates = lazy(() => import('./pages/Certificates'))
const CreatorStore = lazy(() => import('./pages/CreatorStore'))

// Professional Network
const Companies        = lazy(() => import('./pages/Companies'))
const CompanyProfile   = lazy(() => import('./pages/CompanyProfile'))
const CreateCompany    = lazy(() => import('./pages/CreateCompany'))
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'))

// Marketplace & Commerce
const MyOrders            = lazy(() => import('./pages/MyOrders'))
const OrderPage           = lazy(() => import('./pages/OrderPage'))
const CourseViewer        = lazy(() => import('./pages/CourseViewer'))
const SellerStorefront    = lazy(() => import('./pages/SellerStorefront'))
const CreatorMarket       = lazy(() => import('./pages/CreatorMarket'))
const CreatorMarketplace  = lazy(() => import('./pages/CreatorMarketplace'))
const Marketplace         = lazy(() => import('./pages/Marketplace'))
const VideoMarketplace    = lazy(() => import('./pages/VideoMarketplace'))
const TemplateMarketplace = lazy(() => import('./pages/TemplateMarketplace'))
const SkillExchange       = lazy(() => import('./pages/SkillExchange'))
const Monetization        = lazy(() => import('./pages/Monetization'))
const Upgrade             = lazy(() => import('./pages/Upgrade'))
const Billing             = lazy(() => import('./pages/Billing'))
const Pricing             = lazy(() => import('./pages/Pricing'))

// SmartMatch
const SmartMatch = lazy(() => import('./pages/SmartMatch'))

// Philo AI
const PhilomniAI = lazy(() => import('./pages/PhilomniAI'))

// Business
const PitchVault         = lazy(() => import('./pages/PitchVault'))
const BookingCalendar    = lazy(() => import('./pages/BookingCalendar'))
const Meetings           = lazy(() => import('./pages/Meetings'))
const Rooms              = lazy(() => import('./pages/Rooms'))
const ProjectMatcher     = lazy(() => import('./pages/ProjectMatcher'))
const SharedProjectView  = lazy(() => import('./pages/SharedProjectView'))
const SharedVideoView    = lazy(() => import('./pages/SharedVideoView'))
const PostVideoEditorPage = lazy(() => import('./pages/PostVideoEditorPage'))
const QualityReview      = lazy(() => import('./pages/QualityReview'))
const Gamification       = lazy(() => import('./pages/Gamification'))

// Admin
const Admin             = lazy(() => import('./pages/Admin'))
const AdminBadges       = lazy(() => import('./pages/admin/AdminBadges'))
const AdminMonetize     = lazy(() => import('./pages/admin/AdminMonetize'))
const AdminAds          = lazy(() => import('./pages/admin/AdminAds'))
const AdminBrands       = lazy(() => import('./pages/admin/AdminBrands'))
const AdminMusic        = lazy(() => import('./pages/admin/AdminMusic'))
const AdminSpotlight    = lazy(() => import('./pages/admin/AdminSpotlight'))
const AdminCelebrations = lazy(() => import('./pages/admin/AdminCelebrations'))

// Spotlight
const SpotlightArchive  = lazy(() => import('./pages/SpotlightArchive'))
const SpotlightPage     = lazy(() => import('./pages/SpotlightPage'))
const SpotlightNominate = lazy(() => import('./pages/SpotlightNominate'))

// Misc
const ArtistProfile   = lazy(() => import('./pages/ArtistProfile'))
const PlaylistPage    = lazy(() => import('./pages/PlaylistPage'))
const Partners        = lazy(() => import('./pages/Partners'))
const VerifyBadge     = lazy(() => import('./pages/VerifyBadge'))
const CreatorMonetize = lazy(() => import('./pages/CreatorMonetize'))
const Advertise       = lazy(() => import('./pages/Advertise'))
const MyAds           = lazy(() => import('./pages/MyAds'))

// Creator Economy
const Wallet         = lazy(() => import('./pages/Wallet'))
const Learn          = lazy(() => import('./pages/Learn'))
const CourseDetail   = lazy(() => import('./pages/CourseDetail'))
const CourseWatch    = lazy(() => import('./pages/CourseWatch'))
const Teach          = lazy(() => import('./pages/Teach'))
const ProductMarketplace = lazy(() => import('./pages/ProductMarketplace'))
const Sell           = lazy(() => import('./pages/Sell'))
const Consulting     = lazy(() => import('./pages/Consulting'))
const ConsultingOffer = lazy(() => import('./pages/ConsultingOffer'))
const Investors      = lazy(() => import('./pages/Investors'))

// Onboarding
const Onboarding        = lazy(() => import('./pages/Onboarding'))
const OnboardingProfile = lazy(() => import('./pages/OnboardingProfile'))

// Live
const LiveHost   = lazy(() => import('./pages/LiveHost'))
const LiveViewer = lazy(() => import('./pages/LiveViewer'))
const LiveStart  = lazy(() => import('./pages/LiveStart'))
const LiveRecap  = lazy(() => import('./pages/LiveRecap'))
const BuyCoins   = lazy(() => import('./pages/BuyCoins'))

// Philomni Shop — affiliate marketplace
const AffiliateMarketplace = lazy(() => import('./pages/AffiliateMarketplace'))
const SellerDashboard      = lazy(() => import('./pages/SellerDashboard'))
const AffiliateEarnings    = lazy(() => import('./pages/AffiliateEarnings'))
const ProductDetail        = lazy(() => import('./pages/ProductDetail'))

// Celebrations
const Celebrations       = lazy(() => import('./pages/Celebrations'))
const CelebrationCreate  = lazy(() => import('./pages/CelebrationCreate'))
const CelebrationDetail  = lazy(() => import('./pages/CelebrationDetail'))
const CelebrationSponsor = lazy(() => import('./pages/CelebrationSponsor'))

// ─── Query client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // CRITICAL: do NOT refetch every query when the tab regains focus or the
      // network reconnects. With this on (the default), switching back to the
      // Philomni tab refetched every useQuery (who-to-follow, trending, stories,
      // notifications, chat…) and — under the single app-wide <Suspense> — could
      // remount the whole route subtree, resetting pages to skeletons.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  // TEMP diagnostic — if this logs repeatedly, the Suspense boundary is re-suspending
  if (typeof window !== 'undefined') window.__dlog?.('PageLoader (Suspense fallback) shown')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{
        width: '32px', height: '32px',
        border: '3px solid #1a1a2e',
        borderTop: '3px solid #8b5cf6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Route wrapper ────────────────────────────────────────────────────────────
// ALL layout routes use the same R component so React never swaps the Layout
// instance — navigating between auth-required and public pages keeps Layout
// (sidebar, bottom nav, player) fully mounted at all times.
// auth=true  → ProtectedRoute guards the page (redirects to /login if signed out)
// auth=false → page renders for everyone (Login prompt shown inline if needed)
function R({ page: Page, auth = false }) {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {auth
          ? <ProtectedRoute><Page /></ProtectedRoute>
          : <Page />
        }
      </Suspense>
    </Layout>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <SubscriptionProvider>
      <MusicProvider>
      <ModeProvider>
        <DebugHUD />
        <BrowserRouter>
          {/* Outer Suspense catches the very first bundle evaluation only */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public — no Layout */}
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/shared/video/:id" element={<SharedVideoView />} />
              <Route path="/shared/project/:id" element={<SharedProjectView />} />

              {/* Core */}
              <Route path="/" element={<R page={Feed} />} />
              <Route path="/pro-feed" element={<R page={ProFeed} />} />
              <Route path="/profile" element={<R page={Profile} auth />} />
              <Route path="/profile/:userId" element={<R page={Profile} auth />} />
              <Route path="/edit-profile" element={<R page={EditProfile} auth />} />
              <Route path="/settings" element={<R page={Settings} auth />} />
              <Route path="/notifications" element={<R page={Notifications} auth />} />
              <Route path="/search" element={<R page={GlobalSearch} auth />} />

              {/* Social */}
              <Route path="/community" element={<R page={Community} />} />
              <Route path="/groups" element={<R page={Groups} />} />
              <Route path="/groups/:id" element={<R page={GroupChat} />} />
              <Route path="/discover" element={<R page={Discover} />} />
              <Route path="/explore" element={<R page={Explore} />} />
              <Route path="/directory" element={<R page={Directory} />} />
              <Route path="/creators" element={<R page={Creators} />} />
              <Route path="/collab-feed" element={<R page={CollaborationFeed} />} />

              {/* Messaging */}
              <Route path="/messages" element={<R page={Messages} auth />} />
              <Route path="/video-messages" element={<R page={VideoMessages} auth />} />

              {/* Content */}
              <Route path="/reels" element={<R page={Reels} />} />
              <Route path="/stories" element={<R page={Stories} auth />} />
              <Route path="/drafts" element={<R page={Drafts} auth />} />
              <Route path="/content-calendar" element={<R page={ContentCalendar} auth />} />

              {/* Studios */}
              <Route path="/audio-studio" element={<R page={AudioStudio} auth />} />
              <Route path="/creative-studio" element={<R page={CreativeStudio} auth />} />
              <Route path="/creator-studio" element={<R page={CreatorStudio} auth />} />
              <Route path="/video-studio" element={<R page={VideoStudio} auth />} />
              <Route path="/podcast-studio" element={<R page={PodcastStudio} auth />} />
              <Route path="/collab-studio" element={<R page={CollaborativeStudio} auth />} />
              <Route path="/ugc-suite" element={<R page={UGCCreatorSuite} auth />} />
              <Route path="/business-content" element={<R page={BusinessContentSuite} auth />} />

              {/* Media */}
              <Route path="/music-library" element={<R page={MusicLibrary} />} />
              <Route path="/music"         element={<R page={MusicLibrary} />} />
              <Route path="/podcasts" element={<R page={Podcasts} auth />} />
              <Route path="/video-captions/:draftId" element={<R page={VideoCaptions} auth />} />
              <Route path="/video-analytics/:draftId" element={<R page={VideoAnalyticsDashboard} auth />} />

              {/* Analytics & AI */}
              <Route path="/analytics" element={<R page={Analytics} auth />} />
              <Route path="/content" element={<R page={ContentSuite} auth />} />
              <Route path="/content-performance" element={<R page={ContentPerformance} auth />} />
              <Route path="/creator-analytics" element={<R page={CreatorAnalytics} auth />} />
              <Route path="/ai-tools" element={<R page={AITools} auth />} />
              <Route path="/workflows" element={<R page={WorkflowAutomation} auth />} />

              {/* Jobs, Learning, Store */}
              <Route path="/jobs" element={<R page={Jobs} />} />
              <Route path="/learning" element={<R page={Learning} />} />
              <Route path="/learning/certificates" element={<R page={Certificates} auth />} />
              <Route path="/store" element={<R page={CreatorStore} />} />

              {/* Professional Network */}
              <Route path="/companies" element={<R page={Companies} auth />} />
              <Route path="/company/create" element={<R page={CreateCompany} auth />} />
              <Route path="/company/dashboard" element={<R page={CompanyDashboard} auth />} />
              <Route path="/company/:id" element={<R page={CompanyProfile} auth />} />
              <Route path="/stores" element={<R page={CreatorStore} auth />} />
              <Route path="/store/dashboard" element={<R page={CreatorStore} auth />} />
              <Route path="/store/:username" element={<R page={CreatorStore} auth />} />

              {/* Marketplace */}
              <Route path="/my-orders" element={<R page={MyOrders} auth />} />
              <Route path="/orders/:id" element={<R page={OrderPage} auth />} />
              <Route path="/course/:id" element={<R page={CourseViewer} />} />
              <Route path="/seller/:sellerId" element={<R page={SellerStorefront} />} />
              <Route path="/marketplace" element={<Navigate to="/shop" replace />} />
              <Route path="/creator-marketplace" element={<Navigate to="/shop" replace />} />
              <Route path="/shop" element={<R page={ProductMarketplace} />} />
              <Route path="/jobs-board" element={<R page={Marketplace} />} />
              <Route path="/product/:id" element={<R page={ProductDetail} />} />
              <Route path="/video-marketplace" element={<R page={VideoMarketplace} />} />
              <Route path="/templates" element={<R page={TemplateMarketplace} />} />
              <Route path="/skills" element={<R page={SkillExchange} />} />
              <Route path="/upgrade"  element={<R page={Upgrade} auth />} />
              <Route path="/billing"  element={<R page={Billing} auth />} />
              <Route path="/pricing"  element={<R page={Pricing} />} />

              {/* Creator Economy */}
              <Route path="/wallet"                element={<R page={Wallet} auth />} />
              <Route path="/learn"                 element={<R page={Learn} />} />
              <Route path="/learn/:courseId"       element={<R page={CourseDetail} />} />
              <Route path="/learn/:courseId/watch" element={<R page={CourseWatch} auth />} />
              <Route path="/teach"                 element={<R page={Teach} auth />} />
              <Route path="/sell"                  element={<R page={Sell} auth />} />
              <Route path="/consulting"            element={<R page={Consulting} auth />} />
              <Route path="/consulting/offer"      element={<R page={ConsultingOffer} auth />} />
              <Route path="/investors"             element={<R page={Investors} auth />} />

              {/* SmartMatch */}
              <Route path="/match"      element={<R page={SmartMatch} auth />} />
              <Route path="/smartmatch" element={<R page={SmartMatch} auth />} />

              {/* Philo AI */}
              <Route path="/ai" element={<R page={PhilomniAI} auth />} />

              {/* Business */}
              <Route path="/pitch-vault"              element={<R page={PitchVault} auth />} />
              <Route path="/bookings"                 element={<R page={BookingCalendar} auth />} />
              <Route path="/meetings"                 element={<R page={Meetings} auth />} />
              <Route path="/rooms"                    element={<R page={Rooms} />} />
              <Route path="/project-matcher"          element={<R page={ProjectMatcher} auth />} />
              <Route path="/quality-review/:draftId"  element={<R page={QualityReview} auth />} />
              <Route path="/video-editor/:id"         element={<R page={PostVideoEditorPage} auth />} />
              <Route path="/gamification"             element={<R page={Gamification} auth />} />

              {/* Admin */}
              <Route path="/admin"               element={<R page={Admin} auth />} />
              <Route path="/admin/badges"        element={<R page={AdminBadges} auth />} />
              <Route path="/admin/monetize"      element={<R page={AdminMonetize} auth />} />
              <Route path="/admin/ads"           element={<R page={AdminAds} auth />} />
              <Route path="/admin/brands"        element={<R page={AdminBrands} auth />} />
              <Route path="/admin/music"         element={<R page={AdminMusic} auth />} />
              <Route path="/admin/spotlight"     element={<R page={AdminSpotlight} auth />} />
              <Route path="/admin/celebrations"  element={<R page={AdminCelebrations} auth />} />
              <Route path="/verify-badge"        element={<R page={VerifyBadge} auth />} />

              {/* Spotlight */}
              <Route path="/spotlight"           element={<R page={SpotlightArchive} />} />
              <Route path="/spotlight/nominate"  element={<R page={SpotlightNominate} />} />
              <Route path="/spotlight/current"   element={<R page={SpotlightPage} />} />
              <Route path="/spotlight/:month"    element={<R page={SpotlightPage} />} />

              {/* Monetize / Ads */}
              <Route path="/monetize"  element={<R page={CreatorMonetize} auth />} />
              <Route path="/advertise" element={<R page={Advertise} auth />} />
              <Route path="/my-ads"    element={<R page={MyAds} auth />} />

              {/* Philomni Shop */}
              <Route path="/affiliate"          element={<R page={AffiliateMarketplace} />} />
              <Route path="/seller-dashboard"   element={<R page={SellerDashboard} auth />} />
              <Route path="/affiliate-earnings" element={<R page={AffiliateEarnings} auth />} />

              {/* Music — Artist & Playlist */}
              <Route path="/artist/:userId" element={<R page={ArtistProfile} />} />
              <Route path="/playlist/:id"   element={<R page={PlaylistPage} />} />

              {/* Onboarding — no Layout */}
              <Route path="/onboarding"         element={<Onboarding />} />
              <Route path="/onboarding/profile" element={<OnboardingProfile />} />

              {/* Live — full-screen, no sidebar */}
              <Route path="/live/start"     element={<R page={LiveStart} auth />} />
              <Route path="/live/:id/host"  element={<LiveHost />} />
              <Route path="/live/:id/recap" element={<R page={LiveRecap} auth />} />
              <Route path="/live/:id"       element={<LiveViewer />} />
              <Route path="/coins"          element={<R page={BuyCoins} auth />} />

              {/* Celebrations */}
              <Route path="/celebrations"         element={<R page={Celebrations} />} />
              <Route path="/celebrations/create"  element={<R page={CelebrationCreate} auth />} />
              <Route path="/celebrations/sponsor" element={<R page={CelebrationSponsor} auth />} />
              <Route path="/celebrations/:id"     element={<R page={CelebrationDetail} />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ModeProvider>
      </MusicProvider>
      </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
