'use client';

import { Slot as SlotType } from '@/types';
import { ComponentRenderer } from './ComponentRenderer';

interface Props {
  slot: SlotType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  index: number;
}

export function Slot({ slot, isSelected, onSelect, index }: Props) {
  return (
    <div
      onClick={(e) => onSelect(e)}
      className={`
        relative min-h-[60px] rounded-lg border-2 transition-all duration-150 cursor-pointer
        ${isSelected
          ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/20'
          : slot.component
            ? 'border-gray-200 bg-white hover:border-gray-300'
            : 'border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30'
        }
      `}
    >
      {/* Номер слота */}
      <div className={`
        absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-medium
        flex items-center justify-center z-10
        ${isSelected 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-600'
        }
      `}>
        {index + 1}
      </div>

      {slot.component ? (
        <div className="p-4">
          <ComponentRenderer config={slot.component} />
        </div>
      ) : (
        <div className="p-4 flex items-center justify-center">
          <div className="text-gray-400 flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">Добавить компонент</span>
          </div>
        </div>
      )}
    </div>
  );
}
