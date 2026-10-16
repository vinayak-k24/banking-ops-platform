'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTORS, type ActorRole, type ModuleId } from '@/lib/modules';

interface ModalState {
  open: boolean;
  title: string;
  body: string;
}

interface DashboardContextValue {
  modal: ModalState;
  openModal: (title: string, body: string) => void;
  closeModal: () => void;
  drawerOpen: boolean;
  toggleGeminiDrawer: () => void;
  switchPage: (id: ModuleId) => void;
  actor: ActorRole;
  actorLabel: string;
  switchActorRole: (role: ActorRole) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  // Bumped after any backend state change so pages refetch shared data (incidents, telemetry).
  dataVersion: number;
  notifyDataChanged: () => void;
  triggerExport: (type: string) => Promise<void>;
  recordDbaDecision: () => Promise<void>;
  approveGovernanceAction: (reqId: string, approved: boolean) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ open: false, title: 'Operational Detail', body: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actor, setActor] = useState<ActorRole>('coo');
  const [timeframe, setTimeframe] = useState('This Month');
  const [dataVersion, setDataVersion] = useState(0);
  const notifyDataChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  const actorLabel = ACTORS.find((a) => a.value === actor)?.label ?? actor;

  const openModal = useCallback((title: string, body: string) => setModal({ open: true, title, body }), []);
  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);
  const toggleGeminiDrawer = useCallback(() => setDrawerOpen((o) => !o), []);
  const switchPage = useCallback((id: ModuleId) => router.push(`/${id}`), [router]);

  const switchActorRole = useCallback(
    (role: ActorRole) => {
      setActor(role);
      openModal('Persona Switched', `Viewing application under persona context: ${role.toUpperCase()}`);
    },
    [openModal],
  );

  const triggerExport = useCallback(
    async (type: string) => {
      try {
        const res = await api.exportReport(type);
        openModal('Export Dispatched', `Generating operational briefing report: ${res.fileName}`);
      } catch (e) {
        openModal('Export Failed', (e as Error).message);
      }
    },
    [openModal],
  );

  const recordDbaDecision = useCallback(async () => {
    try {
      await api.recordDecision({ kind: 'dba', requestId: 'HIST_TRANS_2025', approved: true, actor });
      openModal('DBA Decision Recorded', 'Executed partition archival swap decision for HIST_TRANS_2025 table in simulated environment.');
    } catch (e) {
      openModal('Decision Failed', (e as Error).message);
    }
  }, [actor, openModal]);

  const approveGovernanceAction = useCallback(
    async (reqId: string, approved: boolean) => {
      try {
        await api.recordDecision({ kind: 'governance', requestId: reqId, approved, actor });
        if (approved) {
          openModal('Governance Authorization Approved', `Request ${reqId} has been signed and authorized by Human Governance Lead. Step dispatched to Agent Command Center.`);
        } else {
          openModal('Governance Authorization Rejected', `Request ${reqId} was rejected. Agent execution rolled back.`);
        }
      } catch (e) {
        openModal('Decision Failed', (e as Error).message);
      }
    },
    [actor, openModal],
  );

  const value = useMemo<DashboardContextValue>(
    () => ({
      modal, openModal, closeModal, drawerOpen, toggleGeminiDrawer, switchPage,
      actor, actorLabel, switchActorRole, timeframe, setTimeframe, dataVersion, notifyDataChanged,
      triggerExport, recordDbaDecision, approveGovernanceAction,
    }),
    [modal, openModal, closeModal, drawerOpen, toggleGeminiDrawer, switchPage, actor, actorLabel,
      switchActorRole, timeframe, dataVersion, notifyDataChanged, triggerExport, recordDbaDecision, approveGovernanceAction],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
