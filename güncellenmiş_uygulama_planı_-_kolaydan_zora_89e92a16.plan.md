---
name: Güncellenmiş Uygulama Planı - Kolaydan Zora
overview: "Kullanıcı isteklerine göre güncellenmiş plan: Stok sorgulama sadece cache'den bilgilendirme, minimum miktar ve increment step atlandı. Özellikler kolaydan zora doğru sıralandı."
todos:
  - id: base-0
    content: Login Kontrolü ve İki Farklı Chatbot Ekranı - Temel altyapı (2-3 saat) - ÖNCE BU!
    status: pending
  - id: easy-1
    content: Kayıtlı müşteri ise isimle hitap - AI eğitimi (1-2 saat)
    status: pending
  - id: easy-2
    content: Hızlı butonlar (Quick replies) - UI component ekleme (1-2 saat)
    status: pending
  - id: easy-3
    content: Çok dilli destek (TR/EN) - Dil bilgisi entegrasyonu (1-2 saat)
    status: pending
  - id: medium-1
    content: Stok sorgulama - Cache'e stok bilgilerini ekleme ve AI eğitimi (3-4 saat)
    status: pending
  - id: medium-2
    content: Mail bırak → müşteri hizmetlerine ilet - Email sistemi (3-4 saat)
    status: pending
  - id: medium-3
    content: Konuşmayı mail'e gönder - Email formatlama (2-3 saat)
    status: pending
  - id: hard-1
    content: Fatura/irsaliye indirme linki - WooCommerce invoice entegrasyonu + Login kontrolü (1-2 gün)
    status: pending
  - id: hard-2
    content: Müşteri temsilcisi email bildirimi - Email gönderme mekanizması + Login kontrolü (1.5 saat)
    status: pending
  - id: hard-3
    content: Sipariş durumu sorgulama - WooCommerce Orders API + Login kontrolü (1-2 gün)
    status: pending
  - id: hard-4
    content: Tekrar sipariş ver - Cart API entegrasyonu + Login kontrolü (1-2 gün)
    status: pending
  - id: hard-5
    content: Favoriler / sık alınanlar - Meta storage sistemi + Login kontrolü (1-2 gün)
    status: pending
isProject: false
---

# Güncellenmiş Uygulama Planı - Kolaydan Zora

## Genel Bakış

Kullanıcı isteklerine göre güncellenmiş plan:

- ✅ **Login Kontrolü:** İki farklı chatbot ekranı (login olmuş/giriş yapmamış)
- ✅ **Stok sorgulama:** Sadece sorulursa cache'deki bilgiyle bilgilendirme (gerçek zamanlı endpoint yok)
- ❌ **Minimum miktar:** Atlandı
- ❌ **Increment step:** Atlandı

**ÖNEMLİ:** Bundan sonraki tüm özellikler login olmuş kullanıcılara odaklı olacak. Her özellik için login kontrolü eklenecek.

---

## SEVIYE 0: Temel Altyapı (2-3 saat) 🔐

### 0. Login Kontrolü ve İki Farklı Chatbot Ekranı

**Zorluk:** Orta  
**Süre:** 2-3 saat  
**Dosyalar:** `peleman-chatbot.php`, `components/ChatWidget.tsx`, `config.ts`

**Yapılacaklar:**

1. **PHP'de Login Kontrolü:**
  - `wp_get_current_user()` ile kullanıcı kontrolü
  - `pelemanSettings` içine `currentUser` ve `isLoggedIn` ekle
2. **React'te İki Farklı Chatbot Ekranı:**
  - **Login olmamış kullanıcılar:** Mevcut basit chatbot (sadece ürün arama, genel sorular)
  - **Login olmuş kullanıcılar:** Gelişmiş chatbot (tüm özellikler: siparişler, faturalar, favoriler, vb.)
3. **Conditional Rendering:**
  - `isLoggedIn` durumuna göre farklı UI göster
  - Login olmamış kullanıcılar için "Giriş yap" butonu veya mesajı
  - Login olmuş kullanıcılar için tüm özellikler aktif

