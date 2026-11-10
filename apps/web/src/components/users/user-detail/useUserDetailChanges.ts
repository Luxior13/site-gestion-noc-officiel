import { useMemo } from 'react';

import {
  type EsportScopeValue,
  FULL_ESPORT_SCOPE_VALUE,
  isEmptyEsportScope,
  normalizeEsportScope,
  sameEsportScope,
} from '$constants/esport-scope.constants';
import type { PermissionsData } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

import { analyzeUserAccessMutationBatch } from './user-access-editor-policy';
import {
  getProfileFieldErrors,
  savedEsportScope,
  type UserDetailForm,
  userProfileSchema,
} from './user-detail-draft';
import {
  ACCESS_PERMISSION_KEYS,
  ACCOUNT_PERMISSION_KEYS,
  havePermissionOverridesChangedForKeys,
} from './user-detail-page.helpers';
import type { UserDetailSectionId } from './UserDetailNavigation';
import type { useUserMutationFeedback } from './UserMutationFeedback';
import type { UserDetailCapabilities } from './useUserDetailCapabilities';

type ProfileFieldErrors = Record<
  'contactEmail' | 'firstName' | 'lastName' | 'loginName',
  string | null
>;

export type UserDetailChanges = {
  accessMutationAnalysis: ReturnType<
    typeof analyzeUserAccessMutationBatch
  > | null;
  accessSaveDisabledReason: string | undefined;
  canSaveAccess: boolean;
  canSaveAccount: boolean;
  canSaveSecurity: boolean;
  /** The draft scope to send: changed, and not reset by a promotion. */
  esportScopeToSave: EsportScopeValue | null;
  hasAccessChanges: boolean;
  hasAccessPermissionChanges: boolean;
  hasAccountChanges: boolean;
  hasProfileChanges: boolean;
  hasProfileContactChanges: boolean;
  hasProfileErrors: boolean;
  hasProfileLoginChanges: boolean;
  hasSecurityChanges: boolean;
  hasUnsavedChanges: boolean;
  profileErrors: ProfileFieldErrors;
  /** Modified sections for the rail: Compte personnel counts as Autorisations. */
  railDirtySections: UserDetailSectionId[];
};

/**
 * Derived state of the record draft: field errors, changes per section,
 * whether each section can be saved, and the sections to mark as modified.
 * Pure derivation of the draft, the saved user and the actor's capabilities.
 */
