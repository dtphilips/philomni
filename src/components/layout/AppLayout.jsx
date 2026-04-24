import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import NotificationCenter from '@/components/feed/NotificationCenter';
import SmartTextToolbar from '@/components/common/SmartTextToolbar';
import { Search } from 'lucide-react';

// Mobile page title map
const PAGE_TITLES = {
  '/': 'Philomni',
  '/discover': 'Discover',
  '/search': 'Search',
  '/marketplace': 'Marketplace',
  '/pitch-vault': 'Pitch Vault',
  '/messages': 'Messages',
  '/community': 'Community',
  '/ai-tools': 'AI Tools',
  '/analytics': 'Analytics',
  '/audio-studio': 'Audio Studio',
  '/creative-studio': 'Creative Studio',
  '/reels': 'Reels',
  '/rooms': 'Rooms',
  '/meetings': 'Meetings',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/notifications': 'Notifications',
  '/upgrade': 'Upgrade',
  '/billing': 'Billing',
  '/bookings': 'Bookings',
  '/podcast-studio': 'Podcast Studio',
  '/monetization': 'Earnings',
  '/gamification': 'Gamification',
  '/groups': 'Groups',
  '/content-calendar': 'Content Calendar',
  '/creator-marketplace': 'Creator Market',
  '/music-library': 'Music Library',
  '/workflows': 'Workflows',
  '/skill-exchange': 'Skill Exchange',
  '/business-content': 'Content Suite',
};

function MobileHeader({ user }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Philomni';
  const isFeed = location.pathname === '/';

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3">
      {isFeed ? (
        <>
          <Link to="/" className="flex items-center gap-2 mr-auto">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-display text-sm">P</span>
            </div>
            <span className="font-display font-bold text-foreground text-base">Philomni</span>
          </Link>
          <Link to="/search" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </Link>
          <NotificationCenter user={user} />
        </>
      ) : (
        <>
          <h1 className="font-semibold text-foreground text-base mr-auto">{title}</h1>
          <NotificationCenter user={user} />
        </>
      )}
    </header>
  );
}

export default function AppLayout() {
  const { user, DEV_MODE } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Dev mode banner */}
      {DEV_MODE && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-400 text-amber-950 text-xs font-semibold text-center py-1 px-4">
          DEV MODE — auth bypassed · Set VITE_DEV_MODE=false to enable real auth
        </div>
      )}

      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar user={user} />

      {/* Mobile top header */}
      <MobileHeader user={user} />

      {/* Main content area */}
      <main className={`
        flex-1 lg:ml-64 xl:ml-72
        ${DEV_MODE ? 'mt-6' : ''}
        pt-14 lg:pt-0
        pb-20 lg:pb-6
        min-h-screen w-full overflow-x-hidden
      `}>
        <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 sm:py-5 lg:py-6">
          <Outlet context={{ user }} />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNavBar user={user} />

      {/* Global smart text toolbar — appears on text selection everywhere */}
      <SmartTextToolbar />
    </div>
  );
}
