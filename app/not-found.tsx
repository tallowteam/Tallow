import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="p-8 max-w-lg text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <Search className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-serif font-light mb-2">404</h1>
        <h2 className="text-lg font-semibold mb-4">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="default" className="w-full sm:w-auto gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/app">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <ArrowLeft className="w-4 h-4" />
              Open App
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
