import { useEffect, useState } from 'react';
import { User, Mail, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Stats {
  leads: number;
  proposals: number;
  outreach: number;
}

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ leads: 0, proposals: 0, outreach: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([
      api.get('/leads', { params: { limit: 1 } }),
      api.get('/proposals', { params: { limit: 1 } }),
      api.get('/outreach', { params: { limit: 1 } }),
    ])
      .then(([leadsRes, proposalsRes, outreachRes]) => {
        setStats({
          leads: leadsRes.data?.pagination?.total ?? 0,
          proposals: proposalsRes.data?.pagination?.total ?? 0,
          outreach: outreachRes.data?.pagination?.total ?? 0,
        });
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setAlert({ type: 'error', msg: 'Name and email are required.' });
      return;
    }
    setSaveLoading(true);
    setAlert(null);
    try {
      await api.put('/auth/profile', { name, email });
      setAlert({ type: 'success', msg: 'Profile updated successfully!' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Avatar + Info */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{user?.name || '—'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{user?.email || '—'}</p>
            <Badge className="mt-3 capitalize" variant="outline">
              <Shield className="mr-1 h-3 w-3" />
              {user?.role || 'user'}
            </Badge>

            <Separator className="my-6 w-full" />

            <div className="w-full space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-left">
                Your Stats
              </h3>
              {statsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <>
                  <StatItem icon={User} label="Total Leads" value={stats.leads} color="text-blue-500" />
                  <StatItem icon={Mail} label="Outreach Sent" value={stats.outreach} color="text-green-500" />
                  <StatItem icon={Shield} label="Proposals" value={stats.proposals} color="text-purple-500" />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {alert && (
              <p className={cn(
                'text-sm rounded p-3',
                alert.type === 'success'
                  ? 'text-green-700 bg-green-50 border border-green-200'
                  : 'text-destructive bg-destructive/10 border border-destructive/20',
              )}>
                {alert.msg}
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
