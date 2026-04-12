'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Target,
  Briefcase,
  Users,
  FileText,
  Calendar,
  MapPin,
  UserCog,
  Phone,
  Settings,
} from 'lucide-react';

export const APP_NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'CRM', icon: Target },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/calls', label: 'Calls', icon: Phone },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function navItemIsActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  /** Rendered above the user profile card (e.g. Calls AI status). */
  beforeUserCard?: ReactNode;
};

export function AppSidebar({ beforeUserCard }: AppSidebarProps) {
  const pathname = usePathname() || '';

  return (
    <aside className="sidebar w-56 text-white flex flex-col flex-shrink-0">
      <div className="p-5 relative z-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="sidebar-logo w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold">P</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            PlumberOS
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-2 relative z-10 overflow-y-auto">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = navItemIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item w-full flex items-center gap-3 px-4 py-2.5 mb-0.5 text-sm ${
                active ? 'active text-white' : 'text-slate-300 hover:text-white'
              }`}
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
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              AK
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Akshay K.</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
