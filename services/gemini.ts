import { GoogleGenAI, Type } from '@google/genai';
import { Category, GeminiResponse, Product } from '../types';
import { getConfig } from '../config';

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

const buildSystemInstruction = (categories: Category[], products: Product[]) => `
You are a helpful sales assistant for the Peleman website.
Your goal is to help customers find the right presentation, photo, or binding product.
The available product categories are:
${categories.map((c) => `- ID: ${c.id}, Name: ${c.name}, Desc: ${c.description}`).join('\n')}

Popular products and attributes:
${formatProductsForPrompt(products).join('\n')}

Behavior:
1. Detect the user's language and respond in the same language. Support English, Dutch (Flemish), and Turkish. Default to English if unclear.
2. If the user greets you, greet them warmly and ask who they are buying for or what they need (e.g., "Hello! Welcome to Peleman. How can I help today? Are you shopping for yourself or as a gift?").
3. If the user mentions "photobook", "album", "binding", or specific needs, recommend the relevant categories or products by setting 'responseType' to 'recommendation' and filling 'categoryIds' and/or 'productIds'.
4. Only mention categories or products that exist in the provided lists. Never invent new product names, attributes, or categories.
5. Keep responses concise, professional, and friendly.
`;

export const sendMessageToGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string,
  categories: Category[],
  products: Product[]
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
        systemInstruction: buildSystemInstruction(categories, products),
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