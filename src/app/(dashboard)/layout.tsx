import { DashboardProvider } from '@/context/DashboardContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import GeminiDrawer from '@/components/layout/GeminiDrawer';
import UniversalModal from '@/components/layout/UniversalModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="w-full h-full max-w-[1600px] max-h-[980px] bg-[#F4F6FA] rounded-[32px] border border-slate-300/80 shadow-2xl overflow-hidden flex p-3 gap-3 relative">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden relative">{children}</main>
        </div>
      </div>
      <GeminiDrawer />
      <UniversalModal />
    </DashboardProvider>
  );
}
