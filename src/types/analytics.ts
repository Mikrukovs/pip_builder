// Типы для аналитики превью

// Зоны интерфейса
export type ClickZone = 'navbar' | 'content' | 'sticky';

// Событие клика
export interface ClickEvent {
  id: string;
  timestamp: number;
  screenId: string;
  // Зона, в которой произошёл клик
  zone: ClickZone;
  // Координаты относительно зоны (0-1 нормализованные)
  x: number;
  y: number;
  // Абсолютные координаты в пикселях относительно зоны
  absoluteX: number;
  absoluteY: number;
  // ID компонента, если клик был по компоненту
  componentId?: string;
  componentType?: string;
}

// Время на экране
export interface ScreenTime {
  screenId: string;
  screenName: string;
  totalTime: number; // в миллисекундах
  visits: number; // количество посещений
}

// Переход между экранами
export interface ScreenTransition {
  fromScreenId: string;
  toScreenId: string;
  count: number;
}

// Сессия просмотра
export interface AnalyticsSession {
  id: string;
  projectId: string;
  startTime: number;
  endTime?: number;
  clicks: ClickEvent[];
  screenTimes: Record<string, number>; // screenId -> время в мс
  transitions: { from: string; to: string; timestamp: number }[];
}

// Точка на тепловой карте
export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
}

// Данные тепловой карты по зонам
export interface ZoneHeatmapData {
  navbar: HeatmapPoint[];
  content: HeatmapPoint[];
  sticky: HeatmapPoint[];
}

// Агрегированная аналитика по проекту
export interface ProjectAnalytics {
  projectId: string;
  sessions: AnalyticsSession[];
  // Агрегированные данные
  totalSessions: number;
  totalClicks: number;
  averageSessionDuration: number;
  // Тепловая карта по экранам и зонам
  heatmapData: Record<string, ZoneHeatmapData>;
  // Время на экранах
  screenTimes: ScreenTime[];
  // Переходы
  transitions: ScreenTransition[];
}

// Ключ для localStorage
export const ANALYTICS_STORAGE_KEY = 'prototype-analytics';

// Утилиты
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateClickId(): string {
  return `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
