'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Target,
  Briefcase,
  Calendar,
  MapPin,
  UserCog,
  Phone,
  Headphones,
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Users,
  FileText,
  ClipboardList,
  Wrench,
  LogOut,
  BarChart3,
  Truck,
} from 'lucide-react';
import type { SessionUser } from '@/lib/auth/types';
import clsx from 'clsx';

const CRM_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/crm', label: 'Board', icon: LayoutGrid },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/crm/service-catalog', label: 'Service catalog', icon: Wrench },
];

const PRIMARY_NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/estimates', label: 'Estimates', icon: ClipboardList },
  { href: '/dispatch', label: 'Dispatch', icon: Truck },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/calls', label: 'Calls', icon: Phone },
  { href: '/receptionist', label: 'Receptionist', icon: Headphones },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function navItemIsActive(pathname: string, href: string) {
  if (href === '/app') {
    return pathname === '/app';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ClerkSignOutIconButton({ className }: { className?: string }) {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: '/' })}
      title="Sign out"
      className={className}
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}

function isCrmSectionPath(pathname: string) {
  if (pathname === '/crm' || pathname.startsWith('/crm/')) return true;
  if (pathname === '/customers' || pathname.startsWith('/customers/')) return true;
  if (pathname === '/invoices' || pathname.startsWith('/invoices/')) return true;
  return false;
}

type AppSidebarProps = {
  /** Rendered above the user profile card (e.g. Calls AI status). */
  beforeUserCard?: ReactNode;
};

export function AppSidebar({ beforeUserCard }: AppSidebarProps) {
  const pathname = usePathname() || '';
  const crmSectionActive = isCrmSectionPath(pathname);
  const [crmOpenOverride, setCrmOpenOverride] = useState<boolean | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((j: { authenticated: boolean; user?: SessionUser }) => {
        if (j.authenticated && j.user) setUser(j.user);
      })
      .catch(() => {});
  }, []);

  const crmOpen = crmOpenOverride ?? crmSectionActive;

  return (
    <aside className="sidebar w-56 text-white flex flex-col flex-shrink-0">
      <div className="p-5 relative z-10">
        <Link href="/app" className="flex items-center gap-3">
          <div className="sidebar-logo w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold">P</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            PlumberOS
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-2 relative z-10 overflow-y-auto">
        {PRIMARY_NAV_ITEMS.slice(0, 1).map((item) => {
          const Icon = item.icon;
          const active = navItemIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'sidebar-item w-full flex items-center gap-3 px-4 py-2.5 mb-0.5 text-sm',
                active ? 'active text-white' : 'text-slate-300 hover:text-white'
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
              <span className="font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        <div className="my-2 border-t border-white/10" aria-hidden />

        <div className="mb-1">
          <button
            type="button"
            onClick={() =>
              setCrmOpenOverride((previous) => {
                const current = previous ?? crmSectionActive;
                const next = !current;
                return next === crmSectionActive ? null : next;
              })
            }
            aria-expanded={crmOpen}
            className={clsx(
              'sidebar-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left',
              crmSectionActive ? 'active text-white' : 'text-slate-300 hover:text-white'
            )}
          >
            <Target className="w-[18px] h-[18px] flex-shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
            <span className="font-medium leading-none flex-1">CRM</span>
            {crmOpen ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-80" aria-hidden />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-80" aria-hidden />
            )}
          </button>

          {crmOpen ? (
            <div className="mt-1 ml-3 pl-3 border-l border-white/15 space-y-0.5">
              {CRM_LINKS.map((sub) => {
                const SubIcon = sub.icon;
                const active =
                  sub.href === '/crm'
                    ? pathname === '/crm' || pathname === '/crm/'
                    : navItemIsActive(pathname, sub.href);
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                      active
                        ? 'bg-white/12 text-white font-medium'
                        : 'text-slate-400 hover:bg-white/6 hover:text-white'
                    )}
                  >
                    <SubIcon className="w-4 h-4 flex-shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
                    <span className="leading-none">{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="my-2 border-t border-white/10" aria-hidden />

        {PRIMARY_NAV_ITEMS.slice(1).map((item) => {
          const Icon = item.icon;
          const active = navItemIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'sidebar-item w-full flex items-center gap-3 px-4 py-2.5 mb-0.5 text-sm',
                active ? 'active text-white' : 'text-slate-300 hover:text-white'
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
              <span className="font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto relative z-10">
        {beforeUserCard ? (
          <div className="px-4 pt-4 border-t border-gray-700/50">{beforeUserCard}</div>
        ) : null}

        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shrink-0">
              {user?.avatarInitials ?? '??'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || user?.email || '—'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role ?? ''}</p>
            </div>
            <ClerkSignOutIconButton className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </aside>
  );
}
