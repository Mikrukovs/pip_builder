'use client';

import { TabsProps } from '@/types';

interface Props {
  config: TabsProps;
  preview?: boolean;
  activeTabId?: string | null;
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ config, preview, activeTabId, onTabChange }: Props) {
  const currentTabId = activeTabId || config.items[config.defaultTabIndex]?.id || config.items[0]?.id;

  const handleTabClick = (tabId: string) => {
    if (preview && onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max pb-1">
        {config.items.map((item) => {
          const isActive = currentTabId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-150
                ${isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }
              `}
            >
              {item.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
