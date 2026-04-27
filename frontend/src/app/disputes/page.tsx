import { Suspense } from 'react';
import DisputesClient from './DisputesClient';

export default function DisputesPage() {
  return (
    <Suspense fallback={<div style={{ color: '#555', padding: '40px', fontFamily: 'JetBrains Mono' }}>Loading...</div>}>
      <DisputesClient />
    </Suspense>
  );
}
