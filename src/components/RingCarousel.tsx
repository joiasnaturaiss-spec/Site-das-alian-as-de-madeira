import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Editable } from './Editable';
import { useConfig } from '../context/ConfigContext';
import { Link } from 'react-router-dom';

export function RingCarousel() {
  const { config } = useConfig();
  const [index, setIndex] = useState(0);

  // Use custom products from catalog or fall back to beautiful presets if none exist
  const catalogProducts = config.customProducts && config.customProducts.length > 0
    ? config.customProducts
    : [
        { id: 'ring-1', image: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&q=80&w=600', name: 'Nebulosa Púrpura' },
        { id: 'ring-2', image: 'https://images.unsplash.com/photo-1598561144733-f3b145520842?auto=format&fit=crop&q=80&w=600', name: 'Floresta Ébano' },
        { id: 'ring-3', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600', name: 'Oceano Profundo' },
      ];

  const next = () => setIndex((i) => (i + 1) % catalogProducts.length);
  const prev = () => setIndex((i) => (i - 1 + catalogProducts.length) % catalogProducts.length);

  // Safe fallback if index gets out of bounds (e.g. if products were deleted)
  const currentIndex = index >= catalogProducts.length ? 0 : index;
  const currentProduct = catalogProducts[currentIndex];

  if (!currentProduct) return null;

  return (
    <section className="py-10 mt-6 sm:mt-10 relative flex flex-col items-center justify-center select-none w-full">
      <div className="relative w-full flex flex-col items-center justify-center p-2 min-h-[410px]">
        
        {/* Navigation Arrows */}
        <div className="absolute inset-x-4 top-[124px] -translate-y-1/2 flex justify-between z-20 px-2 pointer-events-none">
           <button 
             onClick={prev} 
             className="p-2.5 text-zinc-400 hover:text-white transition-colors pointer-events-auto bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 active:scale-90 duration-300"
             aria-label="Anterior"
           >
              <ChevronLeft size={20} />
           </button>
           <button 
             onClick={next} 
             className="p-2.5 text-zinc-400 hover:text-white transition-colors pointer-events-auto bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 active:scale-90 duration-300"
             aria-label="Próximo"
           >
              <ChevronRight size={20} />
           </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentProduct.id || currentIndex}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center justify-center"
          >
            {/* Image Container */}
            <div className="relative group flex justify-center items-center">
              <div className="absolute inset-0 bg-brand-lime/5 blur-3xl group-hover:bg-brand-lime/10 transition-all rounded-full w-60 h-60 mx-auto" />
              <Editable 
                id={`carousel-ring-${currentProduct.id}`} 
                type="image" 
                src={currentProduct.image || (currentProduct as any).src} 
                className="w-60 h-60 object-contain relative z-10 drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)] max-w-full rounded-xl"
              />
            </div>

            {/* Ver Detalhes Button */}
            <div className="mt-8 relative z-20 flex flex-col items-center">
              <Link 
                to={`/produto/${currentProduct.id}`}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-brand-lime text-black font-semibold text-[9px] uppercase tracking-[0.25em] rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-brand-lime/20 hover:shadow-brand-lime/30"
              >
                Ver Detalhes
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Caption */}
        <div className="mt-6">
           <Editable id="carousel-illustrative" type="text" className="text-[7px] text-zinc-650 tracking-widest uppercase">
              Imagem Meramente Ilustrativa
           </Editable>
        </div>
      </div>
    </section>
  );
}
