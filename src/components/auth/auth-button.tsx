
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from '@/contexts/language-context';
import { Loader2, LogOut, User, Settings, LogIn, UserPlus, Shield, FileText } from "lucide-react";

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const { translate } = useLanguage();

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="px-2 sm:px-3">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-1 hidden sm:inline">{translate('loading')}...</span>
      </Button>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
              <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName || translate('not_available_short')}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email || translate('not_available_short')}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account/balance" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{translate('view_balance_history')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>{translate('profile_settings')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/terms" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>{translate('terms_and_conditions_link')}</span>
            </Link>
          </DropdownMenuItem>
          {user.email === "admin@u-dry.com" && ( 
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center text-accent hover:!text-accent-foreground hover:!bg-accent/90">
                <Shield className="mr-2 h-4 w-4" />
                <span>{translate('admin_panel_link')}</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{translate('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button variant="ghost" size="sm" asChild className="px-2 sm:px-3">
        <Link href="/auth/signin" className="flex items-center">
          <LogIn className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{translate('login')}</span>
        </Link>
      </Button>
      <Button size="sm" asChild className="px-2 sm:px-3 bg-accent hover:bg-accent/90 text-accent-foreground">
        <Link href="/auth/signup" className="flex items-center">
          <UserPlus className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{translate('signup')}</span>
        </Link>
      </Button>
    </div>
  );
}
