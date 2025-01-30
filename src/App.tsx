import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { Sidebar } from './components/Sidebar';
import { Message, ChatState } from './types';
import { Bot, Mic, Menu } from 'lucide-react';
import { YumaLogo } from '../assets';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

function App() {
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', title: 'New Chat', messages: [] },
  ]);
  const [activeChat, setActiveChat] = useState('1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [state, setState] = useState<ChatState>({
    messages: [],
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    interimTranscript: '',
  });

  const recognition = useRef<SpeechRecognition | null>(null);
  const synthesis = useRef(window.speechSynthesis);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const silenceTimer = useRef<number | null>(null);
  const lastSpeechTime = useRef<number>(Date.now());

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

      // Enhanced recognition settings
      recognition.current.continuous = true; // Set to true for continuous listening
      recognition.current.interimResults = true;
      recognition.current.maxAlternatives = 1;
      recognition.current.lang = 'en-US';

      let finalTranscriptBuffer = '';

      recognition.current.onstart = () => {
        setState((prev) => ({ ...prev, isListening: true, interimTranscript: '' }));
        finalTranscriptBuffer = '';
        lastSpeechTime.current = Date.now();
      };

      recognition.current.onend = () => {
        // Restart recognition if we're still supposed to be listening
        if (state.isListening) {
          recognition.current?.start();
        } else {
          setState((prev) => ({ ...prev, isListening: false, interimTranscript: '' }));
        }
      };

      recognition.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Update last speech time when we get any result
        lastSpeechTime.current = Date.now();

        // Reset silence timer
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
        }

        // Set new silence timer
        silenceTimer.current = setTimeout(() => {
          const silenceDuration = Date.now() - lastSpeechTime.current;
          if (silenceDuration >= 10000 && state.isListening) {
            toggleListening(); // Auto-pause after 10 seconds of silence
          }
        }, 10000);

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            finalTranscriptBuffer += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setState((prev) => ({ ...prev, interimTranscript }));

        // Only send message if we have a final transcript
        if (finalTranscript) {
          // Small delay to collect more final results
          setTimeout(() => {
            if (finalTranscriptBuffer.trim()) {
              handleSendMessage(finalTranscriptBuffer.trim());
              finalTranscriptBuffer = '';
            }
          }, 1000);
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          return; // Don't stop listening on no-speech error
        }
        setState((prev) => ({
          ...prev,
          isListening: false,
          interimTranscript: '',
        }));
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (synthesis.current) {
        synthesis.current.cancel();
      }
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
    };
  }, [state.isListening]); // Added state.isListening as dependency

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSendMessage = async (content: string, image?: string) => {
    if (!content && !image) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      type: 'user',
      timestamp: new Date(),
      image,
    };

    const updatedMessages = [...state.messages, userMessage];
    
    setState((prev) => ({
      ...prev,
      messages: updatedMessages,
      isProcessing: true,
      interimTranscript: '',
    }));

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? { ...chat, messages: updatedMessages, title: content.slice(0, 20) + '...' }
          : chat
      )
    );

    try {
      const response = await new Promise<string>((resolve) =>
        setTimeout(
          () => resolve("I'm a bot response. I've received your message and/or image."),
          1000
        )
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        type: 'bot',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botMessage];

      setState((prev) => ({
        ...prev,
        messages: finalMessages,
        isProcessing: false,
      }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages: finalMessages }
            : chat
        )
      );

      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      synthesis.current.speak(utterance);
    } catch (error) {
      console.error('Error processing message:', error);
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const toggleListening = useCallback(() => {
    if (!recognition.current) return;

    if (state.isListening) {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      recognition.current.stop();
      setState((prev) => ({ ...prev, isListening: false }));
    } else {
      recognition.current.start();
      setState((prev) => ({ ...prev, isListening: true }));
    }
  }, [state.isListening]);

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChat(newChat.id);
    setState((prev) => ({ ...prev, messages: [] }));
  };

  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (activeChat === id) {
      const remainingChats = chats.filter((chat) => chat.id !== id);
      if (remainingChats.length > 0) {
        setActiveChat(remainingChats[0].id);
        setState((prev) => ({ ...prev, messages: remainingChats[0].messages }));
      } else {
        handleNewChat();
      }
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setState((prev) => ({ ...prev, messages: chat.messages }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isCollapsed={!isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b p-4 flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <img className="w-40 h-16 rounded-lg" src={YumaLogo} alt="Yuma Logo" />
          
          <div className="flex items-center gap-2 ml-auto">
            <Bot className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-semibold text-blue-700">GenAI at your Service</h1>
            {state.isListening && (
              <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-red-50 text-red-600 rounded-full animate-pulse">
                <Mic className="w-4 h-4" />
                <span className="text-sm font-medium">Mindfully Listening...</span>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-4">
            {state.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {state.isProcessing && (
              <div className="flex gap-2 p-4 text-gray-500">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            )}
            {state.interimTranscript && (
              <div className="flex gap-4 p-4 bg-blue-50">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 italic">{state.interimTranscript}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <InputArea
          onSendMessage={handleSendMessage}
          isListening={state.isListening}
          onToggleListening={toggleListening}
          isProcessing={state.isProcessing}
        />
      </div>
    </div>
  );
}

export default App;
