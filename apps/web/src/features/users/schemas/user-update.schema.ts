import { z } from 'zod';

import {
  ESPORT_SCOPE_KINDS,
  ESPORT_SCOPE_MAX_ITEMS,
  isEmptyEsportScope,
  normalizeEsportScope,
} from '$constants/esport-scope.constants';
import {
  getAccessPermissionKeys,
  getAccountPermissionKeys,
  getNonAssignablePermissionKeys,
  getUnknownPermissionKeys,
  isKnownPermissionKey,
  normalizePermissionOverrides,
} from '$constants/permissions.constants';
import {
  loginNameSchema,
  optionalEmailSchema,
  trimmedStringMinMax,
} from '$utils/zod.utils';

const ACCOUNT_PERMISSION_KEY_SET = new Set(getAccountPermissionKeys());
const ACCESS_PERMISSION_KEY_SET = new Set(getAccessPermissionKeys());

type PermissionScope = 'access' | 'account';

export const getPermissionScopeKeySet = (
  permissionScope: PermissionScope,
): ReadonlySet<string> =>
  permissionScope === 'account'
    ? ACCOUNT_PERMISSION_KEY_SET
    : ACCESS_PERMISSION_KEY_SET;

export const mergePermissionOverridesForScope = (
  existingPermissions: Record<string, boolean> | null,
  requestedPermissions: Record<string, boolean> | null,
  permissionScope: PermissionScope,
): Record<string, boolean> | null => {
  const scopePermissionKeys = getPermissionScopeKeySet(permissionScope);
  const mergedPermissions = new Map(
    Object.entries(normalizePermissionOverrides(existingPermissions) ?? {}),
  );

  for (const permissionKey of scopePermissionKeys) {
    mergedPermissions.delete(permissionKey);
  }

  for (const [permissionKey, enabled] of Object.entries(
    normalizePermissionOverrides(requestedPermissions) ?? {},
  )) {
    if (scopePermissionKeys.has(permissionKey)) {
      mergedPermissions.set(permissionKey, enabled);
    }
  }

  return normalizePermissionOverrides(
    Object.fromEntries(mergedPermissions) as Record<string, boolean>,
  );
};

export const toPermissionMap = (value: unknown): Map<string, boolean> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Map();
  }

  return new Map(
    Object.entries(value).flatMap(([permissionKey, enabled]) =>
      typeof enabled === 'boolean' ? [[permissionKey, enabled] as const] : [],
    ),
  );
};

export const getChangedPermissionKeys = (
  before: unknown,
  after: unknown,
): string[] => {
  const beforeMap = toPermissionMap(before);
  const afterMap = toPermissionMap(after);
  const permissionKeys = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  return [...permissionKeys].filter(
    (permissionKey) =>
      beforeMap.get(permissionKey) !== afterMap.get(permissionKey),
  );
};

const permissionsSchema = z
  .record(z.string(), z.boolean())
  .nullable()
  .optional()
  .superRefine((value, context) => {
    const unknownPermissionKeys = getUnknownPermissionKeys(value);
    if (unknownPermissionKeys.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Autorisations inconnues : ${unknownPermissionKeys.join(', ')}`,
      });
    }

    const nonAssignablePermissionKeys = getNonAssignablePermissionKeys(value);
    if (nonAssignablePermissionKeys.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Autorisations non attribuables : ${nonAssignablePermissionKeys.join(', ')}`,
      });
    }
  });

const scopeIdsSchema = z
  .array(z.string().trim().min(1).max(64))
  .max(ESPORT_SCOPE_MAX_ITEMS, {
    error: `${ESPORT_SCOPE_MAX_ITEMS} choix au plus`,
  });

/**
 * Which games and teams the account reaches in the Esport pole (10 November
 * 2026): a restricted scope names at least one game or team.
 */
const esportScopeSchema = z
  .object({
    gameIds: scopeIdsSchema,
    kind: z.enum(ESPORT_SCOPE_KINDS),
    teamIds: scopeIdsSchema,
  })
  .strict()
  .transform(normalizeEsportScope)
  .refine((value) => !isEmptyEsportScope(value), {
    error: 'Choisissez au moins un jeu ou une équipe.',
  });

export const updateUserSchema = z
  .object({
    contactEmail: optionalEmailSchema,
    esportScope: esportScopeSchema.optional(),
    expectedUpdatedAt: z
      .string({ error: 'La version de la fiche est requise' })
      .datetime({ offset: true })
      .transform((value) => new Date(value)),
    firstName: trimmedStringMinMax(
      1,
      50,
      'Prénom requis',
      'Prénom trop long',
    ).optional(),
    isActive: z.boolean().optional(),
    lastName: trimmedStringMinMax(0, 50, undefined, 'Nom trop long').optional(),
    loginName: loginNameSchema.optional(),
    permissions: permissionsSchema,
    permissionScope: z.enum(['access', 'account']).optional(),
    role: z.enum(['ADMIN', 'USER']).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.permissionScope !== undefined &&
      value.permissions === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le volet choisi exige la liste de ses autorisations',
        path: ['permissionScope'],
      });
    }

    // The scope belongs to the administration side, as the role.
    if (
      value.permissionScope === 'account' &&
      value.esportScope !== undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Les jeux et équipes visibles se modifient dans le volet Administration',
        path: ['esportScope'],
      });
    }

    if (value.permissionScope === 'account' && value.role !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le rôle se modifie dans le volet Administration',
        path: ['role'],
      });
    }

    if (
      value.permissions === undefined ||
      value.permissionScope === undefined
    ) {
      return;
    }

    const scopePermissionKeys = getPermissionScopeKeySet(value.permissionScope);
    const outOfScopePermissionKeys = Object.keys(
      value.permissions ?? {},
    ).filter(
      (permissionKey) =>
        isKnownPermissionKey(permissionKey) &&
        !scopePermissionKeys.has(permissionKey),
    );

    if (outOfScopePermissionKeys.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Autorisations hors du volet choisi : ${outOfScopePermissionKeys.join(', ')}`,
        path: ['permissions'],
      });
    }
  });

export type UserUpdateInput = z.infer<typeof updateUserSchema>;
