import { GoogleGenAI, Type } from '@google/genai';
import { Category, GeminiResponse, Product, CurrentUser } from '../types';
import { getConfig } from '../config';
import { SupportedLanguage } from '../translations';

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  const config = getConfig();
  if (!config.apiKey) {
    return null;
  }

  if (!ai) {
    // SECURITY NOTE: In a production WordPress plugin, you should ideally proxy these requests
    // through a PHP endpoint to keep your API Key hidden, rather than exposing it in JS.
    ai = new GoogleGenAI({ apiKey: config.apiKey, vertexai: true });
  }

  return ai;
};

const modelId = 'gemini-2.5-flash';

const buildResponseSchema = (categories: Category[], products: Product[]) => ({
  type: Type.OBJECT,
  properties: {
    responseType: {
      type: Type.STRING,
      enum: ['text', 'recommendation'],
      description:
        "Use 'recommendation' if the user asks for products or if you can suggest specific product categories. Use 'text' for general conversation."
    },
    message: {
      type: Type.STRING,
      description:
        'The conversational response to the user. Be polite and helpful. If recommending, introduce the options.'
    },
    categoryIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'List of category IDs to recommend. ONLY use these IDs: ' + categories.map((c) => c.id).join(', ')
    },
    productIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'List of product IDs to recommend. ONLY use these IDs: ' + products.map((p) => p.id).join(', ')
    }
  },
  required: ['responseType', 'message']
});

const formatProductsForPrompt = (products: Product[], maxItems = 200) => {
  return products.slice(0, maxItems).map((product) => {
    const attrText = (product.attributes || [])
      .map((attr) => `${attr.name}: ${attr.options.join(', ')}`)
      .filter((text) => text.trim().length > 0)
      .join('; ');
    const categoryText = product.category ? `Category: ${product.category}` : '';
    const detailParts = [categoryText, attrText].filter(Boolean);
    const description = product.description ? `Desc: ${product.description}` : '';
    const moreDetails = [description, ...detailParts].filter(Boolean);
    return `- ID: ${product.id} | Name: ${product.name}${moreDetails.length ? ` | ${moreDetails.join(' | ')}` : ''}`;
  });
};

// Map supported language codes to language names for AI
const getLanguageName = (lang: SupportedLanguage): string => {
  const langMap: Record<SupportedLanguage, string> = {
    tr: 'Turkish',
    de: 'German',
    fr: 'French',
    nl: 'Dutch',
    en: 'English',
    es: 'Spanish',
    gr: 'Greek'
  };
  return langMap[lang] || 'English';
};

const buildSystemInstruction = (
  categories: Category[],
  products: Product[],
  currentUser: CurrentUser | null = null,
  browserLanguage: SupportedLanguage = 'en'
) => {
  const userGreeting = currentUser
    ? `The user's name is ${currentUser.name}. Address them by name when appropriate, especially in greetings and when providing personalized responses. Use their name naturally in conversation.`
    : '';

  const languageName = getLanguageName(browserLanguage);

  // Get greeting examples for the browser language
  const getGreetingExample = (lang: SupportedLanguage): string => {
    const greetings: Record<SupportedLanguage, string> = {
      tr: 'Merhaba! Peleman\'a hoş geldiniz. Size nasıl yardımcı olabilirim?',
      de: 'Hallo! Willkommen bei Peleman. Wie kann ich Ihnen helfen?',
      fr: 'Bonjour! Bienvenue chez Peleman. Comment puis-je vous aider?',
      nl: 'Hallo! Welkom bij Peleman. Hoe kan ik u helpen?',
      en: 'Hello! Welcome to Peleman. How can I help you today?',
      es: '¡Hola! Bienvenido a Peleman. ¿Cómo puedo ayudarte?',
      gr: 'Γεια σας! Καλώς ήρθατε στο Peleman. Πώς μπορώ να σας βοηθήσω;'
    };
    return greetings[lang] || greetings.en;
  };

  const languageInstruction = browserLanguage !== 'en'
    ? `CRITICAL: The user's browser language is set to ${languageName} (${browserLanguage}). You MUST respond in ${languageName} from the very first message. Do NOT use English unless the user explicitly writes in English. Your first greeting should be: "${getGreetingExample(browserLanguage)}"`
    : '';

  return `
You are a helpful sales assistant for the Peleman website.
Your goal is to help customers find the right presentation, photo, or binding product.
${userGreeting ? `\n${userGreeting}\n` : ''}
${languageInstruction ? `\n${languageInstruction}\n` : ''}
The available product categories are:
${categories.map((c) => `- ID: ${c.id}, Name: ${c.name}, Desc: ${c.description}`).join('\n')}

Popular products and attributes:
${formatProductsForPrompt(products).join('\n')}

Behavior:
1. ${browserLanguage !== 'en' ? `CRITICAL: Always respond in ${languageName} (${browserLanguage}). ` : ''}Detect the user's language and respond in the same language. Support Turkish, German, French, Dutch, English, Spanish, and Greek. ${browserLanguage !== 'en' ? `Your default language is ${languageName} - use it unless the user explicitly writes in a different language.` : 'Default to English if unclear.'}
2. If the user greets you or this is the first interaction, greet them warmly${currentUser ? ` by name (${currentUser.name})` : ''} in ${languageName}. Example: "${getGreetingExample(browserLanguage)}"
3. If the user mentions "photobook", "album", "binding", or specific needs, recommend the relevant categories or products by setting 'responseType' to 'recommendation' and filling 'categoryIds' and/or 'productIds'.
4. Only mention categories or products that exist in the provided lists. Never invent new product names, attributes, or categories.
5. Keep responses concise, professional, and friendly.
${currentUser ? `6. When addressing the logged-in user, use their name (${currentUser.name}) naturally in conversation, especially in greetings and when providing personalized assistance.` : ''}
`;
};

export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string,
  categories: Category[],
  products: Product[],
  currentUser: CurrentUser | null = null,
  browserLanguage: SupportedLanguage = 'en'
): Promise<GeminiResponse> => {
  try {
    const client = getAiClient();
    if (!client) {
      return {
        responseType: 'text',
        message: 'API key is missing. Please add it in WordPress settings.'
      };
    }

    const chat = client.chats.create({
      model: modelId,
      config: {
        systemInstruction: buildSystemInstruction(categories, products, currentUser, browserLanguage),
        responseMimeType: 'application/json',
        responseSchema: buildResponseSchema(categories, products),
      },
      history: history
    });

    const result = await chat.sendMessage({ message: userMessage });
    const text = result.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as GeminiResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      responseType: 'text',
      message: "Üzgünüm, şu an bağlantıda bir sorun yaşıyorum. Lütfen biraz sonra tekrar deneyin."
    };
  }
};