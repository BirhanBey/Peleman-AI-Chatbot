/**
 * This file handles configuration loading.
 * It prioritizes settings injected by WordPress (via wp_localize_script)
 * and falls back to environment variables for local development.
 */

export const getConfig = () => {
  const wpSettings = window.pelemanSettings || {};

  return {
    // In WP, this comes from the PHP database settings. In Dev, from .env
    apiKey: wpSettings.apiKey || process.env.API_KEY || '',
    apiUrl: wpSettings.apiUrl || '',
    
    // Base URL for the site
    siteUrl: wpSettings.siteUrl || window.location.origin,
    
    // Check if we are running inside WordPress
    isWordPress: !!window.pelemanSettings
  };
};