import { Suspense } from 'react';
import AuditClient from './AuditClient';

export default function AuditPage() {
  return (
    <Suspense fallback={null}>
      <AuditClient />
    </Suspense>
  );
}
