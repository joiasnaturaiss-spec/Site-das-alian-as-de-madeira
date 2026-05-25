import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Image as ImageIcon, Loader2, Sparkles, LogIn } from 'lucide-react';

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
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function FloatingChat() {
  const { user } = useAuth();
  const { activeChats, activeChatMessages, sendMessage, markAsRead, setCurrentChatId, chatError, clearChatError } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachingImage, setAttachingImage] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suppress floating chat on admin pages or login screens to remain clean
  const isHiddenPage = location.pathname.startsWith('/admin') || location.pathname === '/login';

  // Attach chatId when logged in
  useEffect(() => {
    if (user && isOpen) {
      setCurrentChatId(user.id);
      markAsRead(user.id, 'user');
    }
  }, [user, isOpen]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      if (user && activeChatMessages.length > 0) {
        markAsRead(user.id, 'user');
      }
    }
  }, [activeChatMessages, isOpen, user]);

  const handleSend = async (textToSend: string) => {
    if (!user || (!textToSend.trim() && !attachingImage) || sending) return;

    setSending(true);
    try {
      await sendMessage(textToSend);
      setChatInput('');
    } catch (err) {
      console.error("Failed to send floating chat message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAttachingImage(true);
    try {
      const compressedBase64 = await compressAndResizeImage(file);
      await sendMessage('', undefined, compressedBase64);
    } catch (err) {
      console.error("Failed to upload image in floating chat:", err);
    } finally {
      setAttachingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      handleSend(chatInput);
    }
  };

  // Check for any unread messages from standard user perspective
  const userChatSession = activeChats.find(c => c.id === user?.id);
  const hasUnread = userChatSession?.unreadByUser;

  if (isHiddenPage) return null;

  return (
    <>
      {/* 2. Chat Slider Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-28 right-4 md:right-[calc(50%-240px)] w-[360px] max-w-[calc(100vw-32px)] h-[460px] rounded-[28px] bg-zinc-950/95 border border-white/10 flex flex-col overflow-hidden shadow-2xl z-55 backdrop-blur-xl"
            id="floating-chat-container"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900/40 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime">
                  <MessageSquare size={15} />
                </div>
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-white">Ateliê On-line</h4>
                  <p className="text-[7px] text-brand-lime font-mono tracking-widest uppercase flex items-center gap-1 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-brand-lime animate-pulse" />
                    Tempo Real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full flex items-center justify-center transition-colors border border-white/5"
              >
                <X size={12} />
              </button>
            </div>

            {/* Error alerts */}
            {chatError && (
              <div className="bg-red-500/15 p-2 px-4 border-b border-white/5 flex items-center justify-between gap-2 text-red-500 text-[9px] font-mono">
                <span className="truncate">{chatError}</span>
                <button onClick={clearChatError} className="underline hover:text-white uppercase text-[8px] font-bold">FECHAR</button>
              </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
              {!user ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-2 space-y-4 my-auto">
                  <div className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-zinc-500">
                    <Sparkles size={14} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-serif italic text-zinc-300">Inicie uma conversa</h5>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-wider leading-relaxed max-w-[220px]">
                      Conecte-se para bater um papo em tempo real e receber suporte especializado.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/login', { state: { from: { pathname: location.pathname } } });
                    }}
                    className="px-4 py-3 bg-brand-lime text-black font-extrabold uppercase tracking-widest text-[8px] rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Entrar para conversar
                    <LogIn size={10} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 flex-1 overflow-y-auto scrollbar-none pr-1">
                  {activeChatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-2">
                      <div className="w-8 h-8 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-zinc-600">
                        <MessageSquare size={12} />
                      </div>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Nenhuma mensagem ainda.</p>
                      <p className="text-[8px] text-zinc-650 font-serif italic max-w-[160px]">Envie uma pergunta ou compartilhe fotos dos seus rascunhos!</p>
                    </div>
                  ) : (
                    activeChatMessages.map((msg) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                        >
                          <span className="text-[6px] text-zinc-500 uppercase font-mono tracking-widest pb-0.5">
                            {isMe ? 'Você' : 'Ateliê'}
                          </span>
                          <div className={`p-3 px-4 rounded-2xl text-[11px] leading-relaxed font-sans ${isMe ? 'bg-brand-lime text-black font-medium rounded-tr-none' : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-none'}`}>
                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                            {msg.imageUrl && (
                              <div className="mt-1.5 max-w-[160px] rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setActiveLightboxImage(msg.imageUrl)}>
                                <img src={msg.imageUrl} alt="Imagem do chat" className="w-full h-auto object-cover max-h-[120px]" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                          <span className="text-[6px] text-zinc-650 font-mono pt-0.5">
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

            {/* Input Footer */}
            {user && (
              <div className="p-3 bg-zinc-950/80 border-t border-white/5 flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAttachImage}
                  accept="image/*"
                  className="hidden"
                  id="floating-chat-image-input"
                />
                <button
                  type="button"
                  disabled={sending || attachingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-brand-lime rounded-xl flex items-center justify-center hover:bg-zinc-850 transition-all cursor-pointer disabled:opacity-40"
                  title="Enviar foto"
                >
                  {attachingImage ? <Loader2 size={13} className="animate-spin text-brand-lime" /> : <ImageIcon size={13} />}
                </button>
                <form onSubmit={onFormSubmit} className="flex-1 flex gap-1.5">
                  <input
                    type="text"
                    placeholder={attachingImage ? "Enviando foto..." : "Diga algo..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={sending || attachingImage}
                    className="flex-1 bg-zinc-900 border border-white/5 focus:border-brand-lime/20 rounded-xl px-3.5 py-1 text-[10px] text-white tracking-wider focus:outline-none transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || sending || attachingImage}
                    className="w-10 h-10 bg-brand-lime text-black rounded-xl flex items-center justify-center hover:bg-brand-lime/90 active:scale-95 duration-100 transition-all font-bold cursor-pointer disabled:opacity-40"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-28 right-4 md:right-[calc(50%-240px)] w-14 h-14 bg-brand-lime text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-2xl z-50 duration-200 transition-all group pointer-events-auto"
        title="Fale conosco no Chat em Tempo Real"
        id="floating-chat-bubble"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare size={20} />
              
              {/* Unread Message Glowing Notification Alert (Client side state) */}
              {hasUnread && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border border-black animate-bounce flex items-center justify-center">
                  <span className="block w-1.5 h-1.5 bg-white rounded-full" />
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

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
    </>
  );
}
