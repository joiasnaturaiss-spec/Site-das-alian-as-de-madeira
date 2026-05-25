import { motion } from 'framer-motion';
import { Hero } from '../components/Hero';
import { Materials } from '../components/Materials';
import { RingCarousel } from '../components/RingCarousel';
import { useConfig } from '../context/ConfigContext';
import { CustomSection } from '../types';
import { PublicReviews } from '../components/PublicReviews';

export function Home() {
  const { config } = useConfig();

  const renderCustomSection = (section: CustomSection) => {
    switch (section.type) {
      case 'banner':
        return (
          <section 
            key={section.id} 
            style={{ 
              backgroundImage: section.image ? `linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4)), url(${section.image})` : undefined,
              backgroundColor: section.bgColor || '#18181b',
              color: section.textColor || '#ffffff'
            }}
            className="relative px-6 py-14 text-center bg-cover bg-center border-y border-white/5 space-y-4 my-6 mx-4 rounded-3xl overflow-hidden shadow-2xl"
          >
            {section.title && <h3 className="font-serif text-xl uppercase tracking-wider text-glow">{section.title}</h3>}
            {section.subtitle && <p className="text-zinc-300 text-[11px] leading-relaxed max-w-sm mx-auto font-light">{section.subtitle}</p>}
            {section.linkText && (
              <a 
                href={section.linkUrl || '#'} 
                className="inline-flex items-center justify-center mt-3 px-5 py-2.5 bg-brand-lime text-black font-extrabold uppercase tracking-widest text-[8px] rounded-full shadow-lg shadow-brand-lime/20 hover:scale-105 active:scale-95 transition-transform"
              >
                {section.linkText}
              </a>
            )}
          </section>
        );
      case 'text':
        return (
          <section 
            key={section.id}
            style={{ backgroundColor: section.bgColor || '#0c0c0e', color: section.textColor || '#ffffff' }}
            className="mx-4 p-8 text-center space-y-3 my-6 border border-white/5 rounded-3xl shadow-lg"
          >
            {section.title && <h3 className="font-serif text-lg tracking-wide font-medium">{section.title}</h3>}
            {section.subtitle && <p className="text-zinc-400 text-[11px] font-light max-w-xs mx-auto leading-relaxed">{section.subtitle}</p>}
          </section>
        );
      case 'testimonial':
        return (
          <section 
            key={section.id}
            style={{ backgroundColor: section.bgColor || '#09090b', color: section.textColor || '#ffffff' }}
            className="mx-4 p-8 rounded-3xl border border-white/5 space-y-4 my-6 shadow-xl relative"
          >
            <div className="flex justify-center gap-1 text-brand-lime">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xs">★</span>
              ))}
            </div>
            {section.subtitle && (
              <p className="text-xs font-serif italic text-zinc-300 leading-relaxed">
                "{section.subtitle}"
              </p>
            )}
            {section.title && (
              <p className="text-[8px] uppercase tracking-wider text-brand-lime font-bold">
                — {section.title}
              </p>
            )}
          </section>
        );
      case 'image_text':
        return (
          <section 
            key={section.id}
            style={{ backgroundColor: section.bgColor || '#141417', color: section.textColor || '#ffffff' }}
            className="mx-4 p-6 rounded-3xl border border-white/5 space-y-4 my-6 overflow-hidden shadow-2xl"
          >
            {section.image && (
              <img src={section.image} alt={section.title} className="w-full h-44 object-cover rounded-2xl" />
            )}
            <div className="space-y-1.5">
              {section.title && <h4 className="font-serif text-base tracking-wide text-brand-lime">{section.title}</h4>}
              {section.subtitle && <p className="text-zinc-400 text-[11px] font-light leading-relaxed">{section.subtitle}</p>}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full overflow-x-hidden"
    >
      <Hero />
      <PublicReviews />
      <Materials />
      
      {/* Customizable content elements configured in admin settings */}
      {config.uiAssets.customSections && config.uiAssets.customSections.map(renderCustomSection)}

      <RingCarousel />
      
      {/* Visual divider/accent */}
      <div className="flex justify-center py-8">
         <div className="w-px h-12 bg-gradient-to-b from-brand-lime to-transparent opacity-20" />
      </div>

      <section className="px-8 pb-8 text-center space-y-4">
         <h3 className="font-serif text-xl text-white italic">"Onde a alma encontra a joia."</h3>
         <div className="flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-lime/30" />
            ))}
         </div>
      </section>
    </motion.div>
  );
}
