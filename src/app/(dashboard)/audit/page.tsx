import type { Metadata } from 'next';
import ComplianceAuditPage from '@/components/pages/ComplianceAuditPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('audit')!.title} | Banking Ops` };

export default function Page() {
  return <ComplianceAuditPage />;
}
