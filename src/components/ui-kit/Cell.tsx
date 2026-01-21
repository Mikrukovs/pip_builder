'use client';

import { CellProps } from '@/types';
import { useState, useId } from 'react';

interface Props {
  config: CellProps;
  preview?: boolean;
  onNavigate?: (screenId: string) => void;
}

export function Cell({ config, preview, onNavigate }: Props) {
  const [isToggled, setIsToggled] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const radioId = useId();

  const renderIcon = () => {
    if (!config.icon) {
      return (
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }

    return (
      <img
        src={config.icon}
        alt="icon"
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
      />
    );
  };

  const renderContent = () => {
    if (config.subtitlePosition === 'top' && config.showSubtitle) {
      return (
        <>
          <span className="text-sm text-gray-500">{config.subtitle}</span>
          <span className="font-medium text-gray-900">{config.title}</span>
        </>
      );
    }

    return (
      <>
        <span className="font-medium text-gray-900">{config.title}</span>
        {config.showSubtitle && (
          <span className="text-sm text-gray-500">{config.subtitle}</span>
        )}
      </>
    );
  };

  // Рендер правой части в зависимости от типа
  const renderRightControl = () => {
    switch (config.cellType) {
      case 'navigation':
        return (
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );

      case 'toggle':
        return (
          <button
            type="button"
            onClick={() => {
              if (preview) setIsToggled(!isToggled);
            }}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              isToggled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isToggled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        );

      case 'checkbox':
        return (
          <button
            type="button"
            onClick={() => {
              if (preview) setIsChecked(!isChecked);
            }}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              isChecked 
                ? 'bg-blue-600 border-blue-600' 
                : 'border-gray-300 bg-white'
            }`}
          >
            {isChecked && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );

      case 'radio':
        return (
          <label className="relative w-6 h-6 flex-shrink-0 cursor-pointer">
            <input
              type="radio"
              name={config.radioGroup || 'default'}
              id={radioId}
              disabled={!preview}
              className="peer sr-only"
            />
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center transition-colors peer-checked:border-blue-600">
              <div className="w-3 h-3 rounded-full bg-blue-600 scale-0 transition-transform peer-checked:scale-100" />
            </div>
          </label>
        );

      case 'info':
        return (
          <span className="font-medium text-gray-900 flex-shrink-0">
            {config.infoValue || '—'}
          </span>
        );

      case 'icon':
        return config.rightIcon ? (
          <img
            src={config.rightIcon}
            alt=""
            className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );

      case 'basic':
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (!preview) return;
    
    if (config.cellType === 'navigation' && config.action === 'navigate' && config.targetScreenId && onNavigate) {
      onNavigate(config.targetScreenId);
    } else if (config.cellType === 'toggle') {
      setIsToggled(!isToggled);
    } else if (config.cellType === 'checkbox') {
      setIsChecked(!isChecked);
    }
    // Radio обрабатывается нативно через input type="radio"
  };

  const isClickable = preview && (
    config.cellType === 'navigation' || 
    config.cellType === 'toggle' || 
    config.cellType === 'checkbox'
  );
  
  // Radio кликабельна, но через label, а не через div
  const isRadioClickable = preview && config.cellType === 'radio';

  // Проверяем showIcon (для обратной совместимости, если undefined - показываем)
  const shouldShowIcon = config.showIcon !== false;

  // Для radio делаем всю ячейку label
  if (config.cellType === 'radio') {
    return (
      <label 
        htmlFor={radioId}
        className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 transition-colors ${
          isRadioClickable ? 'cursor-pointer hover:border-gray-300 active:bg-gray-50' : ''
        }`}
      >
        {shouldShowIcon && renderIcon()}
        <div className="flex flex-col flex-1 min-w-0">
          {renderContent()}
        </div>
        {renderRightControl()}
      </label>
    );
  }

  return (
    <div 
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 transition-colors ${
        isClickable ? 'cursor-pointer hover:border-gray-300 active:bg-gray-50' : ''
      }`}
      onClick={handleClick}
    >
      {shouldShowIcon && renderIcon()}
      <div className="flex flex-col flex-1 min-w-0">
        {renderContent()}
      </div>
      {renderRightControl()}
    </div>
  );
}
