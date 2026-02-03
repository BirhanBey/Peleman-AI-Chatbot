export interface Product {
  id: string;
  name: string;
  category: string;
  categoryIds?: string[];
  description: string;
  image: string;
  price: string;
  url?: string;
  attributes?: ProductAttribute[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  url: string; // Added URL for WP navigation
}

export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface CatalogData {
  categories: Category[];
  products: Product[];
}

export type Sender = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  recommendedCategories?: Category[];
  recommendedProducts?: Product[];
}

export interface GeminiResponse {
  responseType: 'text' | 'recommendation';
  message: string;
  categoryIds?: string[];
  productIds?: string[];
}

// User interface for logged-in users
export interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

// Extend the global Window interface to accept settings from WordPress PHP
declare global {
  interface Window {
    pelemanSettings?: {
      apiKey?: string;
      apiUrl?: string;
      siteUrl?: string;
      ajaxUrl?: string;
      brandIcon?: string;
      isLoggedIn?: boolean;
      currentUser?: CurrentUser | null;
      loginUrl?: string;
    };
  }
}