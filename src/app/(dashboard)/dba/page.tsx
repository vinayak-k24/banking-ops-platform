import type { Metadata } from 'next';
import DatabaseArchivalPage from '@/components/pages/DatabaseArchivalPage';
import { getModule } from '@/lib/modules';

export const metadata: Metadata = { title: `${getModule('dba')!.title} | Banking Ops` };

export default function Page() {
  return <DatabaseArchivalPage />;
}
