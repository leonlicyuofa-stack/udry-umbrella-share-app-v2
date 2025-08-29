
"use client";

import Link from 'next/link';
import { AppLogo } from './app-logo';
import { Button } from '@/components/ui/button';
import { MapPin, BookOpenText, AlertCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type React from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { ReportIssueDialog } from '@/components/report/report-issue-dialog';
import { useState } from 'react';
import { LanguageSwitcher } from './language-switcher';
import { useLanguage } from '@/contexts/language-context';
import { DebugStatus } from '@/components/debug/DebugStatus';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      asChild
      className={cn(
        "text-sm font-medium px-2 sm:px-3 h-9 sm:h-10", 
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Link href={href} className="flex items-center gap-1 sm:gap-2">
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </Link>
    </Button>
  );
};


export function Header() {
  const [isReportIssueDialogOpen, setIsReportIssueDialogOpen] = useState(false);
  const { translate } = useLanguage();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-auto flex items-center">
            <Link href="/home" aria-label="U-Dry Home" className="mr-6 flex items-center space-x-2">
                <AppLogo />
            </Link>
            <nav className="hidden items-center space-x-1 lg:flex">
              <NavItem href="/home" icon={<MapPin size={18} />} label={translate('map')} />
              <NavItem href="/guide" icon={<BookOpenText size={18} />} label={translate('guide')} />
            </nav>
          </div>

          <div className="flex items-center justify-end space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              onClick={() => setIsReportIssueDialogOpen(true)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 sm:px-3 h-9 sm:h-10"
              aria-label={translate('report_issue')}
            >
              <AlertCircle size={18} className="sm:mr-1" />
              <span className="hidden sm:inline">{translate('report_issue')}</span>
            </Button>
            <LanguageSwitcher />
            <DebugStatus />
            <AuthButton />
          </div>
        </div>
      </header>
      <ReportIssueDialog
        isOpen={isReportIssueDialogOpen}
        onOpenChange={setIsReportIssueDialogOpen}
      />
    </>
  );
}
