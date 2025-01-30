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
  const [selectedChat, setSelectedChat] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showSelectoptions, setShowSelectoptions] = useState(false);

  const [state, setState] = useState<ChatState[]>([
    {
      id: activeChat,
      messages: [],
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      interimTranscript: '',
    },
  ]);

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
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.maxAlternatives = 1;
      recognition.current.lang = 'en-US';

      let finalTranscriptBuffer = '';

      recognition.current.onstart = () => {
        setState((prevState) => {
          if (!Array.isArray(prevState)) return prevState; // Ensure prevState is an array
          return prevState.map((chat) =>
            chat.id === activeChat
              ? { ...chat, isListening: true, interimTranscript: '' }
              : chat
          );
        });
        finalTranscriptBuffer = '';
        lastSpeechTime.current = Date.now();
      };

      recognition.current.onend = () => {
        // Restart recognition if we're still supposed to be listening
        setState((prevState) => {
          if (!Array.isArray(prevState)) return prevState; // Ensure prevState is an array
          return prevState.map((chat) =>
            chat.id === activeChat
              ? {
                  ...chat,
                  isListening: false,
                  interimTranscript: '',
                }
              : chat
          );
        });

        if (state.some((chat) => chat.id === activeChat && chat.isListening)) {
          recognition.current?.start();
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
          if (
            silenceDuration >= 10000 &&
            state.some((chat) => chat.id === activeChat && chat.isListening)
          ) {
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

        setState((prevState) => {
          if (!Array.isArray(prevState)) return prevState; // Ensure prevState is an array
          return prevState.map((chat) =>
            chat.id === activeChat ? { ...chat, interimTranscript } : chat
          );
        });

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
          return;
        }

        setState((prevState) => {
          if (!Array.isArray(prevState)) return prevState; // Ensure prevState is an array
          return prevState.map((chat) =>
            chat.id === activeChat
              ? { ...chat, isListening: false, interimTranscript: '' }
              : chat
          );
        });
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (synthesis.current) {
        synthesis?.current.cancel();
      }
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
    };
  }, [activeChat, state]);

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

    const userMessage: Message = {
      id: String(Date.now().toString() + Math.floor(Math.random() * 1000)),
      content,
      type: 'user',
      timestamp: new Date(),
      image,
    };

    // speakText(content);

    console.log(userMessage, 'userMessage');
    const updatedMessages = [...state[selectedChat].messages, userMessage];

    setState((prev) => {
      if (Array.isArray(prev)) {
        return prev.map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: updatedMessages,
                isProcessing: true,
                interimTranscript: '',
              }
            : chat
        );
      } else {
        // If prev is not an array, you can return a fallback state
        return [];
      }
    });

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: updatedMessages,
              title:
                chat.title === 'New Chat'
                  ? content.slice(content.length >= 10 ? 5 : 0, 20) + '...'
                  : chat.title,
            }
          : chat
      )
    );

    try {
      const body = {
        role: userRole,
        user_text: image ? '' : userMessage.content,
        image_text: image ? userMessage.content : '',
        chat_id: activeChat,
      };
      const { response } = await getResults(body);
      const { chat_id, message } = response;
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: message,
        type: 'bot',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botMessage];

      setState((prev) => {
        return prev.map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: finalMessages,
                isProcessing: false,
                isListening: false,
              }
            : chat
        );
      });

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat ? { ...chat, messages: finalMessages } : chat
        )
      );
      // speakText(message);
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      synthesis.current.speak(utterance);
    } catch (error) {
      console.error('Error processing message:', error);
      setState((prev) =>
        prev.map(
          (chat) =>
            chat.id === activeChat
              ? { ...chat, isProcessing: false } // Update only the chat that matches activeChat
              : chat // Keep other chats unchanged
        )
      );
    }
  };

  const toggleListening = useCallback(() => {
    if (!recognition.current) return;

    setState((prevState) => {
      return prevState.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              isListening: !chat.isListening, // Toggle the listening state
            }
          : chat
      );
    });

    // Use a timeout to check the updated state after setState is done
    setTimeout(() => {
      setState((prevState) => {
        const activeChatState = prevState.find(
          (chat) => chat.id === activeChat
        );
        if (activeChatState?.isListening) {
          // Start recognition if activeChat is listening
          recognition.current.start();
        } else {
          // Stop recognition if activeChat is not listening
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
          }
          recognition.current.stop();
        }

        return prevState; // Return the updated state array
      });
    }, 0);
  }, [activeChat]);

  const handleNewChat = () => {
    const newChat = {
      id: String(Date.now().toString() + Math.floor(Math.random() * 1500)),
      title: 'New Chat',
      messages: [] as Message[],
    };

    // Update the chats state by adding the new chat
    setChats((prev) => {
      const updatedChats = [...prev, newChat];
      const newState = {
        id: newChat.id,
        messages: [],
        isListening: false,
        isProcessing: false,
        isSpeaking: false,
        interimTranscript: '',
      };

      // Update the state to include the new chat's state
      setState((prevState) => [...prevState, newState]);

      return updatedChats;
    });

    // Set the active chat to the newly added chat
    setActiveChat(newChat.id);

    // Get the index of the newly added chat (it's the last chat in the array)
    const idx = chats.length; // Since it's added at the end, the index is simply chats.length - 1
    setSelectedChat(idx);

    // Set the user role to null and send a greeting message
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
    const idx = chats.indexOf(chat);
    setSelectedChat(idx);
  };

  // const speakText = (text: string) => {
  //   if (text && 'speechSynthesis' in window) {
  //     const utterance = new SpeechSynthesisUtterance(text);

  //     utterance.onstart = () => {
  //       console.log('Speech started...');
  //     };

  //     utterance.onend = () => {
  //       console.log('Speech ended.');
  //     };

  //     utterance.onerror = (event) => {
  //       console.error('Speech synthesis error:', event);
  //     };

  //     speechSynthesis.speak(utterance);
  //   } else {
  //     console.error('Speech synthesis is not supported or text is empty.');
  //   }
  // };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const sendBotMessage = async (botMsg: string) => {
    try {
      const botMessage: Message = {
        id: activeChat,
        content: botMsg,
        type: 'bot',
        timestamp: new Date(),
      };

      const activeState = state[selectedChat];
      const finalMessages = [...activeState.messages, botMessage];

      setState((prev) => {
        const updatedState = prev.map((chat) =>
          chat.id === activeChat
            ? { ...chat, messages: finalMessages, isProcessing: false } // Update matching chat
            : chat
        );

        return updatedState;
      });

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
    const messages = [...chats];
    sendBotMessage(greetMessage);
  }, []);

  return (
    <>
      <ChatLayout
        chats={chats}
        selectedChat={selectedChat}
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
    </>
  );
}

export default App;
