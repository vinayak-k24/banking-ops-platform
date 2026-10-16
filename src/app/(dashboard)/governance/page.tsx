import type { Metadata } from 'next';
import HumanGovernancePage from '@/components/pages/HumanGovernancePage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('governance')!.title} | Banking Ops` };

export default function Page() {
  return <HumanGovernancePage />;
}
