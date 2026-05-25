import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Chrome, Sparkles, LogIn, UserPlus } from 'lucide-react';

export function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after login
  const from = (location.state as any)?.from?.pathname || '/';

  // Toggle modes
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [load, setLoad] = useState(false);

  // Automatically redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoad(true);

    try {
      if (isRegister) {
        if (!name) throw new Error('Por favor, informe seu nome.');
        await registerWithEmail(name.trim(), email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoad(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoad(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Falha na autenticação com o Google.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center px-6 py-12 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-8">
        {/* Brand Icon/Logo Placeholder */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 bg-zinc-900 border border-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime glow-green shadow-lg">
            <Sparkles size={24} />
          </div>
          <h2 className="text-3xl font-serif text-brand-lime uppercase tracking-widest text-glow">
            {isRegister ? 'Criar Conta' : 'Acessar Loja'}
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
            {isRegister ? 'Cadastre-se para desenhar e conversar com artesãos' : 'Entre para acompanhar seus desenhos e conversar em tempo real'}
          </p>
        </div>

        <div className="bg-zinc-950/80 border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl relative">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] uppercase font-mono tracking-wider rounded-2xl text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="SEU NOME COMPLETO"
                    className="w-full bg-zinc-900/50 border border-white/5 focus:border-brand-lime/20 rounded-2xl py-4.5 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EX: NOME@EMAIL.COM"
                  className="w-full bg-zinc-900/50 border border-white/5 focus:border-brand-lime/20 rounded-2xl py-4.5 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="SUA SENHA DE ACESSO"
                  className="w-full bg-zinc-900/50 border border-white/5 focus:border-brand-lime/20 rounded-2xl py-4.5 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={load}
              className="w-full py-4.5 mt-2 bg-brand-lime text-black font-extrabold uppercase tracking-[0.3em] text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-lime/90 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-brand-lime/10 disabled:opacity-50"
            >
              {load ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'EFETUAR CADASTRO' : 'CONECTAR AO PORTAL'}
                  {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[8px] text-zinc-600 uppercase font-mono tracking-widest">Ou acessar com</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={load}
            className="w-full py-4.5 bg-zinc-900/50 border border-white/5 hover:border-brand-lime/20 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-zinc-900 text-zinc-300 cursor-pointer"
          >
            <Chrome size={16} className="text-brand-lime" />
            Minha conta Google
          </button>

          {/* Toggle Buttons */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setError(null);
                setIsRegister(!isRegister);
              }}
              className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-brand-lime transition-colors"
            >
              {isRegister ? 'Já possui conta? Conecte-se' : 'Não possui conta? Cadastre-se'}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-[10px] text-zinc-700 uppercase tracking-widest hover:text-zinc-500 transition-colors"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
}
