import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Home, Grid, Leaf, Info, Mail, 
  LayoutDashboard, Instagram, Facebook,
  ArrowRight, LogOut, User, Settings, Settings2, UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Grid, label: 'Catálogo', path: '/catalogo' },
  { icon: Leaf, label: 'Criador de Alianças', path: '/criar' },
  { icon: Info, label: 'Nossa Essência', path: '/sobre' },
  { icon: Mail, label: 'Fale Conosco', path: '/contato' },
];

export function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const { config } = useConfig();
  const { user, logout, isAdmin } = useAuth();
  const { uiAssets } = config;
  const instagram = uiAssets?.contactInstagram || 'https://instagram.com';
  const facebook = uiAssets?.contactFacebook || 'https://facebook.com';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000]"
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-zinc-950 border-r border-white/5 z-[1001] flex flex-col p-8 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-12">
               <div className="flex flex-col">
                  <span className="text-lg font-serif tracking-[0.2em] text-white">MENU</span>
                  <span className="text-[7px] text-brand-lime tracking-[0.4em] uppercase">Jóias Naturais</span>
               </div>
               <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
                 <X size={24} />
               </button>
            </div>

            <nav className="flex-1 space-y-8">
               <div className="space-y-4">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-bold">Navegação Principal</span>
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <Link 
                        key={item.path} 
                        to={item.path} 
                        onClick={onClose}
                        className="flex items-center gap-4 py-3 px-2 text-zinc-400 hover:text-brand-lime transition-colors group"
                      >
                         <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                         <span className="text-sm font-serif italic">{item.label}</span>
                      </Link>
                    ))}
                  </div>
               </div>

               {/* Client Space Section */}
               <div className="space-y-4">
                  <span className="text-[9px] text-zinc-650 uppercase tracking-[0.3em] font-bold">Minha Conta</span>
                  <div className="space-y-1">
                    {!user ? (
                      <>
                        <Link 
                          to="/cadastro" 
                          onClick={onClose}
                          className="flex items-center gap-4 py-3 px-2 text-zinc-400 hover:text-brand-lime transition-colors group"
                        >
                           <UserPlus size={18} className="group-hover:scale-110 transition-transform text-brand-lime" />
                           <span className="text-sm font-serif italic text-glow">Criar Cadastro</span>
                        </Link>
                        <Link 
                          to="/login" 
                          onClick={onClose}
                          className="flex items-center gap-4 py-3 px-2 text-zinc-400 hover:text-white transition-colors group"
                        >
                           <User size={18} className="group-hover:scale-110 transition-transform" />
                           <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold font-sans">Acessar Conta</span>
                        </Link>
                      </>
                    ) : (
                      <Link 
                        to="/perfil" 
                        onClick={onClose}
                        className="flex items-center gap-4 py-3 px-2 text-zinc-400 hover:text-brand-lime transition-colors group animate-fade-in"
                      >
                         <Settings2 size={18} className="group-hover:rotate-45 transition-transform text-brand-lime" />
                         <span className="text-sm font-serif italic">Configurar Perfil</span>
                      </Link>
                    )}
                  </div>
               </div>

               {isAdmin && (
                 <div className="space-y-4 animate-fade-in">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-bold">Administrativo</span>
                    <div className="space-y-1 ml-0.5">
                      <Link 
                        to="/admin/dashboard" 
                        onClick={onClose}
                        className="flex items-center gap-4 py-3 px-2 text-zinc-400 hover:text-white transition-colors group"
                      >
                         <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
                         <span className="text-xs uppercase tracking-widest">Painel Geral</span>
                      </Link>
                      <Link 
                        to="/admin/config" 
                        onClick={onClose}
                        className="flex items-center gap-4 py-3 px-2 text-zinc-400 hover:text-white transition-colors group"
                      >
                         <Settings size={18} className="group-hover:rotate-45 transition-transform" />
                         <span className="text-xs uppercase tracking-widest">Configurações</span>
                      </Link>
                    </div>
                 </div>
               )}
            </nav>

            <div className="mt-12 space-y-6">
                {user ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex flex-col gap-1">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Conectado como</span>
                      <span className="text-xs font-bold text-white uppercase truncate flex items-center gap-1.5">
                        <User size={12} className="text-brand-lime" />
                        {user.name}
                      </span>
                      {isAdmin && (
                        <Link 
                          to="/admin/dashboard" 
                          onClick={onClose}
                          className="text-[9px] text-brand-lime font-bold uppercase tracking-wider mt-1 hover:underline block"
                        >
                          Painel Admin →
                        </Link>
                      )}
                    </div>
                    <button 
                      onClick={async () => {
                        await logout();
                        onClose();
                      }}
                      className="w-full text-center py-3 border border-white/5 hover:border-red-500/20 text-[9px] text-zinc-500 hover:text-red-400 font-bold uppercase tracking-[0.2em] rounded-xl transition-all cursor-pointer"
                    >
                      Sair da Conta
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={onClose}
                    className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5 text-[10px] text-zinc-400 uppercase tracking-widest hover:border-brand-lime/20 hover:text-brand-lime transition-all"
                  >
                    Acesse sua conta
                    <ArrowRight size={14} />
                  </Link>
                )}

                <div className="flex gap-4">
                  {instagram && (
                    <a 
                      href={instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-brand-lime hover:border-brand-lime/20 transition-all duration-300 hover:scale-105"
                    >
                      <Instagram size={18} />
                    </a>
                  )}
                  {facebook && (
                    <a 
                      href={facebook} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 bg-zinc-900 border border-white/5 rounded-full text-zinc-500 hover:text-brand-lime hover:border-brand-lime/20 transition-all duration-300 hover:scale-105"
                    >
                      <Facebook size={18} />
                    </a>
                  )}
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
