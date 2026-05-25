export interface ElementConfig {
  id: string;
  type: 'text' | 'image' | 'container' | 'button' | 'icon';
  content?: string;
  src?: string;
  styles: ElementStyles;
}

export interface ElementStyles {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  width?: string | number;
  height?: string | number;
  fontSize?: string | number;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string | number;
  borderRadius?: string | number;
  boxShadow?: string;
  opacity?: number;
  padding?: string | number;
  margin?: string | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  display?: string;
  gap?: string | number;
  zIndex?: number;
  filter?: string;
  filterBrightness?: string | number;
}

export interface LayerImage {
  id: string;
  name: string;
  src: string;
  type: 'fundo' | 'madeira' | 'nucleo' | 'pedra' | 'filete' | 'logo';
  price?: number;
  symbolism?: string;
}

export interface TextureItem {
  id: string;
  name: string;
  src: string;
  type: 'madeira' | 'pedra' | 'metal';
  symbolism?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  material: string;
  description: string;
  symbolism?: string;
  layerIds?: string[]; // To track exact combinations
  category?: 'ring' | 'box' | 'set' | 'kit' | 'other';
  originalPrice?: number;
  promoBadge?: string;
  isPromotional?: boolean;
}

export interface PricingRule {
  id: string;
  name: string;
  condition: {
    hasWood?: boolean;
    hasNucleo?: boolean;
    nucleoType?: string; // e.g., 'cobre'
    hasStone?: boolean;
    hasFilete?: boolean;
    fileteType?: string; // e.g., 'prata'
  };
  price: number;
}

export interface AppConfig {
  elements: Record<string, ElementConfig>;
  layers: LayerImage[];
  textures?: TextureItem[];
  customProducts: Product[];
  pricingRules: PricingRule[];
  manualPriceOverrides: Record<string, number>;
  uiAssets: {
    logo?: string;
    logoWidth?: number;
    buttonBackground?: string;
    heroBackground?: string;
    brightnessHero?: number;
    heroBackgroundScale?: number;
    bgButtonWoods?: string;
    bgButtonStones?: string;
    bgButtonMetals?: string;
    announcementBarActive?: boolean;
    freeShippingPromoActive?: boolean;
    announcementBarText?: string;
    announcementBarBg?: string;
    announcementBarColor?: string;
    customSections?: CustomSection[];
    interfaceImages: Record<string, string>;
    customFields: Record<string, string>;
    colorScheme?: 'original' | 'gold';
    testPromoPriceActive?: boolean;
    testPromoPriceValue?: number;
    bulkPromoActive?: boolean;
    bulkPromoType?: 'percentage' | 'fixed';
    bulkPromoValue?: number;
    
    // About Us page fields
    aboutTitle?: string;
    aboutSubtitle?: string;
    aboutText?: string;
    aboutImage?: string;
    aboutVideoUrl?: string;
    aboutStats1Value?: string;
    aboutStats1Label?: string;
    aboutStats2Value?: string;
    aboutStats2Label?: string;
    
    // Contact page fields
    contactTitle?: string;
    contactSubtitle?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    contactImage?: string;
    contactVideoUrl?: string;
    contactInstagram?: string;
    contactFacebook?: string;
  };
  globalTheme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    accentColor: string;
  };
  stats: {
    visits: number;
    salesCount: number;
    totalRevenue: number;
    activeProductsCount: number;
  };
  evaluations?: Evaluation[];
  contactMessages?: ContactMessage[];
}

export interface CustomSection {
  id: string;
  type: 'banner' | 'text' | 'testimonial' | 'feature' | 'image_text';
  title: string;
  subtitle?: string;
  image?: string;
  linkText?: string;
  linkUrl?: string;
  bgColor?: string;
  textColor?: string;
}

export interface Evaluation {
  id: string;
  clientName: string;
  rating: number; // 1 to 5
  comment: string;
  imageUrl?: string; // Base64 or uploaded URL
  avatarColor?: string; // Background color for letters avatar
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  material: string;
  description: string;
  size: number;
  quantity: number;
}