**Kod Değişiklikleri:**

```php
// peleman-chatbot.php - wp_localize_script içinde
$current_user = wp_get_current_user();
$is_logged_in = $current_user->ID > 0;

wp_localize_script('peleman-chat-js', 'pelemanSettings', [
    'apiKey' => get_option('peleman_gemini_api_key', ''),
    'siteUrl' => get_site_url(),
    'apiUrl' => rest_url('peleman-chatbot/v1'),
    'ajaxUrl' => admin_url('admin-ajax.php'),
    'brandIcon' => $brand_icon,
    'isLoggedIn' => $is_logged_in,
    'currentUser' => $is_logged_in ? [
        'id' => $current_user->ID,
        'name' => $current_user->display_name,
        'email' => $current_user->user_email
    ] : null,
    'loginUrl' => wp_login_url(get_permalink()) // Login sayfası URL'i
]);
```

```typescript
// config.ts
export const getConfig = () => {
  const wpSettings = window.pelemanSettings || {};
  return {
    apiKey: wpSettings.apiKey || process.env.API_KEY || '',
    apiUrl: wpSettings.apiUrl || '',
    siteUrl: wpSettings.siteUrl || window.location.origin,
    isWordPress: !!window.pelemanSettings,
    isLoggedIn: wpSettings.isLoggedIn || false,
    currentUser: wpSettings.currentUser || null,
    loginUrl: wpSettings.loginUrl || '/wp-login.php'
  };
};
```

```typescript
// components/ChatWidget.tsx
const ChatWidget: React.FC<ChatWidgetProps> = ({ onNavigateToCategory }) => {
  const config = getConfig();
  const isLoggedIn = config.isLoggedIn;
  const currentUser = config.currentUser;
  
  // Login olmamış kullanıcılar için basit özellikler
  // Login olmuş kullanıcılar için tüm özellikler
  
  return (
    <div className="chat-widget">
      {!isLoggedIn && (
        <div className="login-prompt">
          <p>Daha fazla özellik için lütfen giriş yapın.</p>
          <a href={config.loginUrl} className="login-button">
            Giriş Yap
          </a>
        </div>
      )}
      {/* Chat widget içeriği */}
    </div>
  );
};
```

**Özellik Ayrımı:**

**Login Olmamış Kullanıcılar:**

- ✅ Ürün arama
- ✅ Kategori göz atma
- ✅ Genel sorular
- ✅ Stok sorgulama (cache'den)
- ❌ Sipariş durumu
- ❌ Fatura indirme
- ❌ Favoriler
- ❌ Tekrar sipariş
- ❌ Müşteri temsilcisi bağlantısı

**Login Olmuş Kullanıcılar:**

- ✅ Tüm özellikler aktif
- ✅ Kişiselleştirilmiş deneyim
- ✅ Sipariş geçmişi
- ✅ Fatura indirme
- ✅ Favoriler
- ✅ Tekrar sipariş
- ✅ Müşteri temsilcisi bağlantısı

**Test Senaryoları:**

1. Login olmamış kullanıcı chatbot açtığında basit ekran görüyor mu?
2. Login olmuş kullanıcı chatbot açtığında gelişmiş ekran görüyor mu?
3. Login olmamış kullanıcıya "Giriş yap" butonu gösteriliyor mu?
4. Login kontrolü doğru çalışıyor mu?

---

## SEVIYE 1: Çok Kolay (1-2 saat) ⭐

### 1. Kayıtlı müşteri ise isimle hitap

**Zorluk:** Çok düşük  
**Süre:** 1-2 saat  
**Dosyalar:** `services/gemini.ts`

**Yapılacaklar:**

- Gemini prompt'una kullanıcı adını ekle (login kontrolü zaten SEVIYE 0'da yapıldı)
- Login olmuş kullanıcılar için kişiselleştirilmiş hitap

**Kod Değişiklikleri:**

