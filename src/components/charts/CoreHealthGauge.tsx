'use client';

import { useEffect, useRef } from 'react';

// Dotted semicircle gauge (ported from the original canvas drawing routine).
export default function CoreHealthGauge({ value }: { value: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.setTransform(2, 0, 0, 2, 0, 0);

      const { width, height } = rect;
      const centerX = width / 2;
      const centerY = height - 10;
      const radius = Math.min(width, height * 2) / 2 - 15;
      ctx.clearRect(0, 0, width, height);

      const totalDots = 50;
      for (let i = 0; i <= totalDots; i++) {
        const ratio = i / totalDots;
        const angle = Math.PI + ratio * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle), 1.8, 0, Math.PI * 2);
        if (ratio <= value) ctx.fillStyle = ratio < 0.3 ? '#FF5C4D' : ratio < 0.6 ? '#6366F1' : '#437EF7';
        else ctx.fillStyle = '#E2E8F0';
        ctx.fill();
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [value]);

  return <canvas ref={ref} className="w-full h-full" />;
}
