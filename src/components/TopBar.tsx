import { Menu, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEditor } from '../context/EditorContext';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { Editable } from './Editable';
import { useState } from 'react';
import { SidebarMenu } from './SidebarMenu';

export function TopBar() {
  const { isEditMode, setIsEditMode } = useEditor();
  const { config } = useConfig();
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isBarActive = config.uiAssets.announcementBarActive;

  return (
    <>
      {isBarActive && (
        <div 
          style={{ 
            backgroundColor: config.uiAssets.announcementBarBg || '#bef264',
            color: config.uiAssets.announcementBarColor || '#000000'
          }}
          className="fixed top-0 left-0 right-0 z-[110] h-8 flex items-center justify-center text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-4 text-center overflow-hidden whitespace-nowrap"
        >
          <span className="font-sans inline-block animate-pulse">
            {config.uiAssets.announcementBarText || '✨ ATELIÊ NATURECRAFT PREMIUM ✨'}
          </span>
        </div>
      )}
      <header 
        style={isBarActive ? { top: '32px' } : undefined}
        className="fixed top-0 left-0 right-0 z-[100] bg-black/85 backdrop-blur-md border-b border-white/5 h-24 flex items-center justify-between px-4 transition-all duration-300"
      >
        <div className="w-12">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center relative">
          {/* EDITAR button directly to the left of the logo as requested */}
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all duration-300 border",
              isEditMode 
                ? "bg-brand-lime border-brand-lime text-black glow-green shadow-[0_0_15px_rgba(190,242,100,0.5)]" 
                : "bg-zinc-800 border-white/10 text-zinc-400"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", isEditMode ? "bg-black animate-pulse" : "bg-zinc-500")} />
            EDITAR
          </button>

          <div className="flex flex-col items-center justify-center text-center">
            {config.uiAssets.logo && (
              <img 
                src={config.uiAssets.logo} 
                alt="Logo" 
                style={{ width: `${config.uiAssets.logoWidth || 32}px` }}
                className="h-auto object-contain flex-shrink-0 mb-1"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex flex-col items-center justify-center text-center mt-1">
              <Editable id="main-logo" type="text" className="text-sm font-serif tracking-[0.15em] text-white font-medium uppercase leading-tight">
                Jóias Naturais
              </Editable>
              <Editable id="main-subtitle" type="text" className="text-[6px] tracking-[0.25em] text-zinc-600 uppercase mt-0.5 font-light leading-none">
                ALIANÇAS ARTESANAIS
              </Editable>
            </div>
          </div>
        </div>

        <div className="w-12 flex justify-end">
          <Link to="/carrinho" className="relative p-2 text-zinc-400 hover:text-white transition-colors">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand-lime text-black text-[9px] font-bold flex items-center justify-center rounded-full px-1">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
