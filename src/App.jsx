import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ModeProvider } from './context/ModeContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { MusicProvider } from './context/MusicContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'

// Auth pages
import Login from './pages/Login'
import Signup from './pages/Signup'

// Core pages
import Feed from './pages/Feed'
import ProFeed from './pages/ProFeed'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import GlobalSearch from './pages/GlobalSearch'

// Social / Community
import Community from './pages/Community'
import Groups from './pages/Groups'
import GroupChat from './pages/GroupChat'
import Discover from './pages/Discover'
import Explore from './pages/Explore'
import Directory from './pages/Directory'
import Creators from './pages/Creators'
import CollaborationFeed from './pages/CollaborationFeed'

// Messaging
import Messages from './pages/Messages'
import VideoMessages from './pages/VideoMessages'

// Content creation
import Reels from './pages/Reels'
import Stories from './pages/Stories'
import Drafts from './pages/Drafts'
import ContentCalendar from './pages/ContentCalendar'

// Studios
import AudioStudio from './pages/AudioStudio'
import CreativeStudio from './pages/CreativeStudio'
import CreatorStudio from './pages/CreatorStudio'
import VideoStudio from './pages/VideoStudio'
import PodcastStudio from './pages/PodcastStudio'
import CollaborativeStudio from './pages/CollaborativeStudio'
import UGCCreatorSuite from './pages/UGCCreatorSuite'
import BusinessContentSuite from './pages/BusinessContentSuite'

// Media
import MusicLibrary from './pages/MusicLibrary'
import Podcasts from './pages/Podcasts'
import VideoCaptions from './pages/VideoCaptions'
import VideoAnalyticsDashboard from './pages/VideoAnalyticsDashboard'

// Analytics & AI
import Analytics from './pages/Analytics'
import ContentSuite from './pages/ContentSuite'
import ContentPerformance from './pages/ContentPerformance'
import CreatorAnalytics from './pages/CreatorAnalytics'
import AITools from './pages/AITools'
import WorkflowAutomation from './pages/WorkflowAutomation'

// New major sections
import Jobs from './pages/Jobs'
import Learning from './pages/Learning'
import Certificates from './pages/Certificates'
import CreatorStore from './pages/CreatorStore'

// Professional Network
import Companies from './pages/Companies'
import CompanyProfile from './pages/CompanyProfile'
import CreateCompany from './pages/CreateCompany'
import CompanyDashboard from './pages/CompanyDashboard'

// Marketplace & Commerce
import MyOrders from './pages/MyOrders'
import OrderPage from './pages/OrderPage'
import CourseViewer from './pages/CourseViewer'
import SellerStorefront from './pages/SellerStorefront'
import CreatorMarket from './pages/CreatorMarket'
import CreatorMarketplace from './pages/CreatorMarketplace'
import Marketplace from './pages/Marketplace'
import VideoMarketplace from './pages/VideoMarketplace'
import TemplateMarketplace from './pages/TemplateMarketplace'
import SkillExchange from './pages/SkillExchange'
import Monetization from './pages/Monetization'
import Upgrade from './pages/Upgrade'
import Billing from './pages/Billing'
import Pricing from './pages/Pricing'

// SmartMatch
import SmartMatch from './pages/SmartMatch'

// Philo AI
import PhilomniAI from './pages/PhilomniAI'

