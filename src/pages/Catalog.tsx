import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Editable } from '../components/Editable';
import { Search, Filter, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

export const products = [];

export function Catalog() {
  const { config } = useConfig();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Use products from config state (which includes defaults and custom ones)
  const allProducts = useMemo(() => {
    const products = config.customProducts || [];
    if (!searchQuery) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.material.toLowerCase().includes(query) ||
      (p.symbolism && p.symbolism.toLowerCase().includes(query))
    );
  }, [config.customProducts, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full pb-20"
    >
      <div className="px-6 py-8 space-y-6">
        <div className="space-y-1">
          <Editable id="catalog-title" type="text" className="text-4xl font-serif text-brand-lime uppercase">
            CATÁLOGO
          </Editable>
          <Editable id="catalog-subtitle" type="text" className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase">
            {allProducts.length} Peças Disponíveis
          </Editable>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR MATERIAIS..." 
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs tracking-widest text-white focus:outline-none focus:border-brand-lime/30 transition-colors"
            />
          </div>
          <button className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-400">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/5 border-t border-white/5">
        {allProducts.map((product) => (
          <Link 
            key={product.id} 
            to={`/produto/${product.id}`}
            className="bg-black p-4 space-y-4 group flex flex-col"
          >
            <div className="aspect-square relative overflow-hidden rounded-2xl bg-zinc-900/30 w-full h-full">
               <div className="absolute inset-0 bg-brand-lime/0 group-hover:bg-brand-lime/5 transition-all duration-500" />
               {product.isPromotional && (
                 <div className="absolute top-2 left-2 px-2.5 py-1 bg-brand-lime text-black font-black text-[7px] tracking-widest rounded-full uppercase shadow-lg z-10">
                   {product.promoBadge || 'OFERTA'}
                 </div>
               )}
               <Editable 
                 id={`prod-img-${product.id}`} 
                 type="image" 
                 src={product.image} 
                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
               />
               <div className="absolute top-2 right-2">
                 <button className="p-2 bg-black/60 backdrop-blur-md rounded-full text-brand-lime border border-brand-lime/20 glow-green opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShoppingBag size={14} />
                 </button>
               </div>
            </div>

            <div className="space-y-1 flex-1">
              <Editable id={`prod-name-${product.id}`} type="text" className="text-sm font-serif text-white tracking-wide uppercase">
                {product.name}
              </Editable>
              <Editable id={`prod-mat-${product.id}`} type="text" className="text-[8px] text-zinc-600 uppercase tracking-widest leading-tight">
                {product.material}
              </Editable>
              {product.symbolism && (
                <p className="text-[7px] text-brand-lime/60 uppercase tracking-wider italic mt-1 line-clamp-2">
                  {product.symbolism}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 mt-auto">
               <div className="flex items-baseline gap-2 flex-wrap">
                 {product.originalPrice && product.originalPrice > product.price ? (
                   <>
                     <span className="text-zinc-500 text-[9px] line-through font-mono">
                       R$ {Number(product.originalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                     <span className="text-brand-lime text-xs font-bold tracking-widest font-mono">
                       R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                   </>
                 ) : (
                   <span className="text-brand-lime text-xs font-bold tracking-widest font-mono block">
                     R$ {(Number(product.price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </span>
                 )}
               </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
