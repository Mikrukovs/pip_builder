'use client';

import { ImageProps } from '@/types';

interface Props {
  config: ImageProps;
  preview?: boolean;
}

export function Image({ config }: Props) {
  if (!config.src) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400 flex flex-col items-center gap-2">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Изображение не загружено</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={config.src}
      alt={config.alt}
      className="w-full rounded-lg object-cover"
    />
  );
}
