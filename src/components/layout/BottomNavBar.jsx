import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, PlusSquare, MessageSquare, User,
  Clapperboard, Briefcase, Lightbulb, BookOpen,
  BarChart2, Settings, Sparkles, Headphones, Wand2,
  CalendarDays, Store, Video, CirclePlay, Mic,
  MoreHorizontal, X, ArrowLeftRight, Radio, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCenter from '@/components/feed/NotificationCenter';

// Primary 4 tabs + 1 Create button
const PRIMARY_TABS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  // Create placeholder — rendered separately below
  { path: '/reels', icon: Clapperboard, label: 'Reels' },
  { path: '/profile', icon: User, label: 'Profile' },
];

// Secondary items shown in the "More" tray
const MORE_ITEMS = [
  { path: '/marketplace', icon: Briefcase, label: 'Marketplace' },
  { path: '/pitch-vault', icon: Lightbulb, label: 'Pitch Vault' },
  { path: '/community', icon: BookOpen, label: 'Community' },
  { path: '/ai-tools', icon: Sparkles, label: 'AI Tools' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/audio-studio', icon: Headphones, label: 'Audio' },
  { path: '/creative-studio', icon: Wand2, label: 'Creative' },
  { path: '/content-calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/creator-marketplace', icon: Store, label: 'Market' },
  { path: '/meetings', icon: Video, label: 'Meetings' },
  { path: '/rooms', icon: CirclePlay, label: 'Rooms' },
  { path: '/music-library', icon: Mic, label: 'Music' },
  { path: '/podcasts', icon: Radio, label: 'Podcasts' },
  { path: '/podcast-studio', icon: Mic, label: 'Pod Studio' },
  { path: '/skill-exchange', icon: ArrowLeftRight, label: 'Skills' },
  { path: '/business-content', icon: Sparkles, label: 'Content AI' },
  { path: '/bookings', icon: CalendarDays, label: 'Bookings' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNavBar({ user }) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Bottom nav bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-pb">
        <div className="flex items-center h-16">
          {/* Home */}
          {[PRIMARY_TABS[0], PRIMARY_TABS[1]].map((tab) => {
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px] transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMoreOpen(false)}
              >
                <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>{tab.label}</span>
              </Link>
            );
          })}

          {/* Create (+) center button */}
          <button
            onClick={() => { setMoreOpen(false); const el = document.getElementById('create-post-composer'); if (el) { el.scrollIntoView({ behavior: 'smooth' }); el.querySelector('div[class*="cursor-text"]')?.click(); } else { window.location.href = '/'; } }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px]"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))' }}>
              <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
            </div>
          </button>

          {/* Reels + Profile */}
          {[PRIMARY_TABS[2], PRIMARY_TABS[3]].map((tab) => {
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px] transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => setMoreOpen(false)}
              >
                <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>{tab.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px] transition-colors ${
              moreOpen ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {moreOpen
              ? <X className="w-5 h-5" />
              : <MoreHorizontal className="w-5 h-5 stroke-[1.75px]" />}
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* "More" slide-up tray */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-30 bg-black/40"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-card rounded-t-2xl border-t border-border pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* User card */}
              {user && (
                <div className="px-4 pb-3 flex items-center gap-3 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {user.avatar_url
                      ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">{user.full_name?.[0]}</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  {user.plan !== 'free' && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Pro
                    </span>
                  )}
                </div>
              )}

              {/* Grid of items */}
              <div className="grid grid-cols-4 gap-1 p-3 max-h-64 overflow-y-auto">
                {MORE_ITEMS.map(item => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl min-h-[44px] transition-colors ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                })}

                {/* Notifications */}
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl">
                  <NotificationCenter user={user} compact />
                  <span className="text-[10px] font-medium text-muted-foreground">Alerts</span>
                </div>

                {/* Admin link if applicable */}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Admin</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
