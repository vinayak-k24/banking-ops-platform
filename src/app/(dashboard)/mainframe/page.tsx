import type { Metadata } from 'next';
import ModernizationTrackerPage from '@/components/pages/ModernizationTrackerPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('mainframe')!.title} | Banking Ops` };

export default function Page() {
  return <ModernizationTrackerPage />;
}
