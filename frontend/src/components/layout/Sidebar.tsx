import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Send, BarChart3,
  LogOut, Zap, Kanban, GitBranch, MessageSquare, Bell, LayoutTemplate, Activity, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
      { title: 'Leads',         path: '/leads',   icon: Users },
      { title: 'Apollo Search', path: '/apollo', icon: Search },
      { title: 'Kanban',        path: '/kanban', icon: Kanban },
      { title: 'Proposals', path: '/proposals', icon: FileText },
    ],
  },
  {
    label: 'Outreach',
    items: [
      { title: 'Outreach',   path: '/outreach',   icon: Send },
      { title: 'Sequences',  path: '/sequences',  icon: GitBranch },
      { title: 'Templates',  path: '/templates',  icon: LayoutTemplate },
    ],
  },
  {
    label: 'Insights',
    items: [
      { title: 'Analytics', path: '/analytics', icon: BarChart3 },
      { title: 'AI Chat',   path: '/chat',      icon: MessageSquare },
      { title: 'Activity',  path: '/activity',  icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-[230px] flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: '#101318', borderRight: '1px solid rgba(127,216,206,0.25)' }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 px-5 py-[22px] shrink-0"
          style={{ borderBottom: '1px solid rgba(127,216,206,0.25)' }}
        >
          <span className="w-[9px] h-[9px] shrink-0" style={{ background: '#1FB2A6' }} />
          <span
            className="text-[17px] font-semibold tracking-[0.04em]"
            style={{ color: '#F1F4F0', fontFamily: 'Oswald, sans-serif' }}
          >
            ABYTE HUNT
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-[18px]">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p
                className="px-3 pt-3 pb-2 text-[10.5px] tracking-[0.1em] uppercase opacity-45"
                style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#7FD8CE' }}
              >
                {section.label}
              </p>
              <div className="space-y-[2px]">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      'flex items-center gap-[11px] px-3 py-[10px] rounded-[4px] text-[13.5px] transition-all duration-150 mb-[2px]',
                      isActive
                        ? 'opacity-100'
                        : 'opacity-[0.82] hover:opacity-100'
                    )}
                    style={({ isActive }) => isActive
                      ? {
                          background: 'rgba(31,178,166,0.12)',
                          color: '#F1F4F0',
                          borderLeft: '2px solid #1FB2A6',
                          paddingLeft: '10px',
                        }
                      : {
                          color: '#7FD8CE',
                          borderLeft: '2px solid transparent',
                        }
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div
          className="p-4 shrink-0"
          style={{ borderTop: '1px solid rgba(127,216,206,0.25)' }}
        >
          <button
            onClick={() => { navigate('/profile'); onClose(); }}
            className="w-full flex items-center gap-3 rounded-[4px] px-3 py-2 mb-2 text-left transition-colors"
            style={{ color: '#7FD8CE' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(127,216,206,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold overflow-hidden"
              style={{ background: '#1FB2A6', color: '#101318', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user?.name} className="h-8 w-8 object-cover" />
                : initials
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#F1F4F0' }}>
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] capitalize opacity-50" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                {user?.role || 'agent'}
              </p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-[4px] px-3 py-2 text-[13px] transition-colors opacity-60 hover:opacity-100"
            style={{ color: '#7FD8CE' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(127,216,206,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
