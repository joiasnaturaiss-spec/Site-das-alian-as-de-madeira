import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Editable } from '../components/Editable';
import { useConfig } from '../context/ConfigContext';
import { useEditor } from '../context/EditorContext';

export function Hero() {
  const { config } = useConfig();
  const { isEditMode } = useEditor();
  const brightness = config.uiAssets.brightnessHero !== undefined ? config.uiAssets.brightnessHero / 100 : 0.6;
  const scale = config.uiAssets.heroBackgroundScale !== undefined ? config.uiAssets.heroBackgroundScale / 100 : 1.1;

  return (
    <section className="relative w-full aspect-[4/5] overflow-hidden flex flex-col justify-end p-8">
      {/* Background with cinematic image */}
      <Editable 
        id="hero-bg" 
        type="image" 
        src={config.uiAssets.heroBackground || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800"} 
        className="absolute inset-0 w-full h-full object-cover"
        initialStyles={{ scale, filter: `brightness(${brightness})` }}
      />
      
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-all duration-300 ${isEditMode ? 'pointer-events-none' : ''}`} />

      <div className="relative z-10 space-y-6">
        <div className="space-y-1">
          <Editable id="hero-title-1" type="text" className="text-4xl font-serif text-white leading-tight tracking-tight uppercase">
            FEITAS PELA
          </Editable>
          <Editable id="hero-title-2" type="text" className="text-4xl font-serif text-white leading-tight tracking-tight uppercase">
            NATUREZA.
          </Editable>
          <Editable id="hero-title-3" type="text" className="text-3xl font-serif text-brand-lime leading-tight italic">
            CRIADAS À MÃO.
          </Editable>
        </div>

        <Editable id="hero-desc" type="text" className="text-zinc-400 text-xs leading-relaxed max-w-[80%] font-light tracking-wide uppercase">
          Alianças únicas que unem madeiras nobres, pedras naturais e metais.
        </Editable>

        <Editable id="hero-btn-container" type="container" className="mt-4 w-fit h-fit block">
           <Link 
             to="/criar"
             className="inline-flex items-center gap-3 px-6 py-3 border border-brand-lime/50 text-white text-[10px] font-bold tracking-[0.2em] hover:bg-brand-lime hover:text-black transition-all duration-500 glow-green group"
           >
             CRIAR MINHA ALIANÇA
             <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
           </Link>
        </Editable>
      </div>
    </section>
  );
}
