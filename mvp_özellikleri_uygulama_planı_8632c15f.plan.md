---
name: MVP Özellikleri Uygulama Planı
overview: Bugün kararlaştırılan MVP özelliklerinin (Stok sorgulama hibrit, Minimum sipariş miktarı, Fatura/irsaliye indirme) adım adım uygulama planı
todos:
  - id: stock-1
    content: PHP - Cache'e stok bilgilerini ekleme (stockStatus, stockQuantity, isInStock)
    status: pending
  - id: stock-2
    content: PHP - Gerçek zamanlı stok kontrol endpoint'i oluşturma (/peleman-chatbot/v1/stock-check)
    status: pending
  - id: stock-3
    content: TypeScript - Type tanımları güncelleme (Product ve GeminiResponse interface'lerine stok alanları)
    status: pending
  - id: stock-4
    content: TypeScript - Stok kontrol servisi oluşturma (services/stock.ts)
    status: pending
  - id: stock-5
    content: AI Eğitimi - Response Schema güncelleme (stock_query response type ekleme)
    status: pending
  - id: stock-6
    content: AI Eğitimi - System Instruction güncelleme (stok sorgulama davranışı ekleme)
    status: pending
  - id: stock-7
    content: Frontend - Stok sorgusu işleme ve UI component (ChatWidget.tsx)
    status: pending
  - id: stock-8
    content: Stok sorgulama test ve doğrulama
    status: pending
  - id: minqty-1
    content: PHP - Cache'e minimum sipariş miktarı ekleme (minOrderQuantity)
    status: pending
  - id: minqty-2
    content: AI Eğitimi - System Instruction güncelleme (minimum sipariş davranışı)
    status: pending
  - id: minqty-3
    content: Frontend - Minimum miktar gösterimi UI component
    status: pending
  - id: minqty-4
    content: Minimum miktar test ve doğrulama
    status: pending
  - id: invoice-1
    content: PHP - Sipariş fatura endpoint'i oluşturma (/peleman-chatbot/v1/invoices)
    status: pending
  - id: invoice-2
    content: TypeScript - Invoice type tanımları ve servis oluşturma
    status: pending
  - id: invoice-3
    content: AI Eğitimi - Response Schema ve System Instruction güncelleme (invoice_request)
    status: pending
  - id: invoice-4
    content: Frontend - Fatura listesi UI component
    status: pending
  - id: invoice-5
    content: Fatura özelliği test ve doğrulama
    status: pending
  - id: general-1
    content: Cache temizleme ve yeniden oluşturma
    status: pending
  - id: general-2
    content: Build ve TypeScript hata kontrolü
    status: pending
  - id: general-3
    content: Tüm özelliklerin entegrasyon testi
    status: pending
isProject: false
---

# MVP Özellikleri Uygulama Planı - Yarın İçin

## Genel Bakış

Bugün kararlaştırılan MVP özelliklerini implemente etmek için detaylı adım adım plan. Hibrit yaklaşım kullanılacak: Cache'e bilgi ekleme + gerçek zamanlı endpoint'ler.

**Hedef Süre:** 1 gün (8 saat)
**Öncelik:** MVP özellikleri (Stok, Minimum Miktar, Fatura)

---

## ÖZELLİK 1: Stok Sorgulama (Hibrit Yaklaşım) 🔴 YÜKSEK ÖNCELİK

### Adım 1.1: PHP - Cache'e Stok Bilgilerini Ekleme (30 dk)

**Dosya:** `peleman-chatbot/peleman-chatbot.php`

**Yapılacaklar:**

- Satır 191-204 arasındaki `return` array'ine ekle:
  - `'stockStatus' => $product->get_stock_status()` (instock/outofstock/onbackorder)
  - `'stockQuantity' => $product->get_stock_quantity()` (sayısal değer veya null)
  - `'isInStock' => $product->is_in_stock()` (boolean)

**Kod Değişikliği:**

```php
return [
    'id' => (string) $product->get_id(),
    'name' => $product->get_name(),
    // ... mevcut alanlar ...
    'stockStatus' => $product->get_stock_status(),
    'stockQuantity' => $product->get_stock_quantity(),
    'isInStock' => $product->is_in_stock(),
];
```

**Test:** Cache'i temizle ve yeniden oluştur, stok bilgilerinin geldiğini kontrol et

---

### Adım 1.2: PHP - Gerçek Zamanlı Stok Kontrol Endpoint'i (45 dk)

**Dosya:** `peleman-chatbot/peleman-chatbot.php`

**Yapılacaklar:**

- Yeni REST API endpoint: `/peleman-chatbot/v1/stock-check`
- Fonksiyon: `peleman_check_stock()`
- Parametre: `product_id` (tek veya çoklu)
- Response: Stok durumu, miktar, minimum sipariş

**Endpoint Örneği:**

```php
function peleman_check_stock(WP_REST_Request $request) {
    $product_ids = $request->get_param('product_ids'); // Array veya string
    // ... stok kontrolü ...
    return rest_ensure_response($stock_data);
}
```

**Test:** Postman/curl ile endpoint'i test et

---

### Adım 1.3: TypeScript - Type Tanımları Güncelleme (15 dk)

**Dosya:** `types.ts`

**Yapılacaklar:**

- `Product` interface'ine ekle:
  - `stockStatus?: 'instock' | 'outofstock' | 'onbackorder'`
  - `stockQuantity?: number`
  - `isInStock?: boolean`
  - `minOrderQuantity?: number`
- `GeminiResponse` interface'ine ekle:
  - `responseType: 'text' | 'recommendation' | 'stock_query'`
  - `stockInfo?: { productId: string, inStock: boolean, quantity?: number }[]`

**Kod Değişikliği:**

```typescript
export interface Product {
  // ... mevcut alanlar ...
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;
  isInStock?: boolean;
  minOrderQuantity?: number;
}

export interface GeminiResponse {
  responseType: 'text' | 'recommendation' | 'stock_query' | 'min_quantity_check';
  // ... mevcut alanlar ...
  stockInfo?: StockInfo[];
  minQuantity?: { productId: string; minQty: number }[];
}
```

---

### Adım 1.4: TypeScript - Stok Kontrol Servisi Oluşturma (30 dk)

**Dosya:** `services/stock.ts` (YENİ)

**Yapılacaklar:**

- `checkStock()` fonksiyonu oluştur
- REST API endpoint'ini çağır
- Error handling ekle

**Kod Yapısı:**

```typescript
export const checkStock = async (productIds: string[]): Promise<StockInfo[]> => {
  // API çağrısı
  // Error handling
  // Return stock info
};
```

---

### Adım 1.5: AI Eğitimi - Response Schema Güncelleme (20 dk)

**Dosya:** `services/gemini.ts`

**Yapılacaklar:**

- `buildResponseSchema` fonksiyonuna `stock_query` response type ekle
- `stockInfo` array property ekle
- Description'ları güncelle

**Kod Değişikliği:**

```typescript
responseType: {
  enum: ['text', 'recommendation', 'stock_query', 'min_quantity_check'],
  description: "Use 'stock_query' when user asks about stock availability..."
},
stockInfo: {
  type: Type.ARRAY,
  items: { /* stock info object */ }
}
```

---

### Adım 1.6: AI Eğitimi - System Instruction Güncelleme (30 dk)

**Dosya:** `services/gemini.ts`

**Yapılacaklar:**

- `buildSystemInstruction` fonksiyonuna stok sorgulama davranışı ekle
- Ürün formatına stok bilgilerini ekle
- Örnek sorular ve cevaplar ekle

**Eklemeler:**

```
Behavior:
...
6. STOCK QUERIES: If user asks "stokta var mı?", "is this in stock?", 
   set responseType to 'stock_query' and provide productId(s) in stockInfo array.
```

---

### Adım 1.7: Frontend - Stok Sorgusu İşleme (45 dk)

**Dosya:** `components/ChatWidget.tsx`

**Yapılacaklar:**

- `handleSend` fonksiyonunda `stock_query` response type kontrolü
- Stok bilgisini gösteren UI component
- Gerçek zamanlı stok kontrolü yapma (cache'deki bilgi + API çağrısı)

**Kod Yapısı:**

```typescript
if (response.responseType === 'stock_query') {
  // Gerçek zamanlı stok kontrolü yap
  const realTimeStock = await checkStock(response.stockInfo.map(s => s.productId));
  // UI'da göster
}
```

**UI:** Stok durumunu gösteren kart/component ekle

---

### Adım 1.8: Test ve Doğrulama (30 dk)

**Test Senaryoları:**

1. "Bu ürün stokta var mı?" sorusu
2. Çoklu ürün stok sorgusu
3. Stokta olmayan ürün sorgusu
4. Gerçek zamanlı kontrol çalışıyor mu?

**Toplam Süre:** ~3.5 saat

---

## ÖZELLİK 2: Minimum Sipariş Miktarı Kontrolü 🟡 ORTA ÖNCELİK

### Adım 2.1: PHP - Cache'e Minimum Miktar Ekleme (20 dk)

**Dosya:** `peleman-chatbot/peleman-chatbot.php`

**Yapılacaklar:**

- Satır 191-204 arasındaki `return` array'ine ekle:
  - `'minOrderQuantity' => get_post_meta($product->get_id(), '_min_order_quantity', true) ?: 1`

**Not:** WooCommerce'te minimum miktar genellikle meta field olarak saklanır. Plugin kullanılıyorsa farklı olabilir.

---

### Adım 2.2: TypeScript - Type Güncelleme (10 dk)

**Dosya:** `types.ts`

**Yapılacaklar:**

- `Product` interface'ine `minOrderQuantity?: number` ekle (zaten Adım 1.3'te eklendi)
- `GeminiResponse` interface'ine `minQuantity` array ekle (zaten Adım 1.3'te eklendi)

---

### Adım 2.3: AI Eğitimi - Response Schema (15 dk)

**Dosya:** `services/gemini.ts`

**Yapılacaklar:**

- `buildResponseSchema`'ya `min_quantity_check` response type ekle (zaten Adım 1.5'te eklendi)
- `minQuantity` property ekle

---

### Adım 2.4: AI Eğitimi - System Instruction (20 dk)

**Dosya:** `services/gemini.ts`

**Yapılacaklar:**

- System instruction'a minimum sipariş davranışı ekle
- Örnek sorular: "minimum sipariş", "minimum order", "min quantity"

**Eklemeler:**

```
7. MINIMUM ORDER: If user asks "minimum sipariş", "minimum order",
   set responseType to 'min_quantity_check' and provide productId and minQty.
```

---

### Adım 2.5: Frontend - Minimum Miktar Gösterimi (30 dk)

**Dosya:** `components/ChatWidget.tsx`

**Yapılacaklar:**

- `min_quantity_check` response type'ını işle
- Minimum miktar bilgisini gösteren UI component
- Ürün kartlarında minimum miktar gösterimi

**UI:** "Minimum sipariş: X adet" şeklinde gösterim

---

### Adım 2.6: Test (15 dk)

**Test Senaryoları:**

1. "Bu ürünün minimum siparişi nedir?" sorusu
2. Minimum miktar bilgisi doğru gösteriliyor mu?

**Toplam Süre:** ~1.5 saat

---

## ÖZELLİK 3: Fatura/İrsaliye İndirme Linki 🟢 DÜŞÜK ÖNCELİK

### Adım 3.1: PHP - Sipariş Fatura Endpoint'i (45 dk)

**Dosya:** `peleman-chatbot/peleman-chatbot.php`

**Yapılacaklar:**

- REST API endpoint: `/peleman-chatbot/v1/invoices`
- Fonksiyon: `peleman_get_invoices()`
- Kullanıcı authentication kontrolü
- WooCommerce invoice plugin entegrasyonu veya custom PDF

**Endpoint Örneği:**

```php
function peleman_get_invoices(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    if (!$user_id) {
        return new WP_Error('unauthorized', 'User not logged in', ['status' => 401]);
    }
    // Siparişleri getir
    // Fatura linklerini oluştur
    return rest_ensure_response($invoices);
}
```

**Not:** WooCommerce invoice plugin'i varsa onun API'sini kullan, yoksa custom PDF oluşturma gerekebilir.

---

### Adım 3.2: TypeScript - Type Tanımları (10 dk)

**Dosya:** `types.ts`

**Yapılacaklar:**

- Yeni interface: `Invoice`
- `GeminiResponse`'a `invoice_request` response type ekle

**Kod:**

```typescript
export interface Invoice {
  orderId: string;
  orderNumber: string;
  date: string;
  invoiceUrl: string;
  total: string;
}

export interface GeminiResponse {
  responseType: 'text' | 'recommendation' | 'stock_query' | 'min_quantity_check' | 'invoice_request';
  invoices?: Invoice[];
}
```

---

### Adım 3.3: TypeScript - Fatura Servisi (30 dk)

**Dosya:** `services/invoices.ts` (YENİ)

**Yapılacaklar:**

- `fetchInvoices()` fonksiyonu
- REST API çağrısı
- Error handling

---

### Adım 3.4: AI Eğitimi - Response Schema (15 dk)

**Dosya:** `services/gemini.ts`

**Yapılacaklar:**

- `invoice_request` response type ekle
- `invoices` array property ekle

---

### Adım 3.5: AI Eğitimi - System Instruction (20 dk)

**Dosya:** `services/gemini.ts`

