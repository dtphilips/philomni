import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ModeProvider } from './context/ModeContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { MusicProvider } from './context/MusicContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

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

// Celebrations
const Celebrations       = lazy(() => import('./pages/Celebrations'))
const CelebrationCreate  = lazy(() => import('./pages/CelebrationCreate'))
const CelebrationDetail  = lazy(() => import('./pages/CelebrationDetail'))
const CelebrationSponsor = lazy(() => import('./pages/CelebrationSponsor'))

// ─── Query client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

// ─── Route wrappers ───────────────────────────────────────────────────────────
function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function P({ page: Page }) {
  return <ProtectedLayout><Page /></ProtectedLayout>
}

// Public pages — show Layout (sidebar) but do NOT require login
function PL({ page: Page }) {
  return <Layout><Page /></Layout>
}

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
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

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <SubscriptionProvider>
      <MusicProvider>
      <ModeProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/shared/video/:id" element={<SharedVideoView />} />
              <Route path="/shared/project/:id" element={<SharedProjectView />} />

              {/* Core */}
              <Route path="/" element={<PL page={Feed} />} />
              <Route path="/pro-feed" element={<PL page={ProFeed} />} />
              <Route path="/profile" element={<P page={Profile} />} />
              <Route path="/profile/:userId" element={<P page={Profile} />} />
              <Route path="/edit-profile" element={<P page={EditProfile} />} />
              <Route path="/settings" element={<P page={Settings} />} />
              <Route path="/notifications" element={<P page={Notifications} />} />
              <Route path="/search" element={<P page={GlobalSearch} />} />

              {/* Social */}
              <Route path="/community" element={<PL page={Community} />} />
              <Route path="/groups" element={<PL page={Groups} />} />
              <Route path="/groups/:id" element={<PL page={GroupChat} />} />
              <Route path="/discover" element={<PL page={Discover} />} />
              <Route path="/explore" element={<PL page={Explore} />} />
              <Route path="/directory" element={<PL page={Directory} />} />
              <Route path="/creators" element={<PL page={Creators} />} />
              <Route path="/collab-feed" element={<PL page={CollaborationFeed} />} />

              {/* Messaging */}
              <Route path="/messages" element={<P page={Messages} />} />
              <Route path="/video-messages" element={<P page={VideoMessages} />} />

              {/* Content */}
              <Route path="/reels" element={<PL page={Reels} />} />
              <Route path="/stories" element={<P page={Stories} />} />
              <Route path="/drafts" element={<P page={Drafts} />} />
              <Route path="/content-calendar" element={<P page={ContentCalendar} />} />

              {/* Studios */}
              <Route path="/audio-studio" element={<P page={AudioStudio} />} />
              <Route path="/creative-studio" element={<P page={CreativeStudio} />} />
              <Route path="/creator-studio" element={<P page={CreatorStudio} />} />
              <Route path="/video-studio" element={<P page={VideoStudio} />} />
              <Route path="/podcast-studio" element={<P page={PodcastStudio} />} />
              <Route path="/collab-studio" element={<P page={CollaborativeStudio} />} />
              <Route path="/ugc-suite" element={<P page={UGCCreatorSuite} />} />
              <Route path="/business-content" element={<P page={BusinessContentSuite} />} />

              {/* Media */}
              <Route path="/music-library" element={<PL page={MusicLibrary} />} />
              <Route path="/music"         element={<PL page={MusicLibrary} />} />
              <Route path="/podcasts" element={<P page={Podcasts} />} />
              <Route path="/video-captions/:draftId" element={<P page={VideoCaptions} />} />
              <Route path="/video-analytics/:draftId" element={<P page={VideoAnalyticsDashboard} />} />

              {/* Analytics & AI */}
              <Route path="/analytics" element={<P page={Analytics} />} />
              <Route path="/content" element={<P page={ContentSuite} />} />
              <Route path="/content-performance" element={<P page={ContentPerformance} />} />
              <Route path="/creator-analytics" element={<P page={CreatorAnalytics} />} />
              <Route path="/ai-tools" element={<P page={AITools} />} />
              <Route path="/workflows" element={<P page={WorkflowAutomation} />} />

              {/* Jobs, Learning, Store */}
              <Route path="/jobs" element={<PL page={Jobs} />} />
              <Route path="/learning" element={<PL page={Learning} />} />
              <Route path="/learning/certificates" element={<P page={Certificates} />} />
              <Route path="/store" element={<PL page={CreatorStore} />} />

              {/* Professional Network */}
              <Route path="/companies" element={<P page={Companies} />} />
              <Route path="/company/create" element={<P page={CreateCompany} />} />
              <Route path="/company/dashboard" element={<P page={CompanyDashboard} />} />
              <Route path="/company/:id" element={<P page={CompanyProfile} />} />
              <Route path="/stores" element={<P page={CreatorStore} />} />
              <Route path="/store/dashboard" element={<P page={CreatorStore} />} />
              <Route path="/store/:username" element={<P page={CreatorStore} />} />

              {/* Marketplace */}
              <Route path="/my-orders" element={<P page={MyOrders} />} />
              <Route path="/orders/:id" element={<P page={OrderPage} />} />
              <Route path="/course/:id" element={<PL page={CourseViewer} />} />
              <Route path="/seller/:sellerId" element={<PL page={SellerStorefront} />} />
              <Route path="/marketplace" element={<PL page={ProductMarketplace} />} />
              <Route path="/creator-marketplace" element={<PL page={CreatorMarketplace} />} />
              <Route path="/shop" element={<PL page={Marketplace} />} />
              <Route path="/video-marketplace" element={<PL page={VideoMarketplace} />} />
              <Route path="/templates" element={<PL page={TemplateMarketplace} />} />
              <Route path="/skills" element={<PL page={SkillExchange} />} />
              <Route path="/upgrade"  element={<P page={Upgrade} />} />
              <Route path="/billing"  element={<P page={Billing} />} />
              <Route path="/pricing"  element={<P page={Pricing} />} />

              {/* Creator Economy */}
              <Route path="/wallet"                element={<P page={Wallet} />} />
              <Route path="/learn"                 element={<PL page={Learn} />} />
              <Route path="/learn/:courseId"       element={<PL page={CourseDetail} />} />
              <Route path="/learn/:courseId/watch" element={<P page={CourseWatch} />} />
              <Route path="/teach"                 element={<P page={Teach} />} />
              <Route path="/sell"                  element={<P page={Sell} />} />
              <Route path="/consulting"            element={<P page={Consulting} />} />
              <Route path="/consulting/offer"      element={<P page={ConsultingOffer} />} />
              <Route path="/investors"             element={<P page={Investors} />} />

              {/* SmartMatch */}
              <Route path="/match"      element={<P page={SmartMatch} />} />
              <Route path="/smartmatch" element={<P page={SmartMatch} />} />

              {/* Philo AI */}
              <Route path="/ai" element={<P page={PhilomniAI} />} />

              {/* Business */}
              <Route path="/pitch-vault"                element={<P page={PitchVault} />} />
              <Route path="/bookings"                   element={<P page={BookingCalendar} />} />
              <Route path="/meetings"                   element={<P page={Meetings} />} />
              <Route path="/rooms"                      element={<PL page={Rooms} />} />
              <Route path="/project-matcher"            element={<P page={ProjectMatcher} />} />
              <Route path="/quality-review/:draftId"   element={<P page={QualityReview} />} />
              <Route path="/video-editor/:id"          element={<P page={PostVideoEditorPage} />} />
              <Route path="/gamification"               element={<P page={Gamification} />} />

              {/* Admin */}
              <Route path="/admin"                element={<P page={Admin} />} />
              <Route path="/admin/badges"         element={<P page={AdminBadges} />} />
              <Route path="/admin/monetize"       element={<P page={AdminMonetize} />} />
              <Route path="/admin/ads"            element={<P page={AdminAds} />} />
              <Route path="/admin/brands"         element={<P page={AdminBrands} />} />
              <Route path="/admin/music"          element={<P page={AdminMusic} />} />
              <Route path="/admin/spotlight"      element={<P page={AdminSpotlight} />} />
              <Route path="/admin/celebrations"   element={<P page={AdminCelebrations} />} />
              <Route path="/verify-badge"         element={<P page={VerifyBadge} />} />

              {/* Spotlight */}
              <Route path="/spotlight"           element={<PL page={SpotlightArchive} />} />
              <Route path="/spotlight/nominate"  element={<PL page={SpotlightNominate} />} />
              <Route path="/spotlight/current"   element={<PL page={SpotlightPage} />} />
              <Route path="/spotlight/:month"    element={<PL page={SpotlightPage} />} />

              {/* Monetize / Ads */}
              <Route path="/monetize"  element={<P page={CreatorMonetize} />} />
              <Route path="/advertise" element={<P page={Advertise} />} />
              <Route path="/my-ads"    element={<P page={MyAds} />} />

              {/* Philomni Shop — affiliate marketplace (public to browse, auth to promote/sell) */}
              <Route path="/affiliate"           element={<PL page={AffiliateMarketplace} />} />
              <Route path="/seller-dashboard"    element={<P page={SellerDashboard} />} />
              <Route path="/affiliate-earnings"  element={<P page={AffiliateEarnings} />} />

              {/* Music — Artist & Playlist */}
              <Route path="/artist/:userId" element={<PL page={ArtistProfile} />} />
              <Route path="/playlist/:id"   element={<PL page={PlaylistPage} />} />

              {/* Onboarding */}
              <Route path="/onboarding"         element={<Onboarding />} />
              <Route path="/onboarding/profile" element={<OnboardingProfile />} />

              {/* Live — full-screen, no sidebar */}
              <Route path="/live/start"     element={<P page={LiveStart} />} />
              <Route path="/live/:id/host"  element={<LiveHost />} />
              <Route path="/live/:id/recap" element={<P page={LiveRecap} />} />
              <Route path="/live/:id"       element={<LiveViewer />} />
              <Route path="/coins"          element={<P page={BuyCoins} />} />

              {/* Celebrations */}
              <Route path="/celebrations"          element={<PL page={Celebrations} />} />
              <Route path="/celebrations/create"   element={<P page={CelebrationCreate} />} />
              <Route path="/celebrations/sponsor"  element={<P page={CelebrationSponsor} />} />
              <Route path="/celebrations/:id"      element={<PL page={CelebrationDetail} />} />

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
