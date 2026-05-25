import { useState } from 'react';
import { TreeDeciduous, Diamond, CircleDot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editable } from './Editable';
import { useConfig } from '../context/ConfigContext';
import { Link } from 'react-router-dom';

const materialItems = [
  { 
    id: 'mat-woods', 
    icon: TreeDeciduous, 
    title: 'Madeiras', 
    desc: '"A força e a alma da floresta em cada detalhe."' 
  },
  { 
    id: 'mat-stones', 
    icon: Diamond, 
    title: 'Pedras', 
    desc: '"Energia e sabedoria cristalizadas pelo tempo."' 
  },
  { 
    id: 'mat-metals', 
    icon: CircleDot, 
    title: 'Metais', 
    desc: '"O brilho eterno e a maleabilidade da vida."' 
  }
];

const fallbacks: Record<string, Array<{ id: string; name: string; src: string; symbolism: string; price?: number }>> = {
  'mat-woods': [
    {
      id: 'fb-ebano',
      name: 'Pau-Ébano',
      src: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Símbolo de proteção inviolável, sabedoria interior profunda e refinamento eterno. Uma das madeiras nobres mais valiosas e raras do mundo.',
      price: 0
    },
    {
      id: 'fb-jacaranda',
      name: 'Jacarandá Violeta',
      src: 'https://images.unsplash.com/photo-1598561144733-f3b145520842?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Simboliza a harmonia dos laços eternos, sensibilidade mística e criatividade espiritual. Reconhecida por seus veios orgânicos de tons quentes.',
      price: 15
    },
    {
      id: 'fb-brauna',
      name: 'Cerne de Braúna',
      src: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Simboliza a resistência inabalável contra o tempo, resiliência espiritual e retidão de caráter. Uma madeira brasileira majestosa.',
      price: 20
    }
  ],
  'mat-stones': [
    {
      id: 'fb-malaquita',
      name: 'Incrustação de Malaquita',
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Símbolo de transformação espiritual profunda, cura interior e sintonia com as forças regenerativas da natureza com suas fascinantes bandas verdes.',
      price: 35
    },
    {
      id: 'fb-lapislazuli',
      name: 'Lápis-Lazúli Real',
      src: 'https://images.unsplash.com/photo-1599687351724-dfa3c4ff81b1?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Simboliza a clareza intelectual, harmonia celeste e a busca pela verdade interna suprema. Reverenciada pela realeza do Antigo Egito.',
      price: 40
    },
    {
      id: 'fb-olhode-tigre',
      name: 'Pedra Olho de Tigre',
      src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Símbolo de coragem instintiva, clareza lógica de julgamento, integridade e proteção contra negatividade em sua jornada cotidiana.',
      price: 30
    }
  ],
  'mat-metals': [
    {
      id: 'fb-cobre',
      name: 'Núcleo em Cobre Puro',
      src: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Simboliza a condução de energias vitais equilibradas, calor físico, afeto sincero e união indestrutível dos opostos cósmicos.',
      price: 15
    },
    {
      id: 'fb-prata',
      name: 'Filete de Prata 950',
      src: 'https://images.unsplash.com/photo-1598561144733-f3b145520842?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Símbolo de energia receptora lunar, pureza reflexiva de sentimentos, clareza emocional plena e proteção energética sutil.',
      price: 25
    },
    {
      id: 'fb-ouro',
      name: 'Filete de Ouro 18K',
      src: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600',
      symbolism: 'Simboliza a energia solar eterna, nobreza de propósito, vitalidade espiritual abundante e o brilho inatacável do amor maduro.',
      price: 50
    }
  ]
};

