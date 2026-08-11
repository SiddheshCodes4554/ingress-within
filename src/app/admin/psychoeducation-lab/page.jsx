'use client';

import dynamic from 'next/dynamic';

const PsychoeducationLabPage = dynamic(
  () => import('../../../views/PsychoeducationLabPage'),
  { ssr: false }
);

export default function AdminPsychoeducationLabRoutePage() {
  return <PsychoeducationLabPage />;
}
