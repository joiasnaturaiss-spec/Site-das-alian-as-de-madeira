import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, RotateCcw, Info, CreditCard, Coins, Check, Hand } from 'lucide-react';

interface MeasurementGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (size: number) => void;
}

// Brazilian Sizing Table Standard
const SIZING_TABLE = [
  { size: 10, diameter: 15.0, circumference: 47.1 },
  { size: 11, diameter: 15.2, circumference: 47.7 },
  { size: 12, diameter: 15.5, circumference: 48.7 },
  { size: 13, diameter: 15.8, circumference: 49.6 },
  { size: 14, diameter: 16.2, circumference: 50.9 },
  { size: 15, diameter: 16.5, circumference: 51.8 },
  { size: 16, diameter: 16.8, circumference: 52.8 },
  { size: 17, diameter: 17.2, circumference: 54.0 },
  { size: 18, diameter: 17.5, circumference: 55.0 },
  { size: 19, diameter: 17.8, circumference: 55.9 },
  { size: 20, diameter: 18.2, circumference: 57.2 },
  { size: 21, diameter: 18.5, circumference: 58.1 },
  { size: 22, diameter: 18.8, circumference: 59.1 },
  { size: 23, diameter: 19.2, circumference: 60.3 },
  { size: 24, diameter: 19.5, circumference: 61.2 },
  { size: 25, diameter: 19.8, circumference: 62.2 },
  { size: 26, diameter: 20.2, circumference: 63.4 },
  { size: 27, diameter: 20.5, circumference: 64.4 },
  { size: 28, diameter: 20.8, circumference: 65.3 },
  { size: 29, diameter: 21.2, circumference: 66.6 },
  { size: 30, diameter: 21.5, circumference: 67.5 },
  { size: 31, diameter: 21.8, circumference: 68.5 },
  { size: 32, diameter: 22.2, circumference: 69.7 },
  { size: 33, diameter: 22.5, circumference: 70.7 },
  { size: 34, diameter: 22.8, circumference: 71.6 },
  { size: 35, diameter: 23.2, circumference: 72.8 },
  { size: 36, diameter: 23.5, circumference: 73.8 }
];

