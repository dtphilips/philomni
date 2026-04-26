import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Rooms from './pages/Rooms'
import Podcasts from './pages/Podcasts'
import ContentSuite from './pages/ContentSuite'
import Analytics from './pages/Analytics'
import Community from './pages/Community'
import Messages from './pages/Messages'
import AudioStudio from './pages/AudioStudio'
import CreativeStudio from './pages/CreativeStudio'
import MusicLibrary from './pages/MusicLibrary'
import PitchVault from './pages/PitchVault'
import Directory from './pages/Directory'
import SkillExchange from './pages/SkillExchange'
import CreatorMarket from './pages/CreatorMarket'
import Meetings from './pages/Meetings'

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Feed /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="/rooms" element={<ProtectedLayout><Rooms /></ProtectedLayout>} />
          <Route path="/podcasts" element={<ProtectedLayout><Podcasts /></ProtectedLayout>} />
          <Route path="/content" element={<ProtectedLayout><ContentSuite /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
          <Route path="/community" element={<ProtectedLayout><Community /></ProtectedLayout>} />
          <Route path="/messages" element={<ProtectedLayout><Messages /></ProtectedLayout>} />
          <Route path="/audio-studio" element={<ProtectedLayout><AudioStudio /></ProtectedLayout>} />
          <Route path="/creative-studio" element={<ProtectedLayout><CreativeStudio /></ProtectedLayout>} />
          <Route path="/music-library" element={<ProtectedLayout><MusicLibrary /></ProtectedLayout>} />
          <Route path="/pitch-vault" element={<ProtectedLayout><PitchVault /></ProtectedLayout>} />
          <Route path="/directory" element={<ProtectedLayout><Directory /></ProtectedLayout>} />
          <Route path="/skills" element={<ProtectedLayout><SkillExchange /></ProtectedLayout>} />
          <Route path="/marketplace" element={<ProtectedLayout><CreatorMarket /></ProtectedLayout>} />
          <Route path="/meetings" element={<ProtectedLayout><Meetings /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
