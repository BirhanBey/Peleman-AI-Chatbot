import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './components/ChatWidget';
import { Category } from './types';
import './index.css'; // Import CSS so it gets bundled

// 1. Check for WordPress Plugin Mount Point
const wpRootElement = document.getElementById('peleman-chatbot-root');

if (wpRootElement) {
  // --- WORDPRESS MODE ---
  const wpRoot = ReactDOM.createRoot(wpRootElement);
  
  const handleWpNavigation = (category: Category) => {
    if (category.url) {
      window.location.href = category.url;
    } else {
      console.warn('No URL defined for category:', category.name);
    }
  };

  wpRoot.render(
    <React.StrictMode>
      <ChatWidget onNavigateToCategory={handleWpNavigation} />
    </React.StrictMode>
  );

} else {
  // No WordPress mount point found.
  console.warn('Peleman chatbot root element not found.');
}