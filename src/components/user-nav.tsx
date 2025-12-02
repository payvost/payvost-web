
'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, LogOut, Settings, User as UserIcon, ChevronDown } from "lucide-react"
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "./ui/badge";


interface UserNavProps {
    user: User | null;
    businessLogoUrl?: string | null;
}

export function UserNav({ user, businessLogoUrl }: UserNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isAdminRoute = pathname.startsWith('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE');
  const profileHref = isAdminRoute ? '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/profile' : '/dashboard/profile';
  const settingsHref = isAdminRoute ? '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settings' : '/dashboard/settings';

  const handleLogout = async () => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    try {
      if (isOnline) {
        try {
          await Promise.race([
            signOut(auth),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Sign out timeout')), 5000)
            )
          ]);
        } catch (error) {
          console.error('Firebase signOut error:', error);
        }
      }
      
      toast({
        title: "Logged Out",
        description: isOnline 
          ? "You have been successfully logged out."
          : "You have been logged out. Please reconnect to complete the logout process.",
      });
      
      router.push(isAdminRoute ? '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login' : '/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logged Out",
        description: "You have been logged out locally.",
      });
      router.push(isAdminRoute ? '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login' : '/login');
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  }

  const avatarSrc = businessLogoUrl || user?.photoURL || "";
  const avatarAlt = businessLogoUrl ? "Business Logo" : user?.displayName || "User";
  const avatarFallback = businessLogoUrl ? getInitials(avatarAlt) : getInitials(user?.displayName);


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative flex items-center gap-1 cursor-pointer">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarSrc} data-ai-hint="person portrait" alt={avatarAlt} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
          </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{user?.displayName || "User"}</p>
                {isAdminRoute && <Badge variant="secondary">Admin</Badge>}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={settingsHref}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
