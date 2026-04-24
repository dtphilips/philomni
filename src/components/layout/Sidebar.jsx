import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, Briefcase, Lightbulb, Users, Building2,
  MessageSquare, BookOpen, Sparkles, User, Settings,
  LogOut, Crown, BarChart2, Headphones, Wand2,
  CalendarDays, Store, Clapperboard, CirclePlay, Video, Mic,
  ArrowLeftRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationCenter from '@/components/feed/NotificationCenter';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/marketplace', icon: Briefcase, label: 'Marketplace' },
  { path: '/pitch-vault', icon: Lightbulb, label: 'Pitch Vault' },
  { path: '/creators', icon: Users, label: 'Creators' },
  { path: '/directory', icon: Building2, label: 'Directory' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/community', icon: BookOpen, label: 'Community' },
  { path: '/ai-tools', icon: Sparkles, label: 'AI Tools' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/audio-studio', icon: Headphones, label: 'Audio Studio' },
  { path: '/creative-studio', icon: Wand2, label: 'Creative Studio' },
  { path: '/reels', icon: Clapperboard, label: 'Reels' },
  { path: '/rooms', icon: CirclePlay, label: 'Rooms' },
  { path: '/meetings', icon: Video, label: 'Meetings' },
  { path: '/music-library', icon: Mic, label: 'Music Library' },
  { path: '/content-calendar', icon: CalendarDays, label: 'Content Calendar' },
  { path: '/creator-marketplace', icon: Store, label: 'Creator Market' },
  { path: '/skill-exchange', icon: ArrowLeftRight, label: 'Skill Exchange' },
  { path: '/business-content', icon: Sparkles, label: 'Content Suite' },
];

export default function Sidebar({ user }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    // Desktop only — hidden on mobile (BottomNavBar handles mobile)
    <aside className="hidden lg:flex w-64 xl:w-72 h-screen bg-card border-r border-border flex-col fixed left-0 top-0 z-30 overflow-hidden">
      {/* Logo */}
      <div className="flex-shrink-0 p-4 xl:p-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-lg font-display">P</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground leading-tight">Philomni</h1>
            <p className="text-[10px] text-muted-foreground">Brilliance Deserves a Home</p>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group min-h-[44px] ${
              isActive(item.path)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] ${
              isActive('/admin')
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="flex-shrink-0 p-2 border-t border-border space-y-1">
        <NotificationCenter user={user} />

        {user?.plan === 'free' && (
          <Link
            to="/upgrade"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors min-h-[44px]"
          >
            <Crown className="w-[18px] h-[18px]" />
            <span>Upgrade to Pro</span>
          </Link>
        )}

        {/* User card */}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors min-h-[44px]"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
              : <User className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate leading-tight">{user?.full_name || 'Your Profile'}</p>
            <p className="text-xs text-muted-foreground capitalize leading-tight">{user?.role || 'Member'}</p>
          </div>
          {user?.plan === 'pro' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">PRO</Badge>
          )}
        </Link>

        <button
          onClick={() => base44.auth.logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
