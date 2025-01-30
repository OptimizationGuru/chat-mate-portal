import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';
import { YumaBot } from '@/assets';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.type === 'bot';

  return (
    <div
      className={`w-full flex my-1 gap-4 p-2 border border-gray-200 rounded-xl  ${isBot ? 'bg-gray-50' : 'bg-white'}`}
    >
      <div
        className={`w-9 h-9 mt-1 rounded-full flex items-center justify-center ${
          isBot ? 'bg-gray-200 p-1' : 'bg-blue-500'
        }`}
      >
        {isBot ? (
          <img src={YumaBot} alt="yuma-logo" className="rounded-full" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1">
        <div className="prose">
          {message.image && (
            <img
              src={message.image}
              alt="User uploaded"
              className="max-w-sm rounded-lg mb-2"
            />
          )}
          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
