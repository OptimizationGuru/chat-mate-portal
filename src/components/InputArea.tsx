import React, { useRef, useState } from 'react';
import { Mic, MicOff, Send, Image as ImageIcon } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (content: string, image?: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isProcessing: boolean;
}

export function InputArea({ 
  onSendMessage, 
  isListening, 
  onToggleListening, 
  isProcessing 
}: InputAreaProps) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onSendMessage('', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-4xl mx-auto flex gap-4 items-end">
        <button
          onClick={onToggleListening}
          disabled={isProcessing}
          className={`p-2 rounded-full ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message or speak..."
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isProcessing}
          className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}