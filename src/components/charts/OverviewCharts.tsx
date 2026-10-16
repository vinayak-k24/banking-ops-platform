'use client';

import { useEffect, useState } from 'react';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, LinearScale,
  LineElement, PointElement, Tooltip, type ScriptableContext,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '@/lib/api';
import type { CashFlowSeries, ChartSeries, OverviewCharts, ReconcileTrend } from '@/lib/types';
import { useDashboard } from '@/context/DashboardContext';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);

// All overview charts share a single request per timeframe.
const cache = new Map<string, Promise<OverviewCharts>>();

export function useOverviewCharts() {
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

const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
const usdFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const formatUsdCompact = (v: number) => usdCompact.format(v);

const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// Series colors shared by charts and their legends.
export const CASH_FLOW_COLORS = { inflow: '#FF5C4D', outflow: '#121826' };
export const COMPLIANCE_COLORS = ['#FF5C4D', '#437EF7', '#121826'];

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

export function CashFlowBarChart({ series }: { series: CashFlowSeries }) {
  const [inflow, outflow] = series.datasets;
  const bar = { borderRadius: 4, categoryPercentage: 0.72, barPercentage: 0.86, maxBarThickness: 22 };
  return (
    <Bar
      data={{
        labels: series.labels,
        datasets: [
          { label: inflow.label, data: inflow.data, backgroundColor: CASH_FLOW_COLORS.inflow, ...bar },
          { label: outflow.label, data: outflow.data, backgroundColor: CASH_FLOW_COLORS.outflow, ...bar },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => (items[0] ? `${items[0].label}, ${shortDate(series.dates[items[0].dataIndex])}` : ''),
              label: (item) => ` ${item.dataset.label}: ${usdFull.format(item.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: tick(9) },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#F1F5F9' },
            ticks: { ...tick(9), maxTicksLimit: 5, callback: (v) => usdCompact.format(Number(v)) },
          },
        },
      }}
    />
  );
}

export function ComplianceDonutChart({ series }: { series: ChartSeries }) {
  return (
    <Doughnut
      data={{
        labels: series.labels,
        datasets: [{
          data: series.datasets[0].data,
          backgroundColor: COMPLIANCE_COLORS,
          borderWidth: 0,
          borderRadius: 12,
          spacing: 4,
          hoverOffset: 2,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        // ~24px ring on a 180px chart.
        cutout: '73%',
        layout: { padding: 2 },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (item) => ` ${item.label}: ${item.parsed}%` } },
        },
      }}
    />
  );
}

export function ReconcileTrendChart({ trend }: { trend: ReconcileTrend }) {
  const obs = trend.observations;
  const values = obs.map((o) => o.accuracy_pct);
  const last = obs.length - 1;
  const min = Math.min(...values, trend.target_pct);
  // Change vs the previous observation; the first point falls back to the backend's latest delta.
  const changeAt = (i: number) => (i > 0 ? values[i] - values[i - 1] : i === last ? trend.latest?.change_pct ?? null : null);

  return (
    <Line
      data={{
        labels: obs.map((o) => shortDate(o.date)),
        datasets: [
          {
            label: 'Accuracy',
            data: values,
            borderColor: '#437EF7',
            borderWidth: 2,
            backgroundColor: (ctx: ScriptableContext<'line'>) => {
              const area = ctx.chart.chartArea;
              if (!area) return 'rgba(67, 126, 247, 0.12)';
              const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, 'rgba(67, 126, 247, 0.22)');
              g.addColorStop(1, 'rgba(67, 126, 247, 0.0)');
              return g;
            },
            fill: true,
            tension: 0.35,
            pointRadius: values.map((_, i) => (i === last ? 4 : 0)),
            pointHoverRadius: 4,
            pointBackgroundColor: '#437EF7',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1.5,
          },
          {
            label: 'Target',
            data: values.map(() => trend.target_pct),
            borderColor: '#14B8A6',
            borderWidth: 1,
            borderDash: [4, 3],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: (item) => item.datasetIndex === 0,
            callbacks: {
              title: (items) => (items[0] ? new Date(`${obs[items[0].dataIndex].date}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' }) : ''),
              label: (item) => ` Accuracy: ${values[item.dataIndex].toFixed(2)}%`,
              afterLabel: (item) => {
                const c = changeAt(item.dataIndex);
                const o = obs[item.dataIndex];
                const change = c === null ? '' : ` Change: ${c >= 0 ? '+' : ''}${c.toFixed(2)} pts\n`;
                return `${change} Matched: ${o.matched.toLocaleString()} / ${o.total.toLocaleString()}\n Target: ${trend.target_pct}%`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { ...tick(8), maxTicksLimit: 6, maxRotation: 0 } },
          y: {
            suggestedMin: Math.floor((min - 0.2) * 10) / 10,
            max: 100,
            border: { display: false },
            grid: { color: '#F1F5F9' },
            ticks: { ...tick(8), maxTicksLimit: 3, callback: (v) => `${Number(v).toFixed(1)}%` },
          },
        },
      }}
    />
  );
}
