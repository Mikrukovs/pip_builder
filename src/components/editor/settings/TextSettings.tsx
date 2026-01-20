'use client';

import { TextProps } from '@/types';

interface Props {
  config: TextProps;
  onChange: (props: Partial<TextProps>) => void;
}

export function TextSettings({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Текст
        </label>
        <textarea
          value={config.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Выравнивание
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ alignment: 'left' })}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
              config.alignment === 'left'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => onChange({ alignment: 'center' })}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
              config.alignment === 'center'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
