import { useNavigate } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div
            className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, rgba(29,210,215,0.1), rgba(159,141,212,0.1))' }}
          >
            <SearchX className="h-14 w-14 text-muted-foreground/50" />
          </div>
        </div>
        <div className="space-y-2">
          <h1
            className="text-7xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #1DD7CE, #9F8DD4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button
          onClick={() => navigate('/')}
          size="lg"
          className="h-11 rounded-xl text-sm font-semibold text-white gap-2 shadow-glow-teal"
          style={{ background: 'linear-gradient(135deg, #1DD2D7, #1DD7CE)' }}
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
