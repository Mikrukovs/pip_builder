'use client';

import { SelectorProps } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  config: SelectorProps;
  onChange: (props: Partial<SelectorProps>) => void;
}

export function SelectorSettings({ config, onChange }: Props) {
  const addItem = () => {
    onChange({
      items: [...config.items, { id: uuidv4(), text: `Вариант ${config.items.length + 1}` }],
    });
  };

  const removeItem = (id: string) => {
    if (config.items.length <= 1) return;
    onChange({
      items: config.items.filter((item) => item.id !== id),
    });
  };

  const updateItem = (id: string, text: string) => {
    onChange({
      items: config.items.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Варианты ({config.items.length})
        </label>
        <button
          onClick={addItem}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Добавить
        </button>
      </div>

      <div className="space-y-2">
        {config.items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => removeItem(item.id)}
              disabled={config.items.length <= 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
