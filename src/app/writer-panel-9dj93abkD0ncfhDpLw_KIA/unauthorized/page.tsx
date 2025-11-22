import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center space-y-6 p-8">
        <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to access the writer portal. 
          Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/writer-panel-9dj93abkD0ncfhDpLw_KIA/login">Back to Login</Link>
          </Button>
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

