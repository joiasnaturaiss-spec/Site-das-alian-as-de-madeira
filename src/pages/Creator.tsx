import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editable } from '../components/Editable';
import { Check, Info, Save, Layers, Palette, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useConfig } from '../context/ConfigContext';
import { useNavigate } from 'react-router-dom';

export function Creator() {
  const { config, addCustomProduct, findExistingProduct } = useConfig();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'madeira' | 'nucleo' | 'pedra' | 'filete'>('madeira');
  
  // Group layers by type for the UI
  const availableWoods = useMemo(() => (config.layers || []).filter(l => l.type === 'madeira'), [config.layers]);
  const availableStones = useMemo(() => (config.layers || []).filter(l => l.type === 'pedra'), [config.layers]);
  const availableNucleos = useMemo(() => (config.layers || []).filter(l => l.type === 'nucleo'), [config.layers]);
  const availableFiletes = useMemo(() => (config.layers || []).filter(l => l.type === 'filete'), [config.layers]);
  const availableLogos = useMemo(() => (config.layers || []).filter(l => l.type === 'logo'), [config.layers]);
  const defaultFundo = useMemo(() => (config.layers || []).find(l => l.type === 'fundo')?.src || '', [config.layers]);

  const [selectedWood, setSelectedWood] = useState(availableWoods[0] || null);
  const [selectedStone, setSelectedStone] = useState(availableStones[0] || null);
  const [selectedNucleo, setSelectedNucleo] = useState(availableNucleos[0] || null);
  const [selectedFilete, setSelectedFilete] = useState(availableFiletes[0] || null);
  const [selectedLogo, setSelectedLogo] = useState(availableLogos[0] || null);

  const [hasPreselected, setHasPreselected] = useState(false);
  const [isGeneratingSymbolism, setIsGeneratingSymbolism] = useState(false);

  // Dynamic Deep Linking & Preselection Integration for Materials/Textures
  useEffect(() => {
    if (hasPreselected) return;

    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('preselect');
    if (!preselect) return;

    if (
      availableWoods.length > 0 ||
      availableStones.length > 0 ||
      availableNucleos.length > 0 ||
      availableFiletes.length > 0
    ) {
      const decoded = decodeURIComponent(preselect).toLowerCase();

      const findMatch = (list: any[]) => {
        return list.find((item) => {
          const name = item.name.toLowerCase();
          return name === decoded || name.includes(decoded) || decoded.includes(name);
        });
      };

      const wood = findMatch(availableWoods);
      if (wood) {
        setSelectedWood(wood);
        setActiveTab('madeira');
        setHasPreselected(true);
        return;
      }

      const stone = findMatch(availableStones);
      if (stone) {
        setSelectedStone(stone);
        setActiveTab('pedra');
        setHasPreselected(true);
        return;
      }

      const nucleo = findMatch(availableNucleos);
      if (nucleo) {
        setSelectedNucleo(nucleo);
        setActiveTab('nucleo');
        setHasPreselected(true);
        return;
      }

      const filete = findMatch(availableFiletes);
      if (filete) {
        setSelectedFilete(filete);
        setActiveTab('filete');
        setHasPreselected(true);
        return;
      }
    }
  }, [availableWoods, availableStones, availableNucleos, availableFiletes, hasPreselected]);

  const totalPrice = useMemo(() => {
    const hasNucleo = !!selectedNucleo;
    const hasFilete = !!selectedFilete;
    const nucleoName = selectedNucleo?.name.toLowerCase() || '';
    const fileteName = selectedFilete?.name.toLowerCase() || '';

    // Sort rules by some priority (e.g., silver rule is usually more expensive/specific)
    // We'll iterate through rules and find the one that matches
    
    // First, find specific material add-ons (those with individual prices)
    const layers = [selectedWood, selectedStone, selectedNucleo, selectedFilete, selectedLogo];
    const materialAddOns = layers.reduce((acc, layer) => {
      // If a layer has a price, it's an additive cost (manual override/custom material)
      return acc + (Number(layer?.price) || 0);
    }, 0);

    // Now find the applicable pricing rule
    // We check them in reverse order of price (most expensive first) assuming more expensive = more specific
    const sortedRules = [...(config.pricingRules || [])].sort((a, b) => b.price - a.price);

    let baseFromRule = 120;
    let ruleApplied = false;

    for (const rule of sortedRules) {
      const { condition } = rule;
      let matches = true;

      // STRICT MATCHING for booleans if they are defined in the rule
      if (condition.hasWood !== undefined && condition.hasWood !== (!!selectedWood)) matches = false;
      if (condition.hasStone !== undefined && condition.hasStone !== (!!selectedStone)) matches = false;
      if (condition.hasNucleo !== undefined && condition.hasNucleo !== (!!selectedNucleo)) matches = false;
      if (condition.hasFilete !== undefined && condition.hasFilete !== (!!selectedFilete)) matches = false;
      
      // Name filters: only apply if the rule specifies a type
      // We check if the selected material name contains the condition name (case insensitive)
      if (matches && condition.nucleoType && condition.nucleoType.trim() !== '') {
        const type = condition.nucleoType.toLowerCase();
        const name = selectedNucleo?.name.toLowerCase() || '';
        if (!selectedNucleo || !name.includes(type)) {
          // Fallback: if the core is the ONLY one available, maybe match it anyway? 
          // No, let's keep it strict but allow "núcleo" to match if the rule says so.
          matches = false;
        }
      }
      
      if (matches && condition.fileteType && condition.fileteType.trim() !== '') {
        const type = condition.fileteType.toLowerCase();
        const name = selectedFilete?.name.toLowerCase() || '';
        if (!selectedFilete || !name.includes(type)) matches = false;
      }

      if (matches) {
        baseFromRule = rule.price;
        ruleApplied = true;
        break;
      }
    }

    // Standard fallback if no rules match (though rule-standard should match most things)
    if (!ruleApplied) {
      const standard = (config.pricingRules || []).find(r => r.id === 'rule-standard');
      if (standard) baseFromRule = standard.price;
    }

    if (config.uiAssets?.testPromoPriceActive) {
      const val = Number(config.uiAssets.testPromoPriceValue);
      return !isNaN(val) && val > 0 ? val : 1.00;
    }

    const calculatedBase = (Number(baseFromRule) || 120) + materialAddOns;

    if (config.uiAssets?.bulkPromoActive) {
      const type = config.uiAssets.bulkPromoType || 'fixed';
      const val = Number(config.uiAssets.bulkPromoValue) || 0;
      if (type === 'percentage') {
        return Math.max(0.01, calculatedBase * (1 - val / 100));
      } else if (type === 'fixed_discount') {
        return Math.max(0.01, calculatedBase - val);
      } else { // 'fixed' - preço fixo para todos
        return val;
      }
    }

    return calculatedBase;
  }, [selectedWood, selectedStone, selectedNucleo, selectedFilete, selectedLogo, config.pricingRules, config.uiAssets?.testPromoPriceActive, config.uiAssets?.testPromoPriceValue, config.uiAssets?.bulkPromoActive, config.uiAssets?.bulkPromoType, config.uiAssets?.bulkPromoValue]);

  const combinedSymbolism = useMemo(() => {
    const layers = [selectedWood, selectedStone, selectedNucleo, selectedFilete, selectedLogo];
    return layers
      .filter(l => l?.symbolism)
      .map(l => l!.symbolism)
      .join(' • ');
  }, [selectedWood, selectedStone, selectedNucleo, selectedFilete, selectedLogo]);

  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'madeira': return { layers: availableWoods, active: selectedWood, setter: setSelectedWood };
      case 'nucleo': return { layers: availableNucleos, active: selectedNucleo, setter: setSelectedNucleo };
      case 'pedra': return { layers: availableStones, active: selectedStone, setter: setSelectedStone };
      case 'filete': return { layers: availableFiletes, active: selectedFilete, setter: setSelectedFilete };
      default: return { layers: [], active: null, setter: () => {} };
    }
  }, [activeTab, availableWoods, availableNucleos, availableStones, availableFiletes, selectedWood, selectedNucleo, selectedStone, selectedFilete]);

  const handleSaveToCatalog = async () => {
    const currentLayerIds = [
      selectedWood?.id,
      selectedNucleo?.id,
      selectedStone?.id,
      selectedFilete?.id,
      selectedLogo?.id
    ].filter(Boolean) as string[];

    const existing = findExistingProduct(currentLayerIds);
    if (existing) {
      navigate(`/produto/${existing.id}`);
      return;
    }

    setIsGeneratingSymbolism(true);
    let finalSymbolism = '';

    try {
      const selectedMaterials = [selectedWood, selectedNucleo, selectedStone, selectedFilete]
        .filter(l => l?.name)
        .map(l => l!.name);
      
      const response = await fetch("/api/gemini/unify-symbolism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials: selectedMaterials }),
      });
      const data = await response.json();
      if (data && data.symbolism) {
        finalSymbolism = data.symbolism;
      }
    } catch (e) {
      console.error("Error fetching unified symbolism:", e);
    }

    if (!finalSymbolism) {
      const selectedMaterials = [selectedWood, selectedNucleo, selectedStone, selectedFilete]
        .filter(l => l?.name)
        .map(l => l!.name);
      finalSymbolism = `A união de ${selectedMaterials.join(" e ")} cria uma aliança que simboliza profundidade, proteção e conexão verdadeira. A alquimia natural de seus veios e reflexos desperta raízes sólidas e estabilidade emocional, transformando a peça em um elo de um amor autêntico, sofisticado e eterno.`;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const layersToDraw = [
        { src: defaultFundo, isFundo: true },
        selectedWood,
        selectedNucleo,
        selectedStone,
        selectedFilete,
        selectedLogo
      ].filter(l => l !== null && (l.src || (l as any).isFundo));
      
      // Load all images first
      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        });
      };

      try {
        const loadedImages = await Promise.all(layersToDraw.map(l => loadImg((l as any).src)));
        
        // Add a base background color to ensure no transparency issues
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1000, 1000);

        loadedImages.forEach((img, idx) => {
          if (idx === 0) {
             ctx.drawImage(img, 0, 0, 1000, 1000);
          } else {
             // Add shadow for the first ring layer (usually wood) to ground it
             if (idx === 1) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 40;
                ctx.shadowOffsetY = 20;
                ctx.drawImage(img, 0, 0, 1000, 1000);
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;
             } else {
                ctx.drawImage(img, 0, 0, 1000, 1000);
             }
          }
        });
      } catch (e) {
        console.error('Error rendering composite:', e);
      }
    }

    const compositeImage = canvas.toDataURL('image/jpeg', 0.8);

    const productId = `custom-${Date.now()}`;
    const newProduct = {
      id: productId,
      name: `Aliança ${selectedWood?.name || 'Personalizada'}`,
      price: totalPrice,
      image: compositeImage || selectedWood?.src || '',
      material: [selectedWood, selectedNucleo, selectedStone, selectedFilete].filter(l => l?.name).map(l => l!.name).join(' + '),
      description: 'Uma criação única desenvolvida no atelier digital Jóias Naturais com materiais selecionados manualmente.',
      symbolism: finalSymbolism,
      layerIds: currentLayerIds,
      category: 'ring' as const
    };

    addCustomProduct(newProduct);
    setIsGeneratingSymbolism(false);
    navigate(`/produto/${productId}`);
  };

  if (!config.layers || config.layers.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black text-center space-y-6">
         <Sparkles size={48} className="text-zinc-800" />
         <div className="space-y-2">
            <h2 className="text-2xl font-serif text-white">Nenhum Material Configurado</h2>
            <p className="text-zinc-500 text-xs tracking-widest uppercase">Vá ao painel administrativo para carregar as camadas PNG do criador.</p>
         </div>
         <button 
           onClick={() => navigate('/admin/config', { state: { activeTab: 'camadas' } })}
           className="px-8 py-3 bg-brand-lime text-black font-bold uppercase tracking-widest text-[10px] rounded-full glow-green"
         >
           IR PARA CONFIGURAÇÕES
         </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Fixed Header */}
      <div className="px-6 pt-10 pb-8 text-center shrink-0 z-10">
        <Editable id="creator-title" type="text" className="text-3xl font-serif text-brand-lime leading-tight">
          CRIADOR DE ALIANÇAS
        </Editable>
        <p className="text-[10px] text-zinc-500 tracking-[0.4em] uppercase mt-2">Sua essência em cada detalhe</p>
        
        {/* Custom Fields as Mini Alerts */}
        {Object.entries(config.uiAssets.customFields).map(([key, value]) => (
          <div key={key} className="mt-4 px-4 py-2 bg-brand-lime/10 border border-brand-lime/20 rounded-full inline-flex items-center gap-2">
             <span className="text-[8px] font-bold text-brand-lime uppercase tracking-widest">{key}:</span>
             <span className="text-[8px] text-white uppercase tracking-widest">{value}</span>
          </div>
        ))}
      </div>

      {/* Preview Area - Centralized with more room */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6 py-12 min-h-[400px]">
        <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center">
            {/* Background layer - depth effect */}
            {defaultFundo && (
              <img 
                src={defaultFundo} 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80 blur-[2px] transition-opacity" 
              />
            )}
            
            <div className="relative w-full h-full flex items-center justify-center">
               <motion.div
                 key={`${selectedWood?.id}-${selectedStone?.id}-${selectedNucleo?.id}-${selectedFilete?.id}-${selectedLogo?.id}`}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                 className="relative w-full h-full pointer-events-none flex items-center justify-center brightness-[1.02] contrast-[1.05]"
               >
                  {selectedWood && (
                    <img 
                      src={selectedWood.src} 
                      className="absolute inset-0 w-full h-full object-contain z-10" 
                      style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.5))' }}
                    />
                  )}
                  {selectedNucleo && (
                    <img 
                      src={selectedNucleo.src} 
                      className="absolute inset-0 w-full h-full object-contain z-[15]" 
                    />
                  )}
                  {selectedStone && (
                    <img 
                      src={selectedStone.src} 
                      className="absolute inset-0 w-full h-full object-contain z-20" 
                    />
                  )}
                  {selectedFilete && (
                    <img 
                      src={selectedFilete.src} 
                      className="absolute inset-0 w-full h-full object-contain z-30" 
                    />
                  )}
                  {selectedLogo && (
                    <img 
                      src={selectedLogo.src} 
                      className="absolute inset-0 w-full h-full object-contain z-[40]" 
                    />
                  )}
               </motion.div>
            </div>
            
            <div className="absolute -bottom-16 left-0 right-0 text-center flex flex-col items-center gap-2">
               <p className="text-[8px] text-zinc-600 uppercase tracking-[0.4em] font-medium">Design Exclusivo em Alta Definição</p>
               <p className="text-[11px] items-center justify-center gap-2 text-zinc-400 font-serif italic inline-flex">
                 <Sparkles size={12} className="text-brand-lime" />
                 Explore os materiais abaixo
               </p>
            </div>
        </div>
      </div>

      {/* Bottom Controls Area - Now it has spacing from the preview */}
      <div className="bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5 rounded-t-[40px] px-6 pt-10 pb-12 shrink-0">
        
        {/* Category Tabs */}
        <div className="flex justify-between items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-6 overflow-x-auto no-scrollbar relative overflow-hidden">
          {config.uiAssets.buttonBackground && (
            <img src={config.uiAssets.buttonBackground} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
          )}
          {[
            { id: 'madeira', label: 'Madeira' },
            { id: 'nucleo', label: 'Núcleo' },
            { id: 'pedra', label: 'Pedra' },
            { id: 'filete', label: 'Filetes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 px-4 py-3 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap relative z-10",
                activeTab === tab.id 
                  ? "bg-brand-lime text-black glow-green" 
                  : "text-zinc-500 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Horizontal Carousel */}
        <div className="relative mb-8">
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth px-1">
              {/* Clear Selection Option - Only for Nucleo and Filete */}
              {(activeTab === 'nucleo' || activeTab === 'filete') && (
                <button
                  onClick={() => currentItems.setter(null)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all bg-zinc-900/30",
                    currentItems.active === null ? "border-red-500/50 text-red-500" : "border-white/5 text-zinc-600 hover:border-white/10"
                  )}
                >
                  <X size={20} />
                  <span className="text-[8px] uppercase font-bold tracking-tighter">Limpar</span>
                </button>
              )}

              {currentItems.layers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => currentItems.setter(layer)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded-2xl border-2 transition-all relative overflow-hidden bg-white/5",
                    currentItems.active?.id === layer.id 
                      ? "border-brand-lime glow-green scale-105" 
                      : "border-white/5 hover:border-white/10"
                  )}
                >
                  <img src={layer.src} alt={layer.name} className="w-full h-full object-cover p-2" />
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 bg-black/80 py-1 transition-opacity",
                    currentItems.active?.id === layer.id ? "opacity-100" : "opacity-0"
                  )}>
                    <p className="text-[6px] text-brand-lime uppercase tracking-tighter text-center truncate px-1">
                      {layer.name}
                    </p>
                  </div>
                  {currentItems.active?.id === layer.id && (
                    <div className="absolute top-1 right-1 bg-brand-lime rounded-full p-0.5">
                      <Check size={8} className="text-black" />
                    </div>
                  )}
                </button>
              ))}
           </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-6">
           <div className="flex flex-col">
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5 italic">Total Personalizado</span>
              <span className="text-2xl font-serif text-white">R$ {(totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
           </div>
           
           <button 
             onClick={handleSaveToCatalog}
             disabled={isGeneratingSymbolism}
             className="flex-1 px-8 h-14 bg-brand-lime text-black font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-brand-lime/10 flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
           >
             {isGeneratingSymbolism ? (
               <>
                 <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                 Criando Simbolismo...
               </>
             ) : (
               "DETALHES"
             )}
           </button>
        </div>
      </div>
    </div>
  );
}

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18M6 6l12 12"/></svg>
);