// Business tools
import PitchVault from './pages/PitchVault'
import BookingCalendar from './pages/BookingCalendar'
import Meetings from './pages/Meetings'
import Rooms from './pages/Rooms'
import ProjectMatcher from './pages/ProjectMatcher'
import SharedProjectView from './pages/SharedProjectView'
import SharedVideoView from './pages/SharedVideoView'
import PostVideoEditorPage from './pages/PostVideoEditorPage'
import QualityReview from './pages/QualityReview'
import Gamification from './pages/Gamification'
import Admin from './pages/Admin'
import AdminBadges from './pages/admin/AdminBadges'
import AdminMonetize from './pages/admin/AdminMonetize'
import AdminAds from './pages/admin/AdminAds'
import AdminBrands from './pages/admin/AdminBrands'
import AdminMusic from './pages/admin/AdminMusic'
import AdminSpotlight from './pages/admin/AdminSpotlight'
import ArtistProfile from './pages/ArtistProfile'
import SpotlightArchive from './pages/SpotlightArchive'
import SpotlightPage from './pages/SpotlightPage'
import SpotlightNominate from './pages/SpotlightNominate'
import PlaylistPage from './pages/PlaylistPage'
import Partners from './pages/Partners'
import VerifyBadge from './pages/VerifyBadge'
import CreatorMonetize from './pages/CreatorMonetize'
import Advertise from './pages/Advertise'
import MyAds from './pages/MyAds'
// Creator Economy
import Wallet from './pages/Wallet'
import Learn from './pages/Learn'
import CourseDetail from './pages/CourseDetail'
import CourseWatch from './pages/CourseWatch'
import Teach from './pages/Teach'
import ProductMarketplace from './pages/ProductMarketplace'
import Sell from './pages/Sell'
import Consulting from './pages/Consulting'
import ConsultingOffer from './pages/ConsultingOffer'
import Investors from './pages/Investors'

import Onboarding from './pages/Onboarding'
import OnboardingProfile from './pages/OnboardingProfile'

// Live feature
import LiveHost from './pages/LiveHost'
import LiveViewer from './pages/LiveViewer'
import LiveStart from './pages/LiveStart'
import LiveRecap from './pages/LiveRecap'
import BuyCoins from './pages/BuyCoins'

