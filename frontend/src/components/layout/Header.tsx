import { Menu, Bell, ChevronDown, User, Settings, LogOut, Sun, Moon, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':              { title: 'Dashboard',     subtitle: 'Overview of your client acquisition pipeline' },
  '/leads':         { title: 'Leads',         subtitle: 'Manage and track your leads' },
  '/proposals':     { title: 'Proposals',     subtitle: 'AI-generated proposals for your leads' },
  '/outreach':      { title: 'Outreach',      subtitle: 'Send emails and WhatsApp messages' },
  '/analytics':     { title: 'Analytics',     subtitle: 'Performance metrics and insights' },
  '/kanban':        { title: 'Kanban Board',  subtitle: 'Drag-and-drop visual pipeline management' },
  '/sequences':     { title: 'Sequences',     subtitle: 'Automated multi-step email campaigns' },
  '/chat':          { title: 'AI Assistant',  subtitle: 'Powered by Groq · LLaMA 3.3 70B' },
  '/profile':       { title: 'Profile',       subtitle: 'Manage your account information' },
  '/settings':      { title: 'Settings',      subtitle: 'App configuration and integrations' },
  '/notifications': { title: 'Notifications', subtitle: 'Recent activity and alerts' },
  '/activity':      { title: 'Agent Activity', subtitle: 'Real-time feed of everything your agent does' },
  '/templates':     { title: 'Templates',     subtitle: 'Reusable email templates for outreach' },
};

interface HeaderProps { onMenuClick: () => void; }

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const basePath = '/' + pathname.split('/')[1];
  const page = PAGE_TITLES[basePath] || { title: 'Abyte Hunt', subtitle: 'AI Client Hunter' };

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  useSocket((event, data: unknown) => {
    const d = data as Record<string, unknown>;
    if (event === 'lead:new') {
      toast.success(`New lead: ${d?.companyName as string}`, { duration: 4000 });
    }
    if (event === 'outreach:sent') {
      toast.success('Email sent successfully!', { duration: 3000 });
    }
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header
      className="sticky top-0 z-10 px-5 py-3 shrink-0"
      style={{ background: '#F1F4F0', borderBottom: '1px solid #CBD3CF' }}
    >
      <div className="flex items-center justify-between gap-4">

        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="lg:hidden flex items-center justify-center h-[34px] w-[34px] rounded-[4px] shrink-0 transition-colors"
            style={{ background: '#fff', border: '1px solid #CBD3CF', color: '#6E7D79' }}
            onClick={onMenuClick}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E6E9E5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <h1
              className="text-[15px] font-semibold leading-tight truncate uppercase tracking-[0.02em]"
              style={{ color: '#1B1F2B', fontFamily: 'Oswald, sans-serif' }}
            >
              {page.title}
            </h1>
            {page.subtitle && (
              <p
                className="text-[11px] hidden sm:block leading-tight mt-0.5 truncate"
                style={{ color: '#6E7D79', fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {page.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Quick search */}
          <button
            className="hidden sm:flex items-center justify-center h-[34px] w-[34px] rounded-[4px] transition-colors"
            style={{ background: '#fff', border: '1px solid #CBD3CF', color: '#6E7D79' }}
            title="Search leads (Ctrl+/)"
            onClick={() => navigate('/leads')}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E6E9E5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
          <button
            className="relative flex items-center justify-center h-[34px] w-[34px] rounded-[4px] overflow-hidden transition-colors"
            style={{ background: '#fff', border: '1px solid #CBD3CF', color: '#6E7D79' }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E6E9E5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                opacity: theme === 'dark' ? 1 : 0,
                transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
              }}
            >
              <Sun className="h-4 w-4" />
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                opacity: theme === 'light' ? 1 : 0,
                transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
              }}
            >
              <Moon className="h-4 w-4" />
            </span>
          </button>

          {/* Notifications */}
          <button
            className="relative flex items-center justify-center h-[34px] w-[34px] rounded-[4px] transition-colors"
            style={{ background: '#fff', border: '1px solid #CBD3CF', color: '#6E7D79' }}
            onClick={() => navigate('/notifications')}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E6E9E5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-[9px] right-[9px] h-1.5 w-1.5 rounded-full" style={{ background: '#3E8E5A' }} />
          </button>

          {/* Divider */}
          <div className="h-6 w-px mx-0.5 hidden sm:block" style={{ background: '#CBD3CF' }} />

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-2 h-[34px] rounded-[4px] transition-colors"
                style={{ background: '#fff', border: '1px solid #CBD3CF' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E6E9E5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                <Avatar className="h-7 w-7">
                  {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback
                    className="text-[11px] font-bold"
                    style={{ background: '#1FB2A6', color: '#101318', fontFamily: 'IBM Plex Mono, monospace' }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="hidden sm:block text-sm font-medium max-w-[100px] truncate"
                  style={{ color: '#1B1F2B' }}
                >
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 hidden sm:block" style={{ color: '#6E7D79' }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-[4px] shadow-md"
              style={{ background: '#F1F4F0', border: '1px solid #CBD3CF' }}
            >
              <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid #CBD3CF' }}>
                <p className="text-sm font-semibold truncate" style={{ color: '#1B1F2B' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: '#6E7D79' }}>{user?.email}</p>
              </div>
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="rounded-[4px] cursor-pointer gap-2"
                style={{ color: '#2E3532' }}
              >
                <User className="h-4 w-4" style={{ color: '#6E7D79' }} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="rounded-[4px] cursor-pointer gap-2"
                style={{ color: '#2E3532' }}
              >
                <Settings className="h-4 w-4" style={{ color: '#6E7D79' }} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: '#CBD3CF' }} />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive rounded-[4px] cursor-pointer gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
