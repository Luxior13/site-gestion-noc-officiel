'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { type FC, useState } from 'react';

import { EntityDangerZone } from '$components/layout/EntityDangerZone';
import { useUser } from '$context/UserContext';

import { deletePerson } from '../person.api';
import { getPersonDisplayName } from '../person.ui';
import type { PersonDetail } from '../types/person.types';

const AdminStepUpDialog = dynamic(() =>
  import('$components/users/user-detail/AdminStepUpDialog').then(
    (module) => module.AdminStepUpDialog,
  ),
);

type PersonDangerZoneProps = {
  onReload: () => Promise<PersonDetail>;
  person: PersonDetail;
  returnHref: string;
};

export const PersonDangerZone: FC<PersonDangerZoneProps> = ({
  onReload,
  person,
  returnHref,
}) => {
  const router = useRouter();
  const { userData } = useUser();
  // Deleting a record asks for a recent password, like deleting an account;
  // a confirmed proof resumes the same deletion request.
  const [resumeDeletion, setResumeDeletion] = useState<(() => void) | null>(
    null,
  );

  return (
    <>
      <EntityDangerZone
        key={person.id}
        description="L’identité, les coordonnées, les contacts d’urgence, les liens vers les représentants légaux, les autres pseudos, les réseaux sociaux et les comptes de jeu seront supprimés sans possibilité de restauration."
        dialogDescription="Cette action est irréversible. Vérifiez la fiche avant de confirmer sa suppression."
        dialogNotice="La fiche et ses données personnelles seront effacées immédiatement et définitivement."
        dialogTitle={`Supprimer définitivement la fiche de ${getPersonDisplayName(person)} ?`}
        onDelete={(version, idempotencyKey, signal) =>
          deletePerson({
            idempotencyKey,
            personId: person.id,
            signal,
            version,
          })
        }
        onDeleted={() => router.replace(returnHref)}
        onDeletedLabel="Retour au répertoire"
        onPasswordProofRequired={(resume) => setResumeDeletion(() => resume)}
        onReloadVersion={async () => (await onReload()).version}
        // No button the server would refuse (owner, 8 November 2026): a
        // representative's record says why it stays. Without the right to
        // the coordinates the links are unknown here, and the server refuses.
        unavailableReason={
          person.represents.length > 0
            ? `Cette fiche représente légalement ${person.represents.map((item) => item.person.displayName).join(', ')} : retirez d’abord ce lien sur la fiche représentée.`
            : undefined
        }
        version={person.version}
      />
      {resumeDeletion && (
        <AdminStepUpDialog
          actorLoginName={userData?.loginName ?? ''}
          description="Confirmez votre mot de passe pour supprimer définitivement cette fiche."
          onCancel={() => setResumeDeletion(null)}
          onComplete={() => {
            const resume = resumeDeletion;
            setResumeDeletion(null);
            resume();
          }}
          open
          proofKind="password"
          title="Confirmer la suppression"
        />
      )}
    </>
  );
};
