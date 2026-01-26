import { getConfig } from '../config';
import { CatalogData } from '../types';

const getCatalogUrl = () => {
  const config = getConfig();
  if (config.apiUrl) {
    return `${config.apiUrl.replace(/\/$/, '')}/catalog`;
  }

  return `${config.siteUrl.replace(/\/$/, '')}/wp-json/peleman-chatbot/v1/catalog`;
};

const normalizeCatalog = (data: CatalogData): CatalogData => {
  const categories = Array.isArray(data.categories)
    ? data.categories
    : (Object.values(data.categories || {}) as CatalogData['categories']);
  const products = Array.isArray(data.products)
    ? data.products
    : (Object.values(data.products || {}) as CatalogData['products']);
  return {
    categories,
    products
  };
};

export const fetchCatalog = async (): Promise<CatalogData | null> => {
  const url = new URL(getCatalogUrl());
  const lang = document.documentElement.lang;
  if (lang) {
    url.searchParams.set('lang', lang.split('-')[0]);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'same-origin'
  });

  if (!response.ok) {
    throw new Error(`Catalog request failed: ${response.status}`);
  }

  const data = (await response.json()) as CatalogData;
  return normalizeCatalog(data);
};
