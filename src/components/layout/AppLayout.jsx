import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import NotificationCenter from '@/components/feed/NotificationCenter';
import SmartTextToolbar from '@/components/common/SmartTextToolbar';
import PersistentPodcastPlayer from '@/components/podcast/PersistentPodcastPlayer';
import { usePodcastPlayer } from '@/lib/PodcastPlayerContext';
import { Search } from 'lucide-react';

const PAGE_TITLES = {
  '/': 'Philomni',
  '/discover': 'Discover',
  '/search': 'Search',
  '/explore': 'Explore',
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
  '/ugc-suite': 'UGC Creator Suite',
  '/podcasts': 'Podcasts',
};

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

function MobileHeader({ user }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Philomni';
  const isFeed = location.pathname === '/';

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
      style={{
        background: 'rgba(var(--background-rgb, 10,10,20), 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid hsl(var(--border))',
      }}>
      {isFeed ? (
        <>
          <Link to="/" className="flex items-center gap-2 mr-auto">
            <img src="/logo-full.svg" alt="Philomni" className="h-8 w-auto" />
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

function AuthDebugBar() {
  const { user, isAuthenticated, authChecked } = useAuth();
  const [storageKey, setStorageKey] = React.useState('checking…');

  React.useEffect(() => {
    const check = () => {
      const keys = Object.keys(localStorage);
      const found = keys.some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      setStorageKey(found ? `yes (${keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))})` : 'no');
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, [isAuthenticated]);

  const pill = (label, ok) => (
    <span style={{
      background: ok ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
      color: ok ? '#4ade80' : '#f87171',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
      borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', fontSize: '11px',
    }}>{label}</span>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: '30px', background: '#0d0d1a',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '0 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)',
      fontFamily: 'monospace', overflow: 'hidden',
    }}>
      <span style={{ color: '#a78bfa', fontWeight: 700, flexShrink: 0 }}>AUTH DEBUG</span>
      <span>isAuthenticated: {pill(String(isAuthenticated), isAuthenticated)}</span>
      <span>authChecked: {pill(String(authChecked), authChecked)}</span>
      <span>user: {pill(user?.email ?? 'null', !!user)}</span>
      <span style={{ flexShrink: 0 }}>sb-token in localStorage: {pill(storageKey, storageKey !== 'no')}</span>
    </div>
  );
}

export default function AppLayout() {
  const { user, DEV_MODE } = useAuth();
  const location = useLocation();
  const { episode } = usePodcastPlayer();

  return (
    <div className="min-h-screen bg-background flex">
      <AuthDebugBar />

      {DEV_MODE && (
        <div className="fixed left-0 right-0 z-[9998] text-xs font-semibold text-center py-1 px-4"
             style={{ top: '30px', background:'#f59e0b', color:'#451a03' }}>
          DEV MODE — auth bypassed · Set VITE_DEV_MODE=false for production
        </div>
      )}

      <Sidebar user={user} />
      <MobileHeader user={user} />

      <main className={`
        flex-1 lg:ml-64 xl:ml-72
        mt-[30px]
        ${DEV_MODE ? 'mt-[54px]' : ''}
        pt-14 lg:pt-0
        ${episode ? 'pb-36 lg:pb-28' : 'pb-20 lg:pb-6'}
        min-h-screen w-full overflow-x-hidden
      `}>
        <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 sm:py-5 lg:py-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Outlet context={{ user }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNavBar user={user} />
      <SmartTextToolbar />
      <PersistentPodcastPlayer />
    </div>
  );
}
