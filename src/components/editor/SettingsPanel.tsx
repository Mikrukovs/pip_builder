'use client';

import { ComponentProps } from '@/types';
import {
  HeadingSettings,
  TextSettings,
  ButtonSettings,
  InputSettings,
  SelectorSettings,
  ImageSettings,
  CellSettings,
  NavbarSettings,
  CustomSettings,
} from './settings';
import { useCustomComponentsStore } from '@/store/custom-components';

interface Props {
  config: ComponentProps;
  onChange: (props: Partial<ComponentProps>) => void;
  onRemove: () => void;
}

const componentNames: Record<string, string> = {
  heading: 'Заголовок',
  text: 'Текст',
  button: 'Кнопка',
  input: 'Поле ввода',
  selector: 'Селектор',
  image: 'Изображение',
  cell: 'Ячейка',
  navbar: 'Навбар',
  custom: 'Кастомный',
};

export function SettingsPanel({ config, onChange, onRemove }: Props) {
  const { getComponent } = useCustomComponentsStore();
  
  const getComponentName = () => {
    if (config.type === 'custom') {
      const definition = getComponent(config.componentName);
      return definition?.displayName || config.componentName;
    }
    return componentNames[config.type] || 'Компонент';
  };

  const renderSettings = () => {
    switch (config.type) {
      case 'heading':
        return <HeadingSettings config={config} onChange={onChange} />;
      case 'text':
        return <TextSettings config={config} onChange={onChange} />;
      case 'button':
        return <ButtonSettings config={config} onChange={onChange} />;
      case 'input':
        return <InputSettings config={config} onChange={onChange} />;
      case 'selector':
        return <SelectorSettings config={config} onChange={onChange} />;
      case 'image':
        return <ImageSettings config={config} onChange={onChange} />;
      case 'cell':
        return <CellSettings config={config} onChange={onChange} />;
      case 'navbar':
        return <NavbarSettings config={config} onChange={onChange} />;
      case 'custom':
        return <CustomSettings config={config} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {getComponentName()}
        </h2>
        <p className="text-sm text-gray-500">Настройки компонента</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {renderSettings()}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onRemove}
          className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg 
                     hover:bg-red-50 transition-colors"
        >
          Удалить компонент
        </button>
      </div>
    </div>
  );
}
