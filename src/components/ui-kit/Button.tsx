'use client';

import { ButtonProps } from '@/types';

interface Props {
  config: ButtonProps;
  preview?: boolean;
  onNavigate?: (screenId: string) => void;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const sizeStyles = {
  s: 'px-3 py-1.5 text-sm',
  m: 'px-4 py-2 text-base',
  l: 'px-6 py-3 text-lg',
};

export function Button({ config, preview, onNavigate }: Props) {
  const handleClick = () => {
    if (preview && config.action === 'navigate' && config.targetScreenId && onNavigate) {
      onNavigate(config.targetScreenId);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        w-full font-medium rounded-lg transition-colors duration-150 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${variantStyles[config.variant]}
        ${sizeStyles[config.size]}
      `}
    >
      {config.label}
    </button>
  );
}
