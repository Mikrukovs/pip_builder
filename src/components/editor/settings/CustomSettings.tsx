'use client';

import { useState } from 'react';
import { CustomProps } from '@/types';
import { useCustomComponentsStore } from '@/store/custom-components';
import { useEditorStore } from '@/store/editor';
import { SettingDefinition } from '@/types/custom-components';
import { compressImage } from '@/utils/image';

// Компонент для загрузки изображений с автоматическим сжатием
function ImageUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.7,
      });
      onChange(compressed);
    } catch (error) {
      console.error('Failed to compress image:', error);
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="w-full h-24 bg-blue-50 rounded-lg flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : value ? (
        <div className="relative">
          <img src={value} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
          <button
            onClick={() => onChange('')}
            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : null}
      <label className="block">
        <span className="sr-only">Выбрать изображение</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50"
        />
      </label>
    </div>
  );
}

// Компактный загрузчик для элементов списка
function ItemImageUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.7,
      });
      onChange(compressed);
    } catch (error) {
      console.error('Failed to compress image:', error);
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-16 bg-blue-50 rounded-lg flex items-center justify-center">
        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <img src={value} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1">
          <label className="cursor-pointer">
            <span className="text-xs text-blue-600 hover:text-blue-700">Заменить</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <button
            onClick={() => onChange('')}
            className="text-xs text-red-500 hover:text-red-700 text-left"
          >
            Удалить
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 
                      rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
      <div className="flex items-center gap-2 text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs">Добавить фото</span>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}

interface Props {
  config: CustomProps;
  onChange: (props: Partial<CustomProps>) => void;
}

export function CustomSettings({ config, onChange }: Props) {
  const { getComponent } = useCustomComponentsStore();
  const { project } = useEditorStore();
  
  const definition = getComponent(config.componentName);
  
  if (!definition) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm">
        Компонент не найден
      </div>
    );
  }

  // Merge default props with current props
  const currentProps = { ...definition.defaultProps, ...config.props };

  const handlePropChange = (key: string, value: unknown) => {
    onChange({
      props: {
        ...config.props,
        [key]: value,
      },
    });
  };

  const renderSetting = (setting: SettingDefinition) => {
    const value = currentProps[setting.key];

    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => handlePropChange(setting.key, e.target.value)}
            placeholder={setting.placeholder}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 
                       focus:outline-none transition-colors text-sm"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={String(value || '')}
            onChange={(e) => handlePropChange(setting.key, e.target.value)}
            placeholder={setting.placeholder}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 
                       focus:outline-none transition-colors text-sm resize-none"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={Number(value) || 0}
            onChange={(e) => handlePropChange(setting.key, Number(e.target.value))}
            min={setting.min}
            max={setting.max}
            step={setting.step}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 
                       focus:outline-none transition-colors text-sm"
          />
        );

      case 'select':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => handlePropChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 
                       focus:outline-none transition-colors text-sm bg-white"
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'toggle':
        return (
          <button
            type="button"
            onClick={() => handlePropChange(setting.key, !value)}
            className={`
              relative w-11 h-6 rounded-full transition-colors
              ${value ? 'bg-blue-600' : 'bg-gray-300'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${value ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        );

      case 'color':
        return (
          <input
            type="color"
            value={String(value || '#000000')}
            onChange={(e) => handlePropChange(setting.key, e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer"
          />
        );

      case 'image':
        const imageValue = String(value || '');
        return (
          <ImageUploader
            value={imageValue}
            onChange={(newValue) => handlePropChange(setting.key, newValue)}
          />
        );

      case 'screen':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => handlePropChange(setting.key, e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 
                       focus:outline-none transition-colors text-sm bg-white"
          >
            <option value="">Не выбрано</option>
            {project?.screens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                {screen.name}
              </option>
            ))}
          </select>
        );

      case 'items':
        const items = (value as Record<string, unknown>[]) || [];
        
        // Функция для обновления поля элемента
        const updateItemField = (index: number, fieldKey: string, fieldValue: unknown) => {
          const newItems = [...items];
          newItems[index] = {
            ...newItems[index],
            [fieldKey]: fieldValue,
          };
          handlePropChange(setting.key, newItems);
        };

        // Рендер поля в зависимости от типа
        const renderItemField = (item: Record<string, unknown>, index: number, field: { key: string; label: string; type: string }) => {
          const fieldValue = item[field.key];
          
          switch (field.type) {
            case 'image':
              return (
                <ItemImageUploader
                  value={String(fieldValue || '')}
                  onChange={(newValue) => updateItemField(index, field.key, newValue)}
                />
              );
            
            case 'number':
              return (
                <input
                  type="number"
                  value={Number(fieldValue) || 0}
                  onChange={(e) => updateItemField(index, field.key, Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded border border-gray-200 
                            focus:border-blue-500 focus:outline-none text-sm"
                />
              );
            
            case 'textarea':
              return (
                <textarea
                  value={String(fieldValue || '')}
                  onChange={(e) => updateItemField(index, field.key, e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 rounded border border-gray-200 
                            focus:border-blue-500 focus:outline-none text-sm resize-none"
                />
              );
            
            default: // text
              return (
                <input
                  type="text"
                  value={String(fieldValue || '')}
                  onChange={(e) => updateItemField(index, field.key, e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-gray-200 
                            focus:border-blue-500 focus:outline-none text-sm"
                />
              );
          }
        };

        return (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Элемент {index + 1}
                  </span>
                  <button
                    onClick={() => {
                      const newItems = items.filter((_, i) => i !== index);
                      handlePropChange(setting.key, newItems);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Удалить
                  </button>
                </div>
                {setting.itemFields?.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.label}
                    </label>
                    {renderItemField(item, index, field)}
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={() => {
                const newItem: Record<string, unknown> = {};
                setting.itemFields?.forEach((field) => {
                  newItem[field.key] = field.type === 'number' ? 0 : '';
                });
                handlePropChange(setting.key, [...items, newItem]);
              }}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg
                        text-gray-500 hover:border-blue-500 hover:text-blue-600 
                        transition-colors text-sm"
            >
              + Добавить элемент
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {definition.settings.map((setting) => (
        <div key={setting.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {setting.label}
          </label>
          {renderSetting(setting)}
        </div>
      ))}
    </div>
  );
}
