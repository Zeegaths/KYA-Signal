import { Suspense } from 'react';
import AuditClient from './AuditClient';

export default function AuditPage() {
  return (
    <Suspense fallback={<div style={{ color: '#555', padding: '40px', fontFamily: 'JetBrains Mono' }}>Loading...</div>}>
      <AuditClient />
    </Suspense>
  );
}
