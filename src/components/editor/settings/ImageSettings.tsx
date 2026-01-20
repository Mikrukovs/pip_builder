'use client';

import { ImageProps } from '@/types';
import { useRef, useState } from 'react';
import { compressImage, getBase64Size, formatSize } from '@/utils/image';

interface Props {
  config: ImageProps;
  onChange: (props: Partial<ImageProps>) => void;
}

export function ImageSettings({ config, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Сжимаем изображение до 800x800 и качества 70%
      const compressed = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7,
      });
      onChange({ src: compressed });
    } catch (error) {
      console.error('Failed to compress image:', error);
      // Fallback: загружаем без сжатия
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ src: reader.result as string });
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Изображение
        </label>
        
        {loading ? (
          <div className="w-full aspect-video border-2 border-dashed border-blue-300 rounded-lg 
                         flex flex-col items-center justify-center gap-2 bg-blue-50">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-sm text-blue-600">Сжатие изображения...</span>
          </div>
        ) : config.src ? (
          <div className="relative">
            <img
              src={config.src}
              alt={config.alt}
              className="w-full rounded-lg object-cover"
            />
            <button
              onClick={() => onChange({ src: '' })}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              {formatSize(getBase64Size(config.src))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg 
                       flex flex-col items-center justify-center gap-2 
                       hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600">Нажмите для загрузки</span>
            <span className="text-xs text-gray-400">Автоматическое сжатие</span>
          </button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alt текст
        </label>
        <input
          type="text"
          value={config.alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
