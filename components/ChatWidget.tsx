import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Trash2 } from 'lucide-react';
import { ChatMessage, Category, Product } from '../types';
import { fetchCatalog } from '../services/catalog';
import { CATEGORIES, PRODUCTS } from '../data/mockData';
import { getConfig } from '../config';
import { getBrowserLanguage, getTranslation } from '../translations';
import ChatModal from './ChatModal';
import ChatContent from './ChatContent';

// Resize icon component
const ResizeIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M6.995,10.852 L5.133,9.008 L2.107,11.988 L0.062,9.972 L0.062,15.875 L6.049,15.875 L3.973,13.828 L6.995,10.852 Z" 
      fill="currentColor"
    />
    <path 
      d="M9.961,0.00800000003 L12.058,2.095 L9.005,5.128 L10.885,7.008 L13.942,3.97 L15.909,5.966 L15.909,0.00800000003 L9.961,0.00800000003 Z" 
      fill="currentColor"
    />
  </svg>
);

interface ChatWidgetProps {
  // Updated prop to accept the full Category object
  onNavigateToCategory: (category: Category) => void;
}

const STORAGE_KEY = 'peleman-chatbot-history';
const HISTORY_TTL_MS = 20 * 60 * 1000;

type StoredChatState = {
  updatedAt: number;
  isOpen: boolean;
  messages: ChatMessage[];
};

