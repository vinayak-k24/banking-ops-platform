import type { Metadata } from 'next';
import OperationsOverviewPage from '@/components/pages/OperationsOverviewPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('ops')!.title} | Banking Ops` };

export default function Page() {
  return <OperationsOverviewPage />;
}