export const useUserDetailChanges = ({
  capabilities: {
    canEditTargetContact,
    canEditTargetEsportScope,
    canEditTargetLogin,
    canEditTargetProfile,
    canEditTargetRole,
    canEditTargetStatus,
    canManageTargetAccessPermissions,
    canManageTargetAccountPolicy,
    decideAccessPermissionMutation,
    isSelf,
  },
  editForm,
  esportScope,
  mutation,
  permissions,
  user,
}: {
  capabilities: Pick<
    UserDetailCapabilities,
    | 'canEditTargetContact'
    | 'canEditTargetEsportScope'
    | 'canEditTargetLogin'
    | 'canEditTargetProfile'
    | 'canEditTargetRole'
    | 'canEditTargetStatus'
    | 'canManageTargetAccessPermissions'
    | 'canManageTargetAccountPolicy'
    | 'decideAccessPermissionMutation'
    | 'isSelf'
  >;
  editForm: UserDetailForm;
  esportScope: EsportScopeValue | null;
  mutation: Pick<
    ReturnType<typeof useUserMutationFeedback>,
    'feedback' | 'serverValidation'
  >;
  permissions: PermissionsData | null;
  user: UserType | null;
}): UserDetailChanges => {
  const profileErrors = useMemo(() => {
    const validation = userProfileSchema.safeParse({
      contactEmail: editForm.contactEmail,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      loginName: editForm.loginName,
    });
    const local = getProfileFieldErrors(
      validation.success ? undefined : validation.error.flatten().fieldErrors,
    );
    const server = mutation.serverValidation;

    return {
      contactEmail: canEditTargetContact
        ? (local.contactEmail ??
          (server?.form.contactEmail === editForm.contactEmail
            ? server.errors.contactEmail
            : null))
        : null,
      firstName: canEditTargetProfile
        ? (local.firstName ??
          (server?.form.firstName === editForm.firstName
            ? server.errors.firstName
            : null))
        : null,
      lastName: canEditTargetProfile
        ? (local.lastName ??
          (server?.form.lastName === editForm.lastName
            ? server.errors.lastName
            : null))
        : null,
      loginName: canEditTargetLogin
        ? (local.loginName ??
          (server?.form.loginName === editForm.loginName
            ? server.errors.loginName
            : null))
        : null,
    };
  }, [
    canEditTargetContact,
    canEditTargetLogin,
    canEditTargetProfile,
    editForm,
    mutation.serverValidation,
  ]);
  const hasProfileErrors =
    (canEditTargetContact && !!profileErrors.contactEmail) ||
    (canEditTargetLogin && !!profileErrors.loginName) ||
    (canEditTargetProfile &&
      (!!profileErrors.firstName || !!profileErrors.lastName));
  const hasProfileIdentityChanges =
    !!user &&
    canEditTargetProfile &&
    (editForm.firstName.trim() !== user.firstName ||
      editForm.lastName.trim() !== user.lastName);
  const hasProfileLoginChanges =
    !!user &&
    canEditTargetLogin &&
    editForm.loginName.trim().toLowerCase() !== user.loginName;
  const hasProfileContactChanges =
    !!user &&
    canEditTargetContact &&
    (editForm.contactEmail.trim().toLowerCase() || null) !== user.contactEmail;
  const hasProfileChanges =
    hasProfileIdentityChanges ||
    hasProfileLoginChanges ||
    hasProfileContactChanges;
  const hasRoleChanges = !!user && editForm.role !== user.role;
  const hasAccessPermissionChanges =
    !!user &&
    havePermissionOverridesChangedForKeys(
      permissions,
      user.permissions,
      ACCESS_PERMISSION_KEYS,
    );
  const hasAccountPermissionChanges =
    !!user &&
    havePermissionOverridesChangedForKeys(
      permissions,
      user.permissions,
      ACCOUNT_PERMISSION_KEYS,
    );
  // An administrator always sees every game: a promotion resets the scope,
  // the server does it.
  const savedScope = savedEsportScope(user);
  const draftScope =
    editForm.role === 'ADMIN' ? FULL_ESPORT_SCOPE_VALUE : esportScope;
  const hasEsportScopeChanges =
    !!savedScope && !!draftScope && !sameEsportScope(draftScope, savedScope);
  const esportScopeToSave =
    hasEsportScopeChanges && editForm.role !== 'ADMIN' && draftScope
      ? normalizeEsportScope(draftScope)
      : null;
  const esportScopeIncomplete =
    !!esportScopeToSave && isEmptyEsportScope(esportScopeToSave);
  const hasAccessChanges =
    hasRoleChanges || hasAccessPermissionChanges || hasEsportScopeChanges;
  const accessMutationAnalysis = user
    ? analyzeUserAccessMutationBatch({
        currentPermissions: user.permissions,
        currentRole: user.role,
        disabled: !canManageTargetAccessPermissions,
        nextPermissions: permissions,
        nextRole: editForm.role,
        policy: decideAccessPermissionMutation,
        targetCriticalAccessReady: user.criticalAccessReady,
      })
    : null;
  const hasAccountChanges = hasAccountPermissionChanges;
  const hasSecurityChanges = !!user && editForm.isActive !== user.isActive;
  const hasUnsavedChanges =
    hasProfileChanges ||
    hasAccessChanges ||
    hasAccountChanges ||
    hasSecurityChanges;
  const permissionPartAllowed =
    (!hasRoleChanges && !hasAccessPermissionChanges) ||
    accessMutationAnalysis?.decision.allowed === true;
  const canSaveAccess =
    hasAccessChanges &&
    !mutation.feedback?.conflict &&
    (!hasRoleChanges || canEditTargetRole) &&
    permissionPartAllowed &&
    (!esportScopeToSave ||
      (canEditTargetEsportScope && !esportScopeIncomplete));
  const accessSaveDisabledReason = !permissionPartAllowed
    ? accessMutationAnalysis?.decision.reason
    : esportScopeIncomplete
      ? 'Choisissez au moins un jeu ou une équipe.'
      : undefined;
  const canSaveAccount =
    hasAccountPermissionChanges &&
    canManageTargetAccountPolicy &&
    !mutation.feedback?.conflict;
  const canSaveSecurity = canEditTargetStatus && !isSelf && hasSecurityChanges;
  const dirtySections = useMemo<UserDetailSectionId[]>(() => {
    const sections: UserDetailSectionId[] = [];

    if (hasProfileChanges) sections.push('profile');
    if (hasAccessChanges) sections.push('access');
    if (hasAccountChanges) sections.push('account');
    if (hasSecurityChanges) sections.push('security');

    return sections;
  }, [
    hasAccessChanges,
    hasAccountChanges,
    hasProfileChanges,
    hasSecurityChanges,
  ]);
  const railDirtySections = useMemo<UserDetailSectionId[]>(() => {
    const sections = dirtySections.filter((section) => section !== 'account');

    if (hasAccountChanges && !sections.includes('access')) {
      sections.push('access');
    }

    return sections;
  }, [dirtySections, hasAccountChanges]);

  return {
    accessMutationAnalysis,
    accessSaveDisabledReason,
    canSaveAccess,
    canSaveAccount,
    canSaveSecurity,
    esportScopeToSave,
    hasAccessChanges,
    hasAccessPermissionChanges,
    hasAccountChanges,
    hasProfileChanges,
    hasProfileContactChanges,
    hasProfileErrors,
    hasProfileLoginChanges,
    hasSecurityChanges,
    hasUnsavedChanges,
    profileErrors,
    railDirtySections,
  };
};
