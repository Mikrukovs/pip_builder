'use client';

interface CollaborationIndicatorProps {
  isConnected: boolean;
  activeUsers: number;
}

export function CollaborationIndicator({ isConnected, activeUsers }: CollaborationIndicatorProps) {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <span>Оффлайн</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span>
        {activeUsers > 1 ? `${activeUsers} участников онлайн` : 'Онлайн'}
      </span>
    </div>
  );
}