const readStoredState = (): StoredChatState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChatState;
    if (!parsed || typeof parsed.updatedAt !== 'number') return null;
    if (Date.now() - parsed.updatedAt > HISTORY_TTL_MS) return null;
    if (!Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredState = (state: StoredChatState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};


const ChatWidget: React.FC<ChatWidgetProps> = ({ onNavigateToCategory }) => {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = readStoredState();
    return stored ? stored.isOpen : false;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  
  const config = getConfig();
  const { isWordPress, isLoggedIn, currentUser, loginUrl } = config;
  const browserLang = getBrowserLanguage();
  const t = getTranslation(browserLang);

  const getWelcomeMessage = (): ChatMessage => {
    const welcomeText = isLoggedIn && currentUser
      ? t.welcome.loggedIn(currentUser.name)
      : t.welcome.guest;
    
    return {
      id: 'welcome',
      sender: 'bot',
      text: welcomeText
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = readStoredState();
    if (stored && stored.messages.length > 0) {
      // Check if first message is welcome message and update it if needed
      const firstMsg = stored.messages[0];
      if (firstMsg && firstMsg.id === 'welcome') {
        // Update welcome message but keep all other messages
        const updatedWelcome = getWelcomeMessage();
        // Only update if the welcome text changed (login status or language)
        if (firstMsg.text !== updatedWelcome.text) {
          return [updatedWelcome, ...stored.messages.slice(1)];
        }
      }
      // Return all stored messages as-is
      return stored.messages;
    }

    return [getWelcomeMessage()];
  });

  // Store the initial updatedAt timestamp - only set once when component mounts
  const sessionStartTimeRef = useRef<number>((() => {
    const stored = readStoredState();
    // If we have valid stored state, use its updatedAt, otherwise start new session
    return stored?.updatedAt || Date.now();
  })());

  // Update welcome message when login status or language changes
  useEffect(() => {
    const welcomeText = isLoggedIn && currentUser
      ? t.welcome.loggedIn(currentUser.name)
      : t.welcome.guest;
    
    setMessages(prev => {
      // If first message is welcome message, update it
      if (prev.length > 0 && prev[0].id === 'welcome') {
        // Only update if the text is different
        if (prev[0].text !== welcomeText) {
          return [{
            id: 'welcome',
            sender: 'bot',
            text: welcomeText
          }, ...prev.slice(1)];
        }
      }
      return prev;
    });
  }, [isLoggedIn, currentUser?.name, browserLang]);

  useEffect(() => {
    let isMounted = true;

    fetchCatalog()
      .then((data) => {
        if (!isMounted || !data) return;
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setCatalogLoaded(true);
      })
      .catch((error) => {
        setCatalogError(error instanceof Error ? error.message : 'Catalog request failed.');
        setCatalogLoaded(true);
        console.warn('Catalog fetch failed, falling back to mock data.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveCategories = isWordPress ? categories : (categories.length > 0 ? categories : CATEGORIES);
  const effectiveProducts = isWordPress ? products : (products.length > 0 ? products : PRODUCTS);


  useEffect(() => {
    // Use the session start time, not current time, to prevent TTL from resetting
    writeStoredState({
      updatedAt: sessionStartTimeRef.current,
      isOpen,
      messages
    });
  }, [messages, isOpen]);

  useEffect(() => {
    const handlePageHide = () => {
      // Use the session start time when page is closing
      writeStoredState({
        updatedAt: sessionStartTimeRef.current,
        isOpen,
        messages
      });
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [isOpen, messages]);

  // Auto-open chat after 2 seconds for engagement (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only open if it hasn't been opened before (you might use localStorage here)
      // setIsOpen(true); 
    }, 2000);
    return () => clearTimeout(timer);
  }, []);


  const handleCategoryClick = (cat: Category) => {
    // Add a system message saying we are navigating
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text: t.navigation.category(cat.name)
    }]);
    
    // Delay slightly to let the user read the message
    setTimeout(() => {
      onNavigateToCategory(cat);
    }, 1000);
  };

  const handleProductClick = (product: Product) => {
    if (product.url) {
      // Add a system message saying we are navigating
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: t.navigation.product(product.name)
      }]);
      
      // Delay slightly to let the user read the message
      setTimeout(() => {
        window.location.href = product.url!;
      }, 1000);
    } else {
      // Fallback: try to construct product URL from site URL
      const config = getConfig();
      const productUrl = `${config.siteUrl}/product/${product.id}`;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: t.navigation.product(product.name)
      }]);
      setTimeout(() => {
        window.location.href = productUrl;
      }, 1000);
    }
  };

  const handleClearChat = () => {
    if (confirm(t.chat.clearConfirm)) {
      const welcomeMessage = getWelcomeMessage();
      setMessages([welcomeMessage]);
      // Start a new session when clearing chat
      sessionStartTimeRef.current = Date.now();
      writeStoredState({
        updatedAt: sessionStartTimeRef.current,
        isOpen,
        messages: [welcomeMessage]
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans" style={{maxHeight: '90vh'}}>
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[23.75rem] md:w-[28.75rem] h-[36.25rem] md:h-[42.5rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-300" style={{maxWidth: '90%'}}>
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
              <h3 className="font-semibold text-white">Peleman Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleClearChat} 
                className="hover:bg-red-800 p-1 rounded transition-colors"
                title="Clear chat history"
              >
                <Trash2 size={18} />
              </button>
              {isLoggedIn ? (
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setIsModalOpen(true);
                  }} 
                  className="hover:bg-red-800 p-1 rounded transition-colors"
                  title="Open in modal"
                >
                  <ResizeIcon className="text-white" />
                </button>
              ) : (
                <button onClick={() => setIsOpen(false)} className="hover:bg-red-800 p-1 rounded transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Chat Content - Shared component */}
          <ChatContent
            messages={messages}
            setMessages={setMessages}
            categories={effectiveCategories}
            products={effectiveProducts}
            catalogLoaded={catalogLoaded}
            catalogError={catalogError}
            isWordPress={isWordPress}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            loginUrl={loginUrl}
            onNavigateToCategory={handleCategoryClick}
            onProductClick={handleProductClick}
            isVisible={isOpen}
          />
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-[#f05023] hover:bg-[#e0451f] text-white px-5 py-4 rounded-2xl shadow-[0_8px_24px_rgba(240,80,35,0.4)] hover:shadow-[0_12px_32px_rgba(240,80,35,0.5)] transition-all duration-300 hover:scale-105 flex items-center gap-3 group overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f05023 0%, #e0451f 100%)'
        }}
      >
        {/* Pulse animation ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-2xl bg-[#f05023] opacity-75 animate-ping"></span>
        )}
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          {isOpen ? (
            <X size={22} className="flex-shrink-0" />
          ) : (
            <>
              <MessageCircle size={22} className="flex-shrink-0" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-semibold text-sm tracking-wide">
                {t.chat.howCanHelp}
              </span>
            </>
          )}
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full"></div>
      </button>

      {/* Chat Modal - Only for logged-in users */}
      {isLoggedIn && (
              <ChatModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setIsOpen(true); // Reopen small widget when modal closes
                }}
                currentUser={currentUser}
                messages={messages}
                setMessages={setMessages}
                categories={effectiveCategories}
                products={effectiveProducts}
                catalogLoaded={catalogLoaded}
                catalogError={catalogError}
                isWordPress={isWordPress}
                isLoggedIn={isLoggedIn}
                loginUrl={loginUrl}
                onNavigateToCategory={handleCategoryClick}
                onProductClick={handleProductClick}
              />
      )}
    </div>
  );
};

export default ChatWidget;