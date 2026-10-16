import type { Metadata } from 'next';
import PredictiveRiskPage from '@/components/pages/PredictiveRiskPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('risk')!.title} | Banking Ops` };

export default function Page() {
  return <PredictiveRiskPage />;
}
