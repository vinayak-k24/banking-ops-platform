'use client';

import { useEffect, useRef } from 'react';
import type { HealthStatus } from '@/lib/types';

const ARC = 12; // arc thickness, px
const TRACK = '#E2E8F0';
// Healthy keeps the original blue-to-teal sweep; warning/critical use the theme warning colors.
const STATUS_COLORS: Record<HealthStatus, [string, string]> = {
  HEALTHY: ['#437EF7', '#14B8A6'],
  WARNING: ['#F59E0B', '#F59E0B'],
  CRITICAL: ['#FF5C4D', '#FF5C4D'],
};

// Semicircle gauge sized to its container (redraws on resize). The value label is rendered by the caller.
export default function CoreHealthGauge({ value, status }: { value: number; status: HealthStatus }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Fit the full semicircle (plus stroke) inside the canvas without clipping.
      const radius = Math.max(0, Math.min(width / 2, height) - ARC / 2 - 2);
      const cx = width / 2;
      const cy = height - ARC / 2 - 2;
      const clamped = Math.min(1, Math.max(0, value));

      ctx.lineCap = 'round';
      ctx.lineWidth = ARC;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
      ctx.strokeStyle = TRACK;
      ctx.stroke();

      if (clamped > 0) {
        const [from, to] = STATUS_COLORS[status];
        const gradient = ctx.createLinearGradient(cx - radius, 0, cx + radius, 0);
        gradient.addColorStop(0, from);
        gradient.addColorStop(1, to);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, Math.PI + clamped * Math.PI);
        ctx.strokeStyle = gradient;
        ctx.stroke();
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [value, status]);

  return <canvas ref={ref} className="w-full h-full block" role="img" aria-label={`Core banking health ${Math.round(value * 100)}%`} />;
}