export function MeasurementGuide({ isOpen, onClose, onSelectSize }: MeasurementGuideProps) {
  const [activeTab, setActiveTab] = useState<'diameter' | 'circumference'>('diameter');
  
  // Calibration settings (1px = how many mm on screen)
  const [calibrationMethod, setCalibrationMethod] = useState<'coin' | 'card'>('coin');
  const [calibrationScale, setCalibrationScale] = useState<number>(3.78); // Pixels per mm (~96 DPI initial guess)
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Diameter measurement variables (Step 2)
  const [ringDiameter, setRingDiameter] = useState<number>(17.5); // Default is 17.5mm (Size 18)
  const [recommendRingSize, setRecommendRingSize] = useState<number>(18);

  // Circumference variables (Tab 2)
  const [circumference, setCircumference] = useState<number>(55.0); // Default corresponding to Size 18
  const [recommendCircumSize, setRecommendCircumSize] = useState<number>(18);

  // Dynamic zoom block system: prevents gesture zoom, pinching, and standard wheel zoom when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('gesturestart', handleGestureStart);
    };
  }, [isOpen]);

  // Handle matching closest ring size on SIZING_TABLE based on diameter
  useEffect(() => {
    let closest = SIZING_TABLE[0];
    let minDiff = Math.abs(SIZING_TABLE[0].diameter - ringDiameter);
    
    for (let i = 1; i < SIZING_TABLE.length; i++) {
      const diff = Math.abs(SIZING_TABLE[i].diameter - ringDiameter);
      if (diff < minDiff) {
        minDiff = diff;
        closest = SIZING_TABLE[i];
      }
    }
    setRecommendRingSize(closest.size);
  }, [ringDiameter]);

  // Handle matching closest ring size on SIZING_TABLE based on circumference
  useEffect(() => {
    let closest = SIZING_TABLE[0];
    let minDiff = Math.abs(SIZING_TABLE[0].circumference - circumference);
    
    for (let i = 1; i < SIZING_TABLE.length; i++) {
      const diff = Math.abs(SIZING_TABLE[i].circumference - circumference);
      if (diff < minDiff) {
        minDiff = diff;
        closest = SIZING_TABLE[i];
      }
    }
    setRecommendCircumSize(closest.size);
  }, [circumference]);

  const handleApplySize = (size: number) => {
    if (onSelectSize) {
      onSelectSize(size);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md select-none touch-pan-y">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl z-10 touch-pan-y"
            style={{ touchAction: 'pan-y' }} // Set to pan-y to allow touch scrolling but block zoom gestures
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-lime/10 rounded-xl text-brand-lime">
                  <Ruler size={16} />
                </div>
                <div>
                  <h3 className="font-serif text-sm uppercase tracking-[0.15em] text-white">Medidor de Alianças</h3>
                  <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Aferidor Digital de Precisão</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Navigation Tabs */}
            <div className="px-6 pt-4">
              <div className="flex bg-black rounded-2xl p-1 border border-white/5">
                <button
                  onClick={() => setActiveTab('diameter')}
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                    activeTab === 'diameter'
                      ? 'bg-brand-lime text-black shadow-lg shadow-brand-lime/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Unidade Virtual (Diâmetro)
                </button>
                <button
                  onClick={() => setActiveTab('circumference')}
                  className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                    activeTab === 'circumference'
                      ? 'bg-brand-lime text-black shadow-lg shadow-brand-lime/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Fita ou Barbante
                </button>
              </div>
            </div>

            {/* Scrollable Core */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 no-scrollbar touch-pan-y">
              
              {activeTab === 'diameter' && (
                <div className="space-y-6">
                  {/* Step 1: Calibration section */}
                  <div className="bg-zinc-900/40 rounded-3xl p-5 border border-white/5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center font-mono text-[9px] text-brand-lime font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Calibração Física do Tela (Obrigatório)</h4>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-light">
                          Os celulares mudam de tamanho. Para regular a precisão, escolha um objeto físico abaixo e ajuste a barra abaixo até ele coincidir com o desenho.
                        </p>
                      </div>
                    </div>

                    {/* Calibration Switch */}
                    <div className="grid grid-cols-2 gap-2 bg-black/60 p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setCalibrationMethod('coin');
                          setIsCalibrated(true);
                        }}
                        className={`py-2 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          calibrationMethod === 'coin'
                            ? 'bg-zinc-800 text-brand-lime border border-white/5'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Coins size={12} />
                        Moeda R$ 1,00
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalibrationMethod('card');
                          setIsCalibrated(true);
                        }}
                        className={`py-2 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          calibrationMethod === 'card'
                            ? 'bg-zinc-800 text-brand-lime border border-white/5'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <CreditCard size={12} />
                        Cartão de Crédito
                      </button>
                    </div>

                    {/* Interactive Calibration stage */}
                    <div className="relative flex flex-col items-center justify-center bg-black/35 rounded-2xl p-6 border border-white/5 min-h-[140px]">
                      {calibrationMethod === 'coin' ? (
                        /* Simulated R$ 1 Coin */
                        <div 
                          style={{
                            width: `${27.0 * calibrationScale}px`,
                            height: `${27.0 * calibrationScale}px`,
                          }}
                          className="rounded-full border-[3px] border-amber-600/60 bg-gradient-to-tr from-amber-600/10 via-zinc-400/20 to-amber-600/10 flex items-center justify-center transition-all shadow-xl shadow-amber-600/5 relative"
                        >
                          <div className="absolute inset-2.5 rounded-full border border-zinc-500/30 bg-zinc-400/10 flex flex-col items-center justify-center">
                            <span className="text-[12px] font-black text-white/90">R$ 1</span>
                            <span className="text-[7px] text-zinc-400 font-mono">27 mm</span>
                          </div>
                        </div>
                      ) : (
                        /* Simulated Credit Card - Standing Up (Vertical) */
                        <div
                          style={{
                            width: `${53.98 * calibrationScale}px`,
                            height: `${85.6 * calibrationScale}px`,
                          }}
                          className="rounded-xl border border-zinc-700 bg-gradient-to-br from-zinc-800/80 to-zinc-950 flex flex-col justify-between p-3 transition-all shadow-xl relative"
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className="w-5 h-4 bg-amber-500/20 rounded border border-amber-500/40" />
                            <CreditCard size={14} className="text-zinc-600 rotate-90" />
                          </div>
                          <div className="space-y-2 w-full text-center">
                            <div className="h-1 bg-zinc-600/40 rounded w-2/3 mx-auto" />
                            <div className="flex flex-col items-center text-zinc-500 font-mono text-[7px] tracking-widest leading-normal">
                              <span className="uppercase text-[6px] tracking-wider text-zinc-400">POSIÇÃO VERTICAL</span>
                              <span>85.6 mm</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Calibration adjustment Slider */}
                      <div className="w-full mt-4 space-y-1.5">
                        <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-zinc-500">
                          <span>Diminuir</span>
                          <span>Ajuste Sincronizado</span>
                          <span>Aumentar</span>
                        </div>
                        <input
                          type="range"
                          min="2.5"
                          max="5.5"
                          step="0.01"
                          value={calibrationScale}
                          onChange={(e) => {
                            setCalibrationScale(parseFloat(e.target.value));
                            setIsCalibrated(true);
                          }}
                          className="w-full accent-brand-lime h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Measurements Verification */}
                  <div className="bg-zinc-900/40 rounded-3xl p-5 border border-white/5 space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center font-mono text-[9px] text-brand-lime font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Coloque seu Anel e Meça</h4>
                        <p className="text-[10px] text-zinc-400 font-light leading-relaxed">
                          Agora, com a tela calibrated, coloque um anel que sirva em seu dedo bem no centro do círculo abaixo. Ajuste até a borda vermelha/brilhante tocar a parte de INSENTRO (interna) da joia.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Ring Stage with Zoom Blocked */}
                    <div className="relative flex flex-col items-center justify-center bg-black/40 rounded-2xl p-8 border border-white/5 min-h-[190px] overflow-hidden">
                      {/* Grid overlay to emphasize touch lock and absolute flatness */}
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-5 pointer-events-none">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div key={i} className="border border-white" />
                        ))}
                      </div>

                      {/* Ring Drawing */}
                      <div 
                        style={{
                          width: `${ringDiameter * calibrationScale}px`,
                          height: `${ringDiameter * calibrationScale}px`,
                        }}
                        className="rounded-full border-[3px] border-dashed border-brand-lime relative flex items-center justify-center transition-all bg-brand-lime/5 shadow-2xl shadow-brand-lime/10"
                      >
                        {/* Perfect Alignment marker overlay */}
                        <div className="absolute inset-0 rounded-full border border-red-500/50 animate-pulse pointer-events-none" />
                        
                        <div className="p-2 bg-black/80 rounded-xl border border-white/10 flex flex-col items-center shadow-lg">
                          <span className="text-[11px] font-serif font-black text-brand-lime">
                            {ringDiameter.toFixed(1)} mm
                          </span>
                          <span className="text-[6.5px] uppercase text-zinc-500 tracking-wider">Interno</span>
                        </div>
                      </div>

                      {/* Ring measurement slider */}
                      <div className="w-full mt-6 space-y-1.5 z-10">
                        <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-zinc-500">
                          <span>Aro 10 (15.0 mm)</span>
                          <span>Ajustar Diâmetro do Anel</span>
                          <span>Aro 36 (23.5 mm)</span>
                        </div>
                        <input
                          type="range"
                          min="15.0"
                          max="23.5"
                          step="0.05"
                          value={ringDiameter}
                          onChange={(e) => setRingDiameter(parseFloat(e.target.value))}
                          className="w-full accent-brand-lime h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Result and Checkout */}
                    <div className="bg-black/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold font-mono">Tamanho Resultante</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-serif font-black text-brand-lime">Nº {recommendRingSize}</span>
                          <span className="text-[10px] text-zinc-500">({ringDiameter.toFixed(1)}mm)</span>
                        </div>
                      </div>

                      {onSelectSize && (
                        <button
                          onClick={() => handleApplySize(recommendRingSize)}
                          className="px-5 py-3.5 bg-brand-lime hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                        >
                          Usar Medida {recommendRingSize}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'circumference' && (
                <div className="space-y-6">
                  {/* Step instructions description */}
                  <div className="text-center space-y-1 max-w-xs mx-auto">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Aferição Manual (Circunferência)</p>
                    <p className="text-[11px] text-zinc-500 font-light leading-relaxed">
                      Siga o método tradicional utilizando um elemento de toque macio ou papel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-1.5">
                      <span className="text-brand-lime text-[9px] font-mono font-bold block">01 / Contornar</span>
                      <p className="text-[8.5px] leading-relaxed text-zinc-400 font-light">Enrole um barbante ou fita de papel justa (mas confortável) ao redor do dedo.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-1.5">
                      <span className="text-brand-lime text-[9px] font-mono font-bold block">02 / Marcar</span>
                      <p className="text-[8.5px] leading-relaxed text-zinc-400 font-light">Marque rigorosamente a interseção exata com caneta. Sem apertar demais.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-1.5">
                      <span className="text-brand-lime text-[9px] font-mono font-bold block">03 / Medir</span>
                      <p className="text-[8.5px] leading-relaxed text-zinc-400 font-light">Estique sobre uma régua de precisão e insira o valor total em milímetros.</p>
                    </div>
                  </div>

                  {/* Range and entry inputs */}
                  <div className="bg-zinc-900/40 rounded-3xl p-5 border border-white/5 space-y-5">
                    <div className="space-y-2">
                      <label className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block">Comprimento aferido na Régua (milímetros)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="47.1"
                          max="73.8"
                          step="0.1"
                          value={circumference}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) setCircumference(val);
                          }}
                          className="w-full bg-black border border-white/5 rounded-2xl px-4 py-4 text-sm font-mono text-white outline-none focus:border-brand-lime/30"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">MM</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[8px] uppercase tracking-wider font-bold text-zinc-500">
                        <span>Aro 10 (47.1 mm)</span>
                        <span>Ajustar Régua</span>
                        <span>Aro 36 (73.8 mm)</span>
                      </div>
                      <input
                        type="range"
                        min="47.1"
                        max="73.8"
                        step="0.1"
                        value={circumference}
                        onChange={(e) => setCircumference(parseFloat(e.target.value))}
                        className="w-full accent-brand-lime h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Recommended Result */}
                    <div className="bg-black/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold font-mono">Diâmetro Virtual</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-serif font-black text-brand-lime">Nº {recommendCircumSize}</span>
                          <span className="text-[10px] text-zinc-500">({circumference.toFixed(1)}mm)</span>
                        </div>
                      </div>

                      {onSelectSize && (
                        <button
                          onClick={() => handleApplySize(recommendCircumSize)}
                          className="px-5 py-3.5 bg-brand-lime hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                        >
                          Usar Medida {recommendCircumSize}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Calibration Notice Info Banner */}
            <div className="p-4 bg-zinc-900/30 border-t border-white/5 flex items-center justify-center gap-2.5 text-center">
              <Info size={11} className="text-zinc-500 shrink-0" />
              <p className="text-[7.5px] leading-normal uppercase tracking-wider text-zinc-500 font-mono">
                Aferição baseada na norma ABNT NBR 16058. Sistema com touch e zoom impedido na calibração.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
