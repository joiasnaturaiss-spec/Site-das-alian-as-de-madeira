import { motion } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import { Play, Award, CheckCircle } from 'lucide-react';
import { PublicReviews } from '../components/PublicReviews';

export function About() {
  const { config } = useConfig();
  const { uiAssets } = config;

  // Retrieve configurable values or fallback beautiful defaults
  const title = uiAssets?.aboutTitle || 'Nossa Essência';
  const subtitle = uiAssets?.aboutSubtitle || 'Nossos Valores';
  const text = uiAssets?.aboutText || 'Fundada em 2018, a Jóias Naturais nasceu do desejo de reconectar o luxo com a simplicidade orgânica da terra. Acreditamos que uma aliança não é apenas uma joia, mas um fragmento de história, moldado pela natureza e refinado pelo homem. Utilizamos apenas madeiras de descarte certificado ou reaproveitamento nobre, garantindo que cada peça preserve a vida das nossas florestas. Cada anel passa por mais de 40 processos manuais de lixamento, enceramento e polimento até atingir o brilho profundo e a textura aveludada que é nossa marca registrada.';
  const image = uiAssets?.aboutImage || 'https://images.unsplash.com/photo-1544411047-c4912344057e?auto=format&fit=crop&q=80&w=800';
  const videoUrl = uiAssets?.aboutVideoUrl || '';
  const stats1Value = uiAssets?.aboutStats1Value || '100%';
  const stats1Label = uiAssets?.aboutStats1Label || 'Handmade';
  const stats2Value = uiAssets?.aboutStats2Value || 'Certificado';
  const stats2Label = uiAssets?.aboutStats2Label || 'Origem Ética';

  // Helper to extract YouTube ID for real embeds
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('data:video')) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const isLocalVideo = videoUrl && videoUrl.startsWith('data:video');
  const youtubeEmbedUrl = getYoutubeEmbedUrl(videoUrl);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col w-full pb-24 font-sans"
    >
      {/* Hero Header with dynamic background */}
      <div className="relative h-[55vh] w-full overflow-hidden">
         <img 
           src={image} 
           className="w-full h-full object-cover brightness-[0.7] transform scale-105 duration-[3s] transition-all"
           alt="Nossa Essência"
           referrerPolicy="no-referrer"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
            <span className="text-[10px] text-brand-lime tracking-[0.3em] uppercase mb-1 font-mono">{subtitle}</span>
            <h2 className="text-4xl font-serif text-white uppercase leading-none tracking-tight mb-4">
              {title}
            </h2>
            <div className="w-12 h-1 bg-brand-lime mb-4" />
         </div>
      </div>

      <div className="px-8 py-12 space-y-10">
        {/* Descriptive Text Section */}
        <section className="space-y-4">
           <p className="text-zinc-300 text-sm leading-relaxed font-light first-letter:text-4xl first-letter:font-serif first-letter:text-brand-lime first-letter:mr-2 first-letter:float-left whitespace-pre-wrap">
             {text}
           </p>
        </section>

        {/* Dynamic Video Section if present */}
        {videoUrl && (
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-brand-lime font-mono flex items-center gap-2">
              <Play size={12} className="animate-pulse" />
              Nossa Arte em Movimento
            </h3>
            
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-white/5">
              {isLocalVideo ? (
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                />
              ) : youtubeEmbedUrl ? (
                <iframe 
                  src={youtubeEmbedUrl} 
                  title="Vídeo Institucional" 
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              ) : (
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </section>
        )}

        {/* Counters & Certifications */}
        <section className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden text-center">
               <div className="p-6 bg-black/40 backdrop-blur-sm">
                  <Award className="text-brand-lime mx-auto mb-2 text-lime-400" size={20} />
                  <p className="text-xl font-serif text-white">{stats1Value}</p>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono mt-1">{stats1Label}</p>
               </div>
               <div className="p-6 bg-black/40 backdrop-blur-sm">
                  <CheckCircle className="text-brand-lime mx-auto mb-2 text-lime-400" size={20} />
                  <p className="text-xl font-serif text-white">{stats2Value}</p>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono mt-1">{stats2Label}</p>
               </div>
            </div>
            <p className="text-[9px] text-zinc-500 text-center uppercase tracking-wider">
              Joias feitas para durar gerações com respeito ecológico irretocável.
            </p>
        </section>
      </div>
      <PublicReviews />
    </motion.div>
  );
}