export function Materials() {
  const { config } = useConfig();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getItemsForCategory = (catId: string): Array<{ id: string; name: string; src: string; symbolism?: string; price?: number }> => {
    const allTextures = config.textures || [];
    let matchingTextures = [];

    if (catId === 'mat-woods') {
      matchingTextures = allTextures.filter(t => t.type === 'madeira');
    } else if (catId === 'mat-stones') {
      matchingTextures = allTextures.filter(t => t.type === 'pedra');
    } else if (catId === 'mat-metals') {
      matchingTextures = allTextures.filter(t => t.type === 'metal');
    }

    if (matchingTextures.length > 0) {
      return matchingTextures;
    }

    // Fallback beautiful list if none uploaded yet
    return fallbacks[catId] || [];
  };

  const getCategoryTitle = (catId: string) => {
    if (catId === 'mat-woods') return 'Madeiras Nobres';
    if (catId === 'mat-stones') return 'Pedras Preciosas & Cristais';
    if (catId === 'mat-metals') return 'Metais & Ligas Purificadoras';
    return '';
  };

  return (
    <section className="py-14 mt-4 px-6 flex flex-col items-center text-center space-y-8">
      <div className="space-y-2">
        <Editable id="mat-section-title" type="text" className="text-2xl font-serif text-brand-lime/80 tracking-[0.2em] uppercase">
          MATERIAIS
        </Editable>
        <Editable id="mat-section-subtitle" type="text" className="text-zinc-500 italic font-serif text-sm">
          A essência de cada criação
        </Editable>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
        {materialItems.map((item) => {
          // Get uploaded button background if any
          const customBg = item.id === 'mat-woods' ? config.uiAssets.bgButtonWoods
                        : item.id === 'mat-stones' ? config.uiAssets.bgButtonStones
                        : item.id === 'mat-metals' ? config.uiAssets.bgButtonMetals
                        : undefined;

          return (
            <div key={item.id} className="flex flex-col items-center space-y-4">
              <div 
                onClick={() => setSelectedCategory(item.id)}
                className="relative group cursor-pointer"
              >
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-brand-lime/10 blur-xl group-hover:bg-brand-lime/20 transition-all rounded-full" />
                
                {/* Circular Material Button */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border border-zinc-800 flex items-center justify-center text-brand-lime glow-green bg-black/40 overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:border-brand-lime/40 group-active:scale-95 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
                  {customBg ? (
                    <>
                      <img 
                        src={customBg} 
                        alt={item.title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-110 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-brand-lime/5 group-hover:bg-brand-lime/10 transition-all duration-300 rounded-full" />
                  )}
                  <div className="relative z-10 text-brand-lime">
                    <item.icon size={22} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5 cursor-pointer" onClick={() => setSelectedCategory(item.id)}>
                <Editable id={`${item.id}-title`} type="text" className="text-[11px] md:text-xs font-serif text-white tracking-widest uppercase hover:text-brand-lime transition-colors">
                  {item.title}
                </Editable>
                <div className="hidden sm:block">
                  <Editable id={`${item.id}-desc`} type="text" className="text-[9px] text-zinc-500 italic leading-relaxed px-1">
                    {item.desc}
                  </Editable>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HORIZONTAL SLIDING POP-UP OVERLAY (bottom sheet / slider) */}
      <AnimatePresence>
        {selectedCategory && (
          <>
            {/* Backdrop Layer with high z-index to overlay bottom navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCategory(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[190] cursor-pointer"
            />

            {/* Sliding Drawer Container with high z-index and gesture dragging support to slide-dismiss */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 190 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.4}
              onDragEnd={(_, info) => {
                if (info.offset.y > 140 || info.velocity.y > 400) {
                  setSelectedCategory(null);
                }
              }}
              className="fixed bottom-0 inset-x-0 bg-zinc-950 border-t border-zinc-800/80 z-[200] rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.95)] max-h-[92vh] h-[92vh] sm:h-auto flex flex-col overflow-hidden select-text touch-pan-y"
            >
              {/* Slide-to-dismiss gesture pill indicator */}
              <div className="flex justify-center w-full pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0">
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors" />
              </div>

              <div className="p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto flex flex-col h-full overflow-hidden">
                
                {/* Header with reduced spacing */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 shrink-0">
                  <div className="space-y-0.5">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-serif text-brand-lime tracking-[0.12em] uppercase">
                       {getCategoryTitle(selectedCategory)}
                    </h3>
                    <p className="text-[9px] sm:text-xs text-zinc-400 uppercase tracking-widest font-mono">
                      A Essência Natural e Seus Significados Reais (Deslize para baixo para fechar)
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Minimizar pop-up"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Sliding Cards Carousel List - Highly optimized horizontal touch scroll & perfect snap alignment */}
                <div className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 flex-1 items-stretch overscroll-x-contain [-webkit-overflow-scrolling:touch] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {getItemsForCategory(selectedCategory).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.4 }}
                      className="snap-center flex-none w-[285px] sm:w-[365px] md:w-[400px] bg-zinc-900/40 border border-white/5 rounded-3xl p-4 sm:p-5 flex flex-col justify-between hover:border-brand-lime/30 hover:bg-zinc-900/55 transition-all duration-300 group shadow-2xl"
                    >
                      <div className="flex flex-col justify-between h-full space-y-3.5">
                        <div className="space-y-3">
                          {/* Thumbnail / Raw Material Photo Canvas - DEVENIR BIEN PLUS GRAND */}
                          <div className="w-full h-56 xs:h-[260px] sm:h-[300px] md:h-[320px] bg-gradient-to-b from-black/85 to-zinc-950 rounded-2xl border border-white/5 overflow-hidden relative flex items-center justify-center shadow-inner group-hover:border-brand-lime/15 transition-all duration-300">
                            <div className="absolute inset-0 bg-brand-lime/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {item.src ? (
                              <img 
                                src={item.src} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[10px] text-zinc-700 font-mono uppercase">Sem Imagem</span>
                            )}
                          </div>

                          {/* Text info and pricing (reduced spaces, highly compact) */}
                          <div className="space-y-0.5 border-b border-white/5 pb-2">
                            <h4 className="text-sm xs:text-base sm:text-lg md:text-xl font-serif font-bold text-white tracking-widest uppercase">
                              {item.name}
                            </h4>
                            {item.price !== undefined && (
                              <span className="text-[9.5px] sm:text-xs text-brand-lime font-mono uppercase tracking-wider font-semibold">
                                {item.price > 0 ? `+ R$ ${item.price}` : 'Incluído como Padrão'}
                              </span>
                            )}
                          </div>
                          
                          {/* Material's spiritual/natural symbolism to user - highly legible white color */}
                          <p className="text-[12px] xs:text-[13.5px] sm:text-[14.5px] text-zinc-100 italic font-sans leading-relaxed pt-0.5 select-text group-hover:text-white transition-colors">
                            "{item.symbolism || "A pureza e o design primoroso unidos para compor uma joia natural verdadeiramente única e eterna."}"
                          </p>
                        </div>

                        {/* Direct Creator Integration Action Button */}
                        <Link
                          to={`/criar?preselect=${encodeURIComponent(item.name)}`}
                          onClick={() => setSelectedCategory(null)}
                          className="w-full mt-2 py-3 bg-brand-lime text-black font-semibold text-[10.5px] xs:text-xs uppercase tracking-[0.16em] rounded-xl hover:opacity-90 hover:shadow-lg active:scale-[0.98] transition-all duration-300 text-center flex items-center justify-center gap-1.5 cursor-pointer font-sans font-bold shadow-md shadow-brand-lime/10"
                        >
                          Ver como fica na sua joia →
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
