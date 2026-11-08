import type { FeatureId } from '$constants/feature-registry.constants';
import type { NavigationIconName } from '$constants/navigation-icon.constants';
import type { NavigationSpaceTone } from '$constants/navigation-theme.constants';

export type NavigationAvailability = 'live' | 'planned';
export type NavigationAvailabilityFilter = NavigationAvailability | 'all';

export type NavItem = {
  /**
   * Destinations are deliberately planned by default. A page must be
   * explicitly promoted to `live` before it can enter the main navigation.
   */
  availability?: NavigationAvailability;
  children?: NavItem[];
  description?: string;
  featureId?: FeatureId;
  href: string;
  icon: NavigationIconName;
  /** Searched by the quick navigation, never displayed. */
  keywords?: readonly string[];
  label: string;
  /** Other paths where this item stays the current one (its records). */
  matchHrefs?: readonly string[];
  permissionMode?: 'all' | 'any';
  requiredPermissions?: readonly string[];
  status?: string;
  subTabs?: readonly string[];
};

export type NavSection = {
  id: string;
  items: NavItem[];
  label: string;
  position?: 'top' | 'bottom';
};

export type NavigationSpace = {
  badge?: string;
  description: string;
  href: string;
  icon: NavigationIconName;
  id: string;
  label: string;
  matchHrefs?: readonly string[];
  sections: NavSection[];
  summary: string;
  tone: NavigationSpaceTone;
};
