'use client';

import { useMemo } from 'react';
import { ProjectAnalytics, HeatmapPoint } from '@/types/analytics';
import { HeatmapCanvas } from './HeatmapCanvas';

interface HeatmapOverlayProps {
  analytics: ProjectAnalytics | null;
  screenId: string;
  width: number;
  height: number;
}

export function HeatmapOverlay({ analytics, screenId, width, height }: HeatmapOverlayProps) {
  const heatmapPoints = useMemo(() => {
    const screenData = analytics?.heatmapData?.[screenId];
    if (!screenData) return [];
    
    // Поддержка старого формата (массив)
    if (Array.isArray(screenData)) {
      return screenData as HeatmapPoint[];
    }
    
    // Новый формат - объединяем все зоны в один массив для overlay
    // (overlay показывает упрощённую версию без разделения по зонам)
    return [
      ...(screenData.navbar || []),
      ...(screenData.content || []),
      ...(screenData.sticky || []),
    ];
  }, [analytics, screenId]);

  if (heatmapPoints.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
        <div className="text-center p-4">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-gray-400">Нет данных для этого экрана</p>
          <p className="text-xs text-gray-300 mt-1">Откройте превью и покликайте</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      <HeatmapCanvas
        points={heatmapPoints}
        width={width}
        height={height}
        radius={30}
        blur={10}
      />
    </div>
  );
}
