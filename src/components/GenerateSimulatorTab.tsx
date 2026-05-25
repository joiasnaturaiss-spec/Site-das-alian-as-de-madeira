import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, PlayCircle, RefreshCw, CheckCircle2, 
  ShoppingBag, Mail, User, DollarSign, AlertCircle, Sparkles, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  value: number;
  date: string;
  paymentMethod?: string;
  rings?: any[];
  ringSpecs?: any;
}

export function GenerateSimulatorTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New mock order form state
  const [mockName, setMockName] = useState('');
  const [mockEmail, setMockEmail] = useState('');
  const [mockValue, setMockValue] = useState('299.00');
  const [mockPhone, setMockPhone] = useState('(11) 97777-6666');
  const [mockCpf, setMockCpf] = useState('123.456.789-00');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (err) {
      console.error('[GenerateSimulatorTab] Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleGeneratePendingOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockName || !mockEmail) {
      triggerNotification('error', 'Por favor, informe o Nome e E-mail.');
      return;
    }

    setIsGenerating(true);
    try {
      const randomId = `#INV-${Math.floor(2050 + Math.random() * 8000)}`;
      const cartMock = [
        {
          id: 'mock-item-1',
          name: 'Aliança Ébano Imperial',
          price: parseFloat(mockValue) || 299.00,
          quantity: 1,
          size: 19,
          material: 'Ébano+Aço Inox+Turquesa Triturada+Sem Filete'
        }
      ];

      const res = await fetch('/api/orders/pending-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cartMock,
          currentOrderId: randomId,
          email: mockEmail,
          fullName: mockName,
          shippingCost: 0,
          total: parseFloat(mockValue) || 299.00,
          cpf: mockCpf,
          phone: mockPhone,
          paymentMethod: 'pix'
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.error) {
          triggerNotification('error', `O servidor barrou: ${result.error}`);
        } else {
          triggerNotification('success', `Pedido pendente ${result.orderId || randomId} gerado com sucesso!`);
          setMockName('');
          setMockEmail('');
          fetchOrders();
        }
      } else {
        triggerNotification('error', 'Erro ao processar criação de pedido.');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Falha ao conectar com o servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateWebhookPayment = async (orderId: string) => {
    try {
      const res = await fetch('/api/webhook/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'payment.updated',
          id: `sim_pay_${Date.now()}`,
          data: { id: `sim_pay_${Date.now()}` },
          simulated_order_id: orderId,
          simulated_status: 'approved',
        }),
      });

      if (res.ok) {
        triggerNotification('success', `Pedido ${orderId} aprovado via faturamento de webhook simulado!`);
        fetchOrders();
      } else {
        triggerNotification('error', 'Servidor retornou erro ao processar o webhook.');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('error', 'Falha ao contatar webhook.');
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'Pendente');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 font-sans">
      
      {/* Intro Header banner */}
      <div className="bg-zinc-950 border border-white/5 px-6 py-5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lime/[0.02] rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="text-brand-lime animate-pulse" size={16} />
            <h4 className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-zinc-300">Ferramentas de Simulação de Vendas</h4>
          </div>
          <p className="text-[8.5px] text-zinc-500 leading-relaxed uppercase tracking-wider font-light">
            Crie pedidos pendentes de teste instantâneos e simule o disparo de notificações de webhooks de pagamento aprovados do banco.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-extrabold uppercase tracking-widest text-[8px] rounded-xl border border-white/5 transition-colors cursor-pointer"
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
          <span>Sincronizar Lista</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Create Mock Order Form */}
        <form onSubmit={handleGeneratePendingOrder} className="lg:col-span-5 p-8 bg-[#121215] border border-white/5 rounded-[32px] space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-brand-lime/5 border border-brand-lime/10 rounded-2xl text-brand-lime">
              <PlusCircle size={18} className="stroke-[1.5]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-serif font-bold text-white tracking-[0.2em] uppercase">
                Gerar Novo Pedido de Teste
              </h3>
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-light">
                Cria e insere um pedido mockado pendente com dados fictícios de cliente na base de dados.
              </p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-[0.15em] block">
                Nome do Cliente
              </label>
              <div className="relative">
                <User size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                  type="text"
                  value={mockName}
                  onChange={(e) => setMockName(e.target.value)}
                  placeholder="Carlos da Silva Mock"
                  className="w-full bg-black border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-[10px] outline-none text-zinc-300 placeholder:text-zinc-700 focus:border-brand-lime/20 focus:ring-1 focus:ring-brand-lime/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-[0.15em] block">
                E-mail para Envio
              </label>
              <div className="relative">
                <Mail size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                  type="email"
                  value={mockEmail}
                  onChange={(e) => setMockEmail(e.target.value)}
                  placeholder="carlos_simulado@exemplo.com"
                  className="w-full bg-black border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-[10px] outline-none text-zinc-300 placeholder:text-zinc-700 focus:border-brand-lime/20 focus:ring-1 focus:ring-brand-lime/10 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-[0.15em] block">
                  Valor Total (R$)
                </label>
                <div className="relative">
                  <DollarSign size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input 
                    type="number"
                    value={mockValue}
                    onChange={(e) => setMockValue(e.target.value)}
                    placeholder="299.00"
                    step="0.01"
                    className="w-full bg-black border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-[10px] outline-none text-zinc-300 placeholder:text-zinc-700 focus:border-brand-lime/20 focus:ring-1 focus:ring-brand-lime/10 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-[0.15em] block">
                  Cpf do Payer
                </label>
                <input 
                  type="text"
                  value={mockCpf}
                  onChange={(e) => setMockCpf(e.target.value)}
                  placeholder="123.456.789-00"
                  className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-[10px] outline-none text-zinc-300 placeholder:text-zinc-700 focus:border-brand-lime/20 focus:ring-1 focus:ring-brand-lime/10 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-[0.15em] block">
                Telefone Celular
              </label>
              <input 
                type="text"
                value={mockPhone}
                onChange={(e) => setMockPhone(e.target.value)}
                placeholder="(11) 97777-6666"
                className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-[10px] outline-none text-zinc-300 placeholder:text-zinc-700 focus:border-brand-lime/20 focus:ring-1 focus:ring-brand-lime/10 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full h-11 bg-brand-lime hover:bg-brand-lime/90 text-black rounded-2xl font-extrabold uppercase tracking-widest text-[8.5px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-lime/10 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
            Gerar Pedido Pendente
          </button>
        </form>

        {/* Right column: Pending orders list & Webhook dispatch control */}
        <div className="lg:col-span-7 p-8 bg-[#121215] border border-white/5 rounded-[32px] space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-brand-lime/5 border border-brand-lime/10 rounded-2xl text-brand-lime">
              <PlayCircle size={18} className="stroke-[1.5]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-serif font-bold text-white tracking-[0.2em] uppercase">
                Aprovação via Webhook de Teste
              </h3>
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-light">
                Lista de ordens abertas em modo "Pendente". Despache a notificação bancária de liquidação para mudar para "Pago".
              </p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-zinc-650" size={20} />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-black/30 border border-white/5 rounded-2xl p-6 select-none">
              <ShoppingBag size={24} className="text-zinc-700" />
              <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold">Nenhum pedido pendente ativo</p>
              <p className="text-[8px] text-zinc-600 max-w-xs uppercase tracking-normal">
                Gere um pedido com o formulário ao lado ou prossiga até o checkout para registrar novos carrinhos como "Pendente".
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
              {pendingOrders.map((order) => (
                <div 
                  key={order.id}
                  className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-mono text-zinc-200 font-bold">{order.id}</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[7.5px] uppercase font-extrabold tracking-wider font-mono">
                        Pendente
                      </span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      {order.clientName}
                    </p>
                    <p className="text-[8px] text-zinc-500 font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      {order.clientEmail}
                    </p>
                    <div className="text-[8px] text-zinc-650 font-mono">
                      Data: {order.date}
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-end gap-2.5 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    <div className="text-right flex-1 sm:flex-none">
                      <span className="text-[8.5px] font-bold text-zinc-500 block uppercase tracking-wider">Total</span>
                      <span className="text-[11.5px] font-serif text-brand-lime block">
                        R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulateWebhookPayment(order.id)}
                      className="h-8.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-extrabold uppercase tracking-widest text-[8px] flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer hover:scale-101"
                    >
                      <CheckCircle2 size={11} className="stroke-[2.5]" />
                      <span>Simular Pago</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Floating Notification Alerts */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 15, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 p-4.5 rounded-3xl z-[100] border flex items-center gap-3 shadow-2xl min-w-[320px] max-w-sm ${
              notification.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-950/90 border-red-500/20 text-red-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-500" />
            )}
            <p className="text-[9px] uppercase font-bold tracking-wider leading-relaxed">
              {notification.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
