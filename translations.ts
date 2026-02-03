export type SupportedLanguage = 'tr' | 'de' | 'fr' | 'nl' | 'en' | 'es' | 'gr';

export interface Translations {
  welcome: {
    loggedIn: (name: string) => string;
    guest: string;
  };
  loginPrompt: {
    message: string;
    button: string;
  };
  catalog: {
    loading: string;
    error: string;
  };
  navigation: {
    category: (name: string) => string;
    product: (name: string) => string;
  };
  chat: {
    clearConfirm: string;
    placeholder: string;
    howCanHelp: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  tr: {
    welcome: {
      loggedIn: (name: string) => `Merhaba ${name}! 👋\nPeleman'a hoş geldiniz. Size nasıl yardımcı olabilirim?`,
      guest: `Merhaba! Peleman'a hoş geldiniz. 👋\nSize nasıl yardımcı olabilirim? Hangi ürünü arıyorsunuz?`
    },
    loginPrompt: {
      message: 'Daha fazla özellik için lütfen giriş yapın. Siparişlerinizi görüntüleyebilir, faturalarınızı indirebilir ve favorilerinizi kaydedebilirsiniz.',
      button: 'Giriş Yap'
    },
    catalog: {
      loading: 'Katalog yükleniyor. Lütfen birkaç saniye bekleyin.',
      error: 'Katalog yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.'
    },
    navigation: {
      category: (name: string) => `Harika seçim! Sizi ${name} sayfasına yönlendiriyorum...`,
      product: (name: string) => `Sizi ${name} sayfasına yönlendiriyorum...`
    },
    chat: {
      clearConfirm: 'Sohbet geçmişini temizlemek istediğinizden emin misiniz?',
      placeholder: 'Mesajınızı yazın...',
      howCanHelp: 'Size nasıl yardımcı olabilirim?'
    }
  },
  de: {
    welcome: {
      loggedIn: (name: string) => `Hallo ${name}! 👋\nWillkommen bei Peleman. Wie kann ich Ihnen heute helfen?`,
      guest: 'Hallo! Willkommen bei Peleman. 👋\nIch kann Ihnen helfen, das richtige Produkt zu finden. Suchen Sie etwas für sich selbst oder als Geschenk?'
    },
    loginPrompt: {
      message: 'Bitte melden Sie sich an, um weitere Funktionen zu nutzen. Sie können Ihre Bestellungen anzeigen, Rechnungen herunterladen und Favoriten speichern.',
      button: 'Anmelden'
    },
    catalog: {
      loading: 'Der Katalog wird geladen. Bitte warten Sie einen Moment.',
      error: 'Der Katalog konnte nicht geladen werden. Bitte aktualisieren Sie die Seite und versuchen Sie es erneut.'
    },
    navigation: {
      category: (name: string) => `Großartige Wahl! Ich bringe Sie zur ${name}-Seite...`,
      product: (name: string) => `Ich bringe Sie zu ${name}...`
    },
    chat: {
      clearConfirm: 'Sind Sie sicher, dass Sie den Chat-Verlauf löschen möchten?',
      placeholder: 'Geben Sie Ihre Nachricht ein...',
      howCanHelp: 'Wie kann ich helfen?'
    }
  },
  fr: {
    welcome: {
      loggedIn: (name: string) => `Bonjour ${name}! 👋\nBienvenue chez Peleman. Comment puis-je vous aider aujourd'hui?`,
      guest: 'Bonjour! Bienvenue chez Peleman. 👋\nJe peux vous aider à trouver le bon produit. Cherchez-vous quelque chose pour vous-même ou comme cadeau?'
    },
    loginPrompt: {
      message: 'Veuillez vous connecter pour accéder à plus de fonctionnalités. Vous pouvez consulter vos commandes, télécharger vos factures et enregistrer vos favoris.',
      button: 'Se connecter'
    },
    catalog: {
      loading: 'Le catalogue est en cours de chargement. Veuillez patienter un instant.',
      error: 'Le catalogue n\'a pas pu être chargé. Veuillez actualiser la page et réessayer.'
    },
    navigation: {
      category: (name: string) => `Excellent choix! Je vous redirige vers la page ${name}...`,
      product: (name: string) => `Je vous redirige vers ${name}...`
    },
    chat: {
      clearConfirm: 'Êtes-vous sûr de vouloir effacer l\'historique de la conversation?',
      placeholder: 'Tapez votre message...',
      howCanHelp: 'Comment puis-je vous aider?'
    }
  },
  nl: {
    welcome: {
      loggedIn: (name: string) => `Hallo ${name}! 👋\nWelkom bij Peleman. Hoe kan ik u vandaag helpen?`,
      guest: 'Hallo! Welkom bij Peleman. 👋\nIk kan u helpen het juiste product te vinden. Zoekt u iets voor uzelf of als cadeau?'
    },
    loginPrompt: {
      message: 'Log alstublieft in voor meer functies. U kunt uw bestellingen bekijken, facturen downloaden en favorieten opslaan.',
      button: 'Inloggen'
    },
    catalog: {
      loading: 'De catalogus wordt geladen. Even geduld alstublieft.',
      error: 'De catalogus kon niet worden geladen. Ververs de pagina en probeer het opnieuw.'
    },
    navigation: {
      category: (name: string) => `Uitstekende keuze! Ik breng u naar de ${name} pagina...`,
      product: (name: string) => `Ik breng u naar ${name}...`
    },
    chat: {
      clearConfirm: 'Weet u zeker dat u de chatgeschiedenis wilt wissen?',
      placeholder: 'Typ uw bericht...',
      howCanHelp: 'Hoe kan ik helpen?'
    }
  },
  en: {
    welcome: {
      loggedIn: (name: string) => `Hello ${name}! 👋\nWelcome to Peleman. How can I help you today?`,
      guest: 'Hello! Welcome to Peleman. 👋\nI can help you find the right product. Are you shopping for yourself or as a gift?'
    },
    loginPrompt: {
      message: 'Please log in for more features. You can view your orders, download invoices, and save favorites.',
      button: 'Log In'
    },
    catalog: {
      loading: 'Catalog is still loading. Please try again in a moment.',
      error: 'Catalog could not be loaded. Please refresh the page and try again.'
    },
    navigation: {
      category: (name: string) => `Great choice! Taking you to the ${name} page...`,
      product: (name: string) => `Taking you to ${name}...`
    },
    chat: {
      clearConfirm: 'Are you sure you want to clear the chat history?',
      placeholder: 'Type your message...',
      howCanHelp: 'How can I help?'
    }
  },
  es: {
    welcome: {
      loggedIn: (name: string) => `¡Hola ${name}! 👋\nBienvenido a Peleman. ¿Cómo puedo ayudarte hoy?`,
      guest: '¡Hola! Bienvenido a Peleman. 👋\nPuedo ayudarte a encontrar el producto adecuado. ¿Estás comprando para ti o como regalo?'
    },
    loginPrompt: {
      message: 'Por favor, inicia sesión para acceder a más funciones. Puedes ver tus pedidos, descargar facturas y guardar favoritos.',
      button: 'Iniciar sesión'
    },
    catalog: {
      loading: 'El catálogo se está cargando. Por favor, inténtalo de nuevo en un momento.',
      error: 'No se pudo cargar el catálogo. Por favor, actualiza la página e inténtalo de nuevo.'
    },
    navigation: {
      category: (name: string) => `¡Excelente elección! Te llevo a la página de ${name}...`,
      product: (name: string) => `Te llevo a ${name}...`
    },
    chat: {
      clearConfirm: '¿Estás seguro de que quieres borrar el historial del chat?',
      placeholder: 'Escribe tu mensaje...',
      howCanHelp: '¿Cómo puedo ayudarte?'
    }
  },
  gr: {
    welcome: {
      loggedIn: (name: string) => `Γεια σας ${name}! 👋\nΚαλώς ήρθατε στο Peleman. Πώς μπορώ να σας βοηθήσω σήμερα;`,
      guest: 'Γεια σας! Καλώς ήρθατε στο Peleman. 👋\nΜπορώ να σας βοηθήσω να βρείτε το σωστό προϊόν. Ψωνίζετε για τον εαυτό σας ή ως δώρο;'
    },
    loginPrompt: {
      message: 'Παρακαλώ συνδεθείτε για περισσότερες λειτουργίες. Μπορείτε να δείτε τις παραγγελίες σας, να κατεβάσετε τιμολόγια και να αποθηκεύσετε αγαπημένα.',
      button: 'Σύνδεση'
    },
    catalog: {
      loading: 'Ο κατάλογος φορτώνει. Παρακαλώ δοκιμάστε ξανά σε λίγο.',
      error: 'Ο κατάλογος δεν μπόρεσε να φορτωθεί. Παρακαλώ ανανεώστε τη σελίδα και δοκιμάστε ξανά.'
    },
    navigation: {
      category: (name: string) => `Εξαιρετική επιλογή! Σας μεταφέρω στη σελίδα ${name}...`,
      product: (name: string) => `Σας μεταφέρω στο ${name}...`
    },
    chat: {
      clearConfirm: 'Είστε σίγουροι ότι θέλετε να διαγράψετε το ιστορικό συνομιλίας;',
      placeholder: 'Γράψτε το μήνυμά σας...',
      howCanHelp: 'Πώς μπορώ να βοηθήσω;'
    }
  }
};

// Get browser language and map to supported language
export const getBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const lang = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();

  // Map browser language codes to supported languages
  if (lang.startsWith('tr')) return 'tr';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('nl')) return 'nl';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('el') || lang.startsWith('gr')) return 'gr';

  // Default to English
  return 'en';
};

// Get translation function
export const getTranslation = (lang: SupportedLanguage): Translations => {
  return translations[lang] || translations.en;
};
