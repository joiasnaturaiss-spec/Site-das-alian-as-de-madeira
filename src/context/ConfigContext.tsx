import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppConfig, ElementConfig, ElementStyles, LayerImage, Product, PricingRule, TextureItem, Evaluation, ContactMessage } from '../types';
import { getItem, setItem } from '../lib/storage';

import { products as initialProducts } from '../pages/Catalog';

const STORAGE_KEY = 'joias_naturais_config';

const DEFAULT_CONFIG: AppConfig = {
  elements: {},
  layers: [],
  textures: [],
  customProducts: [],
  pricingRules: [
    {
      id: 'rule-standard',
      name: 'Padrão (Madeira + Pedra)',
      condition: { hasWood: true, hasStone: true },
      price: 120,
    },
    {
      id: 'rule-nucleo',
      name: 'Com Núcleo em Cobre',
      condition: { hasNucleo: true, nucleoType: 'cobre' },
      price: 135,
    },
    {
      id: 'rule-silver',
      name: 'Com Filetes em Prata',
      condition: { hasFilete: true, fileteType: 'prata' },
      price: 150,
    }
  ],
  manualPriceOverrides: {},
  uiAssets: {
    interfaceImages: {},
    customFields: {},
    customSections: [],
    announcementBarActive: false,
    freeShippingPromoActive: false,
    announcementBarText: '✨ ATELIÊ NATURECRAFT: FRETE INCLUSO NAS COMPRAS ACIMA DE R$ 500 ✨',
    announcementBarBg: '#bef264',
    announcementBarColor: '#000000',
    logoWidth: 32,
    brightnessHero: 60,
    heroBackgroundScale: 100,
    bgButtonWoods: '',
    bgButtonStones: '',
    bgButtonMetals: '',
    colorScheme: 'original',
    testPromoPriceActive: false,
    testPromoPriceValue: 1.00,
    bulkPromoActive: false,
    bulkPromoType: 'fixed',
    bulkPromoValue: 10.00,
    
    // Default About Us Content
    aboutTitle: 'Nossa Essência',
    aboutSubtitle: 'Nossa Essência',
    aboutText: 'Fundada em 2018, a Jóias Naturais nasceu do desejo de reconectar o luxo com a simplicidade orgânica da terra. Acreditamos que uma aliança não é apenas uma joia, mas um fragmento de história, moldado pela natureza e refinado pelo homem. Utilizamos apenas madeiras de descarte certificado ou reaproveitamento nobre, garantindo que cada peça preserve a vida das nossas florestas. Cada anel passa por mais de 40 processos manuais de lixamento, enceramento e polimento até atingir o brilho profundo e a textura aveludada que é nossa marca registrada.',
    aboutImage: 'https://images.unsplash.com/photo-1544411047-c4912344057e?auto=format&fit=crop&q=80&w=800',
    aboutVideoUrl: '',
    aboutStats1Value: '100%',
    aboutStats1Label: 'Handmade',
    aboutStats2Value: 'Certificado',
    aboutStats2Label: 'Origem Ética',
    
    // Default Contact Content
    contactTitle: 'CONTATO',
    contactSubtitle: 'Fale com nossos artesãos especialistas',
    contactEmail: 'atendimento@joiasnaturais.com.br',
    contactPhone: '+55 (11) 99999-8888',
    contactAddress: 'São Paulo, Brasil',
    contactImage: '',
    contactVideoUrl: '',
    contactInstagram: 'https://instagram.com',
    contactFacebook: 'https://facebook.com',
  },
  globalTheme: {
    primaryColor: '#bef264',
    secondaryColor: '#65a30d',
    backgroundColor: '#000000',
    accentColor: '#bef264',
  },
  stats: {
    visits: 0,
    salesCount: 0,
    totalRevenue: 0,
    activeProductsCount: 0,
  },
  evaluations: [
    {
      id: 'eval-1',
      clientName: 'Alessandra Santos',
      rating: 5,
      comment: 'Minha aliança de madeira com jacarandá e turquesa ficou maravilhosa. Cada detalhe mostra o cuidado do trabalho artesanal!',
      imageUrl: '',
      avatarColor: '#fca5a5',
      createdAt: '2026-05-18',
      status: 'approved'
    },
    {
      id: 'eval-2',
      clientName: 'Marcos Oliveira',
      rating: 5,
      comment: 'Excepcional! A textura da madeira é incrível e super confortável de usar. Atendimento nota 10.',
      imageUrl: '',
      avatarColor: '#86efac',
      createdAt: '2026-05-19',
      status: 'approved'
    },
    {
      id: 'eval-3',
      clientName: 'Danielle Ramos',
      rating: 5,
      comment: 'Estou simplesmente apaixonada! A embalagem de madeira nobre que acompanha é incrível e a gravação perfeitamente alinhada.',
      imageUrl: '',
      avatarColor: '#93c5fd',
      createdAt: '2026-05-20',
      status: 'approved'
    }
  ],
  contactMessages: []
};

