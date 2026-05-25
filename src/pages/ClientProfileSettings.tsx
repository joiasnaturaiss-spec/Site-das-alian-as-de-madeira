import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User, Mail, Phone, MapPin, Sparkles, 
  Save, AlertCircle, CheckCircle2, ShoppingBag, 
  Settings, Layers, Star, ArrowLeft 
} from 'lucide-react';

interface ClientProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressCity?: string;
  addressState?: string;
  favoriteMaterial?: string;
  favoriteStone?: string;
  standardRingSize?: string;
}

export function ClientProfileSettings() {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClientProfileData | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            id: user.id,
            name: data.name || user.name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            addressCep: data.addressCep || '',
            addressStreet: data.addressStreet || '',
            addressNumber: data.addressNumber || '',
            addressComplement: data.addressComplement || '',
            addressCity: data.addressCity || '',
            addressState: data.addressState || '',
            favoriteMaterial: data.favoriteMaterial || 'Prata 950',
            favoriteStone: data.favoriteStone || 'Nenhum',
            standardRingSize: data.standardRingSize || '15',
          });
        }
      } catch (err) {
        console.error('Error loading client profile:', err);
        setErrorMsg('Erro ao carregar dados do perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        name: profile.name,
        phone: profile.phone || '',
        addressCep: profile.addressCep || '',
        addressStreet: profile.addressStreet || '',
        addressNumber: profile.addressNumber || '',
        addressComplement: profile.addressComplement || '',
        addressCity: profile.addressCity || '',
        addressState: profile.addressState || '',
        favoriteMaterial: profile.favoriteMaterial || '',
        favoriteStone: profile.favoriteStone || '',
        standardRingSize: profile.standardRingSize || '',
      });

      await refreshUserProfile();
      setSuccessMsg('Configurações atualizadas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error updating client profile:', err);
      setErrorMsg('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-lime border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Carregando seu perfil...</span>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-white py-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Upper title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2.5 bg-zinc-900 border border-white/5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="space-y-1">
              <h1 className="text-xl font-serif text-brand-lime uppercase tracking-widest text-glow flex items-center gap-2">
                Minhas Configurações
                <Sparkles size={16} className="text-brand-lime" />
              </h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Configure seu perfil pessoal e preferências</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[8px] text-zinc-400 font-mono tracking-widest">
              ID CLIENTE
            </span>
          </div>
        </div>

        {/* Notifications toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-950/20 border border-emerald-500/20 text-brand-lime text-[10px] uppercase font-mono tracking-wider rounded-2xl text-center flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={14} />
              {successMsg}
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-950/20 border border-red-500/40 text-red-400 text-[10px] uppercase font-mono tracking-wider rounded-2xl text-center flex items-center justify-center gap-2"
            >
              <AlertCircle size={14} />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Card 1: Informações de Contato */}
          <div className="p-8 bg-zinc-950/50 border border-white/5 rounded-3xl space-y-6">
            <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2 border-b border-white/5 pb-3">
              <User size={14} className="text-brand-lime" />
              Informações Gerais
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <input
                    type="text"
                    required
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono font-bold">E-mail (Acesso)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-[10px] text-zinc-600 tracking-widest cursor-not-allowed"
                    title="E-mail não pode ser alterado por motivos de segurança."
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Celular (WhatsApp)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <input
                    type="text"
                    name="phone"
                    placeholder="EX: (11) 99999-9999"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 pl-11 pr-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Endereço de Entrega */}
          <div className="p-8 bg-zinc-950/50 border border-white/5 rounded-3xl space-y-6">
            <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2 border-b border-white/5 pb-3">
              <MapPin size={14} className="text-brand-lime" />
              Endereço de Entrega
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">CEP</label>
                <input
                  type="text"
                  name="addressCep"
                  value={profile.addressCep}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 px-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Logradouro / Rua</label>
                <input
                  type="text"
                  name="addressStreet"
                  value={profile.addressStreet}
                  onChange={handleChange}
                  placeholder="RUA, AVENIDA..."
                  className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 px-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Número</label>
                <input
                  type="text"
                  name="addressNumber"
                  value={profile.addressNumber}
                  onChange={handleChange}
                  placeholder="Ex: 123"
                  className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 px-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Complemento</label>
                <input
                  type="text"
                  name="addressComplement"
                  value={profile.addressComplement}
                  onChange={handleChange}
                  placeholder="APT, BLOCO..."
                  className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 px-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all uppercase"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Cidade</label>
                <input
                  type="text"
                  name="addressCity"
                  value={profile.addressCity}
                  onChange={handleChange}
                  className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 px-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Estado</label>
                <input
                  type="text"
                  name="addressState"
                  value={profile.addressState}
                  onChange={handleChange}
                  placeholder="EX: SP"
                  className="w-full bg-zinc-900/30 border border-white/5 focus:border-brand-lime/20 rounded-xl py-3 px-4 text-[10px] text-white tracking-widest focus:outline-none focus:bg-zinc-900 transition-all uppercase"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4.5 bg-brand-lime text-black font-extrabold uppercase tracking-[0.3em] text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-lime/90 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-brand-lime/10 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                SALVAR ALTERAÇÕES
                <Save size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            Voltar ao Início
          </button>
        </div>

      </div>
    </div>
  );
}
