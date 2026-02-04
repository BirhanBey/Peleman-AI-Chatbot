import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { ChatMessage, Category, Product, CurrentUser } from '../types';
import { getTranslation, getBrowserLanguage } from '../translations';
import ChatContent from './ChatContent';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  categories: Category[];
  products: Product[];
  catalogLoaded: boolean;
  catalogError: string | null;
  isWordPress: boolean;
  isLoggedIn: boolean;
  loginUrl: string;
  onNavigateToCategory?: (category: Category) => void;
  onProductClick?: (product: Product) => void;
}

const STORAGE_KEY = 'peleman-chatbot-history';

const writeStoredState = (state: { updatedAt: number; isOpen: boolean; messages: ChatMessage[] }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

const ChatModal: React.FC<ChatModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser,
  messages,
  setMessages,
  categories,
  products,
  catalogLoaded,
  catalogError,
  isWordPress,
  isLoggedIn,
  loginUrl,
  onNavigateToCategory,
  onProductClick
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'orders' | 'invoices' | 'services'>('chat');
  const browserLang = getBrowserLanguage();
  const t = getTranslation(browserLang);
  
  // Store the initial updatedAt timestamp - only set once when component mounts
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Sync messages to localStorage when they change
  useEffect(() => {
    if (isOpen) {
      writeStoredState({
        updatedAt: sessionStartTimeRef.current,
        isOpen: false, // Modal is separate from widget's isOpen state
        messages
      });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleClearChat = () => {
    if (confirm(t.chat.clearConfirm)) {
      const welcomeText = isLoggedIn && currentUser
        ? t.welcome.loggedIn(currentUser.name)
        : t.welcome.guest;
      
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'bot',
        text: welcomeText
      };
      
      setMessages([welcomeMessage]);
      writeStoredState({
        updatedAt: Date.now(),
        isOpen: false,
        messages: [welcomeMessage]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[1200px] h-[90vh] max-h-[800px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#e0451f] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <img 
              src={window.pelemanSettings?.brandIcon || '/wp-content/plugins/peleman-chatbot/assets/favicon.png'} 
              alt="Peleman" 
              className="w-6 h-6 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
            <h3 className="font-semibold text-white">Peleman Assistant Max</h3>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'chat' && (
              <button 
                onClick={handleClearChat}
                className="hover:bg-red-800 p-1 rounded transition-colors"
                title="Clear chat history"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="hover:bg-red-800 p-1 rounded transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat' 
                  ? 'text-slate-700 border-b-2 border-red-600 bg-slate-50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'orders' 
                  ? 'text-slate-700 border-b-2 border-red-600 bg-slate-50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              My Orders
            </button>
            <button 
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'invoices' 
                  ? 'text-slate-700 border-b-2 border-red-600 bg-slate-50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              My Invoices
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'services' 
                  ? 'text-slate-700 border-b-2 border-red-600 bg-slate-50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Customer Services
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'chat' ? (
            <ChatContent
              messages={messages}
              setMessages={setMessages}
              categories={categories}
              products={products}
              catalogLoaded={catalogLoaded}
              catalogError={catalogError}
              isWordPress={isWordPress}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              loginUrl={loginUrl}
              onNavigateToCategory={onNavigateToCategory}
              onProductClick={onProductClick}
              isVisible={isOpen && activeTab === 'chat'}
            />
          ) : (
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>{activeTab === 'orders' && 'My Orders content will be added here...'}</p>
                <p>{activeTab === 'invoices' && 'My Invoices content will be added here...'}</p>
                <p>{activeTab === 'services' && 'Customer Services content will be added here...'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