```typescript
// services/gemini.ts - buildSystemInstruction içinde
const userGreeting = currentUser 
  ? `The user's name is ${currentUser.name}. Address them by name when appropriate.`
  : '';
```

**NOT:** Login kontrolü SEVIYE 0'da yapıldığı için burada sadece AI eğitimi yapılacak.

---

### 2. Hızlı butonlar (Quick replies)

**Zorluk:** Çok düşük  
**Süre:** 1-2 saat  
**Dosyalar:** `components/ChatWidget.tsx`

**Yapılacaklar:**

- ChatWidget'a quick reply butonları ekle
- Önceden tanımlı mesajlar: "Siparişlerim", "Ürün ara", "Canlı destek", "Faturalarım"

**UI Component:**

```typescript
const quickReplies = [
  { text: "Siparişlerim", action: () => handleQuickReply("Siparişlerimi göster") },
  { text: "Ürün ara", action: () => handleQuickReply("Ürün aramak istiyorum") },
  { text: "Canlı destek", action: () => handleQuickReply("Müşteri temsilcisiyle görüşmek istiyorum") },
  { text: "Faturalarım", action: () => handleQuickReply("Faturalarımı göster") }
];
```

---

### 3. Çok dilli destek (TR/EN)

**Zorluk:** Düşük  
**Süre:** 1-2 saat  
**Dosyalar:** `services/gemini.ts`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- Gemini prompt'una dil bilgisi ekle
- Welcome mesajını dile göre değiştir
- `document.documentElement.lang` kullan

**Kod:**

```typescript
const currentLang = document.documentElement.lang || 'tr';
const languageInstruction = `Respond in ${currentLang === 'tr' ? 'Turkish' : 'English'}.`;
```

---

## SEVIYE 2: Kolay (3-5 saat) ⭐⭐

### 4. Stok sorgulama (basit - cache'den bilgilendirme)

**Zorluk:** Orta-düşük  
**Süre:** 3-4 saat  
**Dosyalar:** `peleman-chatbot.php`, `types.ts`, `services/gemini.ts`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- Cache'e stok bilgilerini ekle (`stockStatus`, `stockQuantity`, `isInStock`)
- TypeScript type tanımları güncelle
- AI eğitimi: Response Schema ve System Instruction
- Frontend: Stok bilgisini göster (cache'deki bilgiyle)
- **Login kontrolü:** Her iki kullanıcı tipi için de aktif (genel bilgi)

**ÖNEMLİ:** Gerçek zamanlı endpoint yok, sadece cache'deki bilgi kullanılacak. Bu özellik hem login olmuş hem de olmamış kullanıcılar için aktif.

**PHP Değişikliği:**

```php
// peleman-chatbot.php - return array'ine ekle
return [
    // ... mevcut alanlar ...
    'stockStatus' => $product->get_stock_status(),
    'stockQuantity' => $product->get_stock_quantity(),
    'isInStock' => $product->is_in_stock(),
];
```

**TypeScript:**

```typescript
export interface Product {
  // ... mevcut alanlar ...
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;
  isInStock?: boolean;
}

