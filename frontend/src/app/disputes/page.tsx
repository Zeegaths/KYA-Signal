import { Suspense } from 'react';
import DisputesClient from './DisputesClient';

export default function DisputesPage() {
  return (
    <Suspense fallback={null}>
      <DisputesClient />
    </Suspense>
  );
}
