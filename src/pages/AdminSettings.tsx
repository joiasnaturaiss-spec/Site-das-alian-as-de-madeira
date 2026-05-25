import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, Trash2, Image as ImageIcon, 
  ArrowLeft, Save, AlertCircle, Layers,
  ChevronRight, LayoutDashboard, Tag, ShoppingBag, 
  Settings2, Eye, TrendingUp, Users, DollarSign,
  PlusCircle, Edit3, X, Upload, Feather,
  BookOpen, MessageSquare, Video, Phone, Mail, MapPin, Link, FileText,
  Instagram, Facebook, Star, Clock, CheckCircle2, Check,
  GripHorizontal, Palette, CreditCard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { LayerImage, Product, PricingRule, CustomSection, TextureItem, ContactMessage } from '../types';
import { cn } from '../lib/utils';
import { products as initialProducts } from '../pages/Catalog';

const LAYER_TYPES = [
  { id: 'fundo', name: 'Plano de Fundo' },
  { id: 'madeira', name: 'Madeira Base' },
  { id: 'nucleo', name: 'Núcleo Central' },
  { id: 'pedra', name: 'Incrustação Pedra' },
  { id: 'filete', name: 'Filetes Metálicos' },
  { id: 'logo', name: 'Logo / Marca' },
];

