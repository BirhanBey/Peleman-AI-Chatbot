import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { ChatMessage, Category, Product } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { fetchCatalog } from '../services/catalog';
import { CATEGORIES, PRODUCTS } from '../data/mockData';
import { getConfig } from '../config';

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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = readStoredState();
    if (stored && stored.messages.length > 0) {
      return stored.messages;
    }

    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Hello! Welcome to Peleman. 👋\nI can help you find the right product. Are you shopping for yourself or as a gift?'
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Store the initial updatedAt timestamp - only set once when component mounts
  const sessionStartTimeRef = useRef<number>((() => {
    const stored = readStoredState();
    // If we have valid stored state, use its updatedAt, otherwise start new session
    return stored?.updatedAt || Date.now();
  })());

  const { isWordPress } = getConfig();

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
  const categoryLookup = useMemo(
    () => new Map(effectiveCategories.map((cat) => [cat.id, cat])),
    [effectiveCategories]
  );
  const productLookup = useMemo(
    () => new Map(effectiveProducts.map((product) => [product.id, product])),
    [effectiveProducts]
  );

  const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const decodeHtmlEntities = (value: string) =>
    value
      .replace(/&euro;/g, '€')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

  const formatText = (value?: string) => {
    if (!value) return '';
    return decodeHtmlEntities(stripHtml(value));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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

  // Check if a category was already shown in previous messages
  const getShownCategoryIds = useMemo(() => {
    const shownIds = new Set<string>();
    messages.forEach(msg => {
      if (msg.recommendedCategories) {
        msg.recommendedCategories.forEach(cat => shownIds.add(cat.id));
      }
    });
    return shownIds;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (isWordPress && !catalogLoaded) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Catalog is still loading. Please try again in a moment.'
        }
      ]);
      return;
    }

    if (isWordPress && catalogError) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Catalog could not be loaded. Please refresh the page and try again.'
        }
      ]);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const response = await sendMessageToGemini(history, userMsg.text, effectiveCategories, effectiveProducts);

      let recommendedCategories: Category[] = [];
      let recommendedProducts: Product[] = [];
      
      if (response.responseType === 'recommendation') {
        if (response.categoryIds) {
          const newCategories = response.categoryIds
            .map(id => categoryLookup.get(id))
            .filter((c): c is Category => !!c);
          
          // Check if any of these categories were already shown
          const alreadyShown = newCategories.some(cat => getShownCategoryIds.has(cat.id));
          
          if (alreadyShown && newCategories.length > 0) {
            // If category was already shown, show products instead
            const categoryId = newCategories[0].id;
            const categoryProducts = effectiveProducts.filter(p => 
              p.category === categoryId || p.categoryIds?.includes(categoryId)
            );
            recommendedProducts = categoryProducts.slice(0, 5); // Show max 5 products
          } else {
            recommendedCategories = newCategories;
          }
        }
        
        // Always add product recommendations if provided
        if (response.productIds) {
          const newProducts = response.productIds
            .map(id => productLookup.get(id))
            .filter((p): p is Product => !!p);
          recommendedProducts = [...recommendedProducts, ...newProducts];
        }
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.message,
        recommendedCategories: recommendedCategories.length > 0 ? recommendedCategories : undefined,
        recommendedProducts: recommendedProducts.length > 0 ? recommendedProducts : undefined
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (cat: Category) => {
    // Add a system message saying we are navigating
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text: `Great choice! Taking you to the ${cat.name} page...`
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
        text: `Taking you to ${product.name}...`
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
        text: `Taking you to ${product.name}...`
      }]);
      setTimeout(() => {
        window.location.href = productUrl;
      }, 1000);
    }
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'bot',
        text: 'Hello! Welcome to Peleman. 👋\nI can help you find the right product. Are you shopping for yourself or as a gift?'
      };
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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[380px] md:w-[460px] h-[580px] md:h-[680px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
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
              <button onClick={() => setIsOpen(false)} className="hover:bg-red-800 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 scrollbar-hide">
            <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div key={msg.id} className="w-full flex flex-col gap-3 relative">
                {/* Message Text Bubble */}
                {msg.text && (
                  <div className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap relative z-10 ${
                        msg.sender === 'user'
                          ? 'bg-red-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                )}

                {/* Render Recommendations if any */}
                {(msg.recommendedCategories || msg.recommendedProducts) && (
                  <div className="w-full grid grid-cols-1 gap-2 relative z-10">
                    {msg.recommendedProducts?.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 hover:border-red-500 hover:shadow-md transition-all text-left group w-full cursor-pointer"
                      >
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-16 h-16 object-cover rounded-lg bg-slate-200"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-16 h-16 flex items-center justify-center rounded-lg bg-slate-200 text-slate-500 text-xs font-semibold ${product.image ? 'hidden' : ''}`}
                          style={{ display: product.image ? 'none' : 'flex' }}
                        >
                          {product.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-red-700">{product.name}</h4>
                          {product.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{formatText(product.description)}</p>
                          )}
                          {product.attributes && product.attributes.length > 0 && (
                            <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                              {product.attributes.slice(0, 2).map((attr) => (
                                <div key={attr.name} className="truncate">
                                  <span className="font-semibold">{attr.name}:</span> {attr.options.join(', ')}
                                </div>
                              ))}
                            </div>
                          )}
                          {product.price && (
                            <p className="text-xs text-red-700 font-semibold mt-1">{formatText(product.price)}</p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-red-500" />
                      </button>
                    ))}
                    {msg.recommendedCategories?.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 hover:border-red-500 hover:shadow-md transition-all text-left group"
                      >
                        {cat.thumbnail ? (
                          <img 
                            src={cat.thumbnail} 
                            alt={cat.name} 
                            className="w-16 h-16 object-cover rounded-lg bg-slate-200"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-16 h-16 flex items-center justify-center rounded-lg bg-slate-200 text-slate-500 text-xs font-semibold ${cat.thumbnail ? 'hidden' : ''}`}
                          style={{ display: cat.thumbnail ? 'none' : 'flex' }}
                        >
                          {cat.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-red-700">{cat.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{cat.description}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-red-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-900"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-red-700 text-white p-2 rounded-full hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
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
                How can I help?
              </span>
            </>
          )}
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full"></div>
      </button>
    </div>
  );
};

export default ChatWidget;