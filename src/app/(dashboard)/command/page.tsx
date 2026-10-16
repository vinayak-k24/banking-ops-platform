import type { Metadata } from 'next';
import AgentCommandCenterPage from '@/components/pages/AgentCommandCenterPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('command')!.title} | Banking Ops` };

export default function Page() {
  return <AgentCommandCenterPage />;
}
