import { motion } from 'framer-motion';
import { Editable } from '../components/Editable';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingBag, Heart, Shield, RefreshCw, Truck, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useMemo, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { MeasurementGuide } from '../components/MeasurementGuide';
import { PublicReviews } from '../components/PublicReviews';

const products = [];

export function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { addToCart } = useCart();
  const [isSizerOpen, setIsSizerOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  
  const allProducts = useMemo(() => {
    return config.customProducts || [];
  }, [config.customProducts]);

  const product = allProducts.find(p => p.id === id) || allProducts[0];
  const [selectedSize, setSelectedSize] = useState<number | null>(null);

  const defaultSizes = useMemo(() => Array.from({ length: 27 }, (_, i) => 10 + i), []);
  const renderedSizes = useMemo(() => {
    return defaultSizes;
  }, [defaultSizes]);

  const handleAddToCart = () => {
    if (selectedSize === null) {
      setSizeError(true);
      // scroll to size section if possible
      const element = document.getElementById('size-title-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (product) {
      addToCart(product, selectedSize, 1);
      navigate('/carrinho');
    }
  };

  // Scroll the selected size into view inside the horizontal list
  useEffect(() => {
    if (selectedSize !== null) {
      setTimeout(() => {
        const element = document.getElementById(`size-btn-${selectedSize}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 150);
    }
  }, [selectedSize]);

  if (!product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <p className="text-zinc-500 font-serif italic text-sm">Nenhum produto cadastrado no momento.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-brand-lime text-black text-[10px] uppercase font-bold tracking-widest rounded-xl hover:scale-105 transition-transform">
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col w-full pb-20"
    >
      {/* Product Header/Gallery */}
      <div className="relative aspect-[4/5] w-full bg-zinc-900/20">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-20 p-3 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl text-white"
        >
          <ArrowLeft size={20} />
        </button>
        
        <button className="absolute top-6 right-6 z-20 p-3 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl text-zinc-400">
          <Heart size={20} />
        </button>

        <Editable 
          id={`prod-detail-img-${product.id}`} 
          type="image" 
          src={product.image} 
          className="w-full h-full object-cover"
        />
        
        {product.isPromotional && (
          <div className="absolute top-24 left-6 z-20 px-3 py-1.5 bg-brand-lime text-black font-black text-[9px] tracking-widest rounded-full uppercase shadow-xl">
            {product.promoBadge || 'OFERTA'}
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Info Section */}
      <div className="px-6 -mt-12 relative z-10 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="fill-brand-lime text-brand-lime" />
            ))}
            <span className="text-[10px] text-zinc-500 font-mono ml-2">4.9 (127 AVALIAÇÕES)</span>
          </div>

          <div className="space-y-1">
            <Editable id={`detail-title-${product.id}`} type="text" className="text-4xl font-serif text-white uppercase tracking-tight">
              {product.name}
            </Editable>
            <Editable id={`detail-material-${product.id}`} type="text" className="text-xs text-brand-lime font-mono tracking-widest uppercase">
              {product.material}
            </Editable>
          </div>

           <div className="flex items-baseline gap-3">
              {product.originalPrice && product.originalPrice > product.price ? (
                <>
                  <span className="text-zinc-500 text-lg line-through font-mono">
                    R$ {Number(product.originalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <p className="text-3xl font-serif text-brand-lime font-mono">
                    R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-serif text-white font-mono">
                  R$ {(Number(product.price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
           </div>

          <div className="space-y-4">
            {product.symbolism ? (
              <div className="text-center py-6 border-y border-white/5 space-y-3">
                 <h4 className="text-[11px] font-bold text-brand-lime uppercase tracking-[0.3em] font-sans">Simbolismo</h4>
                 <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed px-4 text-center max-w-xl mx-auto font-sans tracking-wide">
                   {product.symbolism}
                 </p>
              </div>
            ) : (
              <Editable id={`detail-desc-${product.id}`} type="text" className="text-zinc-500 text-sm leading-relaxed font-light font-sans">
                {product.description}
              </Editable>
            )}
          </div>
        </div>

        {/* Size Selection */}
        <div id="size-title-section" className="space-y-5">
           {/* Highlighted 'Obtenha sua medida.' Card */}
           <div className="bg-brand-lime/5 border border-brand-lime/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="space-y-1 text-center sm:text-left">
               <h4 className="text-[10.5px] uppercase font-extrabold tracking-wider text-brand-lime">Não Sabe Seu Tamanho?</h4>
               <p className="text-[11px] text-zinc-400 font-light max-w-[220px]">
                 Meça o seu tamanho ideal de forma rápida e precisa na tela do seu celular.
               </p>
             </div>
             <button
               onClick={() => setIsSizerOpen(true)}
               className="w-full sm:w-auto py-3 px-5 bg-brand-lime text-black font-extrabold rounded-xl text-[10px] uppercase tracking-widest hover:bg-white transition-all scale-100 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-brand-lime/15 shrink-0 cursor-pointer font-sans"
             >
               Obtenha sua medida.
             </button>
           </div>

           <div className="space-y-3">
             <div className="flex justify-between items-center text-zinc-400">
               <div className="flex items-center gap-2">
                 <h4 className="text-[10px] uppercase font-bold tracking-[0.2em]">SELECIONAR TAMANHO</h4>
                 {selectedSize !== null && (
                   <span className="text-[9px] bg-brand-lime/10 border border-brand-lime/30 text-brand-lime px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                     Aro {selectedSize} Selecionado
                   </span>
                 )}
               </div>
               <span className="text-[8px] uppercase font-mono tracking-wider text-zinc-500 animate-pulse">Deslize para o lado ➔</span>
             </div>

             {sizeError && (
               <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-xs animate-shake">
                 <AlertTriangle size={14} className="shrink-0" />
                 <span>Por favor, selecione um tamanho (Aro) antes de adicionar à sacola.</span>
               </div>
             )}

             <div className="flex gap-2.5 overflow-x-auto pb-4 pt-1 -mx-6 px-6 no-scrollbar snap-x touch-pan-x">
               {renderedSizes.map((size) => (
                 <button
                   key={size}
                   id={`size-btn-${size}`}
                   onClick={() => {
                     setSelectedSize(size);
                     setSizeError(false);
                   }}
                   className={cn(
                     "w-[56px] h-[56px] flex flex-col items-center justify-center border rounded-2xl text-xs transition-all font-mono shrink-0 snap-center select-none cursor-pointer",
                     selectedSize === size 
                      ? "bg-brand-lime border-brand-lime text-black glow-green scale-102 font-bold ring-2 ring-brand-lime/30" 
                      : "border-white/5 bg-zinc-900/30 text-zinc-400 hover:border-white/20 hover:text-white"
                   )}
                 >
                   <span className="text-[13px] font-bold">{size}</span>
                   <span className="text-[6.5px] uppercase tracking-wider opacity-60">Aro</span>
                 </button>
               ))}
             </div>
           </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleAddToCart}
          className="w-full py-5 bg-brand-lime text-black font-bold uppercase tracking-[0.4em] text-xs rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl shadow-brand-lime/10 cursor-pointer"
        >
          <ShoppingBag size={18} />
          ADICIONAR À SACOLA
        </button>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900/50 rounded-lg text-brand-lime/60"><Shield size={16} /></div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">Garantia Vitalícia</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900/50 rounded-lg text-brand-lime/60"><Truck size={16} /></div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                {config.uiAssets.freeShippingPromoActive ? "Frete Grátis" : "Frete Fixo R$ 25"}
              </span>
           </div>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900/50 rounded-lg text-brand-lime/60"><RefreshCw size={16} /></div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">Troca Grátis</span>
           </div>
        </div>
      </div>
      <MeasurementGuide 
        isOpen={isSizerOpen} 
        onClose={() => setIsSizerOpen(false)} 
        onSelectSize={setSelectedSize} 
      />
      <div className="mt-8">
        <PublicReviews />
      </div>
    </motion.div>
  );
}
