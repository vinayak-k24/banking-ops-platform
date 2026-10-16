import type { Metadata } from 'next';
import ReconciliationPage from '@/components/pages/ReconciliationPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('reconcile')!.title} | Banking Ops` };

export default function Page() {
  return <ReconciliationPage />;
}
