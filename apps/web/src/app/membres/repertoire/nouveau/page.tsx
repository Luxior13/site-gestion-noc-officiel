'use client';

import { UserPlus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { type FC, Suspense } from 'react';

import AuthenticatedLayout from '$components/AuthenticatedLayout';
import { PageIdentityHero } from '$components/layout/PageIdentityHero';
import { AccessDeniedState } from '$components/layout/PageState';
import { FEATURES } from '$constants/feature-registry.constants';
import { useUser } from '$context/UserContext';
import { PersonCreateForm } from '$features/persons/components/PersonCreateForm';
import { getPersonCapabilities } from '$features/persons/person.permissions';
import { getSafePersonReturnHref } from '$features/persons/person.ui';
import { PageCanvas, PageShell } from '$ui/page-shell';
import { Skeleton } from '$ui/skeleton';

const NewPersonPageSkeleton: FC = () => (
  <PageShell className="py-0" width="form">
    <PageCanvas>
      <div aria-label="Chargement" className="space-y-3" role="status">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </PageCanvas>
  </PageShell>
);

const NewPersonContent: FC<{ returnHref: string }> = ({ returnHref }) => {
  const { userData } = useUser();
  const { canCreate } = getPersonCapabilities(userData);

  if (!canCreate) {
    return (
      <AccessDeniedState
        action="créer une fiche"
        back={{ href: returnHref, label: 'Retour au répertoire' }}
      />
    );
  }

  return (
    <PageShell className="py-0" width="form">
      <PageCanvas contentClassName="relative space-y-5">
        <PageIdentityHero
          compact
          description="Créez l’identité essentielle, puis complétez la fiche si nécessaire."
          icon={<UserPlus className="size-5" />}
          title="Nouvelle fiche"
        />
        <PersonCreateForm key={userData?.id} returnHref={returnHref} />
      </PageCanvas>
    </PageShell>
  );
};

const NewPersonPageContent: FC = () => {
  const searchParams = useSearchParams();
  const returnHref = getSafePersonReturnHref(searchParams.get('returnTo'));

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: FEATURES.persons.audit.poleLabel },
        { href: returnHref, label: FEATURES.persons.label },
        { label: 'Nouvelle fiche' },
      ]}
    >
      <NewPersonContent returnHref={returnHref} />
    </AuthenticatedLayout>
  );
};

const NewPersonPage: FC = () => (
  <Suspense fallback={<NewPersonPageSkeleton />}>
    <NewPersonPageContent />
  </Suspense>
);

export default NewPersonPage;
