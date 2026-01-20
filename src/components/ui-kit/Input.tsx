'use client';

import { InputProps } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface Props {
  config: InputProps;
  preview?: boolean;
}

export function Input({ config, preview }: Props) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Фильтрованные опции для поиска
  const filteredOptions = variant === 'search' && config.dropdownOptions
    ? config.dropdownOptions.filter(opt => 
        opt.label.toLowerCase().includes(value.toLowerCase())
      )
    : config.dropdownOptions || [];

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
            type="button"
            onClick={() => preview && setDropdownOpen(!dropdownOpen)}
            className={`${getInputClasses()} w-full text-left bg-white ${!value ? 'text-gray-400' : 'text-gray-900'}`}
          >
            {value || config.placeholder}
          </button>
        ) : (
          <input
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

        {/* Dropdown list */}
        {(variant === 'dropdown' || variant === 'search') && dropdownOpen && filteredOptions.length > 0 && (
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
