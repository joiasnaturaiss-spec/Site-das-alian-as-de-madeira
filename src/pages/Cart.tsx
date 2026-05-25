import { motion } from 'framer-motion';
import { Editable } from '../components/Editable';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, ShoppingBag, Eye, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';

export function Cart() {
  const { config } = useConfig();
  const { cart, updateQuantity, updateSize, removeFromCart, cartCount } = useCart();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = !!config.uiAssets.freeShippingPromoActive;
  const shippingCost = isFreeShipping ? 0 : 25;
  const total = subtotal + shippingCost;

  // Available Ring sizes from Aro 10 to 36
  const availableRingSizes = Array.from({ length: 27 }, (_, i) => 10 + i);

  if (cart.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center text-center px-6 py-20 min-h-[60vh] space-y-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-brand-lime/10 blur-3xl rounded-full scale-150" />
          <ShoppingBag size={52} className="text-zinc-700 animate-pulse relative z-10 mx-auto" />
        </div>

        <div className="space-y-3 max-w-md mx-auto relative z-10">
          <h2 className="text-2xl font-serif text-white uppercase tracking-wider">Sua Sacola Está Vazia</h2>
          <p className="text-xs text-zinc-500 font-sans leading-relaxed">
            As alianças artesanais são feitas sob medida, inspiradas na sua história. Explore modelos prontos ou lance o criador interativo para construir a sua aliança perfeita de madeira e gema mineral.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto pt-4">
          <button 
            onClick={() => navigate('/criar')}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-brand-lime text-black font-extrabold uppercase tracking-wider text-[10px] rounded-2xl hover:bg-white transition-all scale-100 hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-brand-lime/10 cursor-pointer font-sans"
          >
            <Sparkles size={14} />
            Criar Nova Aliança
          </button>
          
          <button 
            onClick={() => navigate('/catalogo')}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-zinc-900 border border-white/5 text-zinc-300 font-bold uppercase tracking-wider text-[10px] rounded-2xl hover:border-white/20 transition-all scale-100 hover:scale-[1.03] active:scale-[0.97] cursor-pointer font-sans"
          >
            Escolher Outro Modelo
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full px-4 sm:px-6 py-8 pb-24 max-w-5xl mx-auto"
    >
      {/* Page Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <Editable id="cart-title" type="text" className="text-4xl font-serif text-brand-lime uppercase tracking-tight">
            SACOLA DE COMPRAS
          </Editable>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-mono font-medium">
              {cartCount === 1 ? '1 UNITÁRIO SELECIONADO' : `${cartCount} ITENS SELECIONADOS`}
            </span>
          </div>
        </div>

        {/* Dynamic Multi-Add CTAs in the header for premium access */}
        <div className="flex gap-2.5">
          <Link 
            to="/criar" 
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-lime/10 border border-brand-lime/20 text-brand-lime hover:bg-brand-lime hover:text-black transition-all rounded-xl text-[9px] uppercase tracking-wider font-extrabold font-sans"
          >
            <Sparkles size={11} />
            + Criar Outra Aliança
          </Link>
          <Link 
            to="/catalogo" 
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white hover:border-white/15 transition-all rounded-xl text-[9px] uppercase tracking-wider font-bold font-sans"
          >
            + Escolher Outro Modelo
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-7 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 bg-zinc-950/40 rounded-3xl border border-white/5 hover:border-white/10 transition-all relative group overflow-hidden">
              {/* Product Thumbnail */}
              <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl overflow-hidden bg-black shrink-0 relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                  <button 
                    onClick={() => navigate(`/produto/${item.productId}`)}
                    className="flex items-center gap-1 text-[7px] text-zinc-400 uppercase font-bold tracking-widest bg-black/80 hover:bg-brand-lime hover:text-black transition-all px-2 py-1 rounded"
                  >
                    <Eye size={8} /> Detalhes
                  </button>
                </div>
              </div>
              
              {/* Product Metadata & Actions */}
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-serif text-white uppercase tracking-tight">{item.name}</h3>
                    {item.material && (
                      <p className="text-[9px] text-zinc-400/90 font-mono leading-relaxed max-w-[280px]">
                        Materiais: {item.material}
                      </p>
                    )}
                  </div>
                  
                  {/* Delete Item representation */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-zinc-600 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                    title="Excluir aliança da sacola"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Sizing Modification Segment */}
                <div className="my-2.5 p-2 bg-black/60 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Ajuste Aro (Medida):</span>
                    {/* Ring size dropdown overlay targeting individual handmade units */}
                    <select
                      value={item.size}
                      onChange={(e) => updateSize(item.id, Number(e.target.value))}
                      className="bg-zinc-900 text-zinc-200 text-xs font-bold font-mono border border-white/10 rounded-lg px-2 py-0.5 focus:border-brand-lime outline-none cursor-pointer"
                    >
                      {availableRingSizes.map((size) => (
                        <option key={size} value={size}>
                          Aro {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[7.5px] text-brand-lime uppercase font-bold tracking-[0.1em] font-mono animate-pulse">
                    Feito Unitário Sob Medida
                  </span>
                </div>

                {/* Quantity Adjustment + Dynamic Price Line */}
                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-3 bg-zinc-900/60 rounded-xl p-1 px-2.5 border border-white/5">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-zinc-500 hover:text-white transition-colors p-0.5 cursor-pointer"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-mono text-white min-w-[12px] text-center select-none">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-zinc-500 hover:text-white transition-colors p-0.5 cursor-pointer"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div className="text-right">
                    {item.quantity > 1 && (
                      <span className="block text-[8px] font-mono text-zinc-500 line-through">
                        R$ {(item.price * item.quantity).toLocaleString('pt-BR')}
                      </span>
                    )}
                    <span className="text-sm font-serif text-brand-lime font-bold">
                      R$ {item.price.toLocaleString('pt-BR')} <span className="text-[9px] font-sans font-light text-zinc-500 uppercase">/unid</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Prompt regarding Handmade Unique/Pair configurations */}
          <div className="p-4 bg-zinc-900/20 rounded-2xl border border-white/5 text-center mt-6">
            <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-400 mb-1">Dica de Ateliê</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xl mx-auto font-sans">
              Cada anel nesta lista é confeccionado de forma manual e individualizada. Você pode mudar livremente o aro de cada joia e incluir combinações variadas de madeiras o quanto desejar!
            </p>
          </div>
        </div>

        {/* Order Summary Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-zinc-950/20 rounded-3xl border border-white/5 space-y-6 sticky top-28">
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-300 border-b border-white/5 pb-2.5">
                Resumo do Pedido
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span className="font-light">Subtotal ({cartCount} {cartCount === 1 ? 'aliança' : 'alianças'})</span>
                  <span className="font-mono text-white">R$ {subtotal.toLocaleString('pt-BR')}</span>
                </div>
                
                <div className="flex justify-between text-xs text-zinc-400">
                  <span className="font-light">Taxa de Envio</span>
                  {isFreeShipping ? (
                    <span className="text-brand-lime font-bold uppercase tracking-wide">GRÁTIS</span>
                  ) : (
                    <span className="text-white font-mono">R$ {shippingCost.toLocaleString('pt-BR')},00</span>
                  )}
                </div>
                
                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Total Geral</span>
                  <div className="text-right">
                    <span className="text-2xl font-serif text-brand-lime font-bold">
                      R$ {total.toLocaleString('pt-BR')}
                    </span>
                    <span className="block text-[8px] text-zinc-600 uppercase tracking-wider font-mono mt-0.5">
                      ou até 12x de R$ {(total / 12).toFixed(2).replace('.', ',')} sem juros
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link 
                to="/checkout"
                className="w-full py-4 bg-brand-lime text-black font-extrabold uppercase tracking-[.3em] text-[10px] rounded-2xl flex items-center justify-center gap-3 glow-green scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xl shadow-brand-lime/10"
              >
                FINALIZAR PEDIDO
                <ArrowRight size={14} />
              </Link>

              <div className="flex justify-between gap-2.5 pt-1">
                <Link 
                  to="/criar" 
                  className="flex-1 text-center py-3 bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white transition-all rounded-xl text-[8px] uppercase tracking-wider font-bold"
                >
                  Criar Nova
                </Link>
                <Link 
                  to="/catalogo" 
                  className="flex-1 text-center py-3 bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white transition-all rounded-xl text-[8px] uppercase tracking-wider font-bold"
                >
                  Ver Catálogo
                </Link>
              </div>
            </div>
            
            <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[8px] text-zinc-500 uppercase tracking-widest justify-center">
                <ShieldCheck size={12} className="text-brand-lime/70" />
                <span>Pagamento 100% Criptografado</span>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-zinc-500 uppercase tracking-widest justify-center">
                <RefreshCw size={11} className="text-brand-lime/70 animate-spin-slow" />
                <span>Garantia Vitalícia & Ajuste Grátis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
