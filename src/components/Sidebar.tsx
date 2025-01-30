import { Plus } from 'lucide-react';
import { ChatTab } from './ChatTab';
import { cn } from '@/lib/utils';

interface SidebarProps {
  chats: Array<{ id: string; title: string }>;
  activeChat: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isCollapsed,
  onToggle,
}: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 lg:hidden',
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={onToggle}
      />
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 flex flex-col w-72 bg-white transition-transform duration-300 ease-in-out',
          'border-r border-gray-200',
          isCollapsed && '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-blue-700">Chats</h2>
          <button
            onClick={onNewChat}
            className="p-2  bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 " />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {chats.map((chat) => (
            <ChatTab
              key={chat.id}
              id={chat.id}
              title={chat.title}
              isActive={chat.id === activeChat}
              onSelect={() => onSelectChat(chat.id)}
              onDelete={() => onDeleteChat(chat.id)}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
