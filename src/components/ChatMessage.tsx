import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.type === 'bot';
  
  return (
    <div className={`flex gap-4 p-4 ${isBot ? 'bg-gray-50' : 'bg-white'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isBot ? 'bg-green-500' : 'bg-blue-500'
      }`}>
        {isBot ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
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
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}