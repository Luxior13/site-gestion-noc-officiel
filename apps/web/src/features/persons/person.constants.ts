/**
 * Whether a record is in the structure: computed from its passages, never
 * chosen nor stored (owner's decision of 7 November 2026, built on
 * 9 November): « Dans la structure » while one of them, in a team or in the
 * structure, has begun and not ended.
 */
export const PERSON_STRUCTURE_STATUSES = [
  'IN_STRUCTURE',
  'OUTSIDE_STRUCTURE',
] as const;

export const PERSON_LIST_SORTS = ['name', 'updated', 'created'] as const;

export const PERSON_STRUCTURE_STATUS_LABELS = {
  IN_STRUCTURE: 'Dans la structure',
  OUTSIDE_STRUCTURE: 'Hors structure',
} as const satisfies Record<(typeof PERSON_STRUCTURE_STATUSES)[number], string>;

type PersonSocialNetworkStatus = 'active' | 'deprecated';

/**
 * A social network, or a game platform (10 November 2026, « ok go »): a game
 * account is the account of a platform, not of a game (one Riot account plays
 * Valorant and League of Legends), kept as a profile of the record, in its own
 * card of the Coordonnées tab.
 */
export type PersonNetworkKind = 'game' | 'social';

export type PersonSocialNetworkDefinition = {
  /** What the visible identifier is called, and an example of it. */
  identifierLabel?: string;
  identifierPlaceholder?: string;
  key: string;
  kind: PersonNetworkKind;
  label: string;
  status: PersonSocialNetworkStatus;
};

const game = (
  key: string,
  label: string,
  identifierPlaceholder = 'Ex. Kaiz',
): PersonSocialNetworkDefinition => ({
  identifierLabel: 'Nom du compte',
  identifierPlaceholder,
  key,
  kind: 'game',
  label,
  status: 'active',
});

export const PERSON_SOCIAL_NETWORKS: readonly PersonSocialNetworkDefinition[] =
  [
    {
      identifierLabel: 'Nom d’utilisateur',
      identifierPlaceholder: 'Ex. kaiz',
      key: 'discord',
      kind: 'social',
      label: 'Discord',
      status: 'active',
    },
    { key: 'instagram', kind: 'social', label: 'Instagram', status: 'active' },
    { key: 'x', kind: 'social', label: 'X', status: 'active' },
    { key: 'twitter', kind: 'social', label: 'Twitter', status: 'deprecated' },
    { key: 'tiktok', kind: 'social', label: 'TikTok', status: 'active' },
    { key: 'twitch', kind: 'social', label: 'Twitch', status: 'active' },
    { key: 'youtube', kind: 'social', label: 'YouTube', status: 'active' },
    { key: 'facebook', kind: 'social', label: 'Facebook', status: 'active' },
    { key: 'linkedin', kind: 'social', label: 'LinkedIn', status: 'active' },
    game('riot', 'Riot Games', 'Ex. Kaiz#EUW'),
    game('steam', 'Steam'),
    game('epic', 'Epic Games'),
    game('battlenet', 'Battle.net', 'Ex. Kaiz#2154'),
    game('playstation', 'PlayStation Network'),
    game('xbox', 'Xbox'),
    game('ea', 'EA'),
    game('ubisoft', 'Ubisoft Connect'),
    game('faceit', 'FACEIT'),
  ];

export const PERSON_CONTACT_LABEL_SUGGESTIONS = [
  'Personnel',
  'Professionnel',
  'Association',
  'Parent/tuteur',
  'Secondaire',
  'Autre',
] as const;

export const PERSON_SOCIAL_LABEL_SUGGESTIONS = [
  'Personnel',
  'Professionnel',
  'Secondaire',
  'Ancien',
  'Autre',
] as const;

export const PERSON_LIMITS = {
  emails: 10,
  emergencyContacts: 5,
  legalGuardians: 4,
  otherNicknames: 20,
  phones: 10,
  socialProfiles: 20,
} as const;

export const PERSON_AUDIT_KEYS = {
  entityType: 'PERSON',
  sections: {
    contacts: 'contacts',
    // 10 November 2026: read with the coordinates (`persons:view_contact`).
    emergency: 'emergency',
    guardians: 'guardians',
    identity: 'identity',
    // The other pseudos, in the En ligne tab (10 November 2026).
    online: 'online',
    social: 'social',
  },
} as const;

/**
 * How a legal representative stands to the person (10 November 2026), a
 * short fixed list: a parent, a guardian named by a judge, or another one.
 */
export const LEGAL_GUARDIAN_RELATIONS = ['PARENT', 'TUTOR', 'OTHER'] as const;

export type LegalGuardianRelation = (typeof LEGAL_GUARDIAN_RELATIONS)[number];

export const LEGAL_GUARDIAN_RELATION_LABELS = {
  OTHER: 'Autre représentant',
  PARENT: 'Parent',
  TUTOR: 'Tuteur ou tutrice',
} as const satisfies Record<LegalGuardianRelation, string>;

/** Suggestions of what another pseudo is; any text is accepted. */
export const OTHER_NICKNAME_NOTE_SUGGESTIONS = [
  'Ancien pseudo',
  'Compte secondaire',
  'Surnom',
] as const;

/** Suggestions of the link with an emergency contact; any text is accepted. */
export const EMERGENCY_RELATION_SUGGESTIONS = [
  'Parent',
  'Conjoint ou conjointe',
  'Frère ou sœur',
  'Ami ou amie',
  'Autre',
] as const;

const SOCIAL_NETWORK_BY_KEY = new Map(
  PERSON_SOCIAL_NETWORKS.map((network) => [network.key, network]),
);

export const getPersonSocialNetwork = (
  key: string,
): PersonSocialNetworkDefinition | null =>
  SOCIAL_NETWORK_BY_KEY.get(key) ?? null;

/** A social network unless the list says it is a game platform. */
export const personNetworkKind = (key: string): PersonNetworkKind =>
  getPersonSocialNetwork(key)?.kind ?? 'social';

export const isKnownPersonSocialNetwork = (key: string): boolean =>
  SOCIAL_NETWORK_BY_KEY.has(key);

export const isSelectablePersonSocialNetwork = (key: string): boolean =>
  getPersonSocialNetwork(key)?.status === 'active';
