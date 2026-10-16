import type { Metadata } from 'next';
import IncidentReliabilityPage from '@/components/pages/IncidentReliabilityPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('sre')!.title} | Banking Ops` };

export default function Page() {
  return <IncidentReliabilityPage />;
}