**Yapılacaklar:**

- Fatura sorgulama davranışı ekle
- Örnek sorular: "faturalarım", "invoice", "fatura indir"

---

### Adım 3.6: Frontend - Fatura Listesi UI (45 dk)

**Dosya:** `components/ChatWidget.tsx`

**Yapılacaklar:**

- `invoice_request` response type'ını işle
- Fatura listesi gösteren UI component
- Fatura kartları (tarih, tutar, indirme linki)

**UI:** Fatura kartları, indirme butonları

---

### Adım 3.7: Test (20 dk)

**Test Senaryoları:**

1. "Faturalarımı göster" sorusu
2. Fatura listesi doğru geliyor mu?
3. İndirme linkleri çalışıyor mu?

**Toplam Süre:** ~2.5 saat

---

## Genel Görevler (Tüm Özellikler İçin)

### Adım 4.1: Cache Temizleme ve Yeniden Oluşturma (15 dk)

**Yapılacaklar:**

- WordPress admin panelden cache'i temizle
- Cache'i yeniden oluştur
- Yeni alanların geldiğini kontrol et

---

### Adım 4.2: Build ve Test (30 dk)

**Yapılacaklar:**

- `npm run build` çalıştır
- TypeScript hatalarını kontrol et
- Build başarılı mı?

---

### Adım 4.3: Entegrasyon Testi (45 dk)

**Yapılacaklar:**

- Tüm özellikleri birlikte test et
- AI'nın doğru response type'ları kullandığını kontrol et
- UI'da tüm özellikler çalışıyor mu?

---

## Zaman Çizelgesi (Önerilen Sıra)

### Sabah (4 saat)

1. ✅ **Stok Sorgulama - Backend** (Adım 1.1-1.3) - 1.5 saat
2. ✅ **Stok Sorgulama - AI Eğitimi** (Adım 1.5-1.6) - 50 dk
3. ✅ **Minimum Miktar - Backend** (Adım 2.1-2.2) - 30 dk
4. ✅ **Minimum Miktar - AI Eğitimi** (Adım 2.3-2.4) - 35 dk

### Öğleden Sonra (4 saat)

1. ✅ **Stok Sorgulama - Frontend** (Adım 1.4, 1.7) - 1.25 saat
2. ✅ **Minimum Miktar - Frontend** (Adım 2.5) - 30 dk
3. ✅ **Fatura - Backend** (Adım 3.1-3.3) - 1.25 saat
4. ✅ **Fatura - AI Eğitimi** (Adım 3.4-3.5) - 35 dk
5. ✅ **Fatura - Frontend** (Adım 3.6) - 45 dk

### Akşam (Test)

1. ✅ **Genel Testler** (Adım 1.8, 2.6, 3.7, 4.1-4.3) - 2 saat

**Toplam:** ~8 saat

---

## Bağımlılıklar ve Önkoşullar

### WooCommerce Plugin Kontrolü

- WooCommerce aktif mi?
- Invoice plugin var mı? (varsa hangisi?)
- Minimum order quantity plugin var mı?

### Test Ortamı

- WordPress staging ortamı hazır mı?
- Test ürünleri var mı? (stoklu/stoksuz)
- Test kullanıcısı var mı? (sipariş geçmişi için)

---

## Riskler ve Çözümler

### Risk 1: Minimum Order Quantity Meta Field'ı Yok

**Çözüm:** WooCommerce'in varsayılan değeri 1 kullanılabilir veya custom field eklenebilir

### Risk 2: Invoice Plugin Yok

**Çözüm:** Custom PDF oluşturma veya WooCommerce'in varsayılan invoice sistemi kullanılabilir

### Risk 3: Stok Bilgisi Gerçek Zamanlı Değil

**Çözüm:** Cache'e eklenen bilgi + gerçek zamanlı endpoint kombinasyonu kullanılacak (hibrit yaklaşım)

---

## Başarı Kriterleri

- Stok sorgusu çalışıyor (cache + gerçek zamanlı)
- Minimum miktar bilgisi gösteriliyor
- Fatura listesi çalışıyor
- AI doğru response type'ları kullanıyor
- UI'da tüm bilgiler doğru gösteriliyor
- Build başarılı, hata yok

---

## Notlar

- Formlar (Sales/Marketing) geldiğinde marka dili ve mesajlaşma entegrasyonu yapılacak (şimdilik teknik özellikler)
- Cache güncellemesi gerekebilir (admin panelden manuel)
- WooCommerce plugin'lerinin varlığı kontrol edilmeli

