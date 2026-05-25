import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Sparkles, UserPlus, ArrowLeft } from 'lucide-react';

export function Register() {
  const { registerWithEmail, user } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto redirect if logged in
  React.useEffect(() => {
    if (user) {
      navigate('/perfil');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name) throw new Error('Por favor, informe seu nome completo.');
      if (password.length < 6) throw new Error('A senha deve conter no mínimo 6 caracteres.');
      
      await registerWithEmail(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center px-6 py-12 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 bg-zinc-900 border border-brand-lime/10 rounded-2xl flex items-center justify-center text-brand-lime glow-green shadow-lg">
            <Sparkles size={24} />
          </div>
          <h2 className="text-3xl font-serif text-brand-lime uppercase tracking-widest text-glow">
            Criar Cadastro
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
            Cadastre-se para desenhar suas joias e salvar seu perfil
          </p>
        </div>

        <div className="bg-zinc-950/80 border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-00 text-[10px] uppercase font-mono tracking-wider rounded-2xl text-center text-red-400">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: CLARA SILVA"
                  className="w-full bg-zinc-900/50 border border-white/5 focus:border-brand-lime/20 rounded-2xl py-4.5 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">E-mail de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="NOME@EMAIL.COM"
                  className="w-full bg-zinc-900/50 border border-white/5 focus:border-brand-lime/20 rounded-2xl py-4.5 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Crie sua Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="MÍNIMO 6 CARACTERES"
                  className="w-full bg-zinc-900/50 border border-white/5 focus:border-brand-lime/20 rounded-2xl py-4.5 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 mt-2 bg-brand-lime text-black font-extrabold uppercase tracking-[0.3em] text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-lime/90 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-brand-lime/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  EFETUAR CADASTRO
                  <UserPlus size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/login')}
              className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-brand-lime transition-colors"
            >
              Já possui uma conta? Acesse por aqui
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-[10px] text-zinc-700 uppercase tracking-widest hover:text-zinc-500 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={12} />
          Voltar para Home
        </button>
      </div>
    </div>
  );
}
