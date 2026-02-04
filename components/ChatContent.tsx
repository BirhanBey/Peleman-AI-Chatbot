import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, ChevronRight, Loader2, LogIn } from 'lucide-react';
import { ChatMessage, Category, Product, CurrentUser } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { getConfig } from '../config';
import { getBrowserLanguage, getTranslation } from '../translations';

interface ChatContentProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  categories: Category[];
  products: Product[];
  catalogLoaded: boolean;
  catalogError: string | null;
  isWordPress: boolean;
  isLoggedIn: boolean;
  currentUser: CurrentUser | null;
  loginUrl: string;
  onNavigateToCategory?: (category: Category) => void;
  onProductClick?: (product: Product) => void;
  isVisible?: boolean; // When true, scrolls to bottom on mount/visibility change
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  setMessages,
  categories,
  products,
  catalogLoaded,
  catalogError,
  isWordPress,
  isLoggedIn,
  currentUser,
  loginUrl,
  onNavigateToCategory,
  onProductClick,
  isVisible = true
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const browserLang = getBrowserLanguage();
  const t = getTranslation(browserLang);

  const effectiveCategories = categories;
  const effectiveProducts = products;
  
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
    // Use requestAnimationFrame and multiple attempts to ensure scroll works
    const attemptScroll = (attempts = 0) => {
      if (attempts > 5) return; // Max 5 attempts
      
      const container = messagesContainerRef.current;
      if (container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        container.scrollTop = maxScroll;
        
        // If not at bottom, try again after a short delay
        if (container.scrollTop < maxScroll - 10) {
          setTimeout(() => attemptScroll(attempts + 1), 50);
        }
      } else {
        // Fallback to scrollIntoView if container not found
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setTimeout(() => attemptScroll(), 50);
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when component becomes visible
  useEffect(() => {
    if (isVisible) {
      scrollToBottom();
    }
  }, [isVisible]);

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
          text: t.catalog.loading
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
          text: t.catalog.error
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
      const response = await sendMessageToGemini(history, userMsg.text, effectiveCategories, effectiveProducts, currentUser || null, browserLang);

      let recommendedCategories: Category[] = [];
      let recommendedProducts: Product[] = [];
      
      if (response.responseType === 'recommendation') {
        if (response.categoryIds) {
          const newCategories = response.categoryIds
            .map(id => categoryLookup.get(id))
            .filter((c): c is Category => !!c);
          
          const alreadyShown = newCategories.some(cat => getShownCategoryIds.has(cat.id));
          
          if (alreadyShown && newCategories.length > 0) {
            const categoryId = newCategories[0].id;
            const categoryProducts = effectiveProducts.filter(p => 
              p.category === categoryId || p.categoryIds?.includes(categoryId)
            );
            recommendedProducts = categoryProducts.slice(0, 5);
          } else {
            recommendedCategories = newCategories;
          }
        }
        
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
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text: t.navigation.category(cat.name)
    }]);
    
    setTimeout(() => {
      if (onNavigateToCategory) {
        onNavigateToCategory(cat);
      }
    }, 1000);
  };

  const handleProductClick = (product: Product) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text: t.navigation.product(product.name)
    }]);
    
    if (onProductClick) {
      setTimeout(() => {
        onProductClick(product);
      }, 1000);
    } else if (product.url) {
      setTimeout(() => {
        window.location.href = product.url!;
      }, 1000);
    } else {
      const config = getConfig();
      const productUrl = `${config.siteUrl}/product/${product.id}`;
      setTimeout(() => {
        window.location.href = productUrl;
      }, 1000);
    }
  };

  return (
    <>
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-slate-50 scrollbar-hide">
        {/* Login Prompt for Non-Logged-In Users */}
        {!isLoggedIn && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <LogIn size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 mb-2">
                  {t.loginPrompt.message}
                </p>
                <a 
                  href={loginUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <LogIn size={16} />
                  {t.loginPrompt.button}
                </a>
              </div>
            </div>
          </div>
        )}
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
            placeholder={t.chat.placeholder}
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
    </>
  );
};

export default ChatContent;
