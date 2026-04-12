'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppSidebar } from '@/components/app-sidebar';

type SidebarSlotContextValue = {
  setSidebarAboveUserCard: (node: ReactNode | null) => void;
};

const SidebarSlotContext = createContext<SidebarSlotContextValue | null>(null);

/** Register extra content above the user card in the app sidebar (e.g. Calls AI status). */
export function useSetSidebarAboveUserCard() {
  const ctx = useContext(SidebarSlotContext);
  if (!ctx) {
    throw new Error('useSetSidebarAboveUserCard must be used within DashboardShell');
  }
  return ctx.setSidebarAboveUserCard;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarAboveUserCard, setSidebarAboveUserCard] = useState<ReactNode>(null);
  const setSlot = useCallback((node: ReactNode | null) => {
    setSidebarAboveUserCard(node);
  }, []);

  const value = useMemo(() => ({ setSidebarAboveUserCard: setSlot }), [setSlot]);

  return (
    <SidebarSlotContext.Provider value={value}>
      <div className="flex h-screen min-h-0 w-full">
        <AppSidebar beforeUserCard={sidebarAboveUserCard} />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">{children}</div>
      </div>
    </SidebarSlotContext.Provider>
  );
}
