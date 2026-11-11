import {
  Archive,
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FileText,
  Gamepad2,
  Handshake,
  History,
  Home,
  Key,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
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
  Archive,
  // Opérations, in the Finances pole (11 November 2026).
  ArrowLeftRight,
  Bell,
  BriefcaseBusiness,
  // Organisations, in the Relations pole (11 November 2026).
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FileText,
  Gamepad2,
  Handshake,
  History,
  Home,
  // Same icons as the Mon compte tabs found by the quick navigation.
  Key,
  // Entités, in the Structure pole (10 November 2026).
  Landmark,
  LayoutDashboard,
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
