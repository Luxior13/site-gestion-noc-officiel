export const SEARCH_QUERY_MAX_LENGTH = 160;

export type RankedSearchItem = {
  /** Other words people use for the page, never displayed. */
  keywordSearchText?: string;
  labelSearchText: string;
  searchText: string;
  /** Section of the navigation that holds the page (« Administration »). */
  sectionSearchText?: string;
  spaceSearchText: string;
};

// Texts and queries are compared in the site-wide form (`normalizeSearchText`).
function getSearchScore(
  item: RankedSearchItem,
  normalizedQuery: string,
): number | null {
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);

  if (
    queryTokens.length === 0 ||
    !queryTokens.every((token) => item.searchText.includes(token))
  ) {
    return null;
  }

  const labelTokens = item.labelSearchText.split(' ').filter(Boolean);
  const keywordTokens = (item.keywordSearchText ?? '')
    .split(' ')
    .filter(Boolean);
  const placeTexts = [item.spaceSearchText, item.sectionSearchText ?? ''];
  let score = 0;

  if (item.labelSearchText === normalizedQuery) score += 1_000;
  else if (item.labelSearchText.startsWith(normalizedQuery)) score += 700;
  else if (item.labelSearchText.includes(normalizedQuery)) score += 500;

  if (placeTexts.includes(normalizedQuery)) score += 300;
  else if (placeTexts.some((text) => text && text.startsWith(normalizedQuery)))
    score += 180;

  for (const token of queryTokens) {
    if (labelTokens.includes(token)) score += 100;
    else if (labelTokens.some((labelToken) => labelToken.startsWith(token))) {
      score += 70;
    } else if (item.labelSearchText.includes(token)) score += 40;
    // A word people use for the page outranks a chance match elsewhere:
    // « personne » means the Répertoire, not « Compte personnel » (RR-01).
    else if (keywordTokens.some((keyword) => keyword.startsWith(token)))
      score += 30;
    else if (placeTexts.some((text) => text.includes(token))) score += 20;
    else score += 10;
  }

  return score;
}

export function rankSearchResults<T extends RankedSearchItem>(
  results: readonly T[],
  normalizedQuery: string,
  limit = 10,
): T[] {
  return results
    .map((item) => ({ item, score: getSearchScore(item, normalizedQuery) }))
    .filter(
      (entry): entry is { item: T; score: number } => entry.score !== null,
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ item }) => item);
}
