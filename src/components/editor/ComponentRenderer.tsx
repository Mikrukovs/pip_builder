'use client';

import { ComponentProps } from '@/types';
import { Heading, Text, Button, Input, Selector, Image, Cell, Navbar } from '@/components/ui-kit';
import { CustomComponentRenderer } from './CustomComponentRenderer';
import { useCustomComponentsStore } from '@/store/custom-components';
import { CustomComponentDefinition } from '@/types/custom-components';

interface Props {
  config: ComponentProps;
  preview?: boolean;
  onNavigate?: (screenId: string) => void;
  onBack?: () => void;
  // Встроенные кастомные компоненты (для preview на других устройствах)
  embeddedComponents?: Record<string, unknown>[];
}

export function ComponentRenderer({ config, preview = false, onNavigate, onBack, embeddedComponents }: Props) {
  const { getComponent } = useCustomComponentsStore();

  switch (config.type) {
    case 'heading':
      return <Heading config={config} preview={preview} />;
    case 'text':
      return <Text config={config} preview={preview} />;
    case 'button':
      return <Button config={config} preview={preview} onNavigate={onNavigate} />;
    case 'input':
      return <Input config={config} preview={preview} />;
    case 'selector':
      return <Selector config={config} preview={preview} />;
    case 'image':
      return <Image config={config} preview={preview} />;
    case 'cell':
      return <Cell config={config} preview={preview} onNavigate={onNavigate} />;
    case 'navbar':
      return (
        <Navbar 
          config={config} 
          preview={preview} 
          onNavigate={onNavigate}
          onBack={onBack}
          renderComponent={(componentConfig) => (
            <ComponentRenderer
              config={componentConfig}
              preview={preview}
              onNavigate={onNavigate}
              onBack={onBack}
              embeddedComponents={embeddedComponents}
            />
          )}
        />
      );
    case 'custom': {
      // Сначала ищем в localStorage
      let definition = getComponent(config.componentName);
      
      // Если не найден и есть embedded - ищем там
      if (!definition && embeddedComponents) {
        const embedded = embeddedComponents.find(
          (c) => (c as { name: string }).name === config.componentName
        );
        if (embedded) {
          definition = embedded as unknown as CustomComponentDefinition;
        }
      }
      
      if (!definition) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            Компонент &quot;{config.componentName}&quot; не найден. Импортируйте его заново.
          </div>
        );
      }
      return (
        <CustomComponentRenderer
          definition={definition}
          props={config.props}
          preview={preview}
          onNavigate={onNavigate}
        />
      );
    }
    default:
      return null;
  }
}
