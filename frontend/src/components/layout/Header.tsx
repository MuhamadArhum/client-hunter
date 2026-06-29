import { Menu, Bell, ChevronDown, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
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

const PAGE_TITLES: Record<string, { title: string; subtitle: string; emoji: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your client acquisition pipeline', emoji: '📊' },
  '/leads': { title: 'Leads', subtitle: 'Manage and track your leads', emoji: '👥' },
  '/proposals': { title: 'Proposals', subtitle: 'AI-generated proposals for your leads', emoji: '📝' },
  '/outreach': { title: 'Outreach', subtitle: 'Send emails and WhatsApp messages', emoji: '📤' },
  '/analytics': { title: 'Analytics', subtitle: 'Performance metrics and insights', emoji: '📈' },
  '/profile': { title: 'Profile', subtitle: 'Manage your account information', emoji: '👤' },
  '/settings': { title: 'Settings', subtitle: 'App configuration and preferences', emoji: '⚙️' },
  '/notifications': { title: 'Notifications', subtitle: 'Recent activity feed', emoji: '🔔' },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const basePath = '/' + pathname.split('/')[1];
  const page = PAGE_TITLES[basePath] || { title: 'Abyte Hunt', subtitle: '', emoji: '⚡' };

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const { theme, toggleTheme } = useTheme();

  useSocket((event, data: unknown) => {
    const d = data as Record<string, unknown>;
    if (event === 'lead:new') {
      toast.success(`New lead added: ${d?.companyName as string}`, { duration: 4000 });
    }
    if (event === 'outreach:sent') {
      toast.success('Email sent successfully!', { duration: 3000 });
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 px-6 py-3 relative" style={{ background: 'hsl(var(--background) / 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>

      <div className="flex items-center justify-between">
        {/* Left: mobile menu + title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-muted/80"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground tracking-tight">{page.title}</h1>
              </div>
              {page.subtitle && (
                <p className="text-xs text-muted-foreground hidden sm:block mt-0.5 font-medium">{page.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 hover:bg-muted/80 rounded-xl overflow-hidden"
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
              <Sun className="h-4 w-4 text-amber-400" />
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                opacity: theme === 'light' ? 1 : 0,
                transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
              }}
            >
              <Moon className="h-4 w-4 text-indigo-400" />
            </span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 hover:bg-muted/80 rounded-xl"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-4.5 w-4.5" />
            <span
              className="absolute top-2 right-2 h-2 w-2 rounded-full border border-background"
              style={{ background: '#1DD2D7' }}
            />
          </Button>

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2.5 h-9 hover:bg-muted/80 rounded-xl"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback
                    className="text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground">{user?.name || 'Account'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-card-hover rounded-xl border-border/60">
              <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg cursor-pointer">
                <User className="mr-2 h-4 w-4 text-muted-foreground" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-lg cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive rounded-lg cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
