// app/reports/normradarchart.tsx
'use client';

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { NormRadarPoint } from './psoe-helpers';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type Props = {
  points: NormRadarPoint[];
};

/**
 * Radar-Chart zur Darstellung des PSOE-Reifegrads je Norm.
 * Skala 0..4 (z. B. P, S, O, E).
 */
export default function NormRadarChart({ points }: Props) {
  if (!points.length) {
    return (
      <div className="px-5 py-4 text-sm text-slate-500">
        Noch keine PSOE-Daten vorhanden. Sobald Matrices mit
        Reifegradwerten vorliegen, wird hier das Spinnennetz angezeigt.
      </div>
    );
  }

  const labels = points.map((p) => p.label);
  const values = points.map((p) => p.value);

  const data = {
    labels,
    datasets: [
      {
        label: 'PSOE-Durchschnitt (0–4)',
        data: values,
        backgroundColor: 'rgba(15, 118, 110, 0.25)',
        borderColor: 'rgba(15, 118, 110, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(15, 118, 110, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 5,
      },
    ],
  };

  const options: React.ComponentProps<typeof Radar>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(ctx) {
            const raw = ctx.raw as number;
            return `Reifegrad: ${raw.toFixed(1)} / 4`;
          },
        },
      },
    },
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 4,
        ticks: {
          stepSize: 1,
          showLabelBackdrop: false,
          color: '#64748b',
          backdropColor: 'rgba(0,0,0,0)',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.3)',
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.4)',
        },
        pointLabels: {
          color: '#0f172a',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="h-[380px] w-full px-2 pb-4">
      <Radar data={data} options={options} />
    </div>
  );
}
