import {
  Activity,
  Archive,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FileText,
  Handshake,
  History,
  Home,
  Key,
  LayoutDashboard,
  type LucideIcon,
  Newspaper,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

const NAVIGATION_ICONS = {
  Activity,
  Archive,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FileText,
  Handshake,
  History,
  Home,
  // Same icons as the Mon compte tabs found by the quick navigation.
  Key,
  LayoutDashboard,
  Newspaper,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} satisfies Record<string, LucideIcon>;

export type NavigationIconName = keyof typeof NAVIGATION_ICONS;

const NAVIGATION_ICON_MAP = new Map<NavigationIconName, LucideIcon>(
  Object.entries(NAVIGATION_ICONS) as [NavigationIconName, LucideIcon][],
);

export function getNavigationIcon(icon: NavigationIconName): LucideIcon {
  return NAVIGATION_ICON_MAP.get(icon) ?? Settings;
}
