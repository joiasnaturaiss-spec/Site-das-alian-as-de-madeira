import { Home, Grid, Leaf, Info, Mail } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { cn } from '../lib/utils';

const navItems = [
  { icon: Home, label: 'INÍCIO', path: '/' },
  { icon: Grid, label: 'CATÁLOGO', path: '/catalogo' },
  { icon: Leaf, label: 'CRIAR', path: '/criar', isSpecial: true },
  { icon: Info, label: 'ESSÊNCIA', path: '/sobre' },
  { icon: Mail, label: 'CONTATO', path: '/contato' },
];

export function BottomNav() {
  const { config } = useConfig();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-xl border-t border-white/5 px-4 pb-safe pt-2">
      <div className="flex items-center justify-between max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          if (item.isSpecial) {
             return (
               <NavLink
                 key={item.path}
                 to={item.path}
                 className={({ isActive }) => cn(
                   "relative -top-6 flex flex-col items-center justify-center transition-all duration-300",
                   isActive ? "scale-110" : "hover:scale-105"
                 )}
               >
                 {({ isActive }) => (
                   <>
                     <div className={cn(
                       "w-14 h-14 bg-black border-2 rounded-full flex items-center justify-center glow-green shadow-lg transition-colors overflow-hidden",
                       isActive ? "border-brand-lime shadow-brand-lime/40" : "border-zinc-800 shadow-transparent"
                     )}>
                        {config.uiAssets.logo ? (
                          <img 
                            src={config.uiAssets.logo} 
                            alt="Criar" 
                            className="w-8 h-8 object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Leaf size={24} className={cn(isActive ? "text-brand-lime" : "text-zinc-500")} />
                        )}
                     </div>
                     <span className={cn(
                       "text-[10px] font-medium tracking-widest mt-1 font-sans",
                       isActive ? "text-brand-lime" : "text-zinc-500"
                     )}>
                       {item.label}
                     </span>
                   </>
                 )}
               </NavLink>
             );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 transition-all duration-300 w-16",
                isActive ? "text-brand-lime" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn("transition-transform", isActive ? "scale-110" : "")} />
                  <span className="text-[9px] font-medium tracking-[0.1em]">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 bg-brand-lime rounded-full absolute -bottom-1" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
