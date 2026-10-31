import { SITE_CONFIG } from '$constants/app.constants';

// Development tabs say so, on every page (audit RR-10, 31 October 2026).
const SITE_TITLE = `${SITE_CONFIG.name}${process.env.NODE_ENV === 'development' ? ' · Dev' : ''}`;

/**
 * Browser tab title of a view, most specific part first (WCAG 2.4.2):
 * `pageTitle('Nouvel utilisateur', 'Utilisateurs')` gives
 * « Nouvel utilisateur · Utilisateurs · Noctambule ». A Next title template
 * cannot serve here: it skips the page of its own segment (home, 404).
 */
export const pageTitle = (...parts: string[]): string =>
  [...parts, SITE_TITLE].join(' · ');
