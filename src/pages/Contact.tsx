import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Send, Play, Sparkles, MessageSquare, LogIn, UserPlus, AlertCircle, Image as ImageIcon, Loader2, X } from 'lucide-react';

const HELP_SUGGESTIONS = [
  "Qual o prazo de produção das alianças?",
  "Como faço para saber minha medida?",
  "Vocês fazem gravação personalizada?",
  "O envio para minha região possui seguro?"
];

// Helper to compress and resize images with native HTML5 Canvas
function compressAndResizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Get base64 string with compressed JPEG quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function Contact() {
  const { config } = useConfig();
  const { user } = useAuth();
  const { activeChatMessages, sendMessage, markAsRead, setCurrentChatId, chatError, clearChatError } = useChat();
  const navigate = useNavigate();

  const { uiAssets } = config;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form local state
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachingImage, setAttachingImage] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('chat');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAttachingImage(true);
    try {
      const compressedBase64 = await compressAndResizeImage(file);
      await sendMessage('', undefined, compressedBase64);
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setAttachingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Retrieve configurable values or fallback beautiful defaults
  const title = uiAssets?.contactTitle || 'CONTATO';
  const subtitle = uiAssets?.contactSubtitle || 'Fale com nossos artesãos especialistas';
  const email = uiAssets?.contactEmail || 'atendimento@joiasnaturais.com.br';
  const phone = uiAssets?.contactPhone || '+55 (11) 99999-8888';
  const address = uiAssets?.contactAddress || 'São Paulo, Brasil';
  const image = uiAssets?.contactImage || '';
  const videoUrl = uiAssets?.contactVideoUrl || '';
  const instagram = uiAssets?.contactInstagram || 'https://instagram.com';
  const facebook = uiAssets?.contactFacebook || 'https://facebook.com';

  // Attach chatId to user on component load
  useEffect(() => {
    if (user) {
      setCurrentChatId(user.id);
      markAsRead(user.id, 'user');
    } else {
      setCurrentChatId(null);
    }
  }, [user, setCurrentChatId]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (user && activeChatMessages.length > 0) {
      markAsRead(user.id, 'user');
    }
  }, [activeChatMessages, user]);

  // Clean phone number for automated WhatsApp link
  const getWhatsAppLink = (numStr: string) => {
    const digitsOnly = numStr.replace(/\D/g, '');
    if (!digitsOnly) return '#';
    return `https://wa.me/${digitsOnly}`;
  };

  const currentWhatsApp = getWhatsAppLink(phone);

  const handleSend = async (textToSend: string) => {
    if (!user || !textToSend.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(textToSend);
      setChatInput('');
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(chatInput);
  };

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

  if (activeTab === 'chat') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col w-full h-[calc(100vh-215px)] md:h-[calc(100vh-245px)] px-4 py-2 font-sans relative overflow-hidden select-none"
      >
         {/* Tabs Header */}
         <div className="flex bg-zinc-950/85 p-1 rounded-2xl border border-white/5 w-full max-w-sm mx-auto flex-shrink-0">
            <button 
               type="button"
               onClick={() => setActiveTab('chat')}
               className="flex-grow py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer bg-brand-lime text-black shadow-lg shadow-brand-lime/10"
            >
               <MessageSquare size={13} />
               Chat Online
            </button>
            <button 
               type="button"
               onClick={() => setActiveTab('info')}
               className="flex-grow py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white"
            >
               <Mail size={13} />
               Outros Canais
            </button>
         </div>

         {/* Full-Screen Chat container */}
         <div className="flex-1 min-h-0 bg-zinc-950/80 border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl mt-4 relative">
            
            {/* Header of Chat */}
            <div className="p-4 bg-zinc-900/30 border-b border-white/5 flex items-center justify-between flex-shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-lime/10 border border-brand-lime/25 rounded-xl flex items-center justify-center text-brand-lime">
                     <MessageSquare size={18} className="animate-pulse" />
                  </div>
                  <div>
                     <h3 className="text-xs uppercase tracking-widest font-extrabold text-white">Ateliê On-line</h3>
                     <p className="text-[7px] text-brand-lime uppercase font-mono tracking-wider flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
                        Tempo Real
                     </p>
                  </div>
               </div>

               {user && (
                 <div className="text-right">
                   <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-mono">Conectado</span>
                   <p className="text-[9px] text-zinc-300 font-bold tracking-wider truncate max-w-[120px]">{user.name}</p>
                 </div>
               )}
            </div>

            {/* ERROR ALERT BLOCK */}
            {chatError && (
               <div className="bg-red-500/10 border-b border-white/5 p-3 flex items-center justify-between gap-3 text-red-500 flex-shrink-0">
                  <div className="flex items-center gap-2">
                     <AlertCircle size={13} className="flex-shrink-0 text-red-500" />
                     <p className="text-[9px] font-mono tracking-wide">{chatError}</p>
                  </div>
                  <button 
                     onClick={clearChatError} 
                     className="text-[8px] uppercase tracking-wider text-red-500/60 hover:text-red-500 font-bold transition-colors px-2 py-0.5 bg-white/5 rounded"
                  >
                     Fechar
                  </button>
               </div>
            )}

            {/* Messages Body */}
            <div className="flex-1 min-h-0 p-4 overflow-y-auto flex flex-col">
               {!user ? (
                 <div className="my-auto flex flex-col items-center justify-center text-center px-4 py-8 space-y-6">
                    <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-zinc-500">
                       <Sparkles size={18} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xs font-serif italic text-zinc-300">Conecte-se para iniciar a conversa</h4>
                       <p className="text-[9px] text-zinc-500 uppercase tracking-wider leading-relaxed max-w-xs mx-auto">
                          Faça login na sua conta ou registre-se para salvar seus rascunhos de anéis e interagir com nossos designers em tempo real.
                       </p>
                    </div>

                    <button
                      onClick={() => navigate('/login', { state: { from: { pathname: '/contato' } } })}
                      className="px-6 py-3.5 bg-brand-lime text-black font-extrabold uppercase tracking-widest text-[9px] rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow shadow-brand-lime/10"
                    >
                      Entrar ou Criar conta
                      <LogIn size={12} />
                    </button>
                 </div>
               ) : (
                 <div className="space-y-4 flex-1 overflow-y-auto scrollbar-none pr-1">
                   {activeChatMessages.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                        <div className="w-9 h-9 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-zinc-650">
                           <MessageSquare size={14} />
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Nenhuma mensagem ainda.</p>
                        <p className="text-[9px] text-zinc-600 font-serif italic max-w-[200px]">Envie uma pergunta ou clique em uma das sugestões abaixo!</p>
                     </div>
                   ) : (
                     activeChatMessages.map((msg) => {
                       const isMe = msg.senderId === user.id;
                       return (
                         <div 
                           key={msg.id} 
                           className={`flex flex-col max-w-[85%] mb-4 ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                         >
                            <span className="text-[7px] text-zinc-500 uppercase font-mono tracking-widest pb-1">
                               {isMe ? 'Você' : 'Ateliê'}
                            </span>
                            <div className={`p-4 rounded-3xl text-xs leading-relaxed font-sans ${isMe ? 'bg-brand-lime text-black font-medium rounded-tr-none' : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-none'}`}>
                               {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                               {msg.imageUrl && (
                                 <div className="mt-2 max-w-[200px] rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setActiveLightboxImage(msg.imageUrl)}>
                                   <img src={msg.imageUrl} alt="Imagem enviada" className="w-full h-auto object-cover max-h-[160px]" referrerPolicy="no-referrer" />
                                 </div>
                               )}
                            </div>
                            <span className="text-[7px] text-zinc-650 font-mono pt-1">
                               {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                       );
                     })
                   )}
                   <div ref={messagesEndRef} />
                 </div>
               )}
            </div>

            {/* Persistent Input Bar */}
            {user && (
              <div className="p-4 bg-zinc-950/95 border-t border-white/5 space-y-4 flex-shrink-0">
                 
                 {/* Micro suggestions lists */}
                 {activeChatMessages.length === 0 && (
                   <div className="space-y-2">
                      <p className="text-[7px] text-zinc-500 font-mono tracking-widest uppercase">Perguntas frequentes:</p>
                      <div className="flex flex-col gap-1.5">
                         {HELP_SUGGESTIONS.map((suggestion, i) => (
                            <button 
                              key={i}
                              type="button"
                              onClick={() => handleSend(suggestion)}
                              className="text-left py-2 px-3.5 bg-zinc-900/50 hover:bg-zinc-900/90 border border-white/5 hover:border-brand-lime/20 text-[9px] text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer truncate font-serif italic"
                            >
                              "{suggestion}"
                            </button>
                         ))}
                      </div>
                   </div>
                 )}

                 {/* Message input bar */}
                 <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAttachImage}
                      accept="image/*"
                      className="hidden"
                      id="contact-chat-image-input"
                    />
                    <button
                      type="button"
                      disabled={sending || attachingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-brand-lime rounded-2xl flex items-center justify-center hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-40"
                      title="Anexar Foto"
                    >
                       {attachingImage ? <Loader2 size={14} className="animate-spin text-brand-lime" /> : <ImageIcon size={14} />}
                    </button>
                    <form onSubmit={onFormSubmit} className="flex-1 flex gap-2">
                       <input
                         type="text"
                         placeholder={attachingImage ? "Enviando foto..." : "ESCREVA SUA MENSAGEM..."}
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         disabled={sending || attachingImage}
                         className="flex-1 bg-zinc-900 border border-white/5 focus:border-brand-lime/20 rounded-2xl px-5 py-4 text-[10px] text-white tracking-widest focus:bg-zinc-905 focus:outline-none transition-all disabled:opacity-50"
                       />
                       <button
                         type="submit"
                         disabled={!chatInput.trim() || sending || attachingImage}
                         className="px-5 bg-brand-lime text-black rounded-2xl flex items-center justify-center hover:bg-brand-lime/90 active:scale-95 duration-100 transition-all font-extrabold cursor-pointer disabled:opacity-40"
                       >
                          <Send size={14} />
                       </button>
                    </form>
                 </div>
              </div>
            )}
         </div>

         {/* Lightbox Modal */}
         <AnimatePresence>
           {activeLightboxImage && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setActiveLightboxImage(null)}
               className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9000] flex items-center justify-center p-4 cursor-zoom-out"
             >
               <motion.button
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="absolute top-6 right-6 w-11 h-11 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                 onClick={() => setActiveLightboxImage(null)}
               >
                 <X size={18} />
               </motion.button>
               <motion.img
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 src={activeLightboxImage}
                 alt="Visualização em tamanho real"
                 className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/5 select-none"
                 referrerPolicy="no-referrer"
                 onClick={(e) => e.stopPropagation()}
               />
             </motion.div>
           )}
         </AnimatePresence>
      </motion.div>
    );
  }

  // Active Tab: Info
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col w-full px-6 py-6 pb-24 font-sans space-y-8 overflow-y-auto"
    >
       {/* Tabs Header */}
       <div className="flex bg-zinc-950/85 p-1 rounded-2xl border border-white/5 w-full max-w-sm mx-auto">
          <button 
             type="button"
             onClick={() => setActiveTab('chat')}
             className="flex-grow py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white"
          >
             <MessageSquare size={13} />
             Chat Online
          </button>
          <button 
             type="button"
             onClick={() => setActiveTab('info')}
             className="flex-grow py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer bg-brand-lime text-black shadow-lg shadow-brand-lime/10"
          >
             <Mail size={13} />
             Outros Canais
          </button>
       </div>

      {/* Page Title & Subtitle */}
      <div className="space-y-2 pt-2">
        <h2 className="text-4xl font-serif text-brand-lime uppercase tracking-tight">
          {title}
        </h2>
        <p className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase">
          {subtitle}
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Contact info cards */}
        <div className="grid grid-cols-1 gap-4">
           {/* Email Card */}
           <a 
             href={`mailto:${email}`} 
             className="flex items-center gap-5 p-5 bg-zinc-900/40 rounded-3xl border border-white/5 hover:border-brand-lime/25 hover:bg-zinc-900/60 transition-all group"
           >
              <div className="w-12 h-12 bg-black border border-brand-lime/10 group-hover:border-brand-lime/30 rounded-2xl flex items-center justify-center text-brand-lime group-hover:bg-brand-lime group-hover:text-black transition-all shadow-lg">
                 <Mail size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">E-mail</p>
                <p className="text-sm font-serif text-white italic truncate group-hover:text-brand-lime transition-colors">{email}</p>
              </div>
           </a>
           
           {/* WhatsApp Card */}
           <a 
             href={currentWhatsApp} 
             target="_blank" 
             rel="noopener noreferrer"
             className="flex items-center gap-5 p-5 bg-zinc-900/40 rounded-3xl border border-white/5 hover:border-brand-lime/25 hover:bg-zinc-900/60 transition-all group"
           >
              <div className="w-12 h-12 bg-black border border-brand-lime/10 group-hover:border-brand-lime/30 rounded-2xl flex items-center justify-center text-brand-lime group-hover:bg-brand-lime group-hover:text-black transition-all shadow-lg">
                 <Phone size={18} />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">WhatsApp (Clique p/ falar)</p>
                <p className="text-sm font-serif text-white italic group-hover:text-brand-lime transition-colors">{phone}</p>
              </div>
           </a>
           
           {/* Atelier Card */}
           <div className="flex items-center gap-5 p-5 bg-zinc-900/40 rounded-3xl border border-white/5">
              <div className="w-12 h-12 bg-black border border-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime shadow-lg">
                 <MapPin size={18} />
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Atelier</p>
                <p className="text-sm font-serif text-white italic">{address}</p>
              </div>
           </div>
        </div>

        {/* Dynamic Image upload if configured */}
        {image && (
          <div className="w-full h-48 rounded-3xl overflow-hidden border border-white/5">
            <img 
              src={image} 
              className="w-full h-full object-cover brightness-[0.8] hover:scale-105 duration-700 transition-all" 
              alt="Atelier"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Dynamic Video upload if configured */}
        {videoUrl && (
          <div className="space-y-3 pt-3">
            <p className="text-[9px] uppercase tracking-[0.25em] text-brand-lime font-mono flex items-center gap-1.5">
              <Play size={10} className="animate-pulse" />
              Conheça nosso processo
            </p>
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-white/5">
              {isLocalVideo ? (
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                />
              ) : youtubeEmbedUrl ? (
                <iframe 
                  src={youtubeEmbedUrl} 
                  title="Vídeo de contato" 
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
          </div>
        )}

        {/* Social Networks Connect */}
        <div className="flex justify-center gap-4 pt-2">
           {instagram && (
             <a 
               href={instagram} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="p-4 bg-zinc-900/40 border border-white/5 rounded-full text-zinc-400 hover:text-brand-lime hover:border-brand-lime/20 transition-all shadow-md hover:scale-105"
             >
                <Instagram size={18} />
             </a>
           )}
           {facebook && (
             <a 
               href={facebook} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="p-4 bg-zinc-900/40 border border-white/5 rounded-full text-zinc-400 hover:text-brand-lime hover:border-brand-lime/20 transition-all shadow-md hover:scale-105"
             >
                <Facebook size={18} />
             </a>
           )}
        </div>
      </div>
    </motion.div>
  );
}
