import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Send, BarChart3,
  LogOut, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
  { title: 'Leads',     path: '/leads',     icon: Users },
  { title: 'Proposals', path: '/proposals', icon: FileText },
  { title: 'Outreach',  path: '/outreach',  icon: Send },
  { title: 'Analytics', path: '/analytics', icon: BarChart3 },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-[232px] flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'linear-gradient(180deg, #1e2840 0%, #192035 50%, #141929 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, #1DD2D7, #9F8DD4, #1DD7CE)', flexShrink: 0 }} />

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
               style={{ background: 'linear-gradient(135deg, #1DD2D7 0%, #9F8DD4 100%)' }}>
            <Zap className="h-4 w-4 text-white" fill="white" />
            <div className="absolute inset-0 rounded-xl blur-md opacity-50"
                 style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight"
               style={{ background: 'linear-gradient(135deg, #1DD7CE, #c4b8f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ClientHunter
            </p>
            <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: 'rgba(210,220,235,0.35)' }}>
              by Abyte Sol
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(210,220,235,0.3)' }}>
            Navigation
          </p>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive ? 'text-white' : 'text-[rgba(210,225,240,0.6)] hover:text-[rgba(210,225,240,0.9)]',
              )}
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(29,210,215,0.2) 0%, rgba(159,141,212,0.15) 100%)',
                boxShadow: '0 0 0 1px rgba(29,210,215,0.25), 0 4px 16px rgba(29,210,215,0.1)',
              } : { background: 'transparent' }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)',
                      boxShadow: '0 2px 10px rgba(29,210,215,0.4)',
                    } : { background: 'rgba(255,255,255,0.07)' }}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1">{item.title}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#1DD2D7', boxShadow: '0 0 6px #1DD2D7' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1.5"
               style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-bold text-white"
                                style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2"
                    style={{ background: '#22c55e', borderColor: '#1e2840' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(230,240,255,0.9)' }}>
                {user?.name || 'User'}
              </p>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-0 font-medium capitalize"
                     style={{ background: 'rgba(29,210,215,0.12)', color: '#1DD7CE' }}>
                {user?.role || 'agent'}
              </Badge>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-red-500/10 group"
            style={{ color: 'rgba(248,113,113,0.7)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,0.7)'; }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(248,113,113,0.1)' }}>
              <LogOut className="h-3.5 w-3.5" />
            </span>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