// Celebrations feature
import Celebrations from './pages/Celebrations'
import CelebrationCreate from './pages/CelebrationCreate'
import CelebrationDetail from './pages/CelebrationDetail'
import CelebrationSponsor from './pages/CelebrationSponsor'
import AdminCelebrations from './pages/admin/AdminCelebrations'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <SubscriptionProvider>
      <MusicProvider>
      <ModeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public — wrapped in PublicRoute so authenticated users skip to feed */}
            <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/shared/video/:id" element={<SharedVideoView />} />
            <Route path="/shared/project/:id" element={<SharedProjectView />} />

            {/* Core */}
            <Route path="/" element={<P page={Feed} />} />
            <Route path="/pro-feed" element={<P page={ProFeed} />} />
            <Route path="/profile" element={<P page={Profile} />} />
            <Route path="/profile/:userId" element={<P page={Profile} />} />
            <Route path="/edit-profile" element={<P page={EditProfile} />} />
            <Route path="/settings" element={<P page={Settings} />} />
            <Route path="/notifications" element={<P page={Notifications} />} />
            <Route path="/search" element={<P page={GlobalSearch} />} />

            {/* Social */}
            <Route path="/community" element={<P page={Community} />} />
            <Route path="/groups" element={<P page={Groups} />} />
            <Route path="/groups/:id" element={<P page={GroupChat} />} />
            <Route path="/discover" element={<P page={Discover} />} />
            <Route path="/explore" element={<P page={Explore} />} />
            <Route path="/directory" element={<P page={Directory} />} />
            <Route path="/creators" element={<P page={Creators} />} />
            <Route path="/collab-feed" element={<P page={CollaborationFeed} />} />

            {/* Messaging */}
            <Route path="/messages" element={<P page={Messages} />} />
            <Route path="/video-messages" element={<P page={VideoMessages} />} />

            {/* Content */}
            <Route path="/reels" element={<P page={Reels} />} />
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
            <Route path="/music-library" element={<P page={MusicLibrary} />} />
            <Route path="/music"         element={<P page={MusicLibrary} />} />
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
            <Route path="/jobs" element={<P page={Jobs} />} />
            <Route path="/learning" element={<P page={Learning} />} />
            <Route path="/learning/certificates" element={<P page={Certificates} />} />
            <Route path="/store" element={<P page={CreatorStore} />} />

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
            <Route path="/course/:id" element={<P page={CourseViewer} />} />
            <Route path="/seller/:sellerId" element={<P page={SellerStorefront} />} />
            <Route path="/marketplace" element={<P page={ProductMarketplace} />} />
            <Route path="/creator-marketplace" element={<P page={CreatorMarketplace} />} />
            <Route path="/shop" element={<P page={Marketplace} />} />
            <Route path="/video-marketplace" element={<P page={VideoMarketplace} />} />
            <Route path="/templates" element={<P page={TemplateMarketplace} />} />
            <Route path="/skills" element={<P page={SkillExchange} />} />
            {/* /monetize is now handled by the CreatorMonetize route added below */}
            <Route path="/upgrade"  element={<P page={Upgrade} />} />
            <Route path="/billing"  element={<P page={Billing} />} />
            <Route path="/pricing"  element={<P page={Pricing} />} />

            {/* Creator Economy */}
            <Route path="/wallet"             element={<P page={Wallet} />} />
            <Route path="/learn"              element={<P page={Learn} />} />
            <Route path="/learn/:courseId"    element={<P page={CourseDetail} />} />
            <Route path="/learn/:courseId/watch" element={<P page={CourseWatch} />} />
            <Route path="/teach"              element={<P page={Teach} />} />
            <Route path="/sell"               element={<P page={Sell} />} />
            <Route path="/consulting"         element={<P page={Consulting} />} />
            <Route path="/consulting/offer"   element={<P page={ConsultingOffer} />} />
            <Route path="/investors"          element={<P page={Investors} />} />

            {/* SmartMatch */}
            <Route path="/match"      element={<P page={SmartMatch} />} />
            <Route path="/smartmatch" element={<P page={SmartMatch} />} />

            {/* Philo AI */}
            <Route path="/ai" element={<P page={PhilomniAI} />} />

            {/* Business */}
            <Route path="/pitch-vault" element={<P page={PitchVault} />} />
            <Route path="/bookings" element={<P page={BookingCalendar} />} />
            <Route path="/meetings" element={<P page={Meetings} />} />
            <Route path="/rooms" element={<P page={Rooms} />} />
            <Route path="/project-matcher" element={<P page={ProjectMatcher} />} />
            <Route path="/quality-review/:draftId" element={<P page={QualityReview} />} />
            <Route path="/video-editor/:id" element={<P page={PostVideoEditorPage} />} />
            <Route path="/gamification" element={<P page={Gamification} />} />
            <Route path="/admin" element={<P page={Admin} />} />
            <Route path="/admin/badges"   element={<P page={AdminBadges} />} />
            <Route path="/admin/monetize" element={<P page={AdminMonetize} />} />
            <Route path="/admin/ads"      element={<P page={AdminAds} />} />
            <Route path="/admin/brands"   element={<P page={AdminBrands} />} />
            <Route path="/admin/music"      element={<P page={AdminMusic} />} />
            <Route path="/admin/spotlight" element={<P page={AdminSpotlight} />} />
            <Route path="/verify-badge"    element={<P page={VerifyBadge} />} />

            {/* Spotlight */}
            <Route path="/spotlight"          element={<P page={SpotlightArchive} />} />
            <Route path="/spotlight/nominate" element={<P page={SpotlightNominate} />} />
            <Route path="/spotlight/current"  element={<P page={SpotlightPage} />} />
            <Route path="/spotlight/:month"   element={<P page={SpotlightPage} />} />
            <Route path="/monetize"       element={<P page={CreatorMonetize} />} />
            <Route path="/advertise"      element={<P page={Advertise} />} />
            <Route path="/my-ads"         element={<P page={MyAds} />} />

            {/* Music - Artist & Playlist pages */}
            <Route path="/artist/:userId"   element={<P page={ArtistProfile} />} />
            <Route path="/playlist/:id"     element={<P page={PlaylistPage} />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/onboarding/profile" element={<OnboardingProfile />} />

            {/* Live feature — host/viewer are full-screen (no sidebar layout) */}
            <Route path="/live/start" element={<P page={LiveStart} />} />
            <Route path="/live/:id/host" element={<LiveHost />} />
            <Route path="/live/:id/recap" element={<P page={LiveRecap} />} />
            <Route path="/live/:id" element={<LiveViewer />} />
            <Route path="/coins" element={<P page={BuyCoins} />} />

            {/* Celebrations feature */}
            <Route path="/celebrations" element={<P page={Celebrations} />} />
            <Route path="/celebrations/create" element={<P page={CelebrationCreate} />} />
            <Route path="/celebrations/sponsor" element={<P page={CelebrationSponsor} />} />
            <Route path="/celebrations/:id" element={<P page={CelebrationDetail} />} />
            <Route path="/admin/celebrations" element={<P page={AdminCelebrations} />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ModeProvider>
      </MusicProvider>
      </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
