'use client';

import { type SetStateAction, useCallback, useState } from 'react';

import type { EsportScopeValue } from '$constants/esport-scope.constants';
import type { PermissionsData } from '$constants/permissions.constants';
import type { UserType } from '$types/auth.types';

import {
  createUserDetailDraft,
  receiveUserDetail,
  restoreUserDetailSection,
  type SubmittedUserDraft,
  type UserDetailForm,
} from './user-detail-draft';

type UserDetailDraftController = {
  clearUserState: () => void;
  editForm: UserDetailForm;
  esportScope: EsportScopeValue | null;
  permissions: PermissionsData | null;
  /** Drop every draft and show the saved user again. */
  restoreSavedDraft: () => void;
  /** Drop the draft of one section only. */
  restoreSavedSection: (section: SubmittedUserDraft['section']) => void;
  setEditForm: (update: SetStateAction<UserDetailForm>) => void;
  setEsportScope: (scope: EsportScopeValue) => void;
  setPermissions: (update: SetStateAction<PermissionsData | null>) => void;
  syncUserState: (user: UserType, submitted?: SubmittedUserDraft) => void;
  user: UserType | null;
};

export const useUserDetailDraft = (
  initialUser?: UserType,
): UserDetailDraftController => {
  const [state, setState] = useState(() => createUserDetailDraft(initialUser));
  const clearUserState = useCallback((): void => {
    setState(createUserDetailDraft());
  }, []);
  const setEditForm = useCallback(
    (update: SetStateAction<UserDetailForm>): void => {
      setState((current) => ({
        ...current,
        form: typeof update === 'function' ? update(current.form) : update,
      }));
    },
    [],
  );
  const setPermissions = useCallback(
    (update: SetStateAction<PermissionsData | null>): void => {
      setState((current) => ({
        ...current,
        permissions:
          typeof update === 'function' ? update(current.permissions) : update,
      }));
    },
    [],
  );
  const setEsportScope = useCallback((esportScope: EsportScopeValue): void => {
    setState((current) => ({ ...current, esportScope }));
  }, []);
  const restoreSavedDraft = useCallback((): void => {
    setState((current) =>
      current.user ? createUserDetailDraft(current.user) : current,
    );
  }, []);
  const restoreSavedSection = useCallback(
    (section: SubmittedUserDraft['section']): void => {
      setState((current) => restoreUserDetailSection(current, section));
    },
    [],
  );
  const syncUserState = useCallback(
    (user: UserType, submitted?: SubmittedUserDraft): void => {
      setState((current) => receiveUserDetail(current, user, submitted));
    },
    [],
  );

  return {
    clearUserState,
    editForm: state.form,
    esportScope: state.esportScope,
    permissions: state.permissions,
    restoreSavedDraft,
    restoreSavedSection,
    setEditForm,
    setEsportScope,
    setPermissions,
    syncUserState,
    user: state.user,
  };
};
