import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Send, BarChart3,
  LogOut, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
  { title: 'Leads', path: '/leads', icon: Users },
  { title: 'Proposals', path: '/proposals', icon: FileText },
  { title: 'Outreach', path: '/outreach', icon: Send },
  { title: 'Analytics', path: '/analytics', icon: BarChart3 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-60 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: 'linear-gradient(180deg, #3F4D67 0%, #364259 100%)' }}
      >
        {/* Subtle top accent line */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #1DD2D7, #9F8DD4, #1DD7CE)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #1DD2D7 0%, #9F8DD4 100%)' }}
          >
            <Zap className="h-4 w-4 text-white" fill="white" />
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-40"
              style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
            />
          </div>
          <div>
            <p
              className="text-sm font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #1DD7CE, #c4b8f0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ClientHunter
            </p>
            <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: 'rgba(210,220,235,0.4)' }}>
              by Abyte Sol
            </p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
          <p className="px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(210,220,235,0.35)' }}>
            Main Menu
          </p>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'hover:bg-white/8',
                )
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(29,210,215,0.9) 0%, rgba(29,215,206,0.85) 100%)',
                      boxShadow: '0 4px 16px rgba(29,210,215,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                      color: '#fff',
                    }
                  : { color: 'rgba(210,225,240,0.75)' }
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
                    style={isActive ? { background: 'rgba(255,255,255,0.2)' } : { background: 'rgba(255,255,255,0.06)' }}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  {item.title}
                </>
              )}
            </NavLink>
          ))}

        </nav>

        {/* User Footer */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1.5"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div className="relative">
              <Avatar className="h-8 w-8 ring-2 ring-teal-400/30">
                <AvatarFallback
                  className="text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                style={{ background: '#22c55e', borderColor: '#3F4D67' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(230,240,255,0.9)' }}>
                {user?.name || 'User'}
              </p>
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 capitalize border-0 font-medium"
                style={{ background: 'rgba(29,210,215,0.15)', color: '#1DD7CE' }}
              >
                {user?.role || 'agent'}
              </Badge>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-red-500/10"
            style={{ color: 'rgba(248,113,113,0.8)' }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(248,113,113,0.1)' }}>
              <LogOut className="h-3.5 w-3.5" />
            </span>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
