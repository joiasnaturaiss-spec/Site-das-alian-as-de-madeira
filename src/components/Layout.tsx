import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { EditorHUD } from './EditorHUD';
import { useConfig } from '../context/ConfigContext';
import { Loader2 } from 'lucide-react';

export function Layout() {
  const { isLoading, config } = useConfig();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-brand-lime animate-spin" />
        <p className="text-zinc-500 font-serif italic text-sm">Carregando atelier...</p>
      </div>
    );
  }

  const isBarActive = config.uiAssets.announcementBarActive;

  return (
    <div className={`min-h-screen bg-black flex flex-col pb-24 overflow-x-hidden relative ${isBarActive ? 'pt-32' : 'pt-24'}`}>
      <TopBar />
      
      <main className="flex-1 w-full max-w-lg mx-auto overflow-x-hidden px-0">
        <Outlet />
      </main>
      
      <BottomNav />
      <EditorHUD />
    </div>
  );
}
