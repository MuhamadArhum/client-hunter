import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Send, BarChart3,
  LogOut, Zap, Kanban, GitBranch, MessageSquare, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
  { title: 'Leads',     path: '/leads',     icon: Users },
  { title: 'Kanban',    path: '/kanban',    icon: Kanban },
  { title: 'Proposals', path: '/proposals', icon: FileText },
  { title: 'Outreach',  path: '/outreach',  icon: Send },
  { title: 'Sequences', path: '/sequences', icon: GitBranch },
  { title: 'Analytics', path: '/analytics', icon: BarChart3 },
  { title: 'AI Chat',   path: '/chat',      icon: MessageSquare },
];

const bottomItems = [
  { title: 'Notifications', path: '/notifications', icon: Bell },
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
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-[240px] flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: '#171717',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top green accent line */}
        <div
          className="h-0.5 shrink-0"
          style={{ background: 'linear-gradient(90deg, #21F6A8, #10B981)' }}
        />

        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
          >
            <Zap className="h-4.5 w-4.5 text-gray-900" fill="currentColor" />
            <div
              className="absolute inset-0 rounded-xl opacity-50 blur-md"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
            />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #21F6A8, #6EE7B7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Abyte Hunt
            </p>
            <p
              className="text-[10px] font-medium tracking-wider uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              by Abyte Sol
            </p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p
            className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Main Menu
          </p>

          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  'transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]',
                )}
                style={({ isActive }) => isActive ? {
                  background: 'rgba(33,246,168,0.12)',
                } : {}}
              >
                {({ isActive }) => (
                  <>
                    {/* Left active indicator */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                        style={{ background: '#21F6A8' }}
                      />
                    )}

                    {/* Icon */}
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                      )}
                      style={isActive ? {
                        background: 'rgba(33,246,168,0.18)',
                        color: '#21F6A8',
                      } : {
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.35)',
                      }}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </span>

                    <span className="flex-1 leading-none">{item.title}</span>

                    {isActive && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: '#21F6A8', boxShadow: '0 0 6px #21F6A8' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Bottom section nav items */}
          <div className="mt-4 pt-4 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p
              className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              Account
            </p>
            {bottomItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  'transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]',
                )}
                style={({ isActive }) => isActive ? { background: 'rgba(33,246,168,0.12)' } : {}}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#21F6A8' }} />
                    )}
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
                      style={isActive ? {
                        background: 'rgba(33,246,168,0.18)', color: '#21F6A8',
                      } : {
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
                      }}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 leading-none">{item.title}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* User card */}
          <button
            onClick={() => { navigate('/profile'); onClose(); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 transition-all duration-150 hover:bg-white/[0.04] text-left"
          >
            <div className="relative shrink-0">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-gray-900"
                style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
              >
                {initials}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                style={{ background: '#22C55E', borderColor: '#171717' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] font-medium capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {user?.role || 'agent'}
              </p>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-rose-500/10"
            style={{ color: 'rgba(248,113,113,0.6)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,0.6)'; }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(248,113,113,0.08)' }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