export interface GeminiResponse {
  responseType: 'text' | 'recommendation' | 'stock_info';
  // ... mevcut alanlar ...
  stockInfo?: { productId: string; inStock: boolean; quantity?: number }[];
}
```

**AI Eğitimi:**

```
STOCK QUERIES: If user asks "stokta var mı?", "is this in stock?", 
use the stock information from the cached product data and provide 
a helpful response. Set responseType to 'stock_info' when providing stock information.
```

---

### 5. Mail bırak → müşteri hizmetlerine ilet

**Zorluk:** Orta-düşük  
**Süre:** 3-4 saat  
**Dosyalar:** `components/ChatWidget.tsx`, `peleman-chatbot.php`

**Yapılacaklar:**

- ChatWidget'a email input formu ekle
- PHP'de AJAX handler (`wp_ajax_peleman_send_email`)
- Email template oluştur

**Kod:**

```php
function peleman_send_email() {
    $email = sanitize_email($_POST['email']);
    $message = sanitize_textarea_field($_POST['message']);
    $chat_history = json_decode(stripslashes($_POST['chat_history']), true);
    
    $subject = 'Müşteri Hizmetleri Talebi';
    $body = peleman_build_email_template($email, $message, $chat_history);
    
    wp_mail(get_option('admin_email'), $subject, $body);
    wp_send_json_success();
}
add_action('wp_ajax_peleman_send_email', 'peleman_send_email');
add_action('wp_ajax_nopriv_peleman_send_email', 'peleman_send_email');
```

---

### 6. Konuşmayı mail'e gönder

**Zorluk:** Orta-düşük  
**Süre:** 2-3 saat  
**Dosyalar:** `components/ChatWidget.tsx`, `peleman-chatbot.php`

**Yapılacaklar:**

- ChatWidget'a "Mail'e gönder" butonu
- Mesaj geçmişini HTML formatında hazırla
- PHP'de email gönder

---

## SEVIYE 3: Orta (1-2 gün) ⭐⭐⭐

### 7. Fatura/irsaliye indirme linki

**Zorluk:** Orta  
**Süre:** 1-2 gün  
**Dosyalar:** `peleman-chatbot.php`, `types.ts`, `services/invoices.ts`, `services/gemini.ts`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- REST API endpoint: `/peleman-chatbot/v1/invoices`
- **Login kontrolü:** Sadece login olmuş kullanıcılar için aktif
- Kullanıcı authentication kontrolü
- WooCommerce invoice plugin entegrasyonu veya custom PDF
- TypeScript type tanımları ve servis
- AI eğitimi: Response Schema ve System Instruction
- Frontend: Fatura listesi UI component (login kontrolü ile)

---

### 8. Müşteri temsilcisi email bildirimi

**Zorluk:** Orta  
**Süre:** 1.5 saat  
**Dosyalar:** `peleman-chatbot.php`, `types.ts`, `services/contact.ts`, `services/gemini.ts`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- REST API endpoint: `/peleman-chatbot/v1/contact-representative`
- **Login kontrolü:** Sadece login olmuş kullanıcılar için aktif
- Email template fonksiyonu (chat geçmişi formatlama)
- TypeScript type tanımları ve servis
- AI eğitimi: Response Schema ve System Instruction
- Frontend: Email formu UI component (login kontrolü ile)
- WordPress Admin: Müşteri temsilcisi email ayarı

---

### 9. Sipariş durumu sorgulama

**Zorluk:** Orta  
**Süre:** 1-2 gün  
**Dosyalar:** `peleman-chatbot.php`, `services/orders.ts`, `services/gemini.ts`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- REST API endpoint: `/peleman-chatbot/v1/orders`
- **Login kontrolü:** Sadece login olmuş kullanıcılar için aktif
- Kullanıcı doğrulama kontrolü
- Sipariş listesi ve durum bilgisi
- ChatWidget'a sipariş kartları ekle (login kontrolü ile)

---

### 10. Tekrar sipariş ver (1 tık)

**Zorluk:** Orta  
**Süre:** 1-2 gün  
**Dosyalar:** `peleman-chatbot.php`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- **Login kontrolü:** Sadece login olmuş kullanıcılar için aktif
- Sipariş ürünlerini sepete ekleme endpoint'i
- "Tekrar Sipariş Ver" butonu (login kontrolü ile)
- WooCommerce cart'a yönlendirme

---

### 11. Favoriler / sık alınanlar

**Zorluk:** Orta  
**Süre:** 1-2 gün  
**Dosyalar:** `peleman-chatbot.php`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- **Login kontrolü:** Sadece login olmuş kullanıcılar için aktif
- Favori ürünleri kaydetme sistemi
- REST API endpoint (login kontrolü ile)
- "Favorilerim" butonu ve liste (login kontrolü ile)

---

## SEVIYE 4: Zor (3-5 gün) ⭐⭐⭐⭐

### 12. Ticket sistemi + dosya yükleme

**Zorluk:** Yüksek  
**Süre:** 3-5 gün  
**Dosyalar:** `peleman-chatbot.php`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- Custom post type: `peleman_ticket`
- File upload handler (WordPress media library)
- Admin panelde ticket listesi
- Email bildirimleri

---

### 13. Proje bazlı işlemler

**Zorluk:** Yüksek  
**Süre:** 3-5 gün  
**Dosyalar:** `peleman-chatbot.php`, `components/ChatWidget.tsx`

**Yapılacaklar:**

- Proje kaydetme sistemi
- Proje listesi endpoint'i
- Proje detay sayfası
- Projeyi sepete ekleme

---

## SEVIYE 5: Çok Zor (1+ hafta) ⭐⭐⭐⭐⭐

### 15. Tamamlayıcı ürün önerisi (cross-sell)

**Zorluk:** Çok yüksek  
**Süre:** 1+ hafta  
**Dosyalar:** `services/gemini.ts`, yeni analiz servisi

**Yapılacaklar:**

- Satış verilerini analiz etme
- Ürün ilişkilerini öğrenme
- Gemini'ye cross-sell prompt'u ekleme

---

### 16. Sepet büyütme önerisi

**Zorluk:** Çok yüksek  
**Süre:** 1+ hafta  
**Dosyalar:** `peleman-chatbot.php`, `services/gemini.ts`

**Yapılacaklar:**

- Sepet toplamını kontrol etme
- Kargo kurallarını okuma
- Ürün önerisi algoritması

---

## Öncelik Sırası (Önerilen)

### MVP - Hızlı Kazanımlar (1 gün)

1. ✅ Kayıtlı müşteri ise isimle hitap (1-2 saat)
2. ✅ Hızlı butonlar (1-2 saat)
3. ✅ Çok dilli destek (1-2 saat)
4. ✅ Stok sorgulama - basit (3-4 saat)
5. ✅ Mail bırak → müşteri hizmetlerine ilet (3-4 saat)

**Toplam:** ~10-14 saat (1.5-2 gün)

---

### v2 - Orta Vadeli (1 hafta)

1. ✅ Konuşmayı mail'e gönder (2-3 saat)
2. ✅ Fatura/irsaliye indirme linki (1-2 gün)
3. ✅ Müşteri temsilcisi email bildirimi (1.5 saat)
4. ✅ Sipariş durumu sorgulama (1-2 gün)
5. ✅ Tekrar sipariş ver (1-2 gün)
6. ✅ Favoriler / sık alınanlar (1-2 gün)

**Toplam:** ~5-7 gün

---

### v3 - Uzun Vadeli (2-3 hafta)

1. ✅ Ticket sistemi + dosya yükleme (3-5 gün)
2. ✅ Proje bazlı işlemler (3-5 gün)
3. ✅ Teklif oluşturma (3-5 gün)

**Toplam:** ~9-15 gün

---

### v4 - Enterprise (1+ ay)

1. ✅ Tamamlayıcı ürün önerisi (1+ hafta)
2. ✅ Sepet büyütme önerisi (1+ hafta)

---

## Atılan Özellikler ❌

- ❌ Minimum sipariş miktarı kontrolü
- ❌ Increment step bilgisi
- ❌ Gerçek zamanlı stok kontrol endpoint'i (cache yeterli)

---

## İlk Adım: MVP Özellikleri

**Başlangıç sırası:**

1. ✅ **Login Kontrolü ve İki Farklı Chatbot Ekranı** (SEVIYE 0 - ÖNCE BU!)
2. Kayıtlı müşteri ise isimle hitap
3. Hızlı butonlar
4. Çok dilli destek
5. Stok sorgulama (basit)
6. Mail bırak → müşteri hizmetlerine ilet

**ÖNEMLİ NOT:** Her özellik tamamlandığında "Login kontrolü ekleyeyim mi?" sorusu sorulacak.

Bu sırayla başlayalım mı?