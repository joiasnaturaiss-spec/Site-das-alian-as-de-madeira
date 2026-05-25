import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Maximize, Minimize, Type, Palette, Move, 
  RotateCw, Hash, SlidersHorizontal, Image as ImageIcon,
  Trash2, Undo2, Redo2
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { useConfig } from '../context/ConfigContext';
import { cn } from '../lib/utils';
import { useState } from 'react';

const ELEMENT_LABELS: Record<string, string> = {
  'hero-bg': 'Imagem de Fundo Principal',
  'hero-title-1': 'Título Principal Linha 1 ("FEITAS PELA")',
  'hero-title-2': 'Título Principal Linha 2 ("NATUREZA.")',
  'hero-title-3': 'Título Principal Linha 3 ("CRIADAS À MÃO.")',
  'hero-desc': 'Descrição do Banner Principal ("Alianças únicas...")',
  'hero-btn-container': 'Botão "Criar Minha Aliança" (Ir para o Criador)',
  'main-logo': 'Logo do Cabeçalho',
  'main-subtitle': 'Subtítulo do Cabeçalho ("ALIANÇAS ARTESANAIS")',
  'catalog-title': 'Título da Página de Catálogo',
  'catalog-subtitle': 'Contador/Subtítulo do Catálogo',
};

export function EditorHUD() {
  const { isEditMode, selectedElementId, setSelectedElementId } = useEditor();
  const { config, updateElementStyles, updateElementConfig, undo, redo, canUndo, canRedo, resetElementStyles } = useConfig();
  const [activeTab, setActiveTab] = useState<'transform' | 'style' | 'content'>('transform');

  if (!isEditMode) return null;

  if (!selectedElementId) {
    const registeredElements = Object.keys(config.elements || {});
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[9999]"
        >
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-5 overflow-hidden max-h-[360px] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-brand-lime uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
                  PAINEL DO EDITOR ATELIÊ
                </span>
                <span className="text-[8px] text-zinc-400 uppercase tracking-wider mt-0.5">Gerenciador de Elementos do Layout</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={undo}
                  disabled={!canUndo}
                  className={cn("p-2 rounded-xl transition-all shrink-0", canUndo ? "text-zinc-100 hover:bg-white/5" : "text-zinc-650 cursor-not-allowed opacity-40")}
                  title="Desfazer"
                >
                  <Undo2 size={16} />
                </button>
                <button 
                  onClick={redo}
                  disabled={!canRedo}
                  className={cn("p-2 rounded-xl transition-all shrink-0", canRedo ? "text-zinc-100 hover:bg-white/5" : "text-zinc-650 cursor-not-allowed opacity-40")}
                  title="Refazer"
                >
                  <Redo2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-[9px] text-zinc-400 mb-4 font-light leading-relaxed uppercase tracking-wider shrink-0">
              Selecione os elementos listados abaixo para editá-los. Se o botão <strong className="text-brand-lime font-bold">Criar Minha Aliança</strong> ou qualquer outro texto saiu do lugar correspondente, clique em <strong className="text-brand-lime font-bold">RESTAURAR</strong>.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {registeredElements.length === 0 ? (
                <p className="text-[9px] text-zinc-500 text-center uppercase tracking-widest py-8">Nenhum elemento editável carregado ainda nesta página.</p>
              ) : (
                registeredElements.map((id) => {
                  const label = ELEMENT_LABELS[id] || `Elemento (${id})`;
                  return (
                    <div key={id} className="flex justify-between items-center p-3.5 bg-black/40 border border-white/5 rounded-2xl gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9.5px] font-sans font-bold text-zinc-200 truncate uppercase tracking-wide">{label}</span>
                        <span className="text-[7.5px] font-mono text-zinc-650 uppercase mt-0.5">{id}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => resetElementStyles(id)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[8px] font-bold uppercase tracking-wider transition-colors border border-white/5"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => setSelectedElementId(id)}
                          className="px-3 py-1.5 bg-brand-lime text-black font-extrabold rounded-lg text-[8px] font-bold uppercase tracking-wider hover:bg-[#c6f868] transition-colors"
                        >
                          Selecionar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const elementConfig = config.elements[selectedElementId];
  if (!elementConfig) return null;

  const styles = elementConfig.styles;

  const move = (dx: number, dy: number) => {
    updateElementStyles(selectedElementId, {
      x: (styles.x || 0) + dx,
      y: (styles.y || 0) + dy,
    });
  };

  const adjustScale = (delta: number) => {
    updateElementStyles(selectedElementId, {
      scale: Math.max(0.1, (styles.scale || 1) + delta),
    });
  };

  const handleStyleChange = (key: string, value: any) => {
    updateElementStyles(selectedElementId, { [key]: value });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[9999]"
      >
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 overflow-hidden">
          {/* Header with Editor actions and Undo/Redo */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex gap-1.5 items-center">
              <button 
                onClick={() => setActiveTab('transform')}
                className={cn("p-2 rounded-xl transition-all shrink-0", activeTab === 'transform' ? "bg-brand-lime text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5")}
                title="Posição e Escala"
              >
                <Move size={18} />
              </button>
              <button 
                onClick={() => setActiveTab('style')}
                className={cn("p-2 rounded-xl transition-all shrink-0", activeTab === 'style' ? "bg-brand-lime text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5")}
                title="Estilo Visual"
              >
                <Palette size={18} />
              </button>
              <button 
                onClick={() => setActiveTab('content')}
                className={cn("p-2 rounded-xl transition-all shrink-0", activeTab === 'content' ? "bg-brand-lime text-black font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5")}
                title="Alterar Conteúdo"
              >
                <ImageIcon size={18} />
              </button>

              {/* Vertical divider */}
              <div className="w-px h-5 bg-zinc-800/80 mx-1 shrink-0" />

              {/* Back / Undo Action (Voltar ao estado anterior) */}
              <button 
                onClick={undo}
                disabled={!canUndo}
                className={cn(
                  "p-2 rounded-xl transition-all shrink-0 flex items-center justify-center gap-1", 
                  canUndo ? "text-zinc-100 hover:text-brand-lime hover:bg-white/5 cursor-pointer active:scale-95" : "text-zinc-600 cursor-not-allowed opacity-40"
                )}
                title="Voltar histórico de edição (Desfazer)"
              >
                <Undo2 size={18} />
                <span className={cn("text-[9px] uppercase tracking-wider font-mono font-medium hidden xs:inline", canUndo ? "text-zinc-300" : "text-zinc-600")}>Voltar</span>
              </button>

              {/* Forward / Redo Action */}
              <button 
                onClick={redo}
                disabled={!canRedo}
                className={cn(
                  "p-2 rounded-xl transition-all shrink-0 flex items-center justify-center gap-1", 
                  canRedo ? "text-zinc-100 hover:text-brand-lime hover:bg-white/5 cursor-pointer active:scale-95" : "text-zinc-600 cursor-not-allowed opacity-40"
                )}
                title="Avançar histórico de edição (Refazer)"
              >
                <Redo2 size={18} />
              </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => {
                  if (confirm("Deseja mesmo redefinir todos os estilos e posições personalizadas deste elemento para os padrões originais?")) {
                    resetElementStyles(selectedElementId);
                    setSelectedElementId(null);
                  }
                }}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors border border-white/10"
                title="Restaurar estilos deste elemento"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={() => setSelectedElementId(null)}
                className="p-2 bg-red-500/95 hover:bg-red-600 text-white rounded-xl transition-colors"
                aria-label="Definir concluído ou fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-6 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
            {activeTab === 'transform' && (
              <div className="grid grid-cols-2 gap-6">
                {/* Dpad */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Posição</span>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-black/40 rounded-2xl border border-white/5">
                    <div />
                    <button onClick={() => move(0, -5)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-300"><ChevronUp size={18} /></button>
                    <div />
                    <button onClick={() => move(-5, 0)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-300"><ChevronLeft size={18} /></button>
                    <div className="flex items-center justify-center text-[10px] font-mono text-brand-lime/80">{styles.x || 0}</div>
                    <button onClick={() => move(5, 0)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-300"><ChevronRight size={18} /></button>
                    <div />
                    <button onClick={() => move(0, 5)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-300"><ChevronDown size={18} /></button>
                    <div />
                  </div>
                </div>

                {/* Scale & Rotate */}
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Escala</span>
                    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 w-full justify-between">
                      <button onClick={() => adjustScale(-0.1)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300"><Minimize size={16} /></button>
                      <span className="text-xs font-mono text-brand-lime">{((styles.scale || 1) * 100).toFixed(0)}%</span>
                      <button onClick={() => adjustScale(0.1)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300"><Maximize size={16} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Rotação</span>
                     <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 w-full justify-between">
                        <button onClick={() => handleStyleChange('rotate', (styles.rotate || 0) - 15)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300"><RotateCw size={16} className="rotate-180" /></button>
                        <span className="text-xs font-mono text-brand-lime">{styles.rotate || 0}°</span>
                        <button onClick={() => handleStyleChange('rotate', (styles.rotate || 0) + 15)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300"><RotateCw size={16} /></button>
                      </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'style' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Cor do Texto</label>
                  <input 
                    type="color" 
                    value={styles.color || '#ffffff'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-full h-10 bg-black/40 rounded-xl border border-white/10 p-1 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Fundo</label>
                  <input 
                    type="color" 
                    value={styles.backgroundColor || '#000000'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="w-full h-10 bg-black/40 rounded-xl border border-white/10 p-1 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Tamanho Fonte</label>
                  <input 
                    type="number" 
                    value={parseInt(styles.fontSize as string) || 16}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value + 'px')}
                    className="w-full h-10 bg-black/40 rounded-xl border border-white/10 px-3 text-sm text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Arredondamento</label>
                  <input 
                    type="number" 
                    value={parseInt(styles.borderRadius as string) || 0}
                    onChange={(e) => handleStyleChange('borderRadius', e.target.value + 'px')}
                    className="w-full h-10 bg-black/40 rounded-xl border border-white/10 px-3 text-sm text-white"
                  />
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                {elementConfig.type === 'image' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500">Substituir Imagem</label>
                      <div className="flex flex-col gap-3">
                         <input 
                           type="file" 
                           accept="image/*"
                           id="hud-image-upload"
                           className="hidden"
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (!file) return;
                             const reader = new FileReader();
                             reader.onloadend = () => {
                               updateElementConfig(selectedElementId, { src: reader.result as string });
                             };
                             reader.readAsDataURL(file);
                           }}
                         />
                         <label 
                           htmlFor="hud-image-upload"
                           className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-lime/30 transition-all bg-black/20"
                         >
                            <ImageIcon size={20} className="text-zinc-500" />
                            <span className="text-[9px] uppercase tracking-widest text-zinc-500">Selecionar arquivo</span>
                         </label>
                         
                         {elementConfig.src && (
                           <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/5 mx-auto">
                              <img src={elementConfig.src} className="w-full h-full object-cover" alt="Current" />
                           </div>
                         )}
                      </div>
                    </div>

                    {/* Image Brightness / Lighting control to make it look high-end, editorial & commercial advertising style */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-1.5">
                          <SlidersHorizontal size={12} className="text-brand-lime" />
                          Brilho Publicitário
                        </label>
                        <span className="text-[11px] font-mono text-brand-lime font-bold">
                          {Math.round((styles.filterBrightness !== undefined ? parseFloat(styles.filterBrightness) : 1) * 100)}%
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0.3"
                        max="2.0"
                        step="0.05"
                        value={styles.filterBrightness !== undefined ? parseFloat(styles.filterBrightness) : 1}
                        onChange={(e) => handleStyleChange('filterBrightness', e.target.value)}
                        className="w-full accent-brand-lime bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                      <p className="text-[8.5px] text-zinc-500 leading-relaxed uppercase tracking-wider">
                        Ajuste o brilho para harmonizar a iluminação da joia com o fundo estelar polido do catálogo.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500">Texto</label>
                    <textarea 
                      value={elementConfig.content || ''}
                      onChange={(e) => updateElementConfig(selectedElementId, { content: e.target.value })}
                      className="w-full h-24 bg-black/40 rounded-xl border border-white/10 p-3 text-sm text-white resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
