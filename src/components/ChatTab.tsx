import { MessageSquare, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatTabProps {
  id: string;
  isActive: boolean;
  title: string;
  onSelect: () => void;
  onDelete: () => void;
}

export function ChatTab({ id, isActive, title, onSelect, onDelete }: ChatTabProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200",
        "hover:bg-gray-100 rounded-lg mx-2",
        isActive && "bg-gray-100"
      )}
    >
      <div className="flex items-center gap-3">
        <MessageSquare
          className={cn(
            "w-5 h-5 transition-colors duration-200",
            isActive ? "text-blue-500" : "text-gray-500"
          )}
        />
        <span
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            isActive ? "text-gray-900" : "text-gray-700"
          )}
        >
          {title}
        </span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "p-1 rounded-md transition-colors duration-200 opacity-0 group-hover:opacity-100",
              "hover:bg-gray-200"
            )}
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}