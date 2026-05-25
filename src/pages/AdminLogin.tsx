import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, Sparkles, Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AdminLogin() {
  const { loginWithEmail, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [load, setLoad] = useState(false);

  // Automatically redirect if already logged in as admin
  React.useEffect(() => {
    if (user && (user.role === 'admin' || user.email === 'joiasnaturaiss@gmail.com')) {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoad(true);

    try {
      const loggedUser = await loginWithEmail(email.trim(), password);
      // Check privilege levels
      const isAdminUser = loggedUser?.role === 'admin' || loggedUser?.email === 'joiasnaturaiss@gmail.com';
      if (!isAdminUser) {
        throw new Error('Acesso negado. Esta conta de usuário não possui permissões administrativas.');
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('E-mail ou senha do administrador incorretos.');
      } else {
        setError(err.message || 'Falha na autenticação do portal seguro.');
      }
    } finally {
      setLoad(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError(null);
    setLoad(true);
    try {
      const loggedUser = await loginWithGoogle();
      const isAdminUser = loggedUser?.role === 'admin' || loggedUser?.email === 'joiasnaturaiss@gmail.com';
      if (!isAdminUser) {
        throw new Error('Acesso negado. Sua conta Google não possui privilégios de administrador.');
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao autenticar com Google Admin.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-2">
           <div className="mx-auto w-12 h-12 bg-brand-green/10 border border-brand-green/25 rounded-2xl flex items-center justify-center text-brand-lime shadow-inner mb-2">
              <Lock size={20} className="animate-pulse" />
           </div>
           <h2 className="text-3xl font-serif text-brand-lime uppercase tracking-widest">Portal Admin</h2>
           <p className="text-[10px] text-zinc-650 uppercase tracking-[0.3em]">Ambiente Seguro Jóias Naturais</p>
        </div>

        <div className="bg-zinc-950/80 border border-white/5 rounded-[32px] p-6 space-y-6 shadow-2xl relative">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] font-mono tracking-wider uppercase rounded-2xl text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Google Sign In for the Admin */}
          <button
            onClick={handleGoogleAdminLogin}
            disabled={load}
            className="w-full py-4.5 bg-zinc-900 border border-white/5 hover:border-brand-lime/20 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-zinc-900 text-zinc-300 cursor-pointer"
          >
            <Chrome size={16} className="text-brand-lime" />
            Acessar com Google Admin
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[8px] text-zinc-600 uppercase font-mono tracking-widest">Ou com senha</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
             <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-MAIL DO ADMINISTRADOR" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-[10px] text-white tracking-widest focus:border-brand-lime/30 focus:outline-none focus:bg-zinc-900/60 transition-all"
                  />
                </div>
                <div className="relative group">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                   <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="CHAVE DE ACESSO" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-[10px] text-white tracking-widest focus:border-brand-lime/30 focus:outline-none focus:bg-zinc-900/60 transition-all"
                  />
                </div>
             </div>

             <button 
               type="submit"
               disabled={load}
               className="w-full py-4.5 bg-brand-lime text-black font-extrabold uppercase tracking-[0.3em] text-[10px] rounded-2xl flex items-center justify-center gap-3 glow-green hover:scale-[1.01] transition-transform cursor-pointer shadow-lg shadow-brand-lime/10 disabled:opacity-50"
             >
               {load ? (
                 <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
               ) : (
                 <>
                   ENTRAR NO SISTEMA
                   <ArrowRight size={16} />
                 </>
               )}
             </button>
          </form>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full text-center text-[10px] text-zinc-700 uppercase tracking-widest hover:text-zinc-500 transition-colors"
        >
          Voltar para a loja
        </button>
      </div>
    </div>
  );
}