interface ConfigContextType {
  config: AppConfig;
  updateElementConfig: (id: string, updates: Partial<ElementConfig>) => void;
  updateElementStyles: (id: string, styles: Partial<ElementStyles>) => void;
  registerElement: (id: string, initialConfig: ElementConfig) => void;
  addLayer: (layer: LayerImage) => void;
  removeLayer: (id: string) => void;
  addTexture: (texture: TextureItem) => void;
  removeTexture: (id: string) => void;
  addCustomProduct: (product: Product) => void;
  removeCustomProduct: (id: string) => void;
  updatePricingRule: (rule: PricingRule) => void;
  removePricingRule: (id: string) => void;
  setManualPriceOverride: (productId: string, price: number | null) => void;
  updateUIAssets: (updates: Partial<AppConfig['uiAssets']>) => void;
  incrementStat: (key: keyof AppConfig['stats'], amount?: number) => void;
  resetConfig: () => void;
  findExistingProduct: (layerIds: string[]) => Product | null;
  addEvaluation: (evaluation: Evaluation) => void;
  approveEvaluation: (id: string) => void;
  deleteEvaluation: (id: string) => void;
  permanentlyDeleteEvaluation: (id: string) => void;
  addContactMessage: (message: ContactMessage) => void;
  deleteContactMessage: (id: string) => void;
  isLoading: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  resetElementStyles: (id: string) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const [elementsHistory, setElementsHistory] = useState<Record<string, ElementConfig>[]>([]);
  const [historyIndex, setHistoryIndexState] = useState<number>(-1);
  const historyIndexRef = React.useRef<number>(-1);
  const isUndoRedoRef = React.useRef<boolean>(false);
  const historyTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize history once loading is complete
  useEffect(() => {
    if (!isLoading && elementsHistory.length === 0) {
      const initialElements = JSON.parse(JSON.stringify(config.elements || {}));
      setElementsHistory([initialElements]);
      historyIndexRef.current = 0;
      setHistoryIndexState(0);
    }
  }, [isLoading, elementsHistory.length]);

  // Watch for elements changes and save to history if it's a user action
  useEffect(() => {
    if (isLoading || !config.elements) return;

    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const currentElementsStr = JSON.stringify(config.elements);

    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
      setElementsHistory(prev => {
        const nextHistory = prev.slice(0, historyIndexRef.current + 1);
        const last = nextHistory[nextHistory.length - 1];
        if (last && JSON.stringify(last) === currentElementsStr) {
          return prev;
        }
        const parsed = JSON.parse(currentElementsStr);
        const updated = [...nextHistory, parsed];
        if (updated.length > 50) updated.shift();
        
        const newIndex = updated.length - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndexState(newIndex);
        
        return updated;
      });
    }, 400); // 400ms debounce

