import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, X, Check, Award, ShieldAlert, Sparkles, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { Evaluation } from '../types';

export function PublicReviews() {
  const { config, addEvaluation } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState<string>(''); // Base64 image
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  // List of approved evaluations to show publically on Home
  const approvedReviews = (config.evaluations || []).filter(e => e.status === 'approved');

  // Generate random pastel color for monograms
  const pastelColors = [
    '#fca5a5', '#fdba74', '#fde047', '#86efac', 
    '#93c5fd', '#c084fc', '#f472b6', '#2dd4bf'
  ];
  
  const getRandomPastelColor = () => {
    return pastelColors[Math.floor(Math.random() * pastelColors.length)];
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    const newEval: Evaluation = {
      id: `eval-${Date.now()}`,
      clientName: name,
      rating: rating,
      comment: comment,
      imageUrl: imageFile || undefined,
      avatarColor: getRandomPastelColor(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending' // Ensent for moderation
    };

    addEvaluation(newEval);
    setSuccess(true);
    
    // Clear form
    setName('');
    setRating(5);
    setComment('');
    setImageFile('');
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSuccess(false);
  };

  return (
    <section className="px-6 py-10 mt-6 md:mt-8 bg-gradient-to-b from-zinc-950 to-black/40 border-t border-white/5 space-y-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-2">
        <h3 className="font-serif text-[13px] uppercase tracking-[0.2em] text-white font-semibold flex items-center gap-1.5">Avaliações</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-brand-lime hover:bg-brand-lime/90 text-black rounded-lg font-bold uppercase tracking-widest text-[8px] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow shadow-brand-lime/10"
        >
          Avaliar
        </button>
      </div>

      {/* Horizontal Carousel Slider */}
      <div className="max-w-7xl mx-auto relative">
        {approvedReviews.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/10 border border-white/5 rounded-3xl">
            <span className="text-zinc-500 font-serif italic text-xs leading-none">Nenhuma avaliação publicada ainda. Seja o primeiro a avaliar!</span>
          </div>
        ) : (
          <div 
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory px-1 pt-2 pb-6 scroll-smooth"
          >
            {approvedReviews.map((review) => {
              const initials = review.clientName
                ? review.clientName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                : 'U';
              
              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="w-[260px] sm:w-[325px] shrink-0 snap-start bg-zinc-900/35 border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all duration-350 shadow-inner"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2.5 truncate">
                        {review.imageUrl ? (
                          <img
                            src={review.imageUrl}
                            alt={review.clientName}
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            style={{ backgroundColor: review.avatarColor || '#3b82f6' }}
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] text-zinc-950 font-mono shadow-inner uppercase shrink-0"
                          >
                            {initials}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-[11px] uppercase tracking-wider font-extrabold text-white truncate max-w-[185px]">{review.clientName}</p>
                          <p className="text-[8.5px] text-zinc-500 tracking-wider font-mono">{review.createdAt}</p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-0.5 text-brand-lime shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={i < review.rating ? 'fill-brand-lime' : 'text-zinc-800'}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-zinc-300 text-[11.5px] font-normal leading-relaxed font-serif italic min-h-[50px]">
                      "{review.comment}"
                    </p>
                  </div>

                  {review.imageUrl && (
                    <div className="mt-1 text-left">
                      <img src={review.imageUrl} alt="Joia do cliente" className="h-20 w-full object-cover rounded-xl border border-white/5 bg-black/20" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Submision Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl z-10 p-6"
            >
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-brand-lime font-mono tracking-widest uppercase">Deixe sua história</p>
                    <h3 className="font-serif text-lg text-white uppercase tracking-wider">Como foi sua experiência?</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Name input */}
                    <div className="space-y-1.55">
                      <label className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block">Seu nome completo</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Amanda Nunes"
                        className="w-full bg-zinc-900/30 border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white outline-none focus:border-brand-lime/30"
                      />
                    </div>

                    {/* Star selection rating */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block">Sua nota</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="p-1 transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              size={22}
                              className={
                                star <= (hoveredRating ?? rating)
                                  ? 'fill-brand-lime text-brand-lime'
                                  : 'text-zinc-800'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment text block */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block">Sua mensagem ou relato</label>
                      <textarea
                        required
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Conte-nos como se sente usando sua joia, os detalhes do atendimento ou o simbolismo dela..."
                        className="w-full bg-zinc-900/30 border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-brand-lime/30 resize-none font-light leading-relaxed"
                      />
                    </div>

                    {/* Optional photo file submit */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] uppercase tracking-wider font-bold text-zinc-500 block">Foto de sua Joia (Opcional)</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-2 text-[10px] text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                        >
                          <Upload size={14} className="text-brand-lime" />
                          Selecionar Imagem
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        {imageFile && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <img src={imageFile} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setImageFile('')}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-500 hover:text-red-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-lime text-black font-bold uppercase tracking-widest text-[9px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  >
                    Enviar para Moderação
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4 flex flex-col items-center">
                  <div className="p-3 bg-brand-lime/10 rounded-full text-brand-lime">
                    <Check size={32} />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-white font-serif text-lg uppercase tracking-wide">Obrigado por nos avaliar!</h4>
                    <p className="text-zinc-500 text-[11px] font-light leading-relaxed">
                      Sua avaliação foi enviada para nossa moderação com sucesso. Ela passará por uma análise de um dos nossos artesãos e será publicada brevemente!
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-6 py-2.5 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-wider"
                  >
                    Fechar Janela
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
