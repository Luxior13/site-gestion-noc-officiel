import { describe, expect, it } from 'vitest';

import {
  getSearchTerms,
  getSearchWords,
  includesSearchTerms,
  normalizeSearchText,
} from '$utils/search-text.utils';

// Audit RL of 31 October 2026: one comparison rule for every search. The SQL
// mirror (public.search_text) is compared in audit-journal-postgres.test.ts.
describe('site-wide search form', () => {
  it.each([
    ['André LEFÈVRE', 'andre lefevre'],
    ['Iñaki Álvarez', 'inaki alvarez'],
    ['Zoé Cœurdevey', 'zoe coeurdevey'],
    ['Ludmila Søren', 'ludmila soren'],
    ['Æsir Straße Þór Łukasz Đorđe', 'aesir strasse thor lukasz dorde'],
    ['Nguyễn Thị Minh Khai', 'nguyen thi minh khai'],
    ['Jean-Pierre d’Artagnan', 'jean pierre d artagnan'],
    ["Jean-Pierre d'Artagnan", 'jean pierre d artagnan'],
    [
      '  « Modèles—d’activité / ÉQUIPE & œuvre » ',
      'modeles d activite equipe oeuvre',
    ],
    ['jean.dupont@exemple.fr', 'jean dupont exemple fr'],
    ['★ＫＥＮ★ 🔥', 'ken'],
    ['ΟΔΟΣ οδος', 'οδοσ οδοσ'],
    ['Дмитрий', 'дмитрии'],
    ['佐々木', '佐々木'],
    ['… / —', ''],
  ])('reads « %s » as « %s »', (value, expected) => {
    expect(normalizeSearchText(value)).toBe(expected);
  });

  it('keeps distinct words once, in typing order', () => {
    expect(getSearchWords('Lefèvre andré LEFEVRE')).toEqual([
      'lefevre',
      'andre',
    ]);
    expect(getSearchWords('%_\\')).toEqual([]);
  });

  it('drops filler words and reads plurals as singular in local catalogs', () => {
    expect(getSearchTerms('Les réunions des équipes')).toEqual([
      'reunion',
      'equipe',
    ]);
    expect(getSearchTerms('mot de passe')).toEqual(['mot', 'passe']);
    expect(
      includesSearchTerms(
        'Réunion d’équipe',
        getSearchTerms('équipes réunions'),
      ),
    ).toBe(true);
    expect(
      includesSearchTerms('Réunion d’équipe', getSearchTerms('facture')),
    ).toBe(false);
  });
});
