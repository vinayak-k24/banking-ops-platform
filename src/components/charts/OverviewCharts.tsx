'use client';

import { useEffect, useState } from 'react';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, LinearScale,
  LineElement, PointElement, Tooltip, type ScriptableContext,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '@/lib/api';
import type { OverviewCharts } from '@/lib/types';
import { useDashboard } from '@/context/DashboardContext';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);

// All overview charts share a single request per timeframe.
const cache = new Map<string, Promise<OverviewCharts>>();

function useOverviewCharts() {
  const { timeframe } = useDashboard();
  const [data, setData] = useState<OverviewCharts | null>(null);

  useEffect(() => {
    let alive = true;
    if (!cache.has(timeframe)) {
      const p = api.overviewCharts(timeframe);
      p.catch(() => cache.delete(timeframe));
      cache.set(timeframe, p);
    }
    cache.get(timeframe)!.then((d) => alive && setData(d)).catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [timeframe]);

  return data;
}

const tick = (size: number) => ({ font: { size }, color: '#94A3B8' });

export function FraudDetectionChart() {
  const d = useOverviewCharts();
  if (!d) return null;
  const [pred, det] = d.fraud.datasets;
  return (
    <Line
      data={{
        labels: d.fraud.labels,
        datasets: [
          { label: pred.label, data: pred.data, borderColor: '#121826', borderWidth: 2, pointRadius: 0, tension: 0.3 },
          { label: det.label, data: det.data, borderColor: '#FF5C4D', borderWidth: 2, pointRadius: 0, tension: 0.3 },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: tick(9) },
          y: { grid: { color: '#F1F5F9' }, ticks: tick(9) },
        },
      }}
    />
  );
}

export function CashFlowBarChart() {
  const d = useOverviewCharts();
  if (!d) return null;
  const [inflow, outflow] = d.cashFlow.datasets;
  return (
    <Bar
      data={{
        labels: d.cashFlow.labels,
        datasets: [
          { label: inflow.label, data: inflow.data, backgroundColor: '#FF5C4D', borderRadius: 4, barThickness: 8 },
          { label: outflow.label, data: outflow.data, backgroundColor: '#121826', borderRadius: 4, barThickness: 8 },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: tick(8) }, y: { display: false } },
      }}
    />
  );
}

export function ComplianceDonutChart() {
  const d = useOverviewCharts();
  if (!d) return null;
  return (
    <Doughnut
      data={{
        labels: d.compliance.labels,
        datasets: [{ data: d.compliance.datasets[0].data, backgroundColor: ['#FF5C4D', '#437EF7', '#121826'], borderWidth: 0, hoverOffset: 2 }],
      }}
      options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }}
    />
  );
}

export function ReconcileWaveChart() {
  const d = useOverviewCharts();
  if (!d) return null;
  const series = d.reconcile.datasets[0].data;
  const peak = series.indexOf(Math.max(...series));
  return (
    <Line
      data={{
        labels: d.reconcile.labels,
        datasets: [{
          data: series,
          borderColor: '#437EF7',
          borderWidth: 2,
          backgroundColor: (ctx: ScriptableContext<'line'>) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 100);
            g.addColorStop(0, 'rgba(67, 126, 247, 0.25)');
            g.addColorStop(1, 'rgba(67, 126, 247, 0.0)');
            return g;
          },
          fill: true,
          tension: 0.4,
          pointRadius: series.map((_, i) => (i === peak ? 4 : 0)),
          pointBackgroundColor: '#437EF7',
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      }}
    />
  );
}
