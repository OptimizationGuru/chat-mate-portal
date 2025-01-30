import { Bot, Menu, Mic } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import RoleSelection from './RoleSelection';
import { Sidebar } from './Sidebar';
import { InputArea } from './InputArea';
import { Chat, ChatState, Role } from '../types';
import { YumaLogo } from '@/assets';

interface ChatContainerProps {
  state: ChatState;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  userRole: string | null;
  showSelectoptions: boolean;
  roles: Role[];
  handleRoleSelection: (role: string) => void;
}

const ChatContainer = ({
  state,
  messagesEndRef,
  userRole,
  showSelectoptions,
  roles,
  handleRoleSelection,
}: ChatContainerProps) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto py-8 px-4 my-1 rounded-lg">
        {state.messages.map((message) => (
          <ChatMessage
            key={message.id + Math.floor(Math.random() * 5000)}
            message={message}
          />
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

        {!userRole && showSelectoptions && (
          <RoleSelection roles={roles} onSelectRole={handleRoleSelection} />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

interface ChatLayoutProps {
  chats: Chat[];
  selectedChat: number;
  activeChat: string;
  handleNewChat: () => void;
  handleSelectChat: (id: string) => void;
  handleDeleteChat: (id: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  state: ChatState[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  userRole: string | null;
  showSelectoptions: boolean;
  roles: Role[];
  handleRoleSelection: (role: string) => void;
  handleSendMessage: (content: string, image?: string) => void;
  toggleListening: () => void;
}

const ChatLayout = ({
  chats,
  selectedChat,
  activeChat,
  handleNewChat,
  handleSelectChat,
  handleDeleteChat,
  isSidebarOpen,
  setIsSidebarOpen,
  state,
  messagesEndRef,
  userRole,
  showSelectoptions,
  roles,
  handleRoleSelection,
  handleSendMessage,
  toggleListening,
}: ChatLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isCollapsed={!isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b p-4 flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-8 h-8" />
          </button>
          <img
            className="w-40 h-16 rounded-lg"
            src={YumaLogo}
            alt="Yuma Logo"
          />

          <div className="flex items-center gap-2 ml-auto">
            <Bot className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-semibold text-blue-700">
              GenAI at your Service
            </h1>
            {state[selectedChat]?.isListening && (
              <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-red-50 text-blue-600 rounded-full animate-pulse">
                <Mic className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Mindfully Listening...
                </span>
              </div>
            )}
          </div>
        </header>

        <ChatContainer
          state={state[selectedChat]}
          messagesEndRef={messagesEndRef}
          userRole={userRole}
          showSelectoptions={showSelectoptions}
          roles={roles}
          handleRoleSelection={handleRoleSelection}
        />

        {userRole && (
          <InputArea
            onSendMessage={handleSendMessage}
            isListening={state[selectedChat]?.isListening}
            onToggleListening={toggleListening}
            isProcessing={state[selectedChat]?.isProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
