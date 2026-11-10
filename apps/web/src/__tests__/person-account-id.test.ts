import { describe, expect, it, vi } from 'vitest';

import {
  getPersonSocialNetwork,
  OTHER_NICKNAME_NOTE_SUGGESTIONS,
  PERSON_SOCIAL_NETWORKS,
  personNetworkKind,
} from '$features/persons/person.constants';
import {
  accountIdFromUrl,
  accountIdInput,
  accountUrlFromInput,
  accountUrlsForId,
} from '$features/persons/person.utils';
import { createPersonSocialProfileSchema } from '$features/persons/schemas/person.schemas';
import { buildPersonSearchFragments } from '$features/persons/server/person-search';

vi.mock('server-only', () => ({}));

/*
 * The ID of an account that never changes when its owner renames (owner,
 * 10 November 2026: « ok go »): Discord, then Steam with the game accounts.
 * It recognizes a person under a new name.
 */

const DISCORD = '123456789012345678';
const STEAM = '76561198000000001';
const profile = (
  networkKey: string,
  profileUrl: string | null,
  identifier: string | null = null,
): ReturnType<typeof createPersonSocialProfileSchema.safeParse> =>
  createPersonSocialProfileSchema.safeParse({
    identifier,
    label: 'Personnel',
    networkKey,
    personVersion: 1,
    profileUrl,
  });

describe('account ID of a profile', () => {
  it('keeps the ID as the profile link, typed or pasted', () => {
    expect(accountUrlFromInput('discord', ` ${DISCORD} `)).toBe(
      `https://discord.com/users/${DISCORD}`,
    );
    expect(
      accountUrlFromInput('discord', `https://discord.com/users/${DISCORD}`),
    ).toBe(`https://discord.com/users/${DISCORD}`);
    expect(accountUrlFromInput('steam', STEAM)).toBe(
      `https://steamcommunity.com/profiles/${STEAM}`,
    );
    expect(accountUrlFromInput('discord', '')).toBe('');
    expect(
      accountIdInput('discord', `https://discord.com/users/${DISCORD}`),
    ).toBe(DISCORD);
    expect(
      accountIdFromUrl('steam', `https://steamcommunity.com/profiles/${STEAM}`),
    ).toBe(STEAM);
    expect(
      accountIdFromUrl('discord', 'https://discord.gg/noctambule'),
    ).toBeNull();
    // No rule, no ID: the link stays a link.
    expect(accountIdFromUrl('twitch', 'https://twitch.tv/kaiz')).toBeNull();
  });

  it('accepts the ID of the platform, nothing else, and a name alone', () => {
    expect(
      profile('discord', `https://discord.com/users/${DISCORD}`).success,
    ).toBe(true);
    expect(
      profile('steam', `https://steamcommunity.com/profiles/${STEAM}`).success,
    ).toBe(true);
    expect(profile('discord', null, 'kaiz').success).toBe(true);
    expect(profile('riot', null, 'Kaiz#EUW').success).toBe(true);
    for (const [networkKey, wrong, message] of [
      [
        'discord',
        'https://discord.com/users/1234',
        'L’ID d’un compte Discord compte 17 à 20 chiffres',
      ],
      [
        'discord',
        'https://discord.gg/noctambule',
        'L’ID d’un compte Discord compte 17 à 20 chiffres',
      ],
      [
        'steam',
        `https://steamcommunity.com/profiles/${DISCORD}`,
        'L’ID Steam compte 17 chiffres et commence par 7656119',
      ],
    ] as const) {
      expect(profile(networkKey, wrong).error?.issues[0]).toMatchObject({
        message,
        path: ['profileUrl'],
      });
    }
    expect(profile('discord', null).error?.issues[0]?.message).toBe(
      'Renseignez le nom d’utilisateur ou l’ID du compte',
    );
    expect(profile('steam', null).error?.issues[0]?.message).toBe(
      'Renseignez le nom du compte ou l’ID Steam',
    );
    // A platform without an ID: the account name is required, a link alone
    // is not enough (owner, 10 November 2026).
    for (const url of [null, 'https://www.xbox.com/fr-FR/play/user/kaiz']) {
      expect(profile('xbox', url).error?.issues[0]).toMatchObject({
        message: 'Renseignez le nom du compte',
        path: ['identifier'],
      });
    }
    expect(profile('instagram', null).error?.issues[0]?.message).toBe(
      'Renseignez un identifiant visible ou une URL de profil',
    );
  });

  it('finds a record by the ID alone, on every platform it may belong to', () => {
    expect(accountUrlsForId(DISCORD)).toEqual([
      `https://discord.com/users/${DISCORD}`,
    ]);
    // A SteamID64 also has the shape of a Discord ID: both are looked for.
    expect(accountUrlsForId(STEAM)).toEqual([
      `https://discord.com/users/${STEAM}`,
      `https://steamcommunity.com/profiles/${STEAM}`,
    ]);
    expect(
      buildPersonSearchFragments(STEAM).contactSearchClause.values,
    ).toEqual(
      expect.arrayContaining([
        `https://discord.com/users/${STEAM}`,
        `https://steamcommunity.com/profiles/${STEAM}`,
      ]),
    );
  });
});

describe('game accounts', () => {
  it('lists the game platforms apart from the social networks', () => {
    const games = PERSON_SOCIAL_NETWORKS.filter(
      (network) => network.kind === 'game',
    ).map((network) => network.label);
    expect(games).toEqual(
      expect.arrayContaining(['Riot Games', 'Steam', 'Battle.net', 'FACEIT']),
    );
    expect(personNetworkKind('riot')).toBe('game');
    expect(personNetworkKind('discord')).toBe('social');
    // An example says so: never mistaken for a value (10 November 2026).
    expect(getPersonSocialNetwork('riot')?.identifierPlaceholder).toBe(
      'Ex. Kaiz#EUW',
    );
  });

  it('leaves the pseudo in a game to the game accounts', () => {
    expect(OTHER_NICKNAME_NOTE_SUGGESTIONS).not.toContain('Pseudo en jeu');
  });
});
