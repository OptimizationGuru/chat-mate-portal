export interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  image?: string;
}

export interface ChatState {
  messages: Message[];
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export interface PostBody {
  chatId: string;
  role: string;
  textContent?: string;
  imgTextContent?: string;
  voiceTextContent?: string;
}
