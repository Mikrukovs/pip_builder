'use client';

import { SelectorProps } from '@/types';
import { useState } from 'react';

interface Props {
  config: SelectorProps;
  preview?: boolean;
}

export function Selector({ config, preview }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-full space-y-2">
      {config.items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => preview && setSelectedId(item.id)}
          className={`
            w-full px-4 py-3 rounded-lg border text-left transition-all duration-150
            ${selectedId === item.id
              ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600'
              : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${selectedId === item.id ? 'border-blue-600' : 'border-gray-400'}
            `}>
              {selectedId === item.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              )}
            </div>
            <span className="font-medium">{item.text}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
