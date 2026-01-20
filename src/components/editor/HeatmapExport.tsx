'use client';

import { useRef, useState, useEffect } from 'react';
import { domToPng } from 'modern-screenshot';
import { ProjectAnalytics, ZoneHeatmapData, HeatmapPoint } from '@/types/analytics';
import { Screen, Slot } from '@/types';
import { ComponentRenderer } from './ComponentRenderer';
import { HeatmapCanvas } from './HeatmapCanvas';

interface HeatmapExportProps {
  analytics: ProjectAnalytics;
  screen: Screen;
  screenName: string;
  onClose: () => void;
  embeddedComponents?: Record<string, unknown>[];
}

const PREVIEW_WIDTH = 375;

// Пустые данные зон по умолчанию
const emptyZoneData: ZoneHeatmapData = {
  navbar: [],
  content: [],
  sticky: [],
};

export function HeatmapExport({ analytics, screen, screenName, onClose, embeddedComponents }: HeatmapExportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  
  const [exporting, setExporting] = useState(false);
  const [ready, setReady] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [interfaceOpacity, setInterfaceOpacity] = useState(0.8);
  
  // Размеры зон
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(400);
  const [stickyHeight, setStickyHeight] = useState(0);

  // Получаем данные по зонам
  const zoneData: ZoneHeatmapData = analytics.heatmapData?.[screen.id] || emptyZoneData;
  
  // Проверяем старый формат данных (массив вместо объекта с зонами)
  const isOldFormat = Array.isArray(analytics.heatmapData?.[screen.id]);
  const legacyPoints: HeatmapPoint[] = isOldFormat 
    ? (analytics.heatmapData?.[screen.id] as unknown as HeatmapPoint[]) 
    : [];
  
  const hasStickyContent = screen.stickySlots && screen.stickySlots.some(slot => slot.component);
  const navbarSlot = screen.slots.find(slot => slot.component?.type === 'navbar');
  const otherSlots = screen.slots.filter(slot => slot.component?.type !== 'navbar');
  const hasNavbar = !!navbarSlot?.component;

  // Считаем общее количество кликов
  const totalClicks = isOldFormat 
    ? legacyPoints.reduce((sum, p) => sum + p.intensity, 0)
    : (zoneData.navbar.reduce((sum, p) => sum + p.intensity, 0) +
       zoneData.content.reduce((sum, p) => sum + p.intensity, 0) +
       zoneData.sticky.reduce((sum, p) => sum + p.intensity, 0));
  
  const totalPoints = isOldFormat
    ? legacyPoints.length
    : (zoneData.navbar.length + zoneData.content.length + zoneData.sticky.length);

  // Измеряем размеры зон после рендера
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight);
      }
      if (stickyRef.current) {
        setStickyHeight(stickyRef.current.offsetHeight);
      }
      setReady(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleExport = async () => {
    if (!containerRef.current) return;
    
    setExporting(true);
    try {
      const dataUrl = await domToPng(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        style: {
          // Убираем border-radius для чистого экспорта
          borderRadius: '0',
        },
      });
      
      // Скачиваем
      const link = document.createElement('a');
      link.download = `heatmap-${screenName}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Не удалось экспортировать изображение');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Экспорт тепловой карты</h3>
            <p className="text-sm text-gray-500">{screenName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Легенда и настройки */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Холодно</span>
            <div 
              className="flex-1 h-3 rounded"
              style={{ 
                background: 'linear-gradient(to right, rgb(0,0,200), rgb(0,100,255), rgb(0,255,255), rgb(0,255,0), rgb(255,255,0), rgb(255,155,0), rgb(255,0,0))' 
              }}
            />
            <span className="text-xs text-gray-600">Горячо</span>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-gray-600">Показать количество кликов</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 whitespace-nowrap">Прозрачность</span>
            <input
              type="range"
              min="0"
              max="100"
              value={interfaceOpacity * 100}
              onChange={(e) => setInterfaceOpacity(Number(e.target.value) / 100)}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-xs text-gray-500 w-8 text-right">{Math.round(interfaceOpacity * 100)}%</span>
          </div>
        </div>

        {/* Preview container */}
        <div className="flex-1 overflow-auto p-2 bg-gray-100 min-h-0">
          <div 
            ref={containerRef}
            className="relative bg-white rounded-xl overflow-hidden shadow-lg mx-auto flex flex-col"
            style={{ width: PREVIEW_WIDTH, minHeight: 580 }}
          >
            {/* Зона: Навбар */}
            {hasNavbar && navbarSlot?.component && (
              <div ref={navbarRef} className="relative bg-white flex-shrink-0">
                <div style={{ opacity: interfaceOpacity }}>
                  <ComponentRenderer 
                    config={navbarSlot.component}
                    embeddedComponents={embeddedComponents}
                  />
                </div>
                {/* Heatmap для навбара */}
                {ready && navbarHeight > 0 && zoneData.navbar.length > 0 && (
                  <HeatmapCanvas
                    points={zoneData.navbar}
                    width={PREVIEW_WIDTH}
                    height={navbarHeight}
                    radius={25}
                    blur={8}
                    showLabels={showLabels}
                  />
                )}
              </div>
            )}

            {/* Зона: Основной контент - структура должна совпадать с preview */}
            <div 
              ref={contentRef} 
              className="relative px-4 py-6 space-y-4"
            >
              {otherSlots.map((slot: Slot) => (
                slot.component && (
                  <div key={slot.id} style={{ opacity: interfaceOpacity }}>
                    <ComponentRenderer 
                      config={slot.component}
                      embeddedComponents={embeddedComponents}
                    />
                  </div>
                )
              ))}
              {/* Heatmap для контента */}
              {ready && contentHeight > 0 && (zoneData.content.length > 0 || (isOldFormat && legacyPoints.length > 0)) && (
                <HeatmapCanvas
                  points={isOldFormat ? legacyPoints : zoneData.content}
                  width={PREVIEW_WIDTH}
                  height={contentHeight}
                  radius={30}
                  blur={10}
                  showLabels={showLabels}
                />
              )}
            </div>

            {/* Зона: Sticky секция */}
            {hasStickyContent && (
              <div ref={stickyRef} className="relative border-t border-gray-200 bg-white px-4 py-3 space-y-2 flex-shrink-0">
                <div style={{ opacity: interfaceOpacity }} className="space-y-2">
                  {screen.stickySlots!.map((slot: Slot) => (
                    slot.component && (
                      <div key={slot.id}>
                        <ComponentRenderer 
                          config={slot.component}
                          embeddedComponents={embeddedComponents}
                        />
                      </div>
                    )
                  ))}
                </div>
                {/* Heatmap для sticky */}
                {ready && stickyHeight > 0 && zoneData.sticky.length > 0 && (
                  <HeatmapCanvas
                    points={zoneData.sticky}
                    width={PREVIEW_WIDTH}
                    height={stickyHeight}
                    radius={25}
                    blur={8}
                    showLabels={showLabels}
                  />
                )}
              </div>
            )}

            {/* Watermark */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded z-10">
              Prototype Builder • Heatmap
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {totalPoints > 0 
              ? `${totalClicks} кликов в ${totalPoints} точках`
              : 'Нет данных о кликах'
            }
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || !ready || totalPoints === 0}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Экспорт...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Скачать PNG
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
