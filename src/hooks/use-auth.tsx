
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const ProtectRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
  
    useEffect(() => {
      if (loading) return;

      if (!user) {
        // If not logged in, redirect to login
        router.push('/login');
        return;
      }

      // Allow access to verification pages
      if (pathname === '/verify-email' || pathname === '/verify-login') {
        return;
      }

      // Don't require email verification for login - users can access dashboard
      // Email verification is only required during registration flow
      // If user wants to verify email later, they can do it from settings
    }, [user, loading, router, pathname]);
  
    // Show loading if checking auth
    if (loading || !user) {
      return (
        <div className="flex flex-col min-h-screen">
          <div className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
            <div className="ml-auto flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
          <div className="flex-1 space-y-4 p-8 pt-6">
             <Skeleton className="h-8 w-1/4" />
             <div className="flex space-x-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="w-1/4">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                             <Skeleton className="h-5 w-3/4" />
                             <Skeleton className="h-6 w-6 rounded-full" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-8 w-1/2 mb-2" />
                             <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
             </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
                <Card className="lg:col-span-4">
                     <CardHeader>
                         <Skeleton className="h-6 w-1/4" />
                     </CardHeader>
                     <CardContent className="pl-2">
                         <Skeleton className="h-[250px] w-full" />
                     </CardContent>
                </Card>
                 <div className="lg:col-span-3 space-y-4">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                         <CardContent className="space-y-4">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                         </CardContent>
                         <CardFooter>
                            <Skeleton className="h-10 w-full" />
                         </CardFooter>
                    </Card>
                     <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/3" />
                        </CardHeader>
                         <CardContent className="space-y-4">
                           <Skeleton className="h-8 w-full" />
                           <Skeleton className="h-8 w-full" />
                         </CardContent>
                    </Card>
                </div>
             </div>
          </div>
        </div>
      )
    }
  
    return <>{children}</>;
};

// This component is no longer needed here and has been moved to its own file.
// export const ProtectBusinessRoute = ...
