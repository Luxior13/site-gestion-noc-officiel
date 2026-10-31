import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOT = resolve(import.meta.dirname, '..');

// Former names stay searchable on purpose, so that someone typing them still
// finds the account (protected-user.constants.ts); they are never displayed.
const SEARCH_ALIAS_FILES = new Set([
  'shared/constants/protected-user.constants.ts',
]);

/** Every string literal and JSX text of the application sources. */
const readVisibleTexts = (): { file: string; text: string }[] =>
  globSync('**/*.{ts,tsx}', { cwd: SOURCE_ROOT })
    .map((file) => file.replaceAll('\\', '/'))
    .filter(
      (file) => !file.startsWith('__tests__/') && !SEARCH_ALIAS_FILES.has(file),
    )
    .flatMap((file) => {
      const source = ts.createSourceFile(
        file,
        // Paths come from the glob of the source tree above.
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        readFileSync(resolve(SOURCE_ROOT, file), 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const texts: { file: string; text: string }[] = [];
      const visit = (node: ts.Node): void => {
        if (
          ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isTemplateHead(node) ||
          ts.isTemplateMiddle(node) ||
          ts.isTemplateTail(node) ||
          ts.isJsxText(node)
        ) {
          texts.push({ file, text: node.text });
        }
        ts.forEachChild(node, visit);
      };
      visit(source);

      return texts;
    });

describe('visible wording', () => {
  const texts = readVisibleTexts();

  // Owner decision of 25 October 2026: « Superadmin » as a label,
  // « superadmin » in sentences, nothing else.
  it('names the protected account « superadmin » only', () => {
    const offenders = texts
      .filter(({ text }) =>
        /\bracine\b|super[- ]?administrat|compte protégé/iu.test(text),
      )
      .map(({ file, text }) => `${file}: ${text}`);

    expect(offenders).toEqual([]);
  });

  it('writes the ellipsis as one character in French text', () => {
    const offenders = texts
      .filter(({ text }) => /\p{L}\.\.\.(?!\.)/u.test(text))
      .map(({ file, text }) => `${file}: ${text}`);

    expect(offenders).toEqual([]);
  });

  // Audit of 31 October 2026 (AC-22): one apostrophe, the typographic one.
  it('writes the French apostrophe as one typographic character', () => {
    const offenders = texts
      .filter(({ text }) => /\p{L}'\p{L}|&apos;/u.test(text))
      .map(({ file, text }) => `${file}: ${text}`);

    expect(offenders).toEqual([]);
  });

  // Audit of 31 October 2026 (AC-21, AC-29): the interface says
  // \u00AB autorisation \u00BB and its messages stay in French.
  it('says \u00AB autorisation \u00BB and keeps English words out of messages', () => {
    const offenders = texts
      .filter(({ text }) =>
        // Sentences only: SQL, imports and enum values keep their names.
        [
          /\b(?:la|une|des|les|vos|ses|de) permissions?\b/u,
          /^Permissions?\b(?!-)/u,
          /\bunderscores?\b/u,
          /\b(?:le|un|du|au|de) (?:scope|payload)\b/iu,
        ].some((pattern) => pattern.test(text)),
      )
      .map(({ file, text }) => `${file}: ${text}`);

    expect(offenders).toEqual([]);
  });
});
