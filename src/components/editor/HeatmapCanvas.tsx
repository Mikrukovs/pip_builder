'use client';

import { useEffect, useRef } from 'react';

interface HeatmapPoint {
  x: number; // 0-1 нормализованные координаты
  y: number;
  intensity: number;
}

interface HeatmapCanvasProps {
  points: HeatmapPoint[];
  width: number;
  height: number;
  radius?: number; // Радиус точки
  blur?: number; // Размытие
  showLabels?: boolean; // Показывать числа кликов
  globalMaxIntensity?: number; // Максимум кликов для относительной шкалы
}

export function HeatmapCanvas({ 
  points, 
  width, 
  height, 
  radius = 30,
  blur = 15,
  showLabels = false,
  globalMaxIntensity,
}: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистка
    ctx.clearRect(0, 0, width, height);

    // Используем глобальный максимум или локальный, минимум 2 для корректной шкалы
    const maxIntensity = Math.max(globalMaxIntensity || Math.max(...points.map(p => p.intensity)), 2);

    // Рисуем тепловую карту в grayscale
    // Каждая точка — это радиальный градиент от белого к чёрному
    points.forEach(point => {
      const x = point.x * width;
      const y = point.y * height;
      
      // Нормализуем интенсивность относительно максимума (1 клик = ~0, max кликов = 1)
      const normalizedIntensity = Math.min((point.intensity - 1) / (maxIntensity - 1), 1);
      
      // Интенсивность влияет на радиус и яркость
      const pointRadius = radius + normalizedIntensity * radius;
      const alpha = Math.min(0.3 + normalizedIntensity * 0.7, 1);

      // Создаём радиальный градиент
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointRadius);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Получаем данные изображения для колоризации
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Применяем цветовую палитру: синий → голубой → зелёный → жёлтый → красный
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]; // Альфа канал (интенсивность)
      
      if (alpha > 0) {
        const normalizedValue = alpha / 255; // 0-1
        const { r, g, b } = getHeatmapColor(normalizedValue);
        
        data[i] = r;     // R
        data[i + 1] = g; // G
        data[i + 2] = b; // B
        data[i + 3] = Math.min(alpha * 1.5, 220); // Немного увеличиваем видимость
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Применяем размытие
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

  }, [points, width, height, radius, blur, globalMaxIntensity]);

  if (points.length === 0) {
    return null;
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          mixBlendMode: 'multiply' 
        }}
      />
      {/* Числовые лейблы */}
      {showLabels && (
        <div 
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          {points.map((point, index) => (
            <div
              key={index}
              className="absolute flex items-center justify-center"
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div 
                className="min-w-[24px] h-6 px-1.5 rounded-full bg-black/70 
                           text-white text-xs font-bold flex items-center justify-center
                           shadow-lg border border-white/30"
              >
                {point.intensity}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Функция для получения цвета по интенсивности (0-1)
// Градиент: синий → голубой → зелёный → жёлтый → оранжевый → красный
function getHeatmapColor(value: number): { r: number; g: number; b: number } {
  // value: 0 = холодный (синий), 1 = горячий (красный)
  
  if (value < 0.2) {
    // Синий → Голубой
    const t = value / 0.2;
    return {
      r: 0,
      g: Math.round(100 * t),
      b: Math.round(200 + 55 * t),
    };
  } else if (value < 0.4) {
    // Голубой → Зелёный
    const t = (value - 0.2) / 0.2;
    return {
      r: 0,
      g: Math.round(100 + 155 * t),
      b: Math.round(255 - 255 * t),
    };
  } else if (value < 0.6) {
    // Зелёный → Жёлтый
    const t = (value - 0.4) / 0.2;
    return {
      r: Math.round(255 * t),
      g: 255,
      b: 0,
    };
  } else if (value < 0.8) {
    // Жёлтый → Оранжевый
    const t = (value - 0.6) / 0.2;
    return {
      r: 255,
      g: Math.round(255 - 100 * t),
      b: 0,
    };
  } else {
    // Оранжевый → Красный
    const t = (value - 0.8) / 0.2;
    return {
      r: 255,
      g: Math.round(155 - 155 * t),
      b: 0,
    };
  }
}
