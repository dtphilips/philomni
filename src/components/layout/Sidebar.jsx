import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, Briefcase, Lightbulb, Users, Building2,
  MessageSquare, BookOpen, Sparkles, User, Settings,
  LogOut, Crown, BarChart2, Headphones, Wand2,
  CalendarDays, Store, Clapperboard, CirclePlay, Video, Mic,
  ArrowLeftRight, Music4, Radio
} from 'lucide-react';
import NotificationCenter from '@/components/feed/NotificationCenter';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { path: '/',                  icon: Home,          label: 'Feed' },
  { path: '/search',            icon: Search,        label: 'Search' },
  { path: '/marketplace',       icon: Briefcase,     label: 'Marketplace' },
  { path: '/pitch-vault',       icon: Lightbulb,     label: 'Pitch Vault' },
  { path: '/creators',          icon: Users,         label: 'Creators' },
  { path: '/directory',         icon: Building2,     label: 'Directory' },
  { path: '/messages',          icon: MessageSquare, label: 'Messages' },
  { path: '/community',         icon: BookOpen,      label: 'Community' },
  { path: '/ai-tools',          icon: Sparkles,      label: 'AI Tools' },
  { path: '/analytics',         icon: BarChart2,     label: 'Analytics' },
  { path: '/audio-studio',      icon: Headphones,    label: 'Audio Studio' },
  { path: '/creative-studio',   icon: Wand2,         label: 'Creative Studio' },
  { path: '/reels',             icon: Clapperboard,  label: 'Reels' },
  { path: '/rooms',             icon: CirclePlay,    label: 'Rooms' },
  { path: '/meetings',          icon: Video,         label: 'Meetings' },
  { path: '/music-library',     icon: Music4,        label: 'Music Library' },
  { path: '/content-calendar',  icon: CalendarDays,  label: 'Content Calendar' },
  { path: '/creator-marketplace', icon: Store,       label: 'Creator Market' },
  { path: '/skill-exchange',    icon: ArrowLeftRight,label: 'Skill Exchange' },
  { path: '/business-content',  icon: Mic,           label: 'Content Suite' },
  { path: '/podcasts',          icon: Radio,         label: 'Podcasts' },
];

export default function Sidebar({ user }) {
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const saved = sessionStorage.getItem('sidebar_scroll');
    if (saved) nav.scrollTop = parseInt(saved, 10);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => sessionStorage.setItem('sidebar_scroll', nav.scrollTop);
    nav.addEventListener('scroll', onScroll, { passive: true });
    return () => nav.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 h-screen flex-col fixed left-0 top-0 z-30 overflow-hidden"
      style={{
        background: 'hsl(var(--sidebar-background))',
        borderRight: '1px solid hsl(var(--sidebar-border))',
      }}>

      {/* Logo */}
      <div className="flex-shrink-0 px-4 xl:px-5 h-16 flex items-center"
           style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo_v2.svg" alt="Philomni" className="w-9 h-9 rounded-xl flex-shrink-0" style={{ boxShadow: '0 0 16px rgba(109,40,217,0.3)' }} />
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'hsl(var(--sidebar-foreground))' }}>
              Philomni
            </h1>
            <p className="text-[10px] leading-tight" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Brilliance Deserves a Home
            </p>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav ref={navRef} className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] group"
              style={active ? {
                background: 'rgba(109,40,217,0.18)',
                color: 'hsl(var(--primary))',
                boxShadow: 'inset 0 0 0 1px rgba(109,40,217,0.2)',
              } : {
                color: 'hsl(var(--muted-foreground))',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'hsl(var(--muted))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]"
            style={isActive('/admin') ? { background:'rgba(109,40,217,0.18)', color:'hsl(var(--primary))' } : { color:'hsl(var(--muted-foreground))' }}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="flex-shrink-0 p-2 space-y-1" style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        <NotificationCenter user={user} />

        {user?.plan === 'free' && (
          <Link
            to="/upgrade"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors"
            style={{ background:'rgba(109,40,217,0.1)', color:'hsl(var(--primary))', border:'1px solid rgba(109,40,217,0.15)' }}
          >
            <Crown className="w-[18px] h-[18px]" />
            <span>Upgrade to Pro</span>
          </Link>
        )}

        {/* User card */}
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] transition-colors group"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
          onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
          onMouseLeave={e => e.currentTarget.style.background = ''}
        >
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
               style={{ background: 'hsl(var(--muted))', border:'1px solid hsl(var(--border))' }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
              : <User className="w-4 h-4" style={{ color:'hsl(var(--muted-foreground))' }} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate leading-tight">{user?.full_name || 'Your Profile'}</p>
            <p className="text-xs capitalize leading-tight" style={{ color:'hsl(var(--muted-foreground))' }}>{user?.role || 'Member'}</p>
          </div>
          {user?.plan === 'pro' && (
            <Badge className="text-[10px] px-1.5 py-0 flex-shrink-0"
                   style={{ background:'rgba(109,40,217,0.2)', color:'hsl(var(--primary))', border:'1px solid rgba(109,40,217,0.3)' }}>
              PRO
            </Badge>
          )}
        </Link>

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors min-h-[44px]"
          style={{ color:'hsl(var(--muted-foreground))' }}
          onMouseEnter={e => { e.currentTarget.style.background='hsl(var(--muted))'; e.currentTarget.style.color='hsl(var(--foreground))'; }}
          onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color='hsl(var(--muted-foreground))'; }}
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
