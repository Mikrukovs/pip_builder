'use client';

import { InputProps } from '@/types';
import { useState, useRef, useEffect, useId } from 'react';
import { useFormValidation } from '@/contexts/FormValidationContext';

interface Props {
  config: InputProps;
  preview?: boolean;
  onNavigate?: (screenId: string) => void;
}

export function Input({ config, preview, onNavigate }: Props) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSearchTabId, setActiveSearchTabId] = useState<string | null>(
    config.searchTabs?.[0]?.id || null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLButtonElement>(null);
  const inputId = useId();
  const formValidation = useFormValidation();
  const registerInput = formValidation?.registerInput;
  const unregisterInput = formValidation?.unregisterInput;

  // Регистрация/отмена регистрации инпута в контексте валидации
  useEffect(() => {
    if (registerInput && unregisterInput && preview) {
      registerInput(inputId, config.validation.enabled, inputRef);
      return () => unregisterInput(inputId);
    }
  }, [registerInput, unregisterInput, inputId, config.validation.enabled, preview]);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Валидация значения
  const validate = (): { isValid: boolean | null; message: string | null } => {
    if (!config.validation.enabled || !touched || !value) {
      return { isValid: null, message: null };
    }

    const { type, exactValue, min, max, errorMessage, successMessage } = config.validation;

    if (type === 'exact') {
      if (value === exactValue) {
        return { isValid: true, message: successMessage || null };
      }
      return { isValid: false, message: errorMessage || null };
    }

    if (type === 'range') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return { isValid: false, message: errorMessage || 'Введите число' };
      }

      const hasMin = min !== null && min !== undefined;
      const hasMax = max !== null && max !== undefined;

      if (hasMin && hasMax) {
        if (numValue >= min && numValue <= max) {
          return { isValid: true, message: successMessage || null };
        }
        return { isValid: false, message: errorMessage || `Значение должно быть от ${min} до ${max}` };
      } else if (hasMin) {
        if (numValue >= min) {
          return { isValid: true, message: successMessage || null };
        }
        return { isValid: false, message: errorMessage || `Значение должно быть не менее ${min}` };
      } else if (hasMax) {
        if (numValue <= max) {
          return { isValid: true, message: successMessage || null };
        }
        return { isValid: false, message: errorMessage || `Значение должно быть не более ${max}` };
      }
    }

    return { isValid: null, message: null };
  };

  const { isValid, message } = validate();

  // Обновляем состояние валидации в контексте
  const updateValidation = formValidation?.updateValidation;
  useEffect(() => {
    if (updateValidation && preview && config.validation.enabled) {
      updateValidation(inputId, isValid, touched);
    }
  }, [updateValidation, inputId, isValid, touched, preview, config.validation.enabled]);

  // Определяем вид инпута (для обратной совместимости)
  const variant = config.inputVariant || 'default';

  const getInputClasses = () => {
    const baseClasses = `
      w-full py-2 rounded-lg border transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-0
      ${isValid === true 
        ? 'border-green-500 focus:ring-green-500 bg-green-50' 
        : isValid === false 
          ? 'border-red-500 focus:ring-red-500 bg-red-50' 
          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
      }
      ${config.inputType === 'numeric' ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}
    `;

    // Разные padding в зависимости от варианта
    if (variant === 'search') {
      return `${baseClasses} pl-10 pr-3`; // Место для иконки слева
    }
    if (variant === 'dropdown') {
      return `${baseClasses} pl-3 pr-10 cursor-pointer`; // Место для стрелки справа
    }
    if (variant === 'password') {
      return `${baseClasses} pl-3 pr-10`; // Место для глазика справа
    }
    return `${baseClasses} px-3`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (config.inputType === 'numeric') {
      if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
        setValue(newValue);
      }
    } else {
      setValue(newValue);
    }
  };

  const handleDropdownSelect = (option: { id: string; label: string }) => {
    setValue(option.label);
    setDropdownOpen(false);
    setTouched(true);
  };

  const getDescriptor = () => {
    if (message) {
      return message;
    }
    return config.descriptor;
  };

  const descriptorText = getDescriptor();

  // Иконка поиска
  const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  // Иконка стрелки для dropdown
  const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg 
      className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  // Иконки глаза для password
  const EyeIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  // Фильтрованные опции для поиска (dropdown режим)
  const filteredOptions = variant === 'search' && config.searchMode !== 'inline' && config.dropdownOptions
    ? config.dropdownOptions.filter(opt => 
        opt.label.toLowerCase().includes(value.toLowerCase())
      )
    : config.dropdownOptions || [];

  // Фильтрованные ячейки для inline режима
  const getFilteredCells = () => {
    if (variant !== 'search' || config.searchMode !== 'inline') return [];
    
    const cells = config.searchCells || [];
    const searchQuery = value.toLowerCase().trim();
    
    return cells.filter(cell => {
      // Фильтр по табу
      if (activeSearchTabId && !cell.tabIds.includes(activeSearchTabId)) {
        // Если таб "Все" (первый) — показываем всё
        const isAllTab = config.searchTabs?.[0]?.id === activeSearchTabId;
        if (!isAllTab) return false;
      }
      
      // Фильтр по тексту
      if (searchQuery) {
        const matchesTitle = cell.title.toLowerCase().includes(searchQuery);
        const matchesSubtitle = cell.subtitle.toLowerCase().includes(searchQuery);
        return matchesTitle || matchesSubtitle;
      }
      
      return true;
    });
  };

  const filteredCells = getFilteredCells();
  const isInlineSearch = variant === 'search' && config.searchMode === 'inline';
  const searchTabs = config.searchTabs || [];

  return (
    <div className="w-full" ref={containerRef}>
      {config.showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {config.label}
        </label>
      )}
      
      <div className="relative">
        {/* Поисковая иконка слева */}
        {variant === 'search' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </div>
        )}

        {/* Сам инпут или кнопка для dropdown */}
        {variant === 'dropdown' ? (
          <button
            ref={inputRef as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={() => preview && setDropdownOpen(!dropdownOpen)}
            className={`${getInputClasses()} w-full text-left bg-white ${!value ? 'text-gray-400' : 'text-gray-900'}`}
          >
            {value || config.placeholder}
          </button>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={variant === 'password' && !showPassword ? 'password' : 'text'}
            inputMode={config.inputType === 'numeric' ? 'decimal' : 'text'}
            placeholder={config.placeholder}
            value={value}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            onFocus={() => variant === 'search' && value && setDropdownOpen(true)}
            className={getInputClasses()}
            readOnly={!preview}
          />
        )}

        {/* Иконки справа */}
        {variant === 'dropdown' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronIcon open={dropdownOpen} />
          </div>
        )}

        {variant === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}

        {/* Dropdown list (только для dropdown режима) */}
        {(variant === 'dropdown' || (variant === 'search' && config.searchMode !== 'inline')) && dropdownOpen && filteredOptions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleDropdownSelect(option)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                  value === option.label ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inline search: табы и результаты */}
      {isInlineSearch && (
        <div className="mt-3">
          {/* Табы-категории */}
          {searchTabs.length > 1 && (
            <div className="overflow-x-auto scrollbar-hide mb-3">
              <div className="flex gap-2 min-w-max">
                {searchTabs.map((tab) => {
                  const isActive = activeSearchTabId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => preview && setActiveSearchTabId(tab.id)}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                        transition-all duration-150
                        ${isActive
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      {tab.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Результаты (ячейки) */}
          <div className="space-y-2">
            {filteredCells.length > 0 ? (
              filteredCells.map((cell) => (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => {
                    if (preview && cell.action === 'navigate' && cell.targetScreenId && onNavigate) {
                      onNavigate(cell.targetScreenId);
                    }
                  }}
                  className="w-full flex items-center gap-3 py-2.5 bg-white rounded-lg 
                             hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  {/* Иконка */}
                  {cell.icon ? (
                    <img
                      src={cell.icon}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{cell.title}</p>
                    {cell.showSubtitle && cell.subtitle && (
                      <p className="text-sm text-gray-500 truncate">{cell.subtitle}</p>
                    )}
                  </div>

                  {/* Стрелка навигации */}
                  {cell.action === 'navigate' && (
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))
            ) : value ? (
              <div className="text-center py-6 text-gray-500">
                <p>Ничего не найдено</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {descriptorText && (
        <p className={`mt-1 text-sm ${
          isValid === true 
            ? 'text-green-600' 
            : isValid === false 
              ? 'text-red-600' 
              : 'text-gray-500'
        }`}>
          {descriptorText}
        </p>
      )}
    </div>
  );
}