export function AdminSettings() {
  const navigate = useNavigate();
  const { 
    config, addLayer, removeLayer, 
    addTexture, removeTexture,
    addCustomProduct, removeCustomProduct,
    setManualPriceOverride, updateUIAssets,
    incrementStat, updatePricingRule,
    approveEvaluation, deleteEvaluation, permanentlyDeleteEvaluation, addEvaluation,
    deleteContactMessage
  } = useConfig();
  
  const [tabs, setTabs] = useState<string[]>(() => {
    const defaultTabs = ['precos', 'produtos', 'camadas', 'texturas', 'ui', 'sobre-nos', 'contatos'];
    const saved = localStorage.getItem('admin_settings_tab_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t: string) => defaultTabs.includes(t));
          let updated = false;
          defaultTabs.forEach((tab) => {
            if (!filtered.includes(tab)) {
              filtered.push(tab);
              updated = true;
            }
          });
          if (updated) {
            localStorage.setItem('admin_settings_tab_order', JSON.stringify(filtered));
          }
          return filtered;
        }
      } catch (e) {}
    }
    return defaultTabs;
  });

  const location = useLocation();
  const [activeRootTab, setActiveRootTab] = useState<string>(() => {
    const stateTab = location.state?.activeTab;
    const validTabs = ['precos', 'produtos', 'camadas', 'texture', 'ui', 'texturas', 'sobre-nos', 'contatos'];
    if (stateTab && validTabs.includes(stateTab)) {
      return stateTab;
    }
    return 'precos';
  });

  // Custom states and refs for 3-second hold to reorder tabs
  const [dragEnabledTabId, setDragEnabledTabId] = useState<string | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const startPress = (e: React.PointerEvent, tabId: string) => {
    if (e.button !== 0) return; // Only trigger for primary clicks
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    
    isHoldingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        setDragEnabledTabId(tabId);
        if (navigator.vibrate) {
          navigator.vibrate(80);
        }
      }
    }, 3000); // exactly 3 seconds
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isHoldingRef.current || !touchStartPosRef.current) return;
    const dx = e.clientX - touchStartPosRef.current.x;
    const dy = e.clientY - touchStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Cancel the timer if the user moves their finger more than 10 pixels.
    // This allows fluid lateral scrolling without activating tab drag.
    if (distance > 10 && !dragEnabledTabId) {
      cancelPress();
    }
  };

  const cancelPress = () => {
    isHoldingRef.current = false;
    touchStartPosRef.current = null;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const endPress = () => {
    cancelPress();
  };

  const handleReorder = (newOrder: string[]) => {
    setTabs(newOrder);
    localStorage.setItem('admin_settings_tab_order', JSON.stringify(newOrder));
  };

  const TAB_METADATA: Record<string, { label: string; icon: any }> = {
    precos: { label: 'Preços', icon: Tag },
    produtos: { label: 'Produtos', icon: ShoppingBag },
    camadas: { label: 'Camadas', icon: Layers },
    texturas: { label: 'Texturas', icon: Feather },
    ui: { label: 'Home', icon: Settings2 },
    'sobre-nos': { label: 'Sobre Nós', icon: BookOpen },
    contatos: { label: 'Contatos', icon: MessageSquare },
  };

  const [evaluationFilter, setEvaluationFilter] = useState<'all' | 'approved' | 'pending'>('all');
  
  // States for adding manual evaluation (Admin Custom Review Creation)
  const [isAddingEvaluation, setIsAddingEvaluation] = useState(false);
  const [newEvaluation, setNewEvaluation] = useState<{
    clientName: string;
    rating: number;
    comment: string;
    createdAt: string;
    imageUrl: string;
    status: 'approved' | 'pending';
  }>({
    clientName: '',
    rating: 5,
    comment: '',
    createdAt: new Date().toISOString().split('T')[0],
    imageUrl: '',
    status: 'approved',
  });
  
  // States for adding items
  const [isAddingLayer, setIsAddingLayer] = useState(false);
  const [newLayer, setNewLayer] = useState<Partial<LayerImage>>({ type: 'madeira' });
  
  // States for adding textures
  const [isAddingTexture, setIsAddingTexture] = useState(false);
  const [newTexture, setNewTexture] = useState<Partial<TextureItem>>({ type: 'madeira' });
  const [isSearchingSymbolism, setIsSearchingSymbolism] = useState(false);

  const handleSearchSymbolismViaIA = async () => {
    if (!newTexture.name && !newTexture.src) return;
    setIsSearchingSymbolism(true);
    try {
      const response = await fetch("/api/gemini/symbolism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTexture.name || "", image: newTexture.src }),
      });
      const data = await response.json();
      if (data.identifiedName || data.pureSymbolism || data.symbolism) {
        setNewTexture(prev => ({ 
          ...prev, 
          name: data.identifiedName || prev.name || "Material Identificado",
          symbolism: data.pureSymbolism || data.symbolism 
        }));
      }
    } catch (err) {
      console.error("Erro ao pesquisar simbolismo:", err);
    } finally {
      setIsSearchingSymbolism(false);
    }
  };
  
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ 
    category: 'other', 
    price: 0,
    material: 'Manual'
  });

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleManualReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEvaluation(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateManualReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvaluation.clientName.trim() || !newEvaluation.comment.trim()) {
      alert('Por favor, preencha o nome do cliente e o comentário.');
      return;
    }

    const colors = [
      '#bef264', '#fde047', '#6ee7b7', '#93c5fd', '#fca5a5', 
      '#fda4af', '#fca5a5', '#bef264'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addEvaluation({
      id: 'eval_manual_' + Date.now().toString(),
      clientName: newEvaluation.clientName,
      rating: newEvaluation.rating,
      comment: newEvaluation.comment,
      imageUrl: newEvaluation.imageUrl || undefined,
      avatarColor: randomColor,
      createdAt: newEvaluation.createdAt || new Date().toISOString().split('T')[0],
      status: newEvaluation.status,
    });

    // Reset state
    setNewEvaluation({
      clientName: '',
      rating: 5,
      comment: '',
      createdAt: new Date().toISOString().split('T')[0],
      imageUrl: '',
      status: 'approved',
    });
    setIsAddingEvaluation(false);
  };

  const [editingPricingRule, setEditingPricingRule] = useState<PricingRule | null>(null);

  const handleUpdatePricingRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPricingRule) return;
    updatePricingRule(editingPricingRule);
    setEditingPricingRule(null);
  };

  // Custom Sections creation states
  const [isAddingCustomSection, setIsAddingCustomSection] = useState(false);
  const [newCustomSection, setNewCustomSection] = useState<Partial<CustomSection>>({
    type: 'banner',
    title: '',
    subtitle: '',
    linkText: '',
    linkUrl: '',
    bgColor: '#141417',
    textColor: '#ffffff'
  });

  const handleCustomSectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewCustomSection({ ...newCustomSection, image: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomSection.title && !newCustomSection.subtitle) return;
    const currentSections = config.uiAssets.customSections || [];
    const addedSection: CustomSection = {
      id: `sec-${Date.now()}`,
      type: (newCustomSection.type as any) || 'banner',
      title: newCustomSection.title || '',
      subtitle: newCustomSection.subtitle || '',
      image: newCustomSection.image,
      linkText: newCustomSection.linkText || '',
      linkUrl: newCustomSection.linkUrl || '',
      bgColor: newCustomSection.bgColor || '#141417',
      textColor: newCustomSection.textColor || '#ffffff'
    };
    updateUIAssets({
      customSections: [...currentSections, addedSection]
    });
    setNewCustomSection({
      type: 'banner',
      title: '',
      subtitle: '',
      linkText: '',
      linkUrl: '',
      bgColor: '#141417',
      textColor: '#ffffff'
    });
    setIsAddingCustomSection(false);
  };

  const handleRemoveCustomSection = (id: string) => {
    const currentSections = config.uiAssets.customSections || [];
    updateUIAssets({
      customSections: currentSections.filter(sec => sec.id !== id)
    });
  };

  const allProducts = useMemo(() => {
    return config.customProducts || [];
  }, [config.customProducts]);

  const handleLayerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewLayer({ ...newLayer, src: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleTextureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Src = reader.result as string;
      setNewTexture(prev => ({ ...prev, src: base64Src }));
      
      // Automatic intelligence identifying texture material and symbolism
      setIsSearchingSymbolism(true);
      try {
        const response = await fetch("/api/gemini/symbolism", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Src, name: newTexture.name || "" }),
        });
        const data = await response.json();
        if (data.identifiedName || data.pureSymbolism || data.symbolism) {
          setNewTexture(prev => ({
            ...prev,
            name: data.identifiedName || prev.name || "Material Identificado",
            symbolism: data.pureSymbolism || data.symbolism
          }));
        }
      } catch (err) {
        console.error("Erro ao identificar material automaticamente:", err);
      } finally {
        setIsSearchingSymbolism(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewProduct({ ...newProduct, image: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleAddLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayer.name || !newLayer.src || !newLayer.type) return;
    addLayer({
      id: `layer-${Date.now()}`,
      name: newLayer.name,
      src: newLayer.src,
      type: newLayer.type as any,
      price: Number(newLayer.price || 0),
      symbolism: newLayer.symbolism || '',
    });
    setNewLayer({ type: 'madeira' });
    setIsAddingLayer(false);
  };

  const handleAddTexture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTexture.name || !newTexture.src || !newTexture.type) return;
    addTexture({
      id: `texture-${Date.now()}`,
      name: newTexture.name,
      src: newTexture.src,
      type: newTexture.type as any,
      symbolism: newTexture.symbolism || '',
    });
    setNewTexture({ type: 'madeira' });
    setIsAddingTexture(false);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.image || !newProduct.price) return;
    addCustomProduct({
      id: `p-${Date.now()}`,
      name: newProduct.name,
      price: Number(newProduct.price),
      image: newProduct.image,
      material: newProduct.material || 'Diverso',
      description: newProduct.description || '',
      symbolism: newProduct.symbolism || '',
      category: (newProduct.category as any) || 'other',
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
      promoBadge: newProduct.promoBadge || undefined,
      isPromotional: !!newProduct.isPromotional
    });
    setNewProduct({ category: 'other', price: 0, material: 'Manual', originalPrice: undefined, promoBadge: '', isPromotional: false });
    setIsAddingProduct(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans pb-12 animate-fade-in">
      {/* Fixed Header with Root Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-zinc-900 shadow-2xl z-[60]">
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/dashboard')} className="text-zinc-500 hover:text-white transition-colors cursor-pointer" title="Voltar ao Painel Geral">
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-xs uppercase tracking-widest font-bold text-brand-lime hidden sm:inline">Painel de Configuração</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-350 hover:text-white border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Painel Geral</span>
            </Link>

            <Link 
              to="/admin/settings" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1c18] border border-white/5 text-brand-lime hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Configurações</span>
            </Link>

            <Link 
              to="/" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Início</span>
            </Link>
          </div>
        </div>
        
        {/* Main Tabs */}
        <div className="mb-4">
          <Reorder.Group 
            axis="x" 
            values={tabs} 
            onReorder={handleReorder}
            className="flex flex-wrap md:flex-nowrap items-center border-b border-white/5 select-none w-full justify-start gap-y-2 pb-2 md:overflow-x-auto no-scrollbar"
          >
            {tabs.map((tabId) => {
              const tab = TAB_METADATA[tabId];
              if (!tab) return null;
              const isActive = activeRootTab === tabId;
              const isDraggable = dragEnabledTabId === tabId;
              return (
                <Reorder.Item
                  key={tabId}
                  value={tabId}
                  dragListener={isDraggable}
                  onDragEnd={() => setDragEnabledTabId(null)}
                  onPointerDown={(e) => startPress(e, tabId)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endPress}
                  onPointerCancel={endPress}
                  onPointerLeave={endPress}
                  className={cn(
                    "min-w-[65px] xs:min-w-[75px] sm:min-w-[85px] flex-shrink-0 py-2.5 px-1 sm:px-2 flex flex-col items-center gap-1 transition-all relative cursor-pointer select-none touch-none",
                    isActive ? "text-brand-lime font-bold" : "text-zinc-550 hover:text-zinc-300",
                    isDraggable ? "scale-105 bg-zinc-900 border border-brand-lime/30 rounded-xl relative z-50 duration-75 animate-pulse" : "active:scale-95"
                  )}
                  onClick={() => {
                    // Only change tab if we aren't in drag mode
                    if (!isDraggable) {
                      setActiveRootTab(tabId as any);
                    }
                  }}
                >
                  <tab.icon size={14} className="opacity-90" />
                  <span className="text-[7.5px] xs:text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-center">{tab.label}</span>
                  {isActive && (
                    <motion.div layoutId="rootTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-lime" />
                  )}
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-48 px-6 max-w-4xl mx-auto w-full">

        {/* PREÇOS SECTION */}
        {activeRootTab === 'precos' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500 border-b border-white/5 pb-2">Tabela de Preços Automática</h3>
                <div className="space-y-3">
                   {config.pricingRules.map(rule => (
                      <button 
                        key={rule.id}
                        type="button"
                        onClick={() => setEditingPricingRule(rule)}
                        className="w-full p-5 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-between hover:border-brand-lime/30 transition-all text-left cursor-pointer"
                      >
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">{rule.name}</p>
                            <p className="text-[8px] text-zinc-500">
                               {rule.condition.hasWood && 'Madeira '}
                               {rule.condition.hasStone && '+ Pedra '}
                               {rule.condition.hasNucleo && `+ Núcleo (${rule.condition.nucleoType || 'Sim'}) `}
                               {rule.condition.hasFilete && `+ Filete (${rule.condition.fileteType || 'Sim'}) `}
                            </p>
                         </div>
                         <span className="text-xl font-serif text-brand-lime">R$ {rule.price},00</span>
                      </button>
                   ))}
                </div>
             </div>

             {editingPricingRule && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-6">
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setEditingPricingRule(null)}
                     className="absolute inset-0 bg-black/90 backdrop-blur-md"
                   />
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.9, y: 30 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 w-full max-w-lg relative z-10 shadow-3xl space-y-6 animate-in zoom-in-95 duration-200"
                   >
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-serif text-white uppercase tracking-widest">Editar Regra de Preço</h3>
                         <button type="button" onClick={() => setEditingPricingRule(null)} className="text-zinc-600 hover:text-white cursor-pointer">
                            <X size={20} />
                         </button>
                      </div>

                      <form onSubmit={handleUpdatePricingRule} className="space-y-6">
                         <div className="space-y-4">
                            <div className="space-y-1">
                               <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Nome da Regra</label>
                               <input 
                                 value={editingPricingRule.name || ''}
                                 onChange={e => setEditingPricingRule({...editingPricingRule, name: e.target.value})}
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none focus:border-brand-lime/30 text-white"
                               />
                            </div>

                            <div className="space-y-1">
                               <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Valor Final (R$)</label>
                               <input 
                                 type="number"
                                 value={editingPricingRule.price || 0}
                                 onChange={e => setEditingPricingRule({...editingPricingRule, price: Number(e.target.value)})}
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-lg font-serif text-brand-lime outline-none focus:border-brand-lime/30"
                               />
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-4">
                               <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Condições de Ativação</p>
                               
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                     <div className="flex items-center gap-3">
                                        <input 
                                          type="checkbox" 
                                          id="hasNucleo"
                                          checked={!!editingPricingRule.condition.hasNucleo}
                                          onChange={e => setEditingPricingRule({
                                            ...editingPricingRule, 
                                            condition: { ...editingPricingRule.condition, hasNucleo: e.target.checked }
                                          })}
                                          className="w-4 h-4 rounded border-white/10 bg-black text-brand-lime accent-brand-lime"
                                        />
                                        <label htmlFor="hasNucleo" className="text-[10px] uppercase font-bold tracking-wider cursor-pointer select-none">Tem Núcleo?</label>
                                     </div>
                                     {editingPricingRule.condition.hasNucleo && (
                                        <input 
                                          placeholder="Tipo (ex: cobre)"
                                          value={editingPricingRule.condition.nucleoType || ''}
                                          onChange={e => setEditingPricingRule({
                                            ...editingPricingRule,
                                            condition: { ...editingPricingRule.condition, nucleoType: e.target.value }
                                          })}
                                          className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-[9px] outline-none text-white focus:border-brand-lime/30"
                                        />
                                     )}
                                  </div>

                                  <div className="space-y-3">
                                     <div className="flex items-center gap-3">
                                        <input 
                                          type="checkbox" 
                                          id="hasFilete"
                                          checked={!!editingPricingRule.condition.hasFilete}
                                          onChange={e => setEditingPricingRule({
                                            ...editingPricingRule, 
                                            condition: { ...editingPricingRule.condition, hasFilete: e.target.checked }
                                          })}
                                          className="w-4 h-4 rounded border-white/10 bg-black text-brand-lime accent-brand-lime"
                                        />
                                        <label htmlFor="hasFilete" className="text-[10px] uppercase font-bold tracking-wider cursor-pointer select-none">Tem Filete?</label>
                                     </div>
                                     {editingPricingRule.condition.hasFilete && (
                                        <input 
                                          placeholder="Tipo (ex: prata)"
                                          value={editingPricingRule.condition.fileteType || ''}
                                          onChange={e => setEditingPricingRule({
                                            ...editingPricingRule,
                                            condition: { ...editingPricingRule.condition, fileteType: e.target.value }
                                          })}
                                          className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-[9px] outline-none text-white focus:border-brand-lime/30"
                                        />
                                     )}
                                  </div>
                               </div>
                            </div>
                         </div>

                         <button type="submit" className="w-full py-4 bg-brand-lime text-black font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-brand-lime/10 transition-transform active:scale-95 cursor-pointer">
                            SALVAR ALTERAÇÕES
                         </button>
                      </form>
                   </motion.div>
                </div>
             )}

             {/* PREÇO PROMOCIONAL DE TESTE */}
             <div className="p-6 bg-zinc-900 border border-brand-lime/20 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-brand-lime/10 text-brand-lime rounded-2xl">
                      <AlertCircle size={22} className={cn(config.uiAssets?.testPromoPriceActive && "animate-pulse")} />
                   </div>
                   <div className="flex-1 space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        Preço Promocional de Teste (Sandbox)
                        {config.uiAssets?.testPromoPriceActive && (
                          <span className="px-2 py-0.5 bg-brand-lime/20 text-brand-lime text-[7px] tracking-widest rounded-full font-black animate-pulse">ATIVO</span>
                        )}
                      </h4>
                      <p className="text-[8px] text-zinc-400 uppercase leading-relaxed max-w-lg">
                         Permite forçar um preço promocional global (ex: R$ 1,00) em todos os produtos do catálogo e montador de alianças personalizadas. Excelente para realizar testes reais de faturamento via PIX, Boleto e Cartão de Crédito no Mercado Pago de forma barata.
                      </p>
                   </div>
                </div>

                {/* AVISO IMPORTANTE DE VALOR MÍNIMO DO PIX (MERCADO PAGO) */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5">
                   <h5 className="text-[9px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      ⚠️ Atenção ao Limite Mínimo do Pix
                   </h5>
                   <p className="text-[8px] text-zinc-300 uppercase leading-relaxed font-sans font-medium">
                      O Banco Central e o Mercado Pago possuem um valor mínimo de transação de <strong>R$ 1,00</strong> para pagamentos via <strong>Pix Dinâmico</strong>. Se você configurar o preço promocional de teste para menos de R$ 1,00 (por exemplo, R$ 0,10), o Mercado Pago criará a sessão mas retornará o erro <strong>"QR Code inválido"</strong> ao tentar emitir o Pix. Recomendamos usar valores maiores ou iguais a <strong>R$ 1,00</strong> para testar Pix reais sem problemas.
                   </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Valor do Preço de Teste:</label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 font-bold">R$</span>
                         <input 
                           type="number"
                           step="0.01"
                           value={config.uiAssets?.testPromoPriceValue !== undefined ? config.uiAssets.testPromoPriceValue : 1.00}
                           onChange={(e) => {
                             const num = parseFloat(e.target.value);
                             updateUIAssets({ testPromoPriceValue: isNaN(num) ? 1.00 : num });
                           }}
                           className="w-28 bg-black border border-white/10 rounded-xl pl-8 pr-3 py-2 text-[11px] font-mono font-bold text-brand-lime outline-none focus:border-brand-lime/30"
                         />
                      </div>
                   </div>

                   <button
                     type="button"
                     onClick={() => updateUIAssets({ testPromoPriceActive: !config.uiAssets?.testPromoPriceActive })}
                     className={cn(
                       "w-full sm:w-auto px-5 py-3 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2",
                       config.uiAssets?.testPromoPriceActive 
                         ? "bg-brand-lime text-black glow-green font-black" 
                         : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
                     )}
                   >
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        config.uiAssets?.testPromoPriceActive ? "bg-black animate-ping" : "bg-zinc-600"
                      )} />
                      {config.uiAssets?.testPromoPriceActive ? 'MODO DE TESTE ATIVO' : 'ATIVAR PREÇO DE TESTE'}
                   </button>
                </div>
             </div>

             {/* PREÇO PROMOCIONAL EM LOTES (GLOBAL) */}
             <div className="p-6 bg-zinc-900 border border-brand-lime/20 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-brand-lime/10 text-brand-lime rounded-2xl">
                      <Tag size={22} className={cn(config.uiAssets?.bulkPromoActive && "animate-pulse")} />
                   </div>
                   <div className="flex-1 space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        Preço Promocional em Lotes (Global)
                        {config.uiAssets?.bulkPromoActive && (
                          <span className="px-2 py-0.5 bg-brand-lime/20 text-brand-lime text-[7px] tracking-widest rounded-full font-black animate-pulse">EM LOTE ATIVO</span>
                        )}
                      </h4>
                      <p className="text-[8px] text-zinc-400 uppercase leading-relaxed max-w-lg">
                         Aplica um desconto ou preço promocional em lote para todos os produtos do catálogo ao mesmo tempo. É ideal para datas festivas ou promoções sazonais em toda a loja.
                      </p>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                   <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Status da Promoção:</span>
                        <span className={cn(
                          "px-2 py-1 rounded text-[8px] font-bold uppercase",
                          config.uiAssets?.bulkPromoActive ? "bg-brand-lime/10 text-brand-lime" : "bg-zinc-800 text-zinc-400"
                        )}>
                          {config.uiAssets?.bulkPromoActive ? "Ativa" : "Desativada"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateUIAssets({ bulkPromoActive: !config.uiAssets?.bulkPromoActive })}
                        className={cn(
                          "w-full sm:w-auto px-5 py-3 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2",
                          config.uiAssets?.bulkPromoActive 
                            ? "bg-brand-lime text-black glow-green font-black" 
                            : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
                        )}
                      >
                         <span className={cn(
                           "w-2 h-2 rounded-full",
                           config.uiAssets?.bulkPromoActive ? "bg-black animate-ping" : "bg-zinc-600"
                         )} />
                         {config.uiAssets?.bulkPromoActive ? 'DESATIVAR PROMO EM LOTE' : 'ATIVAR PROMO EM LOTE'}
                      </button>
                   </div>

                   {config.uiAssets?.bulkPromoActive && (
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 gap-4 grid grid-cols-1 md:grid-cols-3">
                         {/* Tipo de Promoção */}
                         <div className="space-y-2">
                            <label className="block text-[8px] uppercase tracking-[0.15em] text-zinc-400 font-bold">Tipo de Promoção:</label>
                            <div className="flex rounded-xl overflow-hidden border border-white/10 p-1 bg-black gap-1">
                               {(['percentage', 'fixed_discount', 'fixed'] as const).map((type) => (
                                 <button
                                   key={type}
                                   type="button"
                                   onClick={() => updateUIAssets({ bulkPromoType: type })}
                                   className={cn(
                                     "flex-1 py-2 text-[8.5px] font-bold uppercase tracking-tight rounded-lg transition-all cursor-pointer",
                                     config.uiAssets?.bulkPromoType === type || (type === 'fixed' && !config.uiAssets?.bulkPromoType)
                                       ? "bg-brand-lime text-black font-black font-sans shadow-lg"
                                       : "text-zinc-500 hover:text-white bg-transparent"
                                   )}
                                 >
                                    {type === 'percentage' && 'Porcentagem'}
                                    {type === 'fixed_discount' && 'Valor Reduzido'}
                                    {type === 'fixed' && 'Preço Fixo'}
                                 </button>
                               ))}
                            </div>
                         </div>

                         {/* Valor da Promoção */}
                         <div className="space-y-2">
                            <label className="block text-[8px] uppercase tracking-[0.15em] text-zinc-400 font-bold">
                              {config.uiAssets?.bulkPromoType === 'percentage' && 'Porcentagem de Desconto (%):'}
                              {config.uiAssets?.bulkPromoType === 'fixed_discount' && 'Desconto em Dinheiro (R$):'}
                              {config.uiAssets?.bulkPromoType === 'fixed' && 'Novo Preço Fixo para Todos (R$):'}
                            </label>
                            <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500 font-bold">
                                 {config.uiAssets?.bulkPromoType === 'percentage' ? '%' : 'R$'}
                               </span>
                               <input 
                                 type="number"
                                 step="0.01"
                                 value={config.uiAssets?.bulkPromoValue !== undefined ? config.uiAssets.bulkPromoValue : 10}
                                 onChange={(e) => {
                                   const num = parseFloat(e.target.value);
                                   updateUIAssets({ bulkPromoValue: isNaN(num) ? 0 : num });
                                 }}
                                 className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-3 py-2 text-[11px] font-mono font-bold text-brand-lime outline-none focus:border-brand-lime/30"
                               />
                            </div>
                         </div>

                         {/* Selo Promocional Comum */}
                         <div className="space-y-2">
                            <label className="block text-[8px] uppercase tracking-[0.15em] text-zinc-400 font-bold">Texto do Selo / Badge:</label>
                            <input 
                              type="text"
                              maxLength={12}
                              placeholder={
                                config.uiAssets?.bulkPromoType === 'percentage' 
                                  ? `${config.uiAssets?.bulkPromoValue || 10}% OFF` 
                                  : config.uiAssets?.bulkPromoType === 'fixed_discount'
                                    ? `R$ ${config.uiAssets?.bulkPromoValue || 10} OFF`
                                    : 'PROMOÇÃO'
                              }
                              value={config.uiAssets?.customFields?.bulkPromoBadgeText || ''}
                              onChange={(e) => {
                                 const nextCustomFields = { ...(config.uiAssets?.customFields || {}) };
                                 nextCustomFields.bulkPromoBadgeText = e.target.value;
                                 updateUIAssets({ customFields: nextCustomFields });
                              }}
                              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-brand-lime/30"
                            />
                         </div>
                      </div>
                   )}
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500 border-b border-white/5 pb-2">Ajustes Manuais para Promoções</h3>
                <div className="space-y-2">
                   {allProducts.slice(0, 5).map(product => (
                     <div key={product.id} className="p-4 bg-zinc-950 border border-white/5 rounded-xl flex items-center gap-4">
                        <img src={product.image} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1 overflow-hidden">
                           <p className="text-[9px] font-bold text-white truncate uppercase">{product.name}</p>
                           <p className="text-[8px] text-zinc-600 font-mono">Original: R$ {product.price}</p>
                        </div>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="Novo Valor"
                          value={config.manualPriceOverrides?.[product.id] !== undefined ? config.manualPriceOverrides[product.id] : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            setManualPriceOverride(product.id, val);
                          }}
                          className="w-24 bg-black border border-white/10 rounded-lg px-2 py-2 text-[10px] text-brand-lime outline-none text-right font-mono"
                        />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* PRODUTOS SECTION */}
        {activeRootTab === 'produtos' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* CONFIGURAÇÕES DE PROMOÇÃO */}
             <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Promoção de Frete Grátis</h4>
                      <p className="text-[8px] text-zinc-500 uppercase leading-relaxed">
                         Ativa o frete grátis em toda a loja (detalhes do produto, carrinho e barra superior). Se desativado, o frete passa para valor fixo padrão.
                      </p>
                   </div>
                   <input 
                     type="checkbox" 
                     id="freeShippingPromoActive"
                     checked={!!config.uiAssets.freeShippingPromoActive}
                     onChange={(e) => updateUIAssets({ freeShippingPromoActive: e.target.checked })}
                     className="w-4 h-4 rounded border-white/10 bg-black text-brand-lime accent-brand-lime cursor-pointer"
                   />
                </div>
             </div>

             <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500">Gerenciar Catálogo</h3>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="p-2 bg-brand-lime text-black rounded-xl hover:scale-105 transition-transform cursor-pointer"
                >
                   <PlusCircle size={20} />
                </button>
             </div>

             {isAddingProduct && (
                <form onSubmit={handleAddProduct} className="p-6 bg-zinc-900 border border-brand-lime/20 rounded-3xl space-y-6">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-lime">Novo Produto (Avulso/Kit)</h4>
                     <button type="button" onClick={() => setIsAddingProduct(false)} className="text-zinc-600 hover:text-white cursor-pointer"><X size={18} /></button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      <input 
                        required
                        placeholder="Nome do Produto (Ex: Estojo de Madeira Luxury)"
                        value={newProduct.name || ''}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30"
                      />
                      <div className="flex gap-4">
                         <input 
                           required
                           type="number"
                           placeholder="Preço de Venda R$ (ex: 120.00)"
                           value={newProduct.price || ''}
                           onChange={e => setNewProduct({...newProduct, price: e.target.value as any})}
                           className="flex-1 bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 font-mono font-bold"
                         />
                         <select 
                           value={newProduct.category || 'other'}
                           onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                           className="bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 cursor-pointer"
                         >
                            <option value="other">Outro</option>
                            <option value="box">Estojo/Caixa</option>
                            <option value="set">Par de Alianças</option>
                            <option value="kit">Kit Completo</option>
                         </select>
                      </div>

                      {/* Novos campos de Produto Promocional Individual */}
                      <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5 space-y-4">
                         <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Opções de Produto Promocional</p>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Preço Original Riscado (R$) - Opcional:</label>
                               <input 
                                 type="number"
                                 placeholder="Ex: 150.00"
                                 value={newProduct.originalPrice !== undefined ? newProduct.originalPrice : ''}
                                 onChange={e => setNewProduct({...newProduct, originalPrice: e.target.value === '' ? undefined : Number(e.target.value)})}
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 font-mono"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Texto do Selo / Tag - Opcional:</label>
                               <input 
                                 type="text"
                                 maxLength={12}
                                 placeholder="Ex: 20% OFF"
                                 value={newProduct.promoBadge || ''}
                                 onChange={e => setNewProduct({...newProduct, promoBadge: e.target.value})}
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30"
                               />
                            </div>
                         </div>

                         <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              id="new-product-promotional"
                              checked={!!newProduct.isPromotional}
                              onChange={e => setNewProduct({...newProduct, isPromotional: e.target.checked})}
                              className="w-4 h-4 rounded border-white/10 bg-black text-brand-lime accent-brand-lime cursor-pointer"
                            />
                            <label htmlFor="new-product-promotional" className="text-[9px] uppercase font-bold tracking-wider text-zinc-300 cursor-pointer select-none">
                              Destacar este item com etiqueta promocional no catálogo
                            </label>
                         </div>
                      </div>
                      <textarea 
                        placeholder="Simbolismo dos Materiais (Ex: A madeira ébano representa força ..."
                        value={newProduct.symbolism || ''}
                        onChange={e => setNewProduct({...newProduct, symbolism: e.target.value})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none min-h-[100px] resize-none text-white focus:border-brand-lime/30"
                      />
                      <textarea 
                        placeholder="Descrição Detalhada do Produto"
                        value={newProduct.description || ''}
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none min-h-[100px] resize-none text-white focus:border-brand-lime/30"
                      />
                      <div className="relative">
                         <input type="file" id="prod-img" className="hidden" accept="image/*" onChange={handleProductFileChange} />
                         <label htmlFor="prod-img" className="w-full bg-black border border-white/5 rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-2 cursor-pointer">
                            {newProduct.image ? (
                              <img src={newProduct.image} className="w-20 h-20 object-contain rounded-lg" />
                            ) : (
                              <>
                                <Upload size={20} className="text-zinc-600" />
                                <span className="text-[9px] text-zinc-500 uppercase">Subir Foto do Produto</span>
                              </>
                            )}
                         </label>
                      </div>
                   </div>
                   <button type="submit" className="w-full py-4 bg-brand-lime text-black font-bold uppercase tracking-widest text-[10px] rounded-xl glow-green cursor-pointer">
                     ADICIONAR AO CATÁLOGO
                   </button>
                </form>
             )}

             <div className="space-y-3">
                {allProducts.map(product => (
                  <div key={product.id} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-4 group">
                     <img src={product.image} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white uppercase truncate">{product.name}</p>
                        <p className="text-[8px] text-zinc-600 uppercase tracking-tighter mt-0.5">{product.category || 'ring'}</p>
                        <p className="text-[11px] text-brand-lime font-serif mt-1">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     </div>
                     <button 
                       type="button"
                       onClick={() => triggerConfirm(
                         'Excluir Produto', 
                         `Deseja realmente remover "${product.name}" do catálogo?`, 
                         () => removeCustomProduct(product.id)
                       )}
                       className="p-3 text-red-500/50 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                     >
                        <Trash2 size={18} />
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* CAMADAS SECTION */}
        {activeRootTab === 'camadas' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500">Gestão de PNGs</h3>
                <button 
                  onClick={() => setIsAddingLayer(!isAddingLayer)}
                  className={cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    isAddingLayer ? "bg-red-500 text-white" : "bg-brand-lime text-black glow-green"
                  )}
                >
                  {isAddingLayer ? <X size={20} /> : <PlusCircle size={20} />}
                </button>
             </div>

             {isAddingLayer && (
                <form onSubmit={handleAddLayer} className="p-6 bg-zinc-900 border border-brand-lime/20 rounded-3xl space-y-6">
                   <div className="space-y-4">
                      <input 
                        required
                        placeholder="Nome do Material"
                        value={newLayer.name || ''}
                        onChange={e => setNewLayer({...newLayer, name: e.target.value})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30"
                      />
                      <select 
                        value={newLayer.type || 'madeira'}
                        onChange={e => setNewLayer({...newLayer, type: e.target.value as any})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 cursor-pointer"
                      >
                        {LAYER_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <div className="flex gap-4">
                         <input 
                           type="number"
                           placeholder="Preço Adicional (R$)"
                           value={newLayer.price || ''}
                           onChange={e => setNewLayer({...newLayer, price: Number(e.target.value)})}
                           className="flex-1 bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30"
                         />
                      </div>
                      <textarea 
                        placeholder="Simbolismo deste Material"
                        value={newLayer.symbolism || ''}
                        onChange={e => setNewLayer({...newLayer, symbolism: e.target.value})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none min-h-[80px] resize-none text-white focus:border-brand-lime/30"
                      />
                      <div className="relative">
                         <input type="file" id="layer-img" className="hidden" accept="image/*" onChange={handleLayerFileChange} />
                         <label htmlFor="layer-img" className="w-full bg-black border border-white/5 rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-2 cursor-pointer">
                            {newLayer.src ? (
                              <img src={newLayer.src} className="w-20 h-20 object-contain" />
                            ) : (
                              <span className="text-[9px] text-zinc-500 uppercase">Clique para subir PNG transparente</span>
                            )}
                         </label>
                      </div>
                   </div>
                   <button type="submit" className="w-full py-4 bg-brand-lime text-black font-bold uppercase tracking-widest text-[10px] rounded-xl glow-green cursor-pointer">
                     SALVAR MATERIAL
                   </button>
                </form>
             )}

             <div className="space-y-12">
               {LAYER_TYPES.map(typeGroup => {
                  const layers = config.layers.filter(l => l.type === typeGroup.id);
                  return (
                    <div key={typeGroup.id} className="space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-brand-lime rounded-full" />
                          {typeGroup.name}
                       </h4>
                       <div className="grid grid-cols-1 gap-3">
                          {layers.map(layer => (
                            <div key={layer.id} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-3">
                               <img src={layer.src} className="w-12 h-12 rounded-lg bg-black object-contain" referrerPolicy="no-referrer" />
                               <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold uppercase truncate">{layer.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <span className="text-[8px] text-brand-lime font-mono">+ R$ {layer.price || 0}</span>
                                     {layer.symbolism && <span className="text-[8px] text-zinc-600 truncate italic">"{layer.symbolism.substring(0, 30)}..."</span>}
                                  </div>
                               </div>
                               <button 
                                 type="button"
                                 onClick={() => triggerConfirm(
                                     'Excluir Camada',
                                     `Deseja remover o material "${layer.name}"? Isso não afetará produtos já criados.`,
                                     () => removeLayer(layer.id)
                                   )} 
                                   className="p-2 text-zinc-700 hover:text-red-500 cursor-pointer"
                                 >
                                   <Trash2 size={16} />
                               </button>
                            </div>
                          ))}
                          {layers.length === 0 && <p className="text-[9px] text-zinc-800 uppercase italic">Nenhum item carregado</p>}
                       </div>
                    </div>
                  );
               })}
             </div>
          </div>
        )}

        {activeRootTab === 'texturas' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
             <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500">Gestão de Texturas (Pop-up)</h3>
                <button 
                  onClick={() => setIsAddingTexture(!isAddingTexture)}
                  className={cn(
                    "p-2 rounded-xl transition-all cursor-pointer",
                    isAddingTexture ? "bg-red-500 text-white" : "bg-brand-lime text-black glow-green"
                  )}
                >
                  {isAddingTexture ? <X size={20} /> : <PlusCircle size={20} />}
                </button>
             </div>

             {isAddingTexture && (
                <form onSubmit={handleAddTexture} className="p-6 bg-zinc-900 border border-brand-lime/20 rounded-3xl space-y-6">
                   <div className="space-y-4">
                      <input 
                        required
                        placeholder="Nome da Textura / Material"
                        value={newTexture.name || ''}
                        onChange={e => setNewTexture({...newTexture, name: e.target.value})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30"
                      />
                      <select 
                        value={newTexture.type || 'madeira'}
                        onChange={e => setNewTexture({...newTexture, type: e.target.value as any})}
                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 cursor-pointer"
                      >
                        <option value="madeira">Madeiras Nobres</option>
                        <option value="pedra">Pedras Preciosas & Cristais</option>
                        <option value="metal">Metais & Ligas Purificadoras</option>
                      </select>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Simbolismo do Material</label>
                          <button
                            type="button"
                            onClick={handleSearchSymbolismViaIA}
                            disabled={isSearchingSymbolism || (!newTexture.name && !newTexture.src)}
                            className={cn(
                              "text-[8.5px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all font-mono",
                              isSearchingSymbolism 
                                ? "bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed"
                                : (!newTexture.name && !newTexture.src) 
                                  ? "bg-zinc-900/40 text-zinc-600 border-white/5 opacity-40 cursor-not-allowed"
                                  : "bg-brand-lime/10 text-brand-lime border-brand-lime/20 hover:bg-brand-lime/20 animate-pulse"
                            )}
                          >
                            {isSearchingSymbolism ? (
                              <>
                                <span className="w-2.5 h-2.5 border-2 border-brand-lime border-t-transparent rounded-full animate-spin" />
                                Identificando & Gerando Simbolismo...
                              </>
                            ) : (
                              <>
                                🔍 Buscar Simbolismo na Web
                              </>
                            )}
                          </button>
                        </div>
                        <textarea 
                          placeholder="Simbolismo / Significado Real para o Pop-up (ou use o botão acima para pesquisar automaticamente!)"
                          value={newTexture.symbolism || ''}
                          onChange={e => setNewTexture({...newTexture, symbolism: e.target.value})}
                          className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none min-h-[100px] resize-none text-white focus:border-brand-lime/30"
                        />
                      </div>
                      <div className="relative">
                         <input type="file" id="texture-img" className="hidden" accept="image/*" onChange={handleTextureFileChange} />
                         <label htmlFor="texture-img" className="w-full bg-black border border-white/5 rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-2 cursor-pointer">
                            {newTexture.src ? (
                              <img src={newTexture.src} className="w-20 h-20 object-contain" />
                            ) : (
                              <span className="text-[9px] text-zinc-500 uppercase">Clique para subir Imagem do Material</span>
                            )}
                         </label>
                      </div>
                   </div>
                   <button type="submit" className="w-full py-4 bg-brand-lime text-black font-bold uppercase tracking-widest text-[10px] rounded-xl glow-green cursor-pointer">
                     SALVAR TEXTURA DO POP-UP
                   </button>
                </form>
             )}

             <div className="space-y-12">
               {[
                 { id: 'madeira', name: 'Madeiras Nobres' } ,
                 { id: 'pedra', name: 'Pedras Preciosas & Cristais' } ,
                 { id: 'metal', name: 'Metais & Ligas Purificadoras' }
               ].map(typeGroup => {
                  const items = (config.textures || []).filter(t => t.type === typeGroup.id);
                  return (
                    <div key={typeGroup.id} className="space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-brand-lime rounded-full" />
                          {typeGroup.name}
                       </h4>
                       <div className="grid grid-cols-1 gap-3">
                          {items.map(texture => (
                            <div key={texture.id} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-3">
                               <img src={texture.src} className="w-12 h-12 rounded-lg bg-black object-contain" referrerPolicy="no-referrer" />
                               <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold uppercase truncate">{texture.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     {texture.symbolism && <span className="text-[8px] text-zinc-600 truncate italic font-mono">"{texture.symbolism.substring(0, 50)}..."</span>}
                                  </div>
                               </div>
                               <button 
                                 type="button"
                                 onClick={() => triggerConfirm(
                                     'Excluir Textura',
                                     `Deseja remover a textura "${texture.name}" do pop-up?`,
                                     () => removeTexture(texture.id)
                                   )} 
                                   className="p-2 text-zinc-700 hover:text-red-500 cursor-pointer"
                                 >
                                   <Trash2 size={16} />
                               </button>
                            </div>
                          ))}
                          {items.length === 0 && <p className="text-[9px] text-zinc-800 uppercase italic">Nenhuma textura cadastrada nesta categoria</p>}
                       </div>
                    </div>
                  );
               })}
             </div>
          </div>
        )}

        {/* UI SECTION */}
        {activeRootTab === 'ui' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
             {/* Assets da Interface */}
             <div className="space-y-6">
                <div className="space-y-4">
                   <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500 border-b border-white/5 pb-2">Identidade Visual da Marca</h3>
                    
                    {/* Color Scheme Selector */}
                    <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans mb-4 col-span-1 md:col-span-2">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime">Paleta de Cores do Aplicativo</span>
                          <Palette size={14} className="text-zinc-650" />
                       </div>
                       <p className="text-[8px] text-zinc-500 uppercase leading-relaxed">
                          Escolha a coloração de destaque principal da interface da loja e do criador de alianças.
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {/* Original Theme Choice */}
                          <button
                             type="button"
                             onClick={() => updateUIAssets({ colorScheme: 'original' })}
                             className={cn(
                                "p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer outline-none focus:outline-none w-full",
                                (config.uiAssets.colorScheme || 'original') === 'original'
                                   ? "bg-brand-lime/10 border-brand-lime"
                                   : "bg-black/40 border-white/5 hover:border-white/10"
                             )}
                          >
                             <div className="w-8 h-8 rounded-full bg-[#bef264] flex items-center justify-center shrink-0 border border-black/10">
                                {(config.uiAssets.colorScheme || 'original') === 'original' && <Check size={14} className="text-black font-bold" />}
                             </div>
                             <div className="space-y-0.5">
                                <h4 className="text-[10.5px] uppercase font-bold text-white tracking-wider">Origem Orgânica (Verde Limão)</h4>
                                <p className="text-[8px] text-zinc-500 uppercase leading-normal">O tom vibrante original que celebra o musgo, as florestas brasileiras e a união natural.</p>
                             </div>
                          </button>

                          {/* Gold Theme Choice */}
                          <button
                             type="button"
                             onClick={() => updateUIAssets({ colorScheme: 'gold' })}
                             className={cn(
                                "p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer outline-none focus:outline-none w-full",
                                (config.uiAssets.colorScheme || 'original') === 'gold'
                                   ? "bg-brand-lime/10 border-brand-lime"
                                   : "bg-black/40 border-white/5 hover:border-white/10"
                             )}
                          >
                             <div className="w-8 h-8 rounded-full bg-[#cea14a] flex items-center justify-center shrink-0 border border-black/15">
                                {(config.uiAssets.colorScheme || 'original') === 'gold' && <Check size={14} className="text-black font-bold" />}
                             </div>
                             <div className="space-y-0.5">
                                <h4 className="text-[10.5px] uppercase font-bold text-white tracking-wider">Tradição Imperial (Dourado / Ouro)</h4>
                                <p className="text-[8px] text-zinc-500 uppercase leading-normal">O tom nobre e quente que celebra as joias eternas refinadas pelo sol, madeira e metal.</p>
                             </div>
                          </button>
                       </div>
                    </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Logo Asset */}
                      <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime">Logo Principal da Loja</span>
                            <Edit3 size={14} className="text-zinc-600" />
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-black rounded-2xl border border-white/5 flex items-center justify-center p-2 overflow-hidden">
                               {config.uiAssets.logo ? (
                                 <img src={config.uiAssets.logo} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                               ) : (
                                 <div className="text-[8px] text-zinc-700 font-mono text-center">SEM LOGO</div>
                               )}
                            </div>
                            <div className="flex-1 space-y-2">
                               <p className="text-[8px] text-zinc-500 uppercase leading-relaxed">Formatos: SVG, PNG ou WebP. Recomendamos fundo transparente.</p>
                               <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   const reader = new FileReader();
                                   reader.onload = () => updateUIAssets({ logo: reader.result as string });
                                   reader.readAsDataURL(file);
                                 }
                               }} />
                               <label htmlFor="logo-upload" className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer">Carregar Novo Logo</label>
                            </div>
                         </div>
                         
                         {/* Logo Width Slider */}
                         <div className="pt-2 space-y-1">
                            <div className="flex justify-between text-[8px] uppercase font-bold text-zinc-500">
                               <span>Largura do Logo</span>
                               <span className="text-brand-lime font-mono">{config.uiAssets.logoWidth || 32}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="20" 
                              max="120" 
                              value={config.uiAssets.logoWidth || 32} 
                              onChange={(e) => updateUIAssets({ logoWidth: Number(e.target.value) })}
                              className="w-full accent-brand-lime h-1 bg-black rounded-lg cursor-pointer animate-none"
                            />
                         </div>
                      </div>

                      {/* Imagem de Fundo do Hero (Home Hero) */}
                      <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime">Imagem de Abertura (Fundo Hero)</span>
                            <ImageIcon size={14} className="text-zinc-600" />
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-black rounded-2xl border border-white/5 flex items-center justify-center p-1 overflow-hidden">
                               <img src={config.uiAssets.heroBackground || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=805'} className="max-h-full max-w-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 space-y-2">
                               <p className="text-[8px] text-zinc-500 uppercase leading-relaxed">Substitui a imagem da joia na página principal, servindo de fundo para os títulos.</p>
                               <input type="file" id="hero-bg-upload" className="hidden" accept="image/*" onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   const reader = new FileReader();
                                   reader.onload = () => updateUIAssets({ heroBackground: reader.result as string });
                                   reader.readAsDataURL(file);
                                 }
                               }} />
                               <label htmlFor="hero-bg-upload" className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer">Carregar Foto Hero</label>
                            </div>
                         </div>
                         
                         {/* Hero Brightness Slider */}
                         <div className="pt-2 space-y-1">
                            <div className="flex justify-between text-[8px] uppercase font-bold text-zinc-500">
                               <span>Brilho da Imagem (Opacidade de Contraste)</span>
                               <span className="text-brand-lime font-mono">{config.uiAssets.brightnessHero || 60}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="100" 
                              value={config.uiAssets.brightnessHero !== undefined ? config.uiAssets.brightnessHero : 60} 
                              onChange={(e) => updateUIAssets({ brightnessHero: Number(e.target.value) })}
                               className="w-full accent-brand-lime h-1 bg-black rounded-lg cursor-pointer"
                             />
                          </div>

                          {/* Hero Scale/Zoom Slider */}
                          <div className="pt-2 space-y-1">
                             <div className="flex justify-between text-[8px] uppercase font-bold text-zinc-500">
                                <span>Tamanho da Imagem (Escala/Zoom)</span>
                                <span className="text-brand-lime font-mono">{config.uiAssets.heroBackgroundScale !== undefined ? config.uiAssets.heroBackgroundScale : 100}%</span>
                             </div>
                             <input 
                               type="range" 
                               min="50" 
                               max="250" 
                               value={config.uiAssets.heroBackgroundScale !== undefined ? config.uiAssets.heroBackgroundScale : 100} 
                               onChange={(e) => updateUIAssets({ heroBackgroundScale: Number(e.target.value) })}
                               className="w-full accent-brand-lime h-1 bg-black rounded-lg cursor-pointer"
                             />
                          </div>
                       </div>

                       {/* Fundos dos Botões de Materiais (Madeiras, Pedras, Metais) */}
                       <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans col-span-1 md:col-span-2">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime">Fundos dos Botões de Materiais (Home)</span>
                             <ImageIcon size={14} className="text-zinc-600" />
                          </div>
                          <p className="text-[8px] text-zinc-500 uppercase leading-relaxed font-sans">
                             Personalize o plano de fundo circular das categorias de materiais na página principal. Faça o upload de uma foto real ou deixe vazio para usar o visual neon padrão.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                             {/* Madeiras Button Background */}
                             <div className="space-y-2 p-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
                                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 font-sans">Madeiras</p>
                                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-black relative shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                                   {config.uiAssets.bgButtonWoods ? (
                                     <img src={config.uiAssets.bgButtonWoods} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                   ) : (
                                     <span className="text-[6px] text-zinc-700 text-center font-bold px-1 uppercase font-mono">Original</span>
                                   )}
                                </div>
                                <div className="flex gap-1.5 w-full pt-1">
                                   <input type="file" id="bg-woods-upload" className="hidden" accept="image/*" onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                       const reader = new FileReader();
                                       reader.onload = () => updateUIAssets({ bgButtonWoods: reader.result as string });
                                       reader.readAsDataURL(file);
                                     }
                                   }} />
                                   <label htmlFor="bg-woods-upload" className="flex-1 text-center py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[7px] font-bold uppercase cursor-pointer select-none">Subir</label>
                                   {config.uiAssets.bgButtonWoods && (
                                      <button type="button" onClick={() => updateUIAssets({ bgButtonWoods: '' })} className="px-1.5 py-1 bg-red-950/40 hover:bg-red-900 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-lg text-[7px] font-bold uppercase">Limpar</button>
                                   )}
                                </div>
                             </div>

                             {/* Pedras Button Background */}
                             <div className="space-y-2 p-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
                                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 font-sans">Pedras</p>
                                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-black relative shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                                   {config.uiAssets.bgButtonStones ? (
                                     <img src={config.uiAssets.bgButtonStones} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                   ) : (
                                     <span className="text-[6px] text-zinc-700 text-center font-bold px-1 uppercase font-mono">Original</span>
                                   )}
                                </div>
                                <div className="flex gap-1.5 w-full pt-1">
                                   <input type="file" id="bg-stones-upload" className="hidden" accept="image/*" onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                       const reader = new FileReader();
                                       reader.onload = () => updateUIAssets({ bgButtonStones: reader.result as string });
                                       reader.readAsDataURL(file);
                                     }
                                   }} />
                                   <label htmlFor="bg-stones-upload" className="flex-1 text-center py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[7px] font-bold uppercase cursor-pointer select-none">Subir</label>
                                   {config.uiAssets.bgButtonStones && (
                                      <button type="button" onClick={() => updateUIAssets({ bgButtonStones: '' })} className="px-1.5 py-1 bg-red-950/40 hover:bg-red-900 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-lg text-[7px] font-bold uppercase">Limpar</button>
                                   )}
                                </div>
                             </div>

                             {/* Metais Button Background */}
                             <div className="space-y-2 p-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
                                <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 font-sans">Metais</p>
                                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-black relative shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                                   {config.uiAssets.bgButtonMetals ? (
                                     <img src={config.uiAssets.bgButtonMetals} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                   ) : (
                                     <span className="text-[6px] text-zinc-700 text-center font-bold px-1 uppercase font-mono">Original</span>
                                   )}
                                </div>
                                <div className="flex gap-1.5 w-full pt-1">
                                   <input type="file" id="bg-metals-upload" className="hidden" accept="image/*" onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                       const reader = new FileReader();
                                       reader.onload = () => updateUIAssets({ bgButtonMetals: reader.result as string });
                                       reader.readAsDataURL(file);
                                     }
                                   }} />
                                   <label htmlFor="bg-metals-upload" className="flex-1 text-center py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[7px] font-bold uppercase cursor-pointer select-none">Subir</label>
                                   {config.uiAssets.bgButtonMetals && (
                                      <button type="button" onClick={() => updateUIAssets({ bgButtonMetals: '' })} className="px-1.5 py-1 bg-red-950/40 hover:bg-red-900 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-lg text-[7px] font-bold uppercase">Limpar</button>
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                {/* Barra de comunicados no topo */}
                <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <input 
                           type="checkbox" 
                           id="announcementBarActive" 
                           checked={!!config.uiAssets.announcementBarActive}
                           onChange={(e) => updateUIAssets({ announcementBarActive: e.target.checked })}
                           className="w-4 h-4 rounded border-white/10 bg-black text-brand-lime accent-brand-lime cursor-pointer"
                         />
                         <label htmlFor="announcementBarActive" className="text-[10px] font-bold uppercase tracking-widest text-white cursor-pointer select-none">Ativar Fita de Aviso (Topo da Página)</label>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   </div>

                   {config.uiAssets.announcementBarActive && (
                      <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                         <div className="space-y-1">
                            <label className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Texto de Destaque do Aviso</label>
                            <input 
                              value={config.uiAssets.announcementBarText || ''}
                              onChange={(e) => updateUIAssets({ announcementBarText: e.target.value })}
                              placeholder="Fita de novidades do topo"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30"
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Cor do Fundo</label>
                               <select 
                                 value={config.uiAssets.announcementBarBg || '#bef264'}
                                 onChange={(e) => updateUIAssets({ announcementBarBg: e.target.value })}
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] uppercase font-mono tracking-wider text-brand-lime outline-none cursor-pointer"
                               >
                                  <option value="#bef264">Verde Neon (Padrão)</option>
                                  <option value="#eab308">Dourado / Ouro</option>
                                  <option value="#ffffff">Branco Puro</option>
                                  <option value="#18181b">Preto Elegante</option>
                                  <option value="#dc2626">Vermelho Oferta</option>
                               </select>
                            </div>
                            <div className="space-y-1">
                               <label className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Cor do Texto</label>
                               <select 
                                 value={config.uiAssets.announcementBarColor || '#000000'}
                                 onChange={(e) => updateUIAssets({ announcementBarColor: e.target.value })}
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] uppercase font-mono tracking-wider text-white outline-none cursor-pointer"
                               >
                                  <option value="#000000 font-sans">Preto (Escuro)</option>
                                  <option value="#ffffff font-sans">Branco (Claro)</option>
                                  <option value="#bef264 font-sans">Verde Neon</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                {/* Dynamic Content Sections Manager */}
                <div className="space-y-4 font-sans border-t border-white/5 pt-6">
                   <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500">Módulos Customizados na Tela</h3>
                      <button 
                        type="button"
                        onClick={() => setIsAddingCustomSection(!isAddingCustomSection)}
                        className="text-[9px] font-bold text-brand-lime uppercase tracking-widest flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform bg-brand-lime/10 px-3 py-1.5 rounded-full border border-brand-lime/20 cursor-pointer"
                      >
                         <Plus size={12} />
                         {isAddingCustomSection ? 'Cancelar Novo' : 'Novo Bloco / Imagem / Texto'}
                      </button>
                   </div>

                   {/* Add Custom Section Form Panel */}
                   {isAddingCustomSection && (
                      <form onSubmit={handleAddCustomSection} className="p-6 bg-zinc-900 border border-brand-lime/30 rounded-3xl space-y-4 animate-in slide-in-from-top-6 duration-450">
                         <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-lime">Configurações do Novo Bloco</span>
                            <X size={16} className="text-zinc-500 cursor-pointer hover:text-white" onClick={() => setIsAddingCustomSection(false)} />
                         </div>

                         <div>
                            <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Tipo de Seção Estilizada</label>
                            <select 
                              value={newCustomSection.type}
                              onChange={(e) => setNewCustomSection({ ...newCustomSection, type: e.target.value as any })}
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 cursor-pointer"
                            >
                               <option value="banner">Banner com Imagem de Fundo (Completo)</option>
                               <option value="image_text">Narrativa Dividida (Foto ao lado do texto)</option>
                               <option value="testimonial">Depoimento de Cliente Emocional (Estrelas de Ouro)</option>
                               <option value="text">Placa Institucional / Caixa Corporativa</option>
                            </select>
                         </div>

                         <div className="space-y-4">
                            <div className="space-y-1">
                               <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">Título Principal do Bloco</label>
                               <input 
                                 required
                                 value={newCustomSection.title || ''}
                                 onChange={(e) => setNewCustomSection({ ...newCustomSection, title: e.target.value })}
                                 placeholder="Ex: Alianças que duram gerações"
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30"
                               />
                            </div>

                            <div className="space-y-1">
                               <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">Descrição / Subtítulo / Testemunho</label>
                               <textarea 
                                 required
                                 value={newCustomSection.subtitle || ''}
                                 onChange={(e) => setNewCustomSection({...newCustomSection, subtitle: e.target.value})}
                                 placeholder="Escreva a descrição do seu banner ou o depoimento do cliente..."
                                 className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 min-h-[80px]"
                               />
                            </div>

                            {/* Section Banner CTA Controls (Show if type is banner) */}
                            {newCustomSection.type === 'banner' && (
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                     <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">Texto do Botão (CTA)</label>
                                     <input 
                                       value={newCustomSection.linkText || ''}
                                       onChange={(e) => setNewCustomSection({ ...newCustomSection, linkText: e.target.value })}
                                       placeholder="Ex: Ver mais"
                                       className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-brand-lime/30"
                                     />
                                  </div>
                                  <div className="space-y-1">
                                     <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">Link do Botão</label>
                                     <input 
                                       value={newCustomSection.linkUrl || ''}
                                       onChange={(e) => setNewCustomSection({ ...newCustomSection, linkUrl: e.target.value })}
                                       placeholder="Ex: /criar ou /catalogo"
                                       className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-brand-lime/30"
                                     />
                                  </div>
                               </div>
                            )}

                            {/* Image selector for Banner & split blocks */}
                            {(newCustomSection.type === 'banner' || newCustomSection.type === 'image_text') && (
                               <div className="space-y-1">
                                  <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block font-sans">Mídia do Bloco (Upload de Ilustração/Foto)</label>
                                  <div className="relative font-sans">
                                     <input type="file" id="sec-img" className="hidden" accept="image/*" onChange={handleCustomSectionFileChange} />
                                     <label htmlFor="sec-img" className="w-full bg-black border border-white/5 rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-2 cursor-pointer font-sans">
                                        {newCustomSection.image ? (
                                          <img src={newCustomSection.image} className="w-32 h-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
                                        ) : (
                                          <>
                                            <Upload size={16} className="text-brand-lime" />
                                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Subir Imagem para este bloco</span>
                                          </>
                                        )}
                                     </label>
                                  </div>
                               </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1 font-sans">
                                  <label className="text-[8px] uppercase font-bold text-zinc-500 bg-transparent tracking-widest">Cor de Fundo da Caixa</label>
                                  <select 
                                    value={newCustomSection.bgColor}
                                    onChange={(e) => setNewCustomSection({ ...newCustomSection, bgColor: e.target.value })}
                                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[9px] outline-none text-white cursor-pointer"
                                  >
                                     <option value="#141417">Escuro Premium</option>
                                     <option value="#09090b">Preto Neutro</option>
                                     <option value="#1e1b4b">Azul Noturno</option>
                                     <option value="#0f172a">Slate Azulado</option>
                                     <option value="#111827">Cinza Estúdio</option>
                                  </select>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[8px] uppercase font-bold text-zinc-500 bg-transparent tracking-widest">Cor da Fonte</label>
                                  <select 
                                    value={newCustomSection.textColor}
                                    onChange={(e) => setNewCustomSection({ ...newCustomSection, textColor: e.target.value })}
                                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[9px] outline-none text-white cursor-pointer"
                                  >
                                     <option value="#ffffff">Branco Estúdio</option>
                                     <option value="#bef264">Verde Neon</option>
                                     <option value="#fcd34d">Ouro/Amarelo</option>
                                     <option value="#d1d5db">Cinza Médio</option>
                                  </select>
                               </div>
                            </div>
                         </div>

                         <button type="submit" className="w-full py-4 bg-brand-lime text-black font-extrabold uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-brand-lime/10 hover:brightness-110 active:scale-95 transition-all font-sans cursor-pointer">
                            CONCLUIR E ADICIONAR SEÇÃO
                         </button>
                      </form>
                   )}

                   {/* List current active Custom Sections with Delete controls */}
                   <div className="grid grid-cols-1 gap-3">
                      {(config.uiAssets.customSections || []).map((section) => (
                         <div key={section.id} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-between gap-4 font-sans animate-fade-in">
                            <div className="flex items-center gap-3 overflow-hidden">
                               {section.image ? (
                                 <img src={section.image} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                               ) : (
                                 <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center font-mono text-[9px] text-zinc-500 font-bold flex-shrink-0 uppercase font-sans">TXT</div>
                               )}
                               <div className="overflow-hidden">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[8px] bg-brand-lime/10 text-brand-lime border border-brand-lime/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest leading-none font-sans">
                                        {section.type}
                                     </span>
                                     <span className="text-[8px] text-zinc-500 font-mono tracking-tighter">ID: {section.id}</span>
                                  </div>
                                  <p className="text-[9px] font-bold text-white uppercase truncate mt-1">{section.title || '(Depoimento / Texto)'}</p>
                                  {section.subtitle && <p className="text-[8px] text-zinc-550 truncate mt-0.5 font-light text-zinc-500">"{section.subtitle}"</p>}
                               </div>
                            </div>

                            <button 
                              type="button" 
                              onClick={() => triggerConfirm(
                                 'Excluir Elemento Customizado', 
                                 `Tem certeza que deseja apagar a seção "${section.title || section.type}" da tela de abertura?`, 
                                 () => handleRemoveCustomSection(section.id)
                              )}
                              className="p-3 text-red-500/60 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl flex-shrink-0 transition-colors cursor-pointer"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      ))}
                      {(!config.uiAssets.customSections || config.uiAssets.customSections.length === 0) && (
                         <div className="p-8 border border-dashed border-white/5 text-center rounded-3xl font-sans">
                            <p className="text-[8px] text-zinc-700 uppercase tracking-widest font-bold">Nenhuma seção customizada criada</p>
                            <p className="text-[8px] text-zinc-500 uppercase font-light mt-1 max-w-xs mx-auto leading-relaxed">Crie banners, caixas de depoimentos de clientes ou seções de imagens usando o botão "+ Novo Bloco" acima.</p>
                         </div>
                      )}
                   </div>
                </div>

                {/* Custom Fields (existing, now styled elegantly) */}
                <div className="space-y-4 font-sans border-t border-white/5 pt-6">
                   <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500 font-sans">Ganchos / Variáveis Customizadas</h3>
                      <button 
                        type="button"
                        onClick={() => {
                          const name = prompt('Nome do campo (ex: Aviso Desconto):');
                          if (name) {
                            const value = prompt('Valor/Texto do campo:');
                            if (value) {
                              updateUIAssets({ 
                                customFields: { ...config.uiAssets.customFields, [name]: value } 
                              });
                            }
                          }
                        }}
                        className="text-[9px] font-bold text-brand-lime uppercase tracking-widest flex items-center gap-1 hover:text-glow transition-colors font-sans cursor-pointer"
                      >
                         <Plus size={12} />
                         Novo Campo
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-2 font-sans">
                      {Object.entries(config.uiAssets.customFields).map(([key, value]) => (
                         <div key={key} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-between font-sans">
                            <div className="space-y-0.5">
                               <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">{key}</p>
                               <p className="text-xs text-white">{value}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newFields = { ...config.uiAssets.customFields };
                                delete newFields[key];
                                updateUIAssets({ customFields: newFields });
                              }}
                              className="text-zinc-600 hover:text-red-500 p-2 cursor-pointer"
                            >
                               <X size={14} />
                            </button>
                         </div>
                      ))}
                      {Object.keys(config.uiAssets.customFields).length === 0 && (
                         <p className="text-[9px] tracking-widest font-bold uppercase italic py-4 text-center text-zinc-700">Nenhum gancho customizado</p>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* SOBRE NÓS SECTION */}
        {activeRootTab === 'sobre-nos' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 font-sans">
             <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500 border-b border-white/5 pb-2">Página Sobre Nós (Nossa Essência)</h3>
                <div className="grid grid-cols-1 gap-6">
                   
                   {/* Títulos e Textos Principais */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime block font-bold">Textos e Identidade Narrativa</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">Título Principal da Seção</label>
                            <input 
                              type="text"
                              value={config.uiAssets.aboutTitle || ''}
                              onChange={(e) => updateUIAssets({ aboutTitle: e.target.value })}
                              placeholder="Nossa Essência"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">Etiqueta do Cabeçalho</label>
                            <input 
                              type="text"
                              value={config.uiAssets.aboutSubtitle || ''}
                              onChange={(e) => updateUIAssets({ aboutSubtitle: e.target.value })}
                              placeholder="Nossos Valores"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none"
                            />
                         </div>
                      </div>

                      <div className="space-y-1">
                         <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">História ou Manifesto do Ateliê</label>
                         <textarea 
                           value={config.uiAssets.aboutText || ''}
                           onChange={(e) => updateUIAssets({ aboutText: e.target.value })}
                           placeholder="Conte a história do seu ateliê, sua herança de design artesanal e ética florestal..."
                           className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 min-h-[140px] whitespace-pre-wrap leading-relaxed animate-none resize-none"
                         />
                      </div>
                   </div>

                   {/* Banner de Capa */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans border-t border-white/5">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime font-bold">Imagem de Capa (Banner Principal)</span>
                         <ImageIcon size={14} className="text-zinc-600" />
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 bg-black rounded-2xl border border-white/5 flex items-center justify-center p-1 overflow-hidden">
                            {config.uiAssets.aboutImage ? (
                              <img src={config.uiAssets.aboutImage} className="max-h-full max-w-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="text-[8px] text-zinc-700 font-mono text-center uppercase">Sem Capa</div>
                            )}
                         </div>
                         <div className="flex-1 space-y-2">
                            <p className="text-[8px] text-zinc-500 uppercase leading-relaxed font-sans">Mostre a beleza das madeiras nobres, a bancada da sua oficina ou o polimento das peças brutas.</p>
                            <input type="file" id="about-img-upload" className="hidden" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => updateUIAssets({ aboutImage: reader.result as string });
                                reader.readAsDataURL(file);
                              }
                            }} />
                            <label htmlFor="about-img-upload" className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer font-sans h-[30px] leading-none flex items-center justify-center">Alterar Capa d'Essência</label>
                         </div>
                      </div>
                   </div>

                   {/* Bloco de Selos e Estatísticas */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime block font-bold">Selos de Qualidade e Números</span>
                      <div className="grid grid-cols-2 gap-4">
                         {/* Stat 1 */}
                         <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 font-sans">
                            <span className="text-[7px] text-zinc-500 uppercase font-mono tracking-widest block font-bold">Selo 1 - Handcraft</span>
                            <div className="space-y-2">
                               <input 
                                 type="text" 
                                 placeholder="100%"
                                 value={config.uiAssets.aboutStats1Value || ''}
                                 onChange={(e) => updateUIAssets({ aboutStats1Value: e.target.value })}
                                 className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] font-serif tracking-wide focus:border-brand-lime/30 animate-none outline-none text-white"
                               />
                               <input 
                                 type="text" 
                                 placeholder="Feito à Mão"
                                 value={config.uiAssets.aboutStats1Label || ''}
                                 onChange={(e) => updateUIAssets({ aboutStats1Label: e.target.value })}
                                 className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-[8px] text-zinc-400 uppercase tracking-widest focus:border-brand-lime/30 animate-none outline-none"
                               />
                            </div>
                         </div>
                         {/* Stat 2 */}
                         <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 font-sans">
                            <span className="text-[7px] text-zinc-500 uppercase font-mono tracking-widest block font-bold">Selo 2 - Origem / Garantia</span>
                            <div className="space-y-2">
                               <input 
                                 type="text" 
                                 placeholder="Certificado"
                                 value={config.uiAssets.aboutStats2Value || ''}
                                 onChange={(e) => updateUIAssets({ aboutStats2Value: e.target.value })}
                                 className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] font-serif tracking-wide focus:border-brand-lime/30 animate-none outline-none text-white"
                               />
                               <input 
                                 type="text" 
                                 placeholder="Origem Ética"
                                 value={config.uiAssets.aboutStats2Label || ''}
                                 onChange={(e) => updateUIAssets({ aboutStats2Label: e.target.value })}
                                 className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-[8px] text-zinc-400 uppercase tracking-widest focus:border-brand-lime/30 animate-none outline-none"
                               />
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Vídeo Institucional da Joalheria */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                      <div className="flex items-center justify-between font-sans">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime font-bold">Vídeo de Apresentação de Processo</span>
                         <Video size={14} className="text-zinc-600" />
                      </div>
                      
                      {config.uiAssets.aboutVideoUrl && (
                        <div className="p-2 bg-black border border-white/5 rounded-2xl font-sans">
                          <p className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 mb-2 font-bold font-sans">Vídeo Ativo:</p>
                          <span className="text-[8px] font-mono text-zinc-400 select-all block break-all whitespace-normal bg-zinc-900 p-2 rounded-lg font-sans">{config.uiAssets.aboutVideoUrl.substring(0, 100)}...</span>
                        </div>
                      )}

                      <div className="space-y-3 font-sans">
                         {/* Text Video URL link */}
                         <div className="space-y-1">
                            <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block font-sans">Link do Vídeo (YouTube ou direct MP4)</label>
                            <input 
                              type="url"
                              value={config.uiAssets.aboutVideoUrl || ''}
                              onChange={(e) => updateUIAssets({ aboutVideoUrl: e.target.value })}
                              placeholder="Ex: https://www.youtube.com/watch?v=FOTvY-Q98Dk"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none"
                            />
                         </div>
                         
                         <div className="relative font-sans text-center space-y-2">
                            <div className="text-[8.5px] text-zinc-500 uppercase tracking-wider font-bold">OU SE PREFERIR, FAÇA UPLOAD DE UM VÍDEO (MP4)</div>
                            <input 
                              type="file" 
                              id="about-video-upload" 
                              className="hidden" 
                              accept="video/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 15 * 1024 * 1024) {
                                    alert('Por segurança de armazenamento, faça upload de vídeos curtos de até 15MB, ou use links do YouTube.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => updateUIAssets({ aboutVideoUrl: reader.result as string });
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                            <label htmlFor="about-video-upload" className="w-full border border-dashed border-white/5 hover:border-brand-lime/20 rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer font-sans bg-black/45 hover:bg-black transition-all">
                               <Upload size={14} className="text-brand-lime animate-pulse" />
                               <span className="text-[8.5px] text-zinc-400 uppercase tracking-widest font-extrabold font-sans">Subir Vídeo de Oficina</span>
                            </label>
                         </div>
                      </div>
                   </div>

                </div>
             </div>
          </div>
        )}

        {/* CONTATOS SECTION */}
        {activeRootTab === 'contatos' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 font-sans">
             <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500 border-b border-white/5 pb-2">Página de Contatos & Suporte</h3>
                <div className="grid grid-cols-1 gap-6">
                   
                   {/* Títulos Editáveis */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans border-t border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime block font-bold">Atendimento & Chamadas</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                         <div className="space-y-1">
                            <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block font-sans">Título Principal de Contatos</label>
                            <input 
                              type="text"
                              value={config.uiAssets.contactTitle || ''}
                              onChange={(e) => updateUIAssets({ contactTitle: e.target.value })}
                              placeholder="CONTATO"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block font-sans">Subtítulo / Descrição de Suporte</label>
                            <input 
                              type="text"
                              value={config.uiAssets.contactSubtitle || ''}
                              onChange={(e) => updateUIAssets({ contactSubtitle: e.target.value })}
                              placeholder="Fale com nossos artesãos especialistas"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Informações Ativas do Cartão de Contato */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime block font-bold">Canal Direto de Atendimento</span>
                      
                      <div className="space-y-4 font-sans">
                         {/* Email input */}
                         <div className="space-y-1">
                            <div className="flex justify-between items-center font-sans">
                               <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider font-sans">E-mail Comercial</label>
                               <Mail size={12} className="text-zinc-650" />
                            </div>
                            <input 
                              type="email"
                              value={config.uiAssets.contactEmail || ''}
                              onChange={(e) => updateUIAssets({ contactEmail: e.target.value })}
                              placeholder="atendimento@joiasnaturais.com.br"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none font-sans"
                            />
                         </div>

                         {/* Phone/WhatsApp input */}
                         <div className="space-y-1 font-sans">
                            <div className="flex justify-between items-center font-sans">
                               <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider font-sans">WhatsApp Corporativo (DDI+DDD+Número)</label>
                               <Phone size={12} className="text-zinc-650" />
                            </div>
                            <input 
                              type="text"
                              value={config.uiAssets.contactPhone || ''}
                              onChange={(e) => updateUIAssets({ contactPhone: e.target.value })}
                              placeholder="+55 (11) 99999-8888"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none font-sans"
                            />
                            <p className="text-[7.5px] text-zinc-600 uppercase tracking-normal mt-0.5 leading-none font-sans">Dica: Adicione o DDI (55) + DDD + número. O sistema gera automaticamente os links de conversa do WhatsApp.</p>
                         </div>

                         {/* Atelier Endereço */}
                         <div className="space-y-1 font-sans">
                            <div className="flex justify-between items-center">
                               <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider font-sans">Endereço / Cidade do Atelier</label>
                               <MapPin size={12} className="text-zinc-650" />
                            </div>
                            <input 
                              type="text"
                              value={config.uiAssets.contactAddress || ''}
                              onChange={(e) => updateUIAssets({ contactAddress: e.target.value })}
                              placeholder="São Paulo, Brasil"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none font-sans"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Links Sociais Ativos */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans border-t border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime block font-bold">Mídias Sociais Ativas (Redes Sociais)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                         <div className="space-y-2 font-sans">
                            <div className="flex items-center gap-2 text-zinc-500 font-sans">
                               <Instagram size={14} />
                               <span className="text-[8px] uppercase font-bold tracking-widest font-sans">Link do Instagram</span>
                            </div>
                            <input 
                              type="url"
                              value={config.uiAssets.contactInstagram || ''}
                              onChange={(e) => updateUIAssets({ contactInstagram: e.target.value })}
                              placeholder="https://instagram.com/perfil"
                              className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-brand-lime/30 font-mono text-[9px] animate-none"
                            />
                         </div>
                         <div className="space-y-2 font-sans">
                            <div className="flex items-center gap-2 text-zinc-500 font-sans font-bold">
                               <Facebook size={14} />
                               <span className="text-[8px] uppercase font-bold tracking-widest font-sans">Link do Facebook</span>
                            </div>
                            <input 
                              type="url"
                              value={config.uiAssets.contactFacebook || ''}
                              onChange={(e) => updateUIAssets({ contactFacebook: e.target.value })}
                              placeholder="https://facebook.com/perfil"
                              className="w-full bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-brand-lime/30 font-mono text-[9px] animate-none"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Foto do Atelier ou Escritório */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                      <div className="flex items-center justify-between font-sans">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime font-sans">Imagem de Abertura / Foto da Oficina</span>
                         <ImageIcon size={14} className="text-zinc-600 font-sans" />
                      </div>
                      <div className="flex items-center gap-6 font-sans">
                         <div className="w-20 h-20 bg-black rounded-2xl border border-white/5 flex items-center justify-center p-1 overflow-hidden font-sans">
                            {config.uiAssets.contactImage ? (
                               <img src={config.uiAssets.contactImage} className="max-h-full max-w-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                            ) : (
                               <div className="text-[8px] text-zinc-700 font-mono text-center uppercase">Sem Imagem</div>
                            )}
                         </div>
                         <div className="flex-1 space-y-2 font-sans">
                            <p className="text-[8px] text-zinc-500 uppercase leading-relaxed font-sans font-bold">Mostre uma foto da vitrine do atelier, da equipe de artesãos ou da bancada de ferramentas.</p>
                            <input type="file" id="contact-img-upload" className="hidden" accept="image/*" onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onload = () => updateUIAssets({ contactImage: reader.result as string });
                                 reader.readAsDataURL(file);
                               }
                            }} />
                            <label htmlFor="contact-img-upload" className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer font-sans h-[30px] leading-none flex items-center justify-center">Carregar Foto do Atelier</label>
                         </div>
                      </div>
                   </div>

                    {/* Mensagens de Clientes (Contato) */}
                    <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-6 font-sans">
                       <div className="flex items-center justify-between font-sans pb-3 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-brand-lime" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-350 block">Mensagens Recebidas</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-brand-lime/10 text-brand-lime px-2.5 py-0.5 rounded-full">
                            {(config.contactMessages || []).length} Mensagens
                          </span>
                       </div>

                       {(!config.contactMessages || config.contactMessages.length === 0) ? (
                         <div className="py-6 text-center text-zinc-500 font-serif italic text-xs">
                           Nenhuma mensagem de contato recebida até o momento.
                         </div>
                       ) : (
                         <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto pr-2 space-y-4">
                           {(config.contactMessages || []).map((msg) => (
                             <div key={msg.id} className="pt-4 first:pt-0 space-y-3">
                               <div className="flex items-start justify-between gap-4">
                                 <div>
                                   <p className="text-xs uppercase tracking-wider font-bold text-white">{msg.name}</p>
                                   <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{msg.email} • {msg.createdAt}</p>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => deleteContactMessage(msg.id)}
                                   className="p-1.5 bg-zinc-950 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center h-8 w-8"
                                   title="Excluir mensagem"
                                 >
                                   <Trash2 size={12} />
                                 </button>
                               </div>

                               <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                 <p className="text-zinc-300 text-xs font-serif italic whitespace-pre-line leading-relaxed">
                                   "{msg.message}"
                                 </p>
                               </div>

                               <div className="flex gap-2">
                                 <a
                                   href={`mailto:${msg.email}?subject=Contato - Jóias Naturais&body=Olá ${msg.name},`}
                                   className="px-3 py-1.5 bg-brand-lime hover:bg-brand-lime/90 text-black font-extrabold uppercase tracking-widest text-[8px] rounded-lg transition-all flex items-center gap-1.5 shadow shadow-brand-lime/10 h-7"
                                 >
                                   <Mail size={10} /> Responder por E-mail
                                 </a>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>

                   {/* Vídeo do Atelier (Opcional) */}
                   <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4 font-sans">
                      <div className="flex items-center justify-between font-sans">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-brand-lime font-bold">Vídeo Cortesia / Canal Atelier</span>
                         <Video size={14} className="text-zinc-600" />
                      </div>
                      
                      {config.uiAssets.contactVideoUrl && (
                        <div className="p-2 bg-black border border-white/5 rounded-2xl font-sans">
                          <p className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 mb-2 font-bold select-none">Vídeo de Contatos Ativo:</p>
                          <span className="text-[8px] font-mono text-zinc-400 select-all block break-all whitespace-normal bg-zinc-900 p-2 rounded-lg font-sans">{config.uiAssets.contactVideoUrl.substring(0, 100)}...</span>
                        </div>
                      )}

                      <div className="space-y-3 font-sans">
                         <div className="space-y-1 font-sans">
                            <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block font-sans">Link do Vídeo (YouTube ou direct MP4)</label>
                            <input 
                              type="url"
                              value={config.uiAssets.contactVideoUrl || ''}
                              onChange={(e) => updateUIAssets({ contactVideoUrl: e.target.value })}
                              placeholder="Ex: https://www.youtube.com/watch?v=FOTvY-Q98Dk"
                              className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white focus:border-brand-lime/30 animate-none font-sans"
                            />
                         </div>
                         
                         <div className="relative font-sans text-center space-y-2">
                            <div className="text-[8.5px] text-zinc-500 uppercase tracking-wider font-bold">OU FAÇA UPLOAD DE UM VÍDEO CURTO (MP4)</div>
                            <input 
                              type="file" 
                              id="contact-video-upload" 
                              className="hidden" 
                              accept="video/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 15 * 1024 * 1024) {
                                    alert('Por segurança de armazenamento, faça upload de vídeos curtos de até 15MB, ou envie links externos.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => updateUIAssets({ contactVideoUrl: reader.result as string });
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                            <label htmlFor="contact-video-upload" className="w-full border border-dashed border-white/5 hover:border-brand-lime/20 rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer font-sans bg-black/45 hover:bg-black transition-all">
                               <Upload size={14} className="text-brand-lime font-sans" />
                               <span className="text-[8.5px] text-zinc-400 uppercase tracking-widest font-extrabold font-sans">Subir Vídeo de Suporte</span>
                            </label>
                         </div>
                      </div>
                   </div>

                </div>
             </div>
          </div>
        )}

        {/* EVALUAÇÕES AUDIT TAB MOVED TO DASHBOARD */}
        {false && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 font-sans">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                   <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500">Auditoria & Moderação de Avaliações</h3>
                   <p className="text-[10px] text-zinc-400 leading-relaxed font-sans font-light">
                      Gerencie os relatos enviados pelos clientes no site e decida quais serão exibidos publicamente no carrossel da página inicial, páginas de produto e "sobre nós".
                   </p>
                </div>
                <button
                   onClick={() => setIsAddingEvaluation(!isAddingEvaluation)}
                   className="px-4 py-2 bg-zinc-900 border border-white/10 hover:border-brand-lime/40 text-white hover:text-brand-lime rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap h-fit self-start sm:self-center"
                >
                   {isAddingEvaluation ? <X size={12} /> : <PlusCircle size={12} />}
                   {isAddingEvaluation ? 'Cancelar' : 'Nova Avaliação Manual'}
                </button>
             </div>

             {/* MANUAL EVALUATION FORM */}
             <AnimatePresence>
                {isAddingEvaluation && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateManualReview}
                    className="p-6 bg-zinc-950 border border-brand-lime/10 rounded-3xl space-y-5 overflow-hidden"
                  >
                     <div className="space-y-1">
                        <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-brand-lime">Inserir Depoimento Histórico</h4>
                        <p className="text-[9px] text-zinc-400">Preencha os dados abaixo e selecione a data em que o cliente fez o relato no outro canal.</p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Nome do Cliente</label>
                           <input 
                             type="text" 
                             required
                             placeholder="Ex: Joana Silva"
                             value={newEvaluation.clientName}
                             onChange={(e) => setNewEvaluation({ ...newEvaluation, clientName: e.target.value })}
                             className="w-full px-4 py-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-brand-lime/40 transition-colors"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Data do Depoimento</label>
                           <input 
                             type="date" 
                             required
                             placeholder="Selecione a data original"
                             value={newEvaluation.createdAt}
                             onChange={(e) => setNewEvaluation({ ...newEvaluation, createdAt: e.target.value })}
                             className="w-full px-4 py-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-brand-lime/40 transition-colors font-mono"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Avaliação (Estrelas)</label>
                           <div className="flex gap-2 items-center h-10">
                              {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                   key={star}
                                   type="button"
                                   onClick={() => setNewEvaluation({ ...newEvaluation, rating: star })}
                                   className="text-amber-400 hover:scale-110 active:scale-95 transition-transform"
                                 >
                                    <Star 
                                      size={20} 
                                      className={cn(star <= newEvaluation.rating ? "fill-amber-400" : "text-zinc-700")} 
                                    />
                                 </button>
                              ))}
                              <span className="text-zinc-500 font-mono text-[11px] ml-2">({newEvaluation.rating} de 5)</span>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Status Inicial</label>
                           <div className="grid grid-cols-2 gap-2 h-10">
                              <button
                                type="button"
                                onClick={() => setNewEvaluation({ ...newEvaluation, status: 'approved' })}
                                className={cn(
                                  "rounded-xl font-bold uppercase tracking-widest text-[8px] transition-all border",
                                  newEvaluation.status === 'approved' 
                                    ? "bg-brand-lime text-black border-brand-lime" 
                                    : "bg-zinc-900/40 text-zinc-400 border-white/5 hover:border-white/10"
                                )}
                              >
                                Ativo / Aprovado
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewEvaluation({ ...newEvaluation, status: 'pending' })}
                                className={cn(
                                  "rounded-xl font-bold uppercase tracking-widest text-[8px] transition-all border",
                                  newEvaluation.status === 'pending' 
                                    ? "bg-amber-500 text-black border-amber-500" 
                                    : "bg-zinc-900/40 text-zinc-400 border-white/5 hover:border-white/10"
                                )}
                              >
                                Pendente Moderar
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Comentário / Relato</label>
                        <textarea 
                          required
                          rows={3}
                          placeholder="Digite ou cole aqui o depoimento do seu cliente..."
                          value={newEvaluation.comment}
                          onChange={(e) => setNewEvaluation({ ...newEvaluation, comment: e.target.value })}
                          className="w-full px-4 py-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-brand-lime/40 transition-colors resize-none font-serif italic"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Foto da Joia (Opcional)</label>
                        <div className="flex gap-4 items-center">
                           <input 
                             type="file" 
                             id="manual-eval-photo" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={handleManualReviewImageChange} 
                           />
                           <label 
                             htmlFor="manual-eval-photo" 
                             className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-855 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-white transition-all"
                           >
                              <Upload size={12} className="text-zinc-400" />
                              {newEvaluation.imageUrl ? "Alterar Imagem" : "Subir Foto"}
                           </label>
                           {newEvaluation.imageUrl && (
                              <div className="flex items-center gap-2">
                                 <img src={newEvaluation.imageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                 <button 
                                   type="button" 
                                   onClick={() => setNewEvaluation({ ...newEvaluation, imageUrl: '' })}
                                   className="p-1 hover:bg-white/5 rounded text-red-400"
                                 >
                                    <X size={12} />
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex justify-end gap-2 pt-2 border-t border-white/5 font-sans">
                        <button
                          type="button"
                          onClick={() => setIsAddingEvaluation(false)}
                          className="px-4 py-2 bg-transparent text-zinc-400 hover:text-white font-bold text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                           Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-brand-lime text-black font-extrabold text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-lime/10 cursor-pointer"
                        >
                           Salvar Avaliação
                        </button>
                     </div>
                  </motion.form>
                )}
             </AnimatePresence>

             {/* Stats Cards / Clickable Tabs */}
             <div className="grid grid-cols-3 gap-4 font-sans">
                <button
                   onClick={() => setEvaluationFilter('all')}
                   className={cn(
                     "p-4 text-left border rounded-2xl transition-all cursor-pointer focus:outline-none",
                     evaluationFilter === 'all' 
                       ? "bg-brand-lime/[0.04] border-brand-lime ring-1 ring-brand-lime/20" 
                       : "bg-zinc-900/60 border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
                   )}
                >
                   <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Total Recebido</p>
                   <p className="text-xl font-serif text-white mt-1">{(config.evaluations || []).length}</p>
                   <div className="h-1 w-6 bg-white/20 rounded mt-2 opacity-50" style={{ backgroundColor: evaluationFilter === 'all' ? '#bef264' : 'transparent' }} />
                </button>
                <button
                   onClick={() => setEvaluationFilter('approved')}
                   className={cn(
                     "p-4 text-left border rounded-2xl transition-all cursor-pointer focus:outline-none",
                     evaluationFilter === 'approved' 
                       ? "bg-brand-lime/[0.04] border-brand-lime ring-1 ring-brand-lime/20" 
                       : "bg-zinc-900/60 border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
                   )}
                >
                   <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Aprovadas (Visíveis)</p>
                   <p className="text-xl font-serif text-brand-lime mt-1">{(config.evaluations || []).filter(e => e.status === 'approved').length}</p>
                   <div className="h-1 w-6 bg-brand-lime rounded mt-2" style={{ backgroundColor: evaluationFilter === 'approved' ? '#bef264' : 'transparent' }} />
                </button>
                <button
                   onClick={() => setEvaluationFilter('pending')}
                   className={cn(
                     "p-4 text-left border rounded-2xl transition-all cursor-pointer focus:outline-none",
                     evaluationFilter === 'pending' 
                       ? "bg-brand-lime/[0.04] border-brand-lime ring-1 ring-brand-lime/20" 
                       : "bg-zinc-900/60 border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
                   )}
                >
                   <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Pendentes</p>
                   <p className="text-xl font-mono text-amber-500 mt-1">{(config.evaluations || []).filter(e => e.status === 'pending').length}</p>
                   <div className="h-1 w-6 bg-amber-500 rounded mt-2" style={{ backgroundColor: evaluationFilter === 'pending' ? '#bef264' : 'transparent' }} />
                </button>
             </div>

             {/* Reviews List */}
             <div className="space-y-6">
                {(() => {
                  const filteredReviews = (config.evaluations || []).filter((review) => {
                    if (evaluationFilter === 'all') return true;
                    return review.status === evaluationFilter;
                  });

                  if (filteredReviews.length === 0) {
                    return (
                      <div className="p-12 text-center bg-zinc-900/10 border border-white/5 rounded-[32px] space-y-2">
                         <Star size={24} className="text-zinc-700 mx-auto" />
                         <p className="text-xs font-serif italic text-zinc-500">
                           {evaluationFilter === 'all' && "Nenhuma avaliação recebida ainda."}
                           {evaluationFilter === 'approved' && "Nenhuma avaliação aprovada e ativa no site."}
                           {evaluationFilter === 'pending' && "Nenhuma avaliação pendente para moderar."}
                         </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                       {filteredReviews.map((review) => {
                         const initials = review.clientName
                           ? review.clientName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                           : 'U';
                         return (
                           <div 
                             key={review.id} 
                             className={cn(
                               "p-6 bg-zinc-900 border rounded-3xl space-y-4 transition-all",
                               review.status === 'pending' 
                                 ? "border-amber-500/25 bg-amber-500/5" 
                                 : review.status === 'rejected'
                                   ? "border-red-500/10 bg-red-950/5 opacity-75"
                                   : "border-white/5"
                             )}
                           >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                 <div className="flex items-center gap-3">
                                    {review.imageUrl ? (
                                      <img 
                                        src={review.imageUrl} 
                                        alt={review.clientName} 
                                        className="w-12 h-12 rounded-full object-cover border border-white/10" 
                                        referrerPolicy="no-referrer" 
                                      />
                                    ) : (
                                      <div 
                                        style={{ backgroundColor: review.avatarColor || '#bef264' }} 
                                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs text-zinc-950 font-mono shadow-inner"
                                      >
                                         {initials}
                                      </div>
                                    )}
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <p className="text-xs uppercase font-extrabold tracking-wider text-white">{review.clientName}</p>
                                          <span className={cn(
                                            "text-[7px] px-2 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase",
                                            review.status === 'pending' 
                                              ? "bg-amber-500/10 text-amber-400" 
                                              : review.status === 'rejected'
                                                ? "bg-red-500/10 text-red-400"
                                                : "bg-brand-lime/10 text-brand-lime"
                                          )}>
                                             {review.status === 'pending' && 'Pendente'}
                                             {review.status === 'approved' && 'Ativa/Aprovada'}
                                             {review.status === 'rejected' && 'Excluída / Arquivada'}
                                          </span>
                                       </div>
                                       <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{review.createdAt}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                    {(review.status === 'pending' || review.status === 'rejected') && (
                                       <button
                                         onClick={() => approveEvaluation(review.id)}
                                         className="px-4 py-2 bg-brand-lime hover:scale-[1.02] active:scale-[0.98] text-black font-bold text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                       >
                                          <CheckCircle2 size={12} />
                                          {review.status === 'rejected' ? 'Restaurar & Publicar' : 'Aprovar & Publicar'}
                                       </button>
                                    )}
                                    {review.status !== 'rejected' ? (
                                       <button
                                         onClick={() => triggerConfirm(
                                           'Excluir / Arquivar Avaliação',
                                           `Deseja arquivar e não exibir o depoimento de "${review.clientName}" no site? Ela ainda constará em seus registros de auditoria total.`,
                                           () => deleteEvaluation(review.id)
                                         )}
                                         className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors cursor-pointer"
                                         title="Mover para Excluídas"
                                       >
                                          <Trash2 size={14} />
                                       </button>
                                    ) : (
                                       <button
                                         onClick={() => triggerConfirm(
                                           'Deletar Permanentemente',
                                           `Deseja apagar definitivamente e permanentemente o depoimento de "${review.clientName}"? Essa ação não poderá ser desfeita.`,
                                           () => permanentlyDeleteEvaluation(review.id)
                                         )}
                                         className="p-2.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                         title="Deletar Permanentemente"
                                       >
                                          <X size={14} />
                                       </button>
                                    )}
                                 </div>
                              </div>

                              {/* Ratings & text */}
                              <div className="space-y-4">
                                 <div className="flex gap-0.5 text-amber-400 font-sans">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={12} 
                                        className={cn(i < review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-855")} 
                                      />
                                    ))}
                                 </div>
                                 <p className="text-xs font-serif italic text-zinc-300 leading-relaxed bg-black/15 p-4 rounded-xl border border-white/5">
                                   "{review.comment}"
                                 </p>
                                 {review.imageUrl && (
                                   <div className="mt-2">
                                     <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Foto enviada:</p>
                                     <img src={review.imageUrl} alt="Joia do Cliente" className="max-h-40 rounded-xl object-contain border border-white/5 bg-black/40 p-1" />
                                   </div>
                                 )}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  );
                })()}
             </div>
          </div>
        )}

      </main>

      {/* Global Save Indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-full shadow-2xl z-[70]">
         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
         <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Autosave Local Ativado</span>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl space-y-6"
             >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                   <AlertCircle className="text-red-500" size={32} />
                </div>
                <div className="text-center space-y-2">
                   <h3 className="text-lg font-serif text-white uppercase tracking-widest">{confirmModal.title}</h3>
                   <p className="text-xs text-zinc-500 leading-relaxed">{confirmModal.message}</p>
                </div>
                <div className="flex flex-col gap-3">
                   <button 
                     type="button"
                     onClick={() => {
                       confirmModal.onConfirm();
                       setConfirmModal(prev => ({ ...prev, isOpen: false }));
                     }}
                     className="w-full py-4 bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-colors cursor-pointer"
                   >
                     Confirmar Exclusão
                   </button>
                   <button 
                     type="button"
                     onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                     className="w-full py-4 bg-white/5 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors cursor-pointer"
                   >
                     Cancelar
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
