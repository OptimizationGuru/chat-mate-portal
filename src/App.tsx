import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, ChatState, Chat } from './types';

import {
  greetMessage,
  roles,
  roleSelectionMessage,
  startConvoMessage,
} from './lib/constants';
import ChatLayout from './components/NewChatComponent';
import getResults from './hooks/getResults';

function App() {
  const firstChatId = String(Date.now().toString());
  const [chats, setChats] = useState<Chat[]>([
    { id: firstChatId, title: 'New Chat', messages: [] },
  ]);
  const [activeChat, setActiveChat] = useState(firstChatId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showSelectoptions, setShowSelectoptions] = useState(false);
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
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTime = useRef<number>(Date.now());

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      recognition.current = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();

      // Enhanced recognition settings
      recognition.current.continuous = true; // Set to true for continuous listening
      recognition.current.interimResults = true;
      recognition.current.maxAlternatives = 1;
      recognition.current.lang = 'en-US';

      let finalTranscriptBuffer = '';

      recognition.current.onstart = () => {
        setState((prev) => ({
          ...prev,
          isListening: true,
          interimTranscript: '',
        }));
        finalTranscriptBuffer = '';
        lastSpeechTime.current = Date.now();
      };

      recognition.current.onend = () => {
        // Restart recognition if we're still supposed to be listening
        if (state.isListening) {
          recognition.current?.start();
        } else {
          setState((prev) => ({
            ...prev,
            isListening: false,
            interimTranscript: '',
          }));
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
  }, [state.isListening]);

  const handleRoleSelection = async (role: string) => {
    setUserRole(role); // Update the selected role
    setShowSelectoptions(false);
    const newMsg = `${roleSelectionMessage} ${role
      .toUpperCase()
      .replace('_', ' ')}${startConvoMessage}`;
    await sendBotMessage(newMsg);
  };

  const handleSendMessage = async (content: string, image?: string) => {
    if (!content && !image) return;

    console.log('msg sent');
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
          ? {
              ...chat,
              messages: updatedMessages,
              title: content.slice(0, 20) + '...',
            }
          : chat
      )
    );

    try {
      const { response } = await getResults();
      const { chat_id, message } = response;
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: message,
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
          chat.id === activeChat ? { ...chat, messages: finalMessages } : chat
        )
      );

      const utterance = new SpeechSynthesisUtterance(message);
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
    setUserRole(null);
    sendBotMessage(greetMessage);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const sendBotMessage = async (botMsg: string) => {
    try {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botMsg,
        type: 'bot',
        timestamp: new Date(),
      };

      const finalMessages = [...state.messages, botMessage];

      setState((prev) => ({
        ...prev,
        messages: finalMessages,
        isProcessing: false,
      }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat ? { ...chat, messages: finalMessages } : chat
        )
      );

      const utterance = new SpeechSynthesisUtterance(botMsg);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      synthesis.current.speak(utterance);
      if (!userRole) setShowSelectoptions(true);
    } catch (error) {
      console.error('Error processing message:', error);
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  useEffect(() => {
    sendBotMessage(greetMessage);
  }, []);

  return (
    <ChatLayout
      chats={chats}
      activeChat={activeChat}
      handleNewChat={handleNewChat}
      handleSelectChat={handleSelectChat}
      handleDeleteChat={handleDeleteChat}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      state={state}
      messagesEndRef={messagesEndRef}
      userRole={userRole}
      showSelectoptions={showSelectoptions}
      roles={roles}
      handleRoleSelection={handleRoleSelection}
      handleSendMessage={handleSendMessage}
      toggleListening={toggleListening}
    />
  );
}

export default App;