    return () => {
      if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    };
  }, [config.elements, isLoading]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const prevIndex = historyIndexRef.current - 1;
      const prevElements = elementsHistory[prevIndex];
      if (prevElements) {
        isUndoRedoRef.current = true;
        historyIndexRef.current = prevIndex;
        setHistoryIndexState(prevIndex);
        setConfig(prev => ({
          ...prev,
          elements: prevElements
        }));
      }
    }
  }, [elementsHistory]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < elementsHistory.length - 1) {
      const nextIndex = historyIndexRef.current + 1;
      const nextElements = elementsHistory[nextIndex];
      if (nextElements) {
        isUndoRedoRef.current = true;
        historyIndexRef.current = nextIndex;
        setHistoryIndexState(nextIndex);
        setConfig(prev => ({
          ...prev,
          elements: nextElements
        }));
      }
    }
  }, [elementsHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < elementsHistory.length - 1;

  // Load from storage on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        let savedConfig = await getItem<AppConfig>(STORAGE_KEY);
        
        if (!savedConfig) {
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy) {
            try {
              savedConfig = JSON.parse(legacy);
              if (savedConfig) {
                await setItem(STORAGE_KEY, savedConfig);
                localStorage.removeItem(STORAGE_KEY);
              }
            } catch (e) {
              console.error('Failed to parse legacy config:', e);
            }
          }
        }

        if (savedConfig) {
          // Filter out the old auto-generated products ('p1', 'p2', 'p3', 'p4') from the saved list
          const mergedProducts = (savedConfig.customProducts || []).filter(
            p => !['p1', 'p2', 'p3', 'p4'].includes(p.id)
          );

          // MIGRATION: Clean up rules that might have invalid conditions from previous versions
          const migratedRules = (savedConfig.pricingRules || DEFAULT_CONFIG.pricingRules).map(rule => {
            if (rule.id === 'rule-nucleo') {
              const newCondition = { ...rule.condition };
              // Remove restrictions that break matching when other layers are added
              delete newCondition.hasFilete;
              delete (newCondition as any).hasWood; // Make it more flexible
              delete (newCondition as any).hasStone;
              return { ...rule, name: 'Núcleo em Cobre', price: 135, condition: newCondition };
            }
            if (rule.id === 'rule-standard') {
              return { ...rule, name: 'Padrão (Madeira + Pedra)', price: 120 };
            }
            if (rule.id === 'rule-silver') {
              return { ...rule, name: 'Filetes em Prata', price: 150 };
            }
            return rule;
          });

          setConfig({
            ...DEFAULT_CONFIG,
            ...savedConfig,
            layers: savedConfig.layers || DEFAULT_CONFIG.layers,
            textures: savedConfig.textures || DEFAULT_CONFIG.textures,
            customProducts: mergedProducts,
            elements: savedConfig.elements || DEFAULT_CONFIG.elements,
            pricingRules: migratedRules,
            manualPriceOverrides: savedConfig.manualPriceOverrides || DEFAULT_CONFIG.manualPriceOverrides,
            uiAssets: {
              ...DEFAULT_CONFIG.uiAssets,
              ...(savedConfig.uiAssets || {}),
              interfaceImages: savedConfig.uiAssets?.interfaceImages || {},
              customFields: savedConfig.uiAssets?.customFields || {},
              customSections: savedConfig.uiAssets?.customSections || [],
            },
            stats: savedConfig.stats || DEFAULT_CONFIG.stats,
            evaluations: savedConfig.evaluations || DEFAULT_CONFIG.evaluations || [],
            contactMessages: savedConfig.contactMessages || DEFAULT_CONFIG.contactMessages || [],
          });
        }
      } catch (e) {
        console.error('Failed to load config:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
    // Increment visit on mount
    incrementStat('visits');
  }, []);

  // Persist to storage when config changes
  useEffect(() => {
    if (!isLoading) {
      setItem(STORAGE_KEY, config).catch(err => console.error('Auto-save failed:', err));
    }
  }, [config, isLoading]);

  // Apply theme color scheme to html root element
  useEffect(() => {
    if (!isLoading) {
      const scheme = config.uiAssets?.colorScheme || 'original';
      if (scheme === 'gold') {
        document.documentElement.classList.add('theme-gold');
      } else {
        document.documentElement.classList.remove('theme-gold');
      }
    }
  }, [config.uiAssets?.colorScheme, isLoading]);

  const findExistingProduct = useCallback((layerIds: string[]) => {
    return config.customProducts.find(p => {
      if (!p.layerIds) return false;
      if (p.layerIds.length !== layerIds.length) return false;
      return layerIds.every(id => p.layerIds?.includes(id));
    }) || null;
  }, [config.customProducts]);

  const updateElementConfig = useCallback((id: string, updates: Partial<ElementConfig>) => {
    setConfig((prev) => {
      const updatedElements = {
        ...prev.elements,
        [id]: {
          ...prev.elements[id],
          ...updates,
        },
      };
      return {
        ...prev,
        elements: updatedElements,
      };
    });
  }, []);

  const updateElementStyles = useCallback((id: string, styles: Partial<ElementStyles>) => {
    setConfig((prev) => {
      const currentElement = prev.elements[id] || { id, type: 'container', styles: {} };
      const updatedElements: Record<string, ElementConfig> = {
        ...prev.elements,
        [id]: {
          ...currentElement,
          styles: {
            ...currentElement.styles,
            ...styles,
          },
        },
      };

      // If this is a carousel ring, automatically apply the exact same styles to all other carousel rings
      if (id.startsWith('carousel-ring-')) {
        Object.keys(prev.elements).forEach((key) => {
          if (key.startsWith('carousel-ring-') && key !== id) {
            const el = prev.elements[key];
            updatedElements[key] = {
              ...el,
              styles: {
                ...el.styles,
                ...styles,
              },
            };
          }
        });
      }

      return {
        ...prev,
        elements: updatedElements,
      };
    });
  }, []);

  const registerElement = useCallback((id: string, initialConfig: ElementConfig) => {
    setConfig((prev) => {
      const existing = prev.elements[id];
      if (existing) {
        if (existing.src === initialConfig.src && existing.content === initialConfig.content) {
          return prev;
        }
        return {
          ...prev,
          elements: {
            ...prev.elements,
            [id]: {
              ...existing,
              src: initialConfig.src !== undefined ? initialConfig.src : existing.src,
              content: initialConfig.content !== undefined ? initialConfig.content : existing.content,
            },
          },
        };
      }

      // If it's a new carousel ring element, look if we already have another carousel ring styles to clone
      let finalConfig = { ...initialConfig };
      if (id.startsWith('carousel-ring-')) {
        const existingCarouselKey = Object.keys(prev.elements).find(key => key.startsWith('carousel-ring-'));
        if (existingCarouselKey && prev.elements[existingCarouselKey]?.styles) {
          finalConfig.styles = {
            ...finalConfig.styles,
            ...prev.elements[existingCarouselKey].styles,
          };
        }
      }

      return {
        ...prev,
        elements: {
          ...prev.elements,
          [id]: finalConfig,
        },
      };
    });
  }, []);

  const addLayer = useCallback((layer: LayerImage) => {
    setConfig((prev) => ({
      ...prev,
      layers: [...prev.layers, layer],
    }));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
    }));
  }, []);

  const addTexture = useCallback((texture: TextureItem) => {
    setConfig((prev) => ({
      ...prev,
      textures: [...(prev.textures || []), texture],
    }));
  }, []);

  const removeTexture = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      textures: (prev.textures || []).filter((t) => t.id !== id),
    }));
  }, []);

  const addCustomProduct = useCallback((product: Product) => {
    setConfig((prev) => {
      // Check if product with these layers already exists
      if (product.layerIds) {
        const existing = prev.customProducts.find(p => {
          if (!p.layerIds) return false;
          if (p.layerIds.length !== product.layerIds!.length) return false;
          return product.layerIds!.every(id => p.layerIds?.includes(id));
        });
        if (existing) return prev; // Don't add duplicate
      }

      return {
        ...prev,
        customProducts: [product, ...prev.customProducts],
        stats: {
          ...prev.stats,
          activeProductsCount: prev.customProducts.length + 1
        }
      };
    });
  }, []);

  const removeCustomProduct = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      customProducts: prev.customProducts.filter(p => p.id !== id),
      stats: {
        ...prev.stats,
        activeProductsCount: Math.max(0, prev.customProducts.length - 1)
      }
    }));
  }, []);

  const updatePricingRule = useCallback((rule: PricingRule) => {
    setConfig((prev) => {
      const exists = prev.pricingRules.find(r => r.id === rule.id);
      return {
        ...prev,
        pricingRules: exists 
          ? prev.pricingRules.map(r => r.id === rule.id ? rule : r)
          : [...prev.pricingRules, rule]
      };
    });
  }, []);

  const removePricingRule = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      pricingRules: prev.pricingRules.filter(r => r.id !== id)
    }));
  }, []);

  const setManualPriceOverride = useCallback((productId: string, price: number | null) => {
    setConfig((prev) => {
      const newOverrides = { ...prev.manualPriceOverrides };
      if (price === null) {
        delete newOverrides[productId];
      } else {
        newOverrides[productId] = price;
      }
      return {
        ...prev,
        manualPriceOverrides: newOverrides
      };
    });
  }, []);

  const updateUIAssets = useCallback((updates: Partial<AppConfig['uiAssets']>) => {
    setConfig((prev) => {
      const nextConfig = {
        ...prev,
        uiAssets: {
          ...prev.uiAssets,
          ...updates
        }
      };

      // Ensure elements is initialized
      if (!nextConfig.elements) {
        nextConfig.elements = {};
      }

      // Automatically keep the editable 'hero-bg' image element in sync with the hero background uiAssets controls
      const heroElement = nextConfig.elements['hero-bg'] || { id: 'hero-bg', type: 'image', styles: {} };
      const heroStyles = { ...(heroElement.styles || {}) };
      let changed = false;

      if (updates.heroBackground !== undefined) {
        heroElement.src = updates.heroBackground;
        changed = true;
      }

      if (updates.heroBackgroundScale !== undefined) {
        heroStyles.scale = updates.heroBackgroundScale / 100;
        changed = true;
      }

      if (updates.brightnessHero !== undefined) {
        heroStyles.filter = `brightness(${updates.brightnessHero / 100})`;
        changed = true;
      }

      if (changed) {
        nextConfig.elements['hero-bg'] = {
          ...heroElement,
          styles: heroStyles
        };
      }

      return nextConfig;
    });
  }, []);

  const incrementStat = useCallback((key: keyof AppConfig['stats'], amount: number = 1) => {
    setConfig((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [key]: prev.stats[key] + amount
      }
    }));
  }, []);

  const addEvaluation = useCallback((evaluation: Evaluation) => {
    setConfig((prev) => ({
      ...prev,
      evaluations: [evaluation, ...(prev.evaluations || [])]
    }));
  }, []);

  const approveEvaluation = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      evaluations: (prev.evaluations || []).map((e) => e.id === id ? { ...e, status: 'approved' as const } : e)
    }));
  }, []);

  const deleteEvaluation = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      evaluations: (prev.evaluations || []).map((e) => e.id === id ? { ...e, status: 'rejected' as const } : e)
    }));
  }, []);

  const permanentlyDeleteEvaluation = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      evaluations: (prev.evaluations || []).filter((e) => e.id !== id)
    }));
  }, []);

  const addContactMessage = useCallback((message: ContactMessage) => {
    setConfig((prev) => ({
      ...prev,
      contactMessages: [message, ...(prev.contactMessages || [])]
    }));
  }, []);

  const deleteContactMessage = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      contactMessages: (prev.contactMessages || []).filter((m) => m.id !== id)
    }));
  }, []);

  const resetElementStyles = useCallback((id: string) => {
    setConfig((prev) => {
      const currentElement = prev.elements[id];
      if (!currentElement) return prev;
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [id]: {
            ...currentElement,
            styles: {}, // Reset all custom CSS styles back to code defaults
          },
        },
      };
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const mergedConfig = useMemo(() => {
    const products = config.customProducts || [];
    const isTestPromoActive = !!config.uiAssets?.testPromoPriceActive;
    const testPromoValue = Number(config.uiAssets?.testPromoPriceValue) !== undefined && !isNaN(Number(config.uiAssets?.testPromoPriceValue)) ? Number(config.uiAssets?.testPromoPriceValue) : 1.00;

    const isBulkPromoActive = !!config.uiAssets?.bulkPromoActive;
    const bulkPromoType = config.uiAssets?.bulkPromoType || 'fixed'; // 'percentage' | 'fixed_discount' | 'fixed'
    const bulkPromoValue = Number(config.uiAssets?.bulkPromoValue) || 0;

    const mappedProducts = products.map(product => {
      // 1. Preço de Teste (prioridade máxima para sandbox)
      if (isTestPromoActive) {
        return {
          ...product,
          originalPrice: product.originalPrice || product.price,
          price: testPromoValue,
          isPromotional: true,
          promoBadge: product.promoBadge || 'TESTE'
        };
      }

      // 2. Verificar se há um ajuste individual (override manual)
      let basePrice = product.price;
      let hasManualOverride = false;
      const override = config.manualPriceOverrides?.[product.id];
      if (override !== undefined && override !== null) {
        basePrice = override;
        hasManualOverride = true;
      }

      let finalPrice = basePrice;
      let originalPrice = product.originalPrice;
      let isPromotional = !!product.isPromotional || hasManualOverride;
      let promoBadge = product.promoBadge;

      // 3. Aplicar promoção em lote se ativo e se o produto não tem override individual
      if (isBulkPromoActive && !hasManualOverride) {
        originalPrice = originalPrice || product.price; // Manter o preço original cadastrado
        isPromotional = true;
        
        const globalBadgeOverride = config.uiAssets?.customFields?.bulkPromoBadgeText;
        
        if (bulkPromoType === 'percentage') {
          finalPrice = Math.max(0.01, product.price * (1 - bulkPromoValue / 100));
          promoBadge = promoBadge || globalBadgeOverride || `${bulkPromoValue}% OFF`;
        } else if (bulkPromoType === 'fixed_discount') {
          finalPrice = Math.max(0.01, product.price - bulkPromoValue);
          promoBadge = promoBadge || globalBadgeOverride || `R$ ${bulkPromoValue} OFF`;
        } else { // 'fixed' - preço fixo global
          finalPrice = bulkPromoValue;
          promoBadge = promoBadge || globalBadgeOverride || 'PROMO';
        }
      } else if (hasManualOverride) {
        // Se tem override individual manual de preço, vira promocional comparado ao original
        originalPrice = product.originalPrice || product.price;
        isPromotional = true;
        promoBadge = promoBadge || 'PROMO';
      }

      return {
        ...product,
        price: Number(Number(finalPrice).toFixed(2)),
        originalPrice: originalPrice ? Number(Number(originalPrice).toFixed(2)) : undefined,
        isPromotional,
        promoBadge
      };
    });

    return {
      ...config,
      customProducts: mappedProducts
    };
  }, [config]);

  return (
    <ConfigContext.Provider value={{ 
      config: mergedConfig, 
      updateElementConfig, 
      updateElementStyles, 
      registerElement, 
      addLayer, 
      removeLayer, 
      addTexture,
      removeTexture,
      addCustomProduct,
      removeCustomProduct,
      updatePricingRule,
      removePricingRule,
      setManualPriceOverride,
      updateUIAssets,
      incrementStat,
      resetConfig,
      findExistingProduct,
      addEvaluation,
      approveEvaluation,
      deleteEvaluation,
      permanentlyDeleteEvaluation,
      addContactMessage,
      deleteContactMessage,
      isLoading,
      undo,
      redo,
      canUndo,
      canRedo,
      resetElementStyles
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
