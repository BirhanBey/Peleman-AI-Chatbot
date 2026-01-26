import { Product, Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'photobook_hardcover',
    name: 'Hardcover Photobook',
    description: 'Premium sert kapaklı, profesyonel fotoğraf albümleri.',
    thumbnail: 'https://picsum.photos/id/24/300/200',
    url: '/urun-kategorisi/photobook-hardcover' // Example WP URL
  },
  {
    id: 'photobook_softcover',
    name: 'Softcover Photobook',
    description: 'Esnek kapaklı, hafif ve modern fotoğraf kitapları.',
    thumbnail: 'https://picsum.photos/id/20/300/200',
    url: '/urun-kategorisi/photobook-softcover'
  },
  {
    id: 'v_paper',
    name: 'V-Paper',
    description: 'Tamamen düz açılan özel patentli kağıt teknolojisi.',
    thumbnail: 'https://picsum.photos/id/180/300/200',
    url: '/urun-kategorisi/v-paper'
  },
  {
    id: 'binding_machines',
    name: 'Ciltleme Makineleri',
    description: 'Ofis ve profesyonel kullanım için termal ciltleme sistemleri.',
    thumbnail: 'https://picsum.photos/id/3/300/200',
    url: '/urun-kategorisi/binding-machines'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    category: 'photobook_hardcover',
    name: 'Peleman Classic Hardcover A4',
    description: 'Lüks deri dokulu kaplama, A4 dikey format.',
    price: '₺450',
    image: 'https://picsum.photos/id/24/600/400'
  },
  {
    id: 'p2',
    category: 'photobook_hardcover',
    name: 'Peleman Premium Square',
    description: '30x30cm kare format, kişiselleştirilebilir pencere.',
    price: '₺600',
    image: 'https://picsum.photos/id/42/600/400'
  },
  {
    id: 'p3',
    category: 'photobook_softcover',
    name: 'FlexiBook A5',
    description: 'Günlük anılar için ideal, yumuşak kapak.',
    price: '₺250',
    image: 'https://picsum.photos/id/20/600/400'
  },
  {
    id: 'p4',
    category: 'v_paper',
    name: 'V-Paper A4 Glossy',
    description: '120gr parlak yüzey, 500 adet paket.',
    price: '₺800',
    image: 'https://picsum.photos/id/180/600/400'
  },
  {
    id: 'p5',
    category: 'binding_machines',
    name: 'Thermal Binder 8.2',
    description: 'Aynı anda birden fazla dokümanı ciltleme kapasitesi.',
    price: '₺4500',
    image: 'https://picsum.photos/id/3/600/400'
  }
];

export const getCategoryById = (id: string) => CATEGORIES.find(c => c.id === id);
export const getProductsByCategory = (catId: string) => PRODUCTS.filter(p => p.category === catId);