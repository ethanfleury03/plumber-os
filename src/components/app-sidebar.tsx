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
import { cn } from '@/lib/ops';

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
  mobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
};

export function AppSidebar({ beforeUserCard, mobile = false, onNavigate, onClose }: AppSidebarProps) {
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
  const navLinkClass = (active: boolean) =>
    clsx(
      'sidebar-item flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm',
      active ? 'active text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-slate-300 hover:text-white',
    );

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        'sidebar flex min-h-0 w-[18rem] flex-col text-white',
        mobile ? 'h-full max-h-full' : 'h-screen max-h-screen shrink-0',
      )}
    >
      <div className="relative z-10 border-b border-white/10 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-3" onClick={handleNavigate}>
            <div className="sidebar-logo flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg">
              <span className="text-lg font-bold">P</span>
            </div>
            <div>
              <span className="block text-xl font-semibold tracking-[-0.03em] text-white">PlumberOS</span>
              <span className="block text-[11px] uppercase tracking-[0.22em] text-slate-400">Ops Console</span>
            </div>
          </Link>
          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-300 transition-colors hover:bg-white/6 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <p className="mt-1 text-sm font-semibold text-white">Field operations</p>
            </div>
            <div className="rounded-full bg-emerald-400/16 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
              Live
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Dispatch, quotes, and receptionist workflows in one shared control surface.
          </p>
        </div>
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mb-3">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Overview</p>
        </div>
        {PRIMARY_NAV_ITEMS.slice(0, 1).map((item) => {
          const Icon = item.icon;
          const active = navItemIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigate}
              className={navLinkClass(active)}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
              <span className="font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        <div className="my-4 border-t border-white/10" aria-hidden />

        <div className="mb-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">CRM</p>
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
            className={navLinkClass(crmSectionActive)}
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
            <div className="mt-2 ml-3 space-y-1 border-l border-white/12 pl-3">
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
                    onClick={handleNavigate}
                    className={clsx(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-colors',
                      active
                        ? 'bg-white/10 text-white font-medium'
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

        <div className="mb-3">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Operations</p>
        </div>

        {PRIMARY_NAV_ITEMS.slice(1).map((item) => {
          const Icon = item.icon;
          const active = navItemIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigate}
              className={navLinkClass(active)}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
              <span className="font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto relative z-10">
        {beforeUserCard ? (
          <div className="border-t border-white/10 px-4 pt-4">{beforeUserCard}</div>
        ) : null}

        <div className="border-t border-white/10 p-4">
          <div className="group flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/6 p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4a7eff,#255cf3)] text-sm font-bold shadow-lg">
              {user?.avatarInitials ?? '??'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || user?.email || '—'}</p>
              <p className="mt-0.5 text-xs capitalize text-slate-400">{user?.role ?? 'dispatcher'}</p>
            </div>
            <ClerkSignOutIconButton className="shrink-0 rounded-xl p-2 text-slate-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </aside>
  );
}
