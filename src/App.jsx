import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Auth pages
import Login from './pages/Login'
import Signup from './pages/Signup'

// Core pages
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import GlobalSearch from './pages/GlobalSearch'

// Social / Community
import Community from './pages/Community'
import Groups from './pages/Groups'
import Discover from './pages/Discover'
import Explore from './pages/Explore'
import Directory from './pages/Directory'
import Creators from './pages/Creators'
import CollaborationFeed from './pages/CollaborationFeed'

// Messaging
import Messages from './pages/Messages'
import VideoMessages from './pages/VideoMessages'

// Content creation
import Feed2 from './pages/Feed'
import Reels from './pages/Reels'
import Stories from './pages/Stories'
import Drafts from './pages/Drafts'
import ContentCalendar from './pages/ContentCalendar'

// Studios
import AudioStudio from './pages/AudioStudio'
import CreativeStudio from './pages/CreativeStudio'
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

// Marketplace & Commerce
import CreatorMarket from './pages/CreatorMarket'
import CreatorMarketplace from './pages/CreatorMarketplace'
import Marketplace from './pages/Marketplace'
import VideoMarketplace from './pages/VideoMarketplace'
import TemplateMarketplace from './pages/TemplateMarketplace'
import SkillExchange from './pages/SkillExchange'
import MonetizationHub from './pages/MonetizationHub'
import Upgrade from './pages/Upgrade'
import Billing from './pages/Billing'

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
import Onboarding from './pages/Onboarding'
import OnboardingProfile from './pages/OnboardingProfile'

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
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/shared/video/:id" element={<SharedVideoView />} />
            <Route path="/shared/project/:id" element={<SharedProjectView />} />

            {/* Core */}
            <Route path="/" element={<P page={Feed} />} />
            <Route path="/profile" element={<P page={Profile} />} />
            <Route path="/edit-profile" element={<P page={EditProfile} />} />
            <Route path="/settings" element={<P page={Settings} />} />
            <Route path="/notifications" element={<P page={Notifications} />} />
            <Route path="/search" element={<P page={GlobalSearch} />} />

            {/* Social */}
            <Route path="/community" element={<P page={Community} />} />
            <Route path="/groups" element={<P page={Groups} />} />
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
            <Route path="/video-studio" element={<P page={VideoStudio} />} />
            <Route path="/podcast-studio" element={<P page={PodcastStudio} />} />
            <Route path="/collab-studio" element={<P page={CollaborativeStudio} />} />
            <Route path="/ugc-suite" element={<P page={UGCCreatorSuite} />} />
            <Route path="/business-content" element={<P page={BusinessContentSuite} />} />

            {/* Media */}
            <Route path="/music-library" element={<P page={MusicLibrary} />} />
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

            {/* Marketplace */}
            <Route path="/marketplace" element={<P page={CreatorMarket} />} />
            <Route path="/creator-marketplace" element={<P page={CreatorMarketplace} />} />
            <Route path="/shop" element={<P page={Marketplace} />} />
            <Route path="/video-marketplace" element={<P page={VideoMarketplace} />} />
            <Route path="/templates" element={<P page={TemplateMarketplace} />} />
            <Route path="/skills" element={<P page={SkillExchange} />} />
            <Route path="/monetize" element={<P page={MonetizationHub} />} />
            <Route path="/upgrade" element={<P page={Upgrade} />} />
            <Route path="/billing" element={<P page={Billing} />} />

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

            {/* Onboarding */}
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/onboarding/profile" element={<OnboardingProfile />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
