# Changelog

All notable changes to the Peleman AI Chatbot project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-03

### Added

#### 🔐 Authentication & User Management
- **Login Control System**: Added WordPress user authentication detection
  - `wp_get_current_user()` integration in PHP plugin
  - `isLoggedIn`, `currentUser`, and `loginUrl` added to `pelemanSettings`
  - Two different chatbot experiences based on login status
- **Personalized Greetings**: Login users are greeted by name
  - Welcome message customization based on user login status
  - AI system instruction includes user name for personalized responses

#### 🌍 Multi-language Support
- **7 Language Support**: Full translation system for UI messages
  - Supported languages: Turkish (TR), German (DE), French (FR), Dutch (NL), English (EN), Spanish (ES), Greek (GR)
  - Browser language auto-detection and mapping
  - All UI elements translated (welcome messages, buttons, placeholders, error messages)
- **Translation System**: Centralized translation management
  - New `translations.ts` file with type-safe translation system
  - `SupportedLanguage` type and `Translations` interface
  - `getBrowserLanguage()` and `getTranslation()` utility functions
- **AI Language Detection**: Gemini AI responds in browser language
  - Browser language passed to AI system instructions
  - Language-specific greeting examples for each supported language
  - Critical language instructions to ensure AI responds in correct language from first message

#### 🎨 UI/UX Improvements
- **Login Prompt**: Non-logged-in users see informative login prompt
  - Multi-language login prompt message
  - "Log In" button with language-specific text
  - Feature list explanation (orders, invoices, favorites)
- **Dynamic Welcome Messages**: Welcome message adapts to user status and language
  - Logged-in users: Personalized greeting with name
  - Guest users: General welcome message
  - Language-specific welcome messages for all 7 languages
- **Localized Error Messages**: All error and loading messages translated
  - Catalog loading messages
  - Catalog error messages
  - Navigation messages (category/product redirects)
  - Chat clear confirmation dialog

### Changed

#### 📁 Code Organization
- **Translation Extraction**: Moved all translations from `ChatWidget.tsx` to `translations.ts`
  - Cleaner component code
  - Easier translation management
  - Better maintainability

#### 🔧 Configuration Updates
- **Config System**: Enhanced `config.ts` with login and language support
  - Added `isLoggedIn`, `currentUser`, `loginUrl` to config
  - Browser language detection integration

#### 🤖 AI Service Updates
- **Gemini Service**: Enhanced with language and user context
  - `sendMessageToGemini()` now accepts `browserLanguage` parameter
  - `buildSystemInstruction()` includes browser language context
  - Language-specific system instructions with greeting examples
  - User name integration for personalized responses

### Technical Details

#### Files Created
- `translations.ts`: Centralized translation system with 7 language support
- `CHANGELOG.md`: This changelog file

#### Files Modified
- `peleman-chatbot/peleman-chatbot.php`: Added login detection and user data to `pelemanSettings`
- `components/ChatWidget.tsx`: 
  - Removed inline translations
  - Added translation imports
  - Added login prompt UI
  - Dynamic welcome message based on login status and language
  - Browser language detection integration
- `services/gemini.ts`: 
  - Added browser language parameter
  - Enhanced system instructions with language context
  - Language-specific greeting examples
- `config.ts`: Added login and language configuration options
- `types.ts`: Added `CurrentUser` interface and extended `Window.pelemanSettings`

### Features by User Type

#### Guest Users (Not Logged In)
- ✅ Product search
- ✅ Category browsing
- ✅ General questions
- ✅ Stock queries (from cache)
- ✅ Multi-language support
- ❌ Order status (requires login)
- ❌ Invoice download (requires login)
- ❌ Favorites (requires login)
- ❌ Re-order (requires login)
- ❌ Customer service contact (requires login)

#### Logged-In Users
- ✅ All guest features
- ✅ Personalized experience (name-based greetings)
- ✅ Order history (ready for implementation)
- ✅ Invoice download (ready for implementation)
- ✅ Favorites (ready for implementation)
- ✅ Re-order (ready for implementation)
- ✅ Customer service contact (ready for implementation)

### Language Support Details

Each language includes translations for:
- Welcome messages (logged-in and guest)
- Login prompt message and button
- Catalog loading/error messages
- Navigation messages (category/product redirects)
- Chat UI elements (clear confirm, placeholder, help button)

### Next Steps (Planned Features)

Based on the application plan, upcoming features include:
- Quick reply buttons
- Stock query enhancement
- Email to customer service
- Send conversation via email
- Invoice/waybill download links
- Order status query
- Re-order functionality
- Favorites/frequently ordered items

---

## Version History

- **1.0.0** (2026-02-03): Initial release with login control, multi-language support, and personalized greetings
