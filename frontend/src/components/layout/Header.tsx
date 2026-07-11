import { Menu, Bell, ChevronDown, User, Settings, LogOut, Sun, Moon, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  '/kanban':        { title: 'Kanban Board',  subtitle: 'Visual pipeline management' },
  '/sequences':     { title: 'Sequences',     subtitle: 'Automated follow-up campaigns' },
  '/chat':          { title: 'AI Assistant',  subtitle: 'Powered by Groq · LLaMA 3.3 70B' },
  '/profile':       { title: 'Profile',       subtitle: 'Manage your account information' },
  '/settings':      { title: 'Settings',      subtitle: 'App configuration and preferences' },
  '/notifications': { title: 'Notifications', subtitle: 'Recent activity feed' },
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
      style={{
        background: 'hsl(var(--background) / 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid hsl(var(--border) / 0.6)',
      }}
    >
      <div className="flex items-center justify-between gap-4">

        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-lg hover:bg-muted shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight truncate">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-xs text-muted-foreground hidden sm:block leading-tight mt-0.5 truncate">
                {page.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Search placeholder — quick access */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg hover:bg-muted overflow-hidden"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                opacity: theme === 'dark' ? 1 : 0,
                transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
              }}
            >
              <Sun className="h-4 w-4 text-amber-500" />
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                opacity: theme === 'light' ? 1 : 0,
                transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
              }}
            >
              <Moon className="h-4 w-4 text-blue-400" />
            </span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-4 w-4" />
            <span
              className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-400"
            />
          </Button>

          {/* Divider */}
          <div className="h-6 w-px bg-border mx-0.5 hidden sm:block" />

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 h-9 hover:bg-muted rounded-lg"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className="text-[11px] font-bold text-gray-900"
                    style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/60 shadow-card-hover">
              <div className="px-3 py-2 border-b border-border/50 mb-1">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg cursor-pointer gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg cursor-pointer gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive rounded-lg cursor-pointer gap-2"
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
