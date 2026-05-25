import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag,
  Package,
  Layers,
  Settings,
  Plus,
  MessageSquare,
  Check,
  X,
  Clock,
  Trash2,
  CheckCircle2,
  Star,
  Send,
  MessageCircle,
  Inbox,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  PlusCircle,
  Upload,
  ArrowLeft,
  ChevronRight,
  Filter,
  DollarSign,
  GripHorizontal,
  LayoutDashboard,
  Home,
  CreditCard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { PaymentConfigTab } from '../components/PaymentConfigTab';
import { GenerateSimulatorTab } from '../components/GenerateSimulatorTab';

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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

const stats = [
  { label: 'Vendas Mês', value: 'R$ 42.500', icon: TrendingUp, trend: '+12.5%' },
  { label: 'Novos Pedidos', value: '18', icon: ShoppingBag, trend: '+3' },
  { label: 'Visitantes', value: '1.240', icon: Users, trend: '+15%' },
];

interface MockOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  value: number;
  ringSpecs: {
    woodBase: string;
    core: string;
    stoneInlay: string;
    filigree: string;
    size: number;
    engraving: string;
  };
  address: string;
  trackingCode?: string;
}

const initialMockOrders: MockOrder[] = [];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    config, 
    approveEvaluation, 
    deleteEvaluation, 
    permanentlyDeleteEvaluation, 
    addEvaluation 
  } = useConfig();
  const { user: adminUser, logout, isAdmin } = useAuth();
  const { 
    activeChats, 
    activeChatMessages, 
    currentChatId, 
    setCurrentChatId, 
    sendMessage, 
    markAsRead, 
    deleteChatSession,
    loadingChats,
    chatError,
    clearChatError
  } = useChat();

  const evaluations = config.evaluations || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // States for dynamic tabs with click-and-drag reordering
  const [tabs, setTabs] = useState<string[]>(() => {
    const defaultTabs = ['dashboard', 'chat', 'pedidos', 'evaluacoes', 'pagamento', 'gerar_pagamento'];
    const saved = localStorage.getItem('admin_dashboard_tab_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t: string) => defaultTabs.includes(t));
          let updated = false;
          defaultTabs.forEach((tab) => {
            if (!filtered.includes(tab)) {
              filtered.push(tab);
              updated = true;
            }
          });
          if (updated) {
            localStorage.setItem('admin_dashboard_tab_order', JSON.stringify(filtered));
          }
          return filtered;
        }
      } catch (e) {}
    }
    return defaultTabs;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Custom states and refs for 3-second hold to reorder tabs
  const [dragEnabledTabId, setDragEnabledTabId] = useState<string | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const startPress = (e: React.PointerEvent, tabId: string) => {
    if (e.button !== 0) return; // Only trigger for primary clicks
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    
    isHoldingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        setDragEnabledTabId(tabId);
        if (navigator.vibrate) {
          navigator.vibrate(80);
        }
      }
    }, 3000); // exactly 3 seconds
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isHoldingRef.current || !touchStartPosRef.current) return;
    const dx = e.clientX - touchStartPosRef.current.x;
    const dy = e.clientY - touchStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Cancel the timer if the user moves their finger more than 10 pixels.
    // This allows fluid lateral scrolling without activating tab drag.
    if (distance > 10 && !dragEnabledTabId) {
      cancelPress();
    }
  };

  const cancelPress = () => {
    isHoldingRef.current = false;
    touchStartPosRef.current = null;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const endPress = () => {
    cancelPress();
  };

  const handleReorder = (newOrder: string[]) => {
    setTabs(newOrder);
    localStorage.setItem('admin_dashboard_tab_order', JSON.stringify(newOrder));
  };

  const TAB_METADATA: Record<string, { label: string; icon: any }> = {
    dashboard: { label: 'Métricas', icon: LayoutDashboard },
    chat: { label: 'Conversas', icon: MessageCircle },
    pedidos: { label: 'Pedidos', icon: ShoppingBag },
    evaluacoes: { label: 'Avaliações', icon: Star },
    pagamento: { label: 'Configuração MP', icon: Settings },
    gerar_pagamento: { label: 'Gerar MP (Teste)', icon: PlusCircle },
  };

  // -------------------------
  // STATS / CHAT PANEL LOCAL STATE
  // -------------------------
  const [adminReply, setAdminReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [attachingImage, setAttachingImage] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChatId) return;

    setAttachingImage(true);
    try {
      const compressedBase64 = await compressAndResizeImage(file);
      await sendMessage('', currentChatId, compressedBase64);
    } catch (err) {
      console.error("Failed to upload image from admin:", err);
    } finally {
      setAttachingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // -------------------------
  // MOCK ORDERS LOCAL STATE
  // -------------------------
  const [mockOrders, setMockOrders] = useState<MockOrder[]>(() => {
    const saved = localStorage.getItem('admin_mock_orders');
    const parsed = saved ? JSON.parse(saved) : initialMockOrders;
    return parsed.filter((o: any) => o.id !== '#INV-2041' && o.id !== '#INV-2042' && o.id !== '#INV-2043' && o.id !== '#INV-2044' && o.clientName !== 'Cliente Sacola');
  });

  // Web Push Subscription states
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState('');

  // Load orders from server dynamically on system boot
  useEffect(() => {
    const fetchServerOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const serverOrders = await response.json();
          if (serverOrders && Array.isArray(serverOrders)) {
            const cleanOrders = serverOrders.filter((o: any) => o.id !== '#INV-2041' && o.id !== '#INV-2042' && o.id !== '#INV-2043' && o.id !== '#INV-2044' && o.clientName !== 'Cliente Sacola');
            setMockOrders(cleanOrders);
            localStorage.setItem('admin_mock_orders', JSON.stringify(cleanOrders));
            console.log('[AdminDashboard] Synchronized order book with full-stack server state.');
          }
        }
      } catch (err) {
        console.error('[AdminDashboard] Failed to fetch server orders:', err);
      }
    };

    fetchServerOrders();

    // Check device notification capabilities
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotificationStatus('unsupported');
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationStatus('granted');
    } else if (Notification.permission === 'denied') {
      setNotificationStatus('denied');
    }
  }, []);

  const handleSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não oferece suporte a notificações em segundo plano.');
      return;
    }

    setIsSubscribingPush(true);
    setPushStatusMessage('Solicitando permissão do sistema...');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationStatus('denied');
        setPushStatusMessage('Permissão de notificações negada.');
        setIsSubscribingPush(false);
        return;
      }

      setPushStatusMessage('Instalando Service Worker de Alertas...');
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      
      setPushStatusMessage('Sintonizando canais seguros do navegador...');
      await new Promise<void>((resolve) => {
        if (reg.active) {
          resolve();
        } else {
          const interval = setInterval(() => {
            if (reg.active) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        }
      });

      setPushStatusMessage('Buscando chave pública criptográfica...');
      const keyResponse = await fetch('/api/notifications/vapid-key');
      if (!keyResponse.ok) throw new Error('Não foi possível obter a chave do servidor.');
      const { publicKey } = await keyResponse.json();

      setPushStatusMessage('Assinando o canal místico Web Push...');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      setPushStatusMessage('Registrando endereço deste dispositivo no servidor...');
      const subscribeResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: sub }),
      });

      if (subscribeResponse.ok) {
        setNotificationStatus('granted');
        setPushStatusMessage('Conectado à Central de Alertas do Ateliê com sucesso!');
      } else {
        throw new Error('Falha no registro do servidor.');
      }
    } catch (err: any) {
      console.error('Falha na inscrição Web Push:', err);
      setPushStatusMessage(`Erro: ${err.message || String(err)}`);
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const res = await fetch('/api/notifications/test-send', { method: 'POST' });
      if (res.ok) {
        setPushStatusMessage('Notificação de teste disparada! Verifique seu dispositivo.');
      } else {
        const data = await res.json();
        alert(data.error || 'Falha ao despachar notificação de teste.');
      }
    } catch (err) {
      console.error(err);
      alert('Contate o administrador secundário: servidor inalcançável.');
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pago' | 'Pendente' | 'Cancelado'>('Todos');
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  const saveOrders = (updated: MockOrder[]) => {
    setMockOrders(updated);
    localStorage.setItem('admin_mock_orders', JSON.stringify(updated));
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'Pago' | 'Pendente' | 'Cancelado') => {
    const updated = mockOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    saveOrders(updated);
    
    // Synchronize to fullstack backend status endpoint
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      console.log(`[AdminDashboard] Successfully synced order status ${newStatus} with server.`);
    } catch (err) {
      console.error('[AdminDashboard] Failed state sync with server status endpoint:', err);
    }

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const addOrderTracking = (orderId: string, code: string) => {
    const updated = mockOrders.map(order => 
      order.id === orderId ? { ...order, trackingCode: code } : order
    );
    saveOrders(updated);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, trackingCode: code } : null);
    }
  };

  const deleteOrder = (orderId: string) => {
    triggerConfirm(
      "Excluir Pedido",
      "Deseja mesmo remover permanentemente esse registro de pedido?",
      async () => {
        // Optimistically update local UI state
        const updated = mockOrders.filter(order => order.id !== orderId);
        saveOrders(updated);
        setSelectedOrder(null);

        // Delete permanently from server storage too
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
            method: 'DELETE'
          });
          if (!res.ok) {
            console.error('[AdminDashboard] Failed to delete order on server, response code:', res.status);
          }
        } catch (err) {
          console.error('[AdminDashboard] Network error trying to delete order from server:', err);
        }
      },
      "Confirmar Exclusão"
    );
  };

  const clearAllOrders = () => {
    triggerConfirm(
      "Limpar Todos os Pedidos",
      "Tem certeza que deseja apagar permanentemente TODOS os seus pedidos do painel de administração e do servidor de banco de dados?",
      async () => {
        // Clear local storage and state
        saveOrders([]);
        setSelectedOrder(null);
        
        // Permanent server wipe
        try {
          const res = await fetch('/api/admin/clear-all-orders', {
            method: 'POST'
          });
          if (!res.ok) {
            console.error('[AdminDashboard] Failed to clear all orders on server, response code:', res.status);
          }
        } catch (err) {
          console.error('[AdminDashboard] Network error trying to clear all orders on server:', err);
        }
      },
      "Confirmar Apagar Tudo"
    );
  };

  const filteredOrders = mockOrders.filter(order => {
    const matchSearch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.ringSpecs.woodBase.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // -------------------------
  // EVALUATIONS LOCAL STATES
  // -------------------------
  const [evaluationFilter, setEvaluationFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [isAddingEvaluation, setIsAddingEvaluation] = useState(false);
  const [newEvaluation, setNewEvaluation] = useState({
    clientName: '',
    rating: 5,
    comment: '',
    createdAt: new Date().toISOString().split('T')[0],
    imageUrl: '',
    status: 'approved' as 'approved' | 'pending',
  });

  const handleManualReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEvaluation(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateManualReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvaluation.clientName.trim() || !newEvaluation.comment.trim()) {
      alert('Por favor, preencha o nome do cliente e o comentário.');
      return;
    }

    const colors = [
      '#bef264', '#fde047', '#6ee7b7', '#93c5fd', '#fca5a5', 
      '#fda4af', '#fca5a5', '#bef264'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addEvaluation({
      id: 'eval_manual_' + Date.now().toString(),
      clientName: newEvaluation.clientName,
      rating: newEvaluation.rating,
      comment: newEvaluation.comment,
      imageUrl: newEvaluation.imageUrl || undefined,
      avatarColor: randomColor,
      createdAt: newEvaluation.createdAt || new Date().toISOString().split('T')[0],
      status: newEvaluation.status,
    });

    // Reset state
    setNewEvaluation({
      clientName: '',
      rating: 5,
      comment: '',
      createdAt: new Date().toISOString().split('T')[0],
      imageUrl: '',
      status: 'approved',
    });
    setIsAddingEvaluation(false);
  };

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar Exclusão',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirmar Exclusão') => {
    setConfirmModal({ isOpen: true, title, message, confirmText, onConfirm });
  };

  // Guard Dashboard to only real admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  // Mark chat as read when admin clicks/selects the chat session
  useEffect(() => {
    if (currentChatId) {
      markAsRead(currentChatId, 'admin');
    }
  }, [currentChatId, activeChatMessages]);

  // Scroll active chat panel to the bottom when new messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  const handleAdminLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChatId || !adminReply.trim() || replying) return;

    setReplying(true);
    try {
      await sendMessage(adminReply, currentChatId);
      setAdminReply('');
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setReplying(false);
    }
  };

  const selectedChat = activeChats.find(c => c.id === currentChatId);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans pb-24">
      
      {/* Admin Sidebar/Topnav */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-900/50 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-8 h-8 rounded-lg bg-brand-lime flex items-center justify-center text-black font-extrabold text-[11px] hover:scale-105 transition-transform">
             JN
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xs font-serif tracking-[0.2em] uppercase text-zinc-100">Painel Geral Administrativo</h1>
            <span className="text-[7px] text-brand-lime tracking-widest font-mono">WORKSPACE CENTRALIZADO</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest hidden lg:inline mr-2">
            Acesso: {adminUser?.email}
          </span>
          
          <Link 
            to="/admin/dashboard" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1c18] border border-white/5 text-brand-lime hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <span>Painel Geral</span>
          </Link>

          <Link 
            to="/admin/settings" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Ir para Configurações"
          >
            <span>Configurações</span>
          </Link>

          <Link 
            to="/" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Voltar para a tela inicial"
          >
            <Home size={11} className="text-zinc-400" />
            <span>Início</span>
          </Link>
        </div>
      </header>

      {/* Tabs segment */}
      <div className="fixed top-16 left-0 right-0 py-3 md:py-0 md:h-14 bg-zinc-950/80 border-b border-white/5 z-40 flex flex-col justify-center px-4">
        <div className="max-w-7xl mx-auto w-full">
          <Reorder.Group 
            axis="x" 
            values={tabs} 
            onReorder={handleReorder}
            className="flex flex-wrap md:flex-nowrap items-center gap-1.5 select-none w-full justify-start md:overflow-x-auto no-scrollbar"
          >
            {tabs.map((tabId) => {
              const tab = TAB_METADATA[tabId];
              if (!tab) return null;
              const isActive = activeTab === tabId;
              const isDraggable = dragEnabledTabId === tabId;
              return (
                <Reorder.Item
                  key={tabId}
                  value={tabId}
                  dragListener={isDraggable}
                  onDragEnd={() => setDragEnabledTabId(null)}
                  onPointerDown={(e) => startPress(e, tabId)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endPress}
                  onPointerCancel={endPress}
                  onPointerLeave={endPress}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[8px] xs:text-[9.5px] uppercase tracking-wider font-bold font-sans cursor-pointer flex items-center gap-1.5 border transition-all select-none whitespace-nowrap flex-shrink-0 touch-none",
                    isActive 
                      ? "bg-brand-lime text-black border-brand-lime glow-green font-extrabold" 
                      : "bg-zinc-900/40 text-zinc-400 border-white/5 hover:text-white hover:border-white/10",
                    isDraggable ? "scale-105 border-brand-lime bg-zinc-800 animate-pulse relative z-50 duration-75" : "active:scale-95"
                  )}
                  onClick={() => {
                    // Clicking on tab registers the view ONLY if not dragging
                    if (!isDraggable) {
                      setActiveTab(tabId);
                    }
                  }}
                >
                  <tab.icon size={11} className="flex-shrink-0" />
                  <span>{tab.label}</span>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>
      </div>

      <main className="flex-1 pt-44 md:pt-36 px-6 max-w-7xl mx-auto w-full space-y-10">
        
        {/* -------------------- 1. TAB: DASHBOARD / METRICS -------------------- */}
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="p-6 bg-zinc-900 border border-white/5 rounded-3xl flex items-center gap-6">
                  <div className="w-12 h-12 bg-black border border-brand-lime/20 rounded-2xl flex items-center justify-center text-brand-lime glow-green">
                     <stat.icon size={24} />
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                     <div className="flex items-baseline gap-2 mt-0.5">
                       <p className="text-2xl font-serif">{stat.value}</p>
                       <span className="text-[10px] text-brand-lime">{stat.trend}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Background Push Alerts configuration banner */}
            <div className="p-6 bg-zinc-950/60 border border-white/5 rounded-3xl space-y-4 max-w-4xl">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
                  </span>
                </div>
                <div>
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-100 font-mono">Alertas de Pedido em Segundo Plano (Web Push)</h3>
                  <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-mono">Status do dispositivo: 
                    <span className={cn(
                      "ml-1 font-bold",
                      notificationStatus === 'granted' ? "text-brand-lime" : notificationStatus === 'denied' ? "text-red-500" : "text-amber-400"
                    )}>
                      {notificationStatus === 'granted' && 'ATIVADO (RECEBENDO SMART ALERTAS)'}
                      {notificationStatus === 'denied' && 'BLOQUEADO (REQUER AUTORIZAÇÃO)'}
                      {notificationStatus === 'default' && 'PENDENTE (NÃO CONFIGURADO)'}
                      {notificationStatus === 'unsupported' && 'NÃO SUPORTADO PELO NAVEGADOR'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed">
                   O sistema do ateliê possui integração Web Push criptografada. Ativando o sensor abaixo, **mesmo que você feche esta aba ou desligue a tela do seu celular/computador**, você receberá alertas push em tempo real sempre que um cliente colocar alianças no carrinho e concluir o pagamento!
                </p>
                {pushStatusMessage && (
                  <p className="text-[9px] font-mono text-brand-lime bg-brand-lime/5 px-2.5 py-1.5 rounded-lg border border-brand-lime/10 inline-block animate-pulse">
                    ⚡ {pushStatusMessage}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {notificationStatus !== 'granted' && notificationStatus !== 'unsupported' && (
                  <button
                    onClick={handleSubscribePush}
                    disabled={isSubscribingPush}
                    className="px-5 py-3 bg-brand-lime hover:bg-brand-lime/90 text-black text-[9.5px] font-extrabold tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-brand-lime/10 disabled:opacity-40"
                  >
                    {isSubscribingPush ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Ativando Alertas...
                      </>
                    ) : (
                      'Autorizar Alertas Dispositivo'
                    )}
                  </button>
                )}
                
                {notificationStatus === 'granted' && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-bold text-brand-lime bg-brand-lime/10 border border-brand-lime/20 px-3 py-2 rounded-xl uppercase font-mono flex items-center gap-1.5">
                      ✓ Alertas Ativos e Pronto
                    </span>
                    <button
                      onClick={handleTestNotification}
                      className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-white/10 hover:text-white text-zinc-400 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Enviar Notificação de Teste
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* -------------------- 2. TAB: IMMERSIVE FULL SCREEN CHAT -------------------- */}
        {activeTab === 'chat' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col"
          >
            {/* Header for Full Screen Workspace */}
            <div className="h-16 px-6 border-b border-white/5 bg-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-lime flex items-center justify-center text-black font-extrabold text-[11px]">
                  JN
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-serif tracking-[0.15em] uppercase text-zinc-100 flex items-center gap-2">
                    Central de Atendimento Omnichannel
                    <span className="w-2 h-2 rounded-full bg-brand-lime animate-ping" />
                  </span>
                  <span className="text-[8px] text-zinc-400 font-mono">SUPORTE IMERSIVO EXCLUSIVO • DESKTOP FULL-SCREEN</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono font-bold bg-brand-lime/10 text-brand-lime px-3 py-1 rounded-full uppercase hidden sm:inline">
                   {activeChats.filter(chat => chat.unreadByAdmin).length} Mensagens Não Lidas
                </span>
                
                {/* Exit Full Screen Button / Sair Voltar */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white border border-white/5 rounded-xl text-[9px] uppercase tracking-widest font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                  title="Voltar para o Painel Geral"
                >
                  <X size={12} /> Sair do Chat
                </button>
              </div>
            </div>

            {/* Error alerts inside Full Screen Chat */}
            {chatError && (
              <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center justify-between gap-3 text-red-500 z-10">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <p className="text-[10px] font-mono tracking-wide">
                     {chatError.includes("permission-denied") || chatError.toLowerCase().includes("permission")
                        ? "Erro de Permissão (Firestore Rules): Entre em contato com o suporte para certificar as regras."
                        : chatError}
                  </p>
                </div>
                <button 
                  onClick={clearChatError} 
                  className="text-[9px] uppercase tracking-wider text-red-400/60 hover:text-red-500 font-bold transition-colors px-2.5 py-1 bg-white/5 rounded-md hover:bg-white/10"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Sub-container filling full screen */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden select-none">
              
              {/* Left Customer list panel */}
              <div className={cn(
                "lg:border-r border-white/5 flex flex-col bg-zinc-950/40 h-full overflow-y-auto w-full",
                currentChatId ? "hidden lg:flex" : "flex"
              )}>
                <div className="p-4 bg-zinc-900 border-b border-white/5 flex items-center justify-between text-[8px] text-zinc-500 font-mono tracking-widest">
                  <span>SESSÕES CLIENTES ATIVOS ({activeChats.length})</span>
                  <span className="text-[7px] text-brand-lime animate-pulse">SINC AUTO-LIVE</span>
                </div>

                {loadingChats ? (
                  <div className="p-16 text-center text-zinc-600 font-serif italic text-xs my-auto">
                     <Loader2 className="animate-spin text-brand-lime mx-auto mb-2" size={20} />
                     Carregando clientes no chat...
                  </div>
                ) : activeChats.length === 0 ? (
                  <div className="p-10 text-center space-y-4 my-auto">
                     <Inbox className="mx-auto text-zinc-700" size={32} />
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Fila de Atendimento Vazia</p>
                     <p className="text-[9px] text-zinc-650 italic max-w-[220px] mx-auto leading-relaxed">
                       Sessões aparecem aqui em tempo real quando visitantes mandam dúvidas na página de Contatos do site.
                     </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
                     {activeChats.map((chat) => {
                        const isSelected = chat.id === currentChatId;
                        return (
                           <button
                             key={chat.id}
                             onClick={() => setCurrentChatId(chat.id)}
                             className={cn(
                                "w-full p-5 text-left transition-all flex items-start gap-4 hover:bg-white/5 border-l-2 border-transparent",
                                isSelected ? "bg-zinc-900 border-brand-lime" : ""
                             )}
                           >
                              <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center font-bold text-xs border border-white/10 text-zinc-400 relative">
                                 {chat.userName.substring(0, 2).toUpperCase()}
                                 {chat.unreadByAdmin && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand-lime border-2 border-zinc-900 animate-bounce" />
                                 )}
                               </div>
                               <div className="flex-1 overflow-hidden">
                                  <div className="flex justify-between items-baseline">
                                     <p className="text-xs font-bold text-white uppercase truncate">{chat.userName}</p>
                                     <span className="text-[7.5px] text-zinc-600 font-mono">
                                        {new Date(chat.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                  </div>
                                  <p className="text-[9px] text-zinc-500 font-mono truncate mt-0.5">{chat.userEmail}</p>
                                  <p className="text-[10px] text-zinc-400 font-serif italic truncate mt-2 leading-relaxed">
                                     "{chat.lastMessage}"
                                  </p>
                               </div>
                           </button>
                        );
                     })}
                  </div>
                )}
              </div>

              {/* Chat Conversation & Reply column (Takes 2/3 space) */}
              <div className={cn(
                "lg:col-span-2 flex flex-col bg-black/40 h-full justify-between overflow-hidden relative w-full",
                currentChatId ? "flex" : "hidden lg:flex"
              )}>
                
                {selectedChat ? (
                  <>
                    {/* Active conversation banner */}
                    <div className="p-4 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <button
                            onClick={() => setCurrentChatId(null)}
                            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Voltar para a lista"
                          >
                             <ArrowLeft size={16} />
                          </button>
                          <div>
                             <p className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-2">
                               {selectedChat.userName}
                               <span className="w-2 h-2 rounded-full bg-emerald-500" />
                             </p>
                             <p className="text-[8px] text-zinc-500 font-mono mt-0.5">Sessão ID: {selectedChat.id} • Conexão: {selectedChat.userEmail}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                               triggerConfirm(
                                 "Encerrar Chat",
                                 "Encerrar este atendimento excluirá o histórico de chat local. Tem certeza?",
                                 () => {
                                   deleteChatSession(selectedChat.id);
                                 },
                                 "Encerrar Chat"
                               );
                            }}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl text-[9px] uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="Encerrar Conversa em definitivo"
                          >
                             <Trash2 size={11} /> Cancelar Sessão
                          </button>
                       </div>
                    </div>

                    {/* Infinite Scrolling Msg log */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-black/20 flex flex-col">
                       {activeChatMessages.map((msg) => {
                          const isMe = msg.senderRole === 'admin';
                          return (
                             <div 
                               key={msg.id} 
                               className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                             >
                                <span className="text-[7.5px] text-zinc-500 uppercase font-mono tracking-wider pb-1">
                                   {isMe ? 'Ateliê (Você)' : selectedChat.userName}
                                </span>
                                <div className={`p-4 rounded-[24px] text-xs leading-relaxed font-sans ${isMe ? 'bg-zinc-850 border border-white/5 text-zinc-300 rounded-tr-none shadow-xl' : 'bg-brand-lime text-black font-semibold rounded-tl-none'}`}>
                                   {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                   {msg.imageUrl && (
                                     <div className="mt-2 max-w-[280px] rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:opacity-95 transition-opacity" onClick={() => setActiveLightboxImage(msg.imageUrl)}>
                                       <img src={msg.imageUrl} alt="Anexo enviado" className="w-full h-auto object-cover max-h-[190px]" referrerPolicy="no-referrer" />
                                     </div>
                                   )}
                                </div>
                                <span className="text-[7px] text-zinc-600 font-mono pt-1">
                                   {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                          );
                       })}
                       <div ref={messagesEndRef} />
                    </div>

                    {/* Imagens modal zoom */}
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
                            alt="Zoom da Imagem enviada"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/5 select-none"
                            referrerPolicy="no-referrer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* CRM footer entry box */}
                    <div className="p-4 bg-zinc-900 border-t border-white/5 flex gap-2">
                       <input
                         type="file"
                         ref={fileInputRef}
                         onChange={handleAttachImage}
                         accept="image/*"
                         className="hidden"
                         id="fullscreen-chat-photo-input"
                       />
                       <button
                         type="button"
                         disabled={replying || attachingImage}
                         onClick={() => fileInputRef.current?.click()}
                         className="px-5 bg-zinc-800 border border-white/5 text-zinc-400 hover:text-brand-lime rounded-2xl flex items-center justify-center hover:bg-zinc-750 transition-all cursor-pointer disabled:opacity-45"
                         title="Anexar foto da joia"
                       >
                          {attachingImage ? <Loader2 size={16} className="animate-spin text-brand-lime" /> : <ImageIcon size={16} />}
                       </button>
                       <form onSubmit={handleSendReply} className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder={attachingImage ? "Enviando arquivo JPEG..." : `Escreva uma mensagem para ${selectedChat.userName}...`}
                            value={adminReply}
                            onChange={(e) => setAdminReply(e.target.value)}
                            disabled={replying || attachingImage}
                            className="flex-1 bg-zinc-950 border border-white/5 focus:border-brand-lime/20 rounded-2xl px-5 py-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:bg-zinc-950 transition-all disabled:opacity-50"
                          />
                          <button
                            type="submit"
                            disabled={!adminReply.trim() || replying || attachingImage}
                            className="px-6 bg-brand-lime text-black rounded-2xl flex items-center justify-center hover:bg-brand-lime/90 active:scale-95 duration-100 transition-all font-extrabold cursor-pointer disabled:opacity-40 shadow-lg shadow-brand-lime/10"
                          >
                             <Send size={15} />
                          </button>
                       </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                     <Inbox className="text-zinc-800" size={48} />
                     <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Nenhum cliente selecionado</p>
                     <p className="text-[10px] text-zinc-600 font-serif italic max-w-sm leading-relaxed">
                       Selecione qualquer uma das sessões de chat abertas na lista à esquerda para carregar o histórico de conversa imersivo e responder seu cliente de forma instantânea.
                     </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* -------------------- 3. TAB: PEDIDOS RECENTES -------------------- */}
        {activeTab === 'pedidos' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header info */}
            <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs uppercase tracking-[0.3em] font-extrabold text-zinc-400">Livro de Pedidos e Customizações</h2>
                <p className="text-[10px] text-zinc-500 font-light font-sans leading-relaxed">
                  Acompanhe as escolhas dos usuários no Criador de Alianças. Analise as especificações das camadas, pedras selecionadas, tamanhos e proceda com despache de joias.
                </p>
              </div>

              {mockOrders.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllOrders}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 text-[8px] uppercase tracking-widest font-extrabold rounded-xl border border-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 self-start sm:self-center"
                >
                  <Trash2 size={11} />
                  <span>Limpar Todos</span>
                </button>
              )}
            </div>

            {/* Filter and search bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:max-w-xs relative">
                <input 
                  type="text" 
                  placeholder="Pesquisar por cliente, pedido ou madeira..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/5 hover:border-white/10 focus:border-brand-lime/30 focus:outline-none rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {(['Todos', 'Pago', 'Pendente', 'Cancelado'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-4 py-2 text-[8px] uppercase tracking-widest font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap",
                      statusFilter === status 
                        ? "bg-brand-lime text-black border-brand-lime" 
                        : "bg-zinc-900 border-white/5 hover:border-white/10 text-zinc-400 hover:text-white"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout divided if an order is active */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Order Lists - left */}
              <div className={cn(
                "space-y-3",
                selectedOrder ? "lg:col-span-7" : "lg:col-span-12"
              )}>
                {filteredOrders.length === 0 ? (
                  <div className="p-16 text-center border border-white/5 bg-zinc-900/10 rounded-[32px] space-y-2">
                    <ShoppingBag size={24} className="text-zinc-700 mx-auto" />
                    <p className="text-xs font-serif italic text-zinc-550">Nenhum pedido atende aos filtros atuais.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={cn(
                        "w-full p-5 bg-zinc-900 border text-left rounded-3xl transition-all flex items-center justify-between hover:border-white/10 relative overflow-hidden",
                        selectedOrder?.id === order.id ? "border-brand-lime" : "border-white/5"
                      )}
                    >
                      {/* Clickable overlay for container selection */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="absolute inset-0 z-10 w-full h-full cursor-pointer bg-transparent focus:outline-none"
                      />

                      {/* Info - left */}
                      <div className="space-y-1 relative z-20 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-serif text-white uppercase tracking-wider">{order.id}</span>
                          <span className={cn(
                            "text-[6.5px] px-2 py-0.5 rounded-full font-mono font-bold uppercase",
                            order.status === 'Pago' 
                              ? "bg-brand-lime/10 text-brand-lime"
                              : order.status === 'Pendente'
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-red-500/10 text-red-500"
                          )}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans tracking-wide uppercase font-bold">{order.clientName}</p>
                        <p className="text-[9px] text-zinc-600 font-mono italic">{order.date} • Joia de {order.ringSpecs.woodBase}</p>
                      </div>

                      {/* Info - right */}
                      <div className="text-right space-y-1 relative z-20 flex flex-col items-end">
                        <p className="text-sm font-bold font-mono text-white pointer-events-none">R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className="flex items-center gap-2 justify-end pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-xl transition-all cursor-pointer relative z-30 flex items-center justify-center min-w-[32px] min-h-[32px] active:scale-95 touch-manipulation"
                            title="Excluir pedido"
                          >
                            <Trash2 size={14} className="pointer-events-none" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="text-[8px] text-brand-lime font-mono block hover:underline cursor-pointer relative z-30 focus:outline-none"
                          >
                            Ver especificações →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Specific Details Panel - right */}
              <AnimatePresence>
                {selectedOrder && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="lg:col-span-5 bg-zinc-900 border border-brand-lime/10 rounded-[32px] p-6 space-y-6 overflow-hidden relative"
                  >
                    {/* Header close */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h4 className="text-[10px] uppercase font-bold tracking-widest text-brand-lime">Customização no Ateliê</h4>
                        <p className="text-xs font-serif text-white">{selectedOrder.id}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedOrder(null)} 
                        className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Ring selected layers details lists */}
                    <div className="space-y-4">
                      <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest">MAPA DE CAMADAS DA ALIANÇA:</span>
                      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 font-mono text-[9.5px]">
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-zinc-500 uppercase">Madeira de Base:</span>
                          <span className="text-white text-right">{selectedOrder.ringSpecs.woodBase}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-zinc-500 uppercase">Núcleo Central:</span>
                          <span className="text-white text-right">{selectedOrder.ringSpecs.core}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-zinc-500 uppercase">Gema Incrustada:</span>
                          <span className="text-white text-right">{selectedOrder.ringSpecs.stoneInlay}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-zinc-500 uppercase">Filete Lateral:</span>
                          <span className="text-white text-right">{selectedOrder.ringSpecs.filigree}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-zinc-500 uppercase">Gravação Interna:</span>
                          <span className="text-white text-right font-serif italic">"{selectedOrder.ringSpecs.engraving}"</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 uppercase">Medida / Aro:</span>
                          <span className="text-brand-lime font-bold">Nº {selectedOrder.ringSpecs.size}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer details */}
                    <div className="space-y-2">
                      <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest">DADOS DE ENVIO:</span>
                      <div className="text-[10px] space-y-1">
                        <p className="text-white uppercase font-bold">{selectedOrder.clientName}</p>
                        <p className="text-zinc-400">{selectedOrder.clientEmail} • {selectedOrder.clientPhone}</p>
                        <p className="text-zinc-500 italic bg-black/10 p-3 rounded-xl border border-white/5 mt-1 leading-relaxed">
                          {selectedOrder.address}
                        </p>
                      </div>
                    </div>

                    {/* Shipments Info */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-baseline font-mono text-[10px]">
                        <span className="text-zinc-500">Valor Pago:</span>
                        <span className="text-white font-extrabold text-xs">R$ {selectedOrder.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {selectedOrder.trackingCode ? (
                        <div className="p-3 bg-brand-lime/5 border border-brand-lime/10 rounded-xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-mono">Código de Rastreamento:</span>
                            <span className="text-xs font-mono font-bold text-brand-lime">{selectedOrder.trackingCode}</span>
                          </div>
                          <span className="text-[8px] bg-brand-lime/15 text-brand-lime font-bold uppercase tracking-wider px-2 py-1 rounded">Despachado</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              const code = prompt("Digite o código de rastreamento dos Correios (ex: JN123456789BR):");
                              if (code?.trim()) {
                                addOrderTracking(selectedOrder.id, code.trim());
                              }
                            }}
                            className="w-full text-center py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-[9px] uppercase tracking-widest font-bold transition-all border border-white/5 cursor-pointer"
                          >
                            + Despachar & Adicionar Rastreio
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions bar for order statuses */}
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      {selectedOrder.status !== 'Pago' && (
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'Pago')}
                          className="flex-1 py-3 bg-brand-lime hover:opacity-90 text-black font-extrabold text-[8px] uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          Marcar como Pago
                        </button>
                      )}
                      <button
                        onClick={() => {
                          triggerConfirm(
                            "Cancelar Pedido",
                            "Tem certeza que deseja cancelar este pedido? O status dele será alterado para Cancelado.",
                            () => {
                              updateOrderStatus(selectedOrder.id, 'Cancelado');
                            },
                            "Confirmar Cancelamento"
                          );
                        }}
                        className="py-3 px-4 bg-red-500/10 hover:bg-red-500/15 text-red-500 font-bold text-[8px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => deleteOrder(selectedOrder.id)}
                        className="p-3 bg-zinc-950 border border-white/5 hover:border-red-550/20 text-zinc-500 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                        title="Deletar registro"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}

        {/* -------------------- 4. TAB: FULL EVALUATIONS MODERATION -------------------- */}
        {activeTab === 'evaluacoes' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8 pb-10"
          >
            {/* Header section identical to settings config style */}
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                   <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-400">Auditoria & Moderação de Avaliações</h3>
                   <p className="text-[10px] text-zinc-400 leading-relaxed font-sans font-light">
                      Gerencie os relatos enviados pelos clientes no site e decida quais serão exibidos publicamente no carrossel da página inicial, páginas de produto e "sobre nós".
                   </p>
                </div>
                <button
                   onClick={() => setIsAddingEvaluation(!isAddingEvaluation)}
                   className="px-4 py-2.5 bg-zinc-900 border border-white/10 hover:border-brand-lime/40 text-white hover:text-brand-lime rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap h-fit self-start sm:self-center focus:outline-none"
                >
                   {isAddingEvaluation ? <X size={12} /> : <PlusCircle size={12} />}
                   {isAddingEvaluation ? 'Cancelar' : 'Nova Avaliação Manual'}
                </button>
             </div>

             {/* Form block */}
             <AnimatePresence>
                {isAddingEvaluation && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateManualReview}
                    className="p-6 bg-zinc-950 border border-brand-lime/10 rounded-3xl space-y-5 overflow-hidden"
                  >
                     <div className="space-y-1">
                        <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-brand-lime">Inserir Depoimento Histórico</h4>
                        <p className="text-[9px] text-zinc-400">Preencha os dados abaixo e selecione a data em que o cliente fez o relato no outro canal.</p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Nome do Cliente</label>
                           <input 
                             type="text" 
                             required
                             placeholder="Ex: Joana Silva"
                             value={newEvaluation.clientName}
                             onChange={(e) => setNewEvaluation({ ...newEvaluation, clientName: e.target.value })}
                             className="w-full px-4 py-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-brand-lime/40 transition-colors"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Data do Depoimento</label>
                           <input 
                             type="date" 
                             required
                             placeholder="Selecione a data original"
                             value={newEvaluation.createdAt}
                             onChange={(e) => setNewEvaluation({ ...newEvaluation, createdAt: e.target.value })}
                             className="w-full px-4 py-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-brand-lime/40 transition-colors font-mono"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Avaliação (Estrelas)</label>
                           <div className="flex gap-2 items-center h-10">
                              {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                   key={star}
                                   type="button"
                                   onClick={() => setNewEvaluation({ ...newEvaluation, rating: star })}
                                   className="text-amber-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-none"
                                 >
                                    <Star 
                                      size={20} 
                                      className={cn(star <= newEvaluation.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700")} 
                                    />
                                 </button>
                              ))}
                              <span className="text-zinc-500 font-mono text-[11px] ml-2">({newEvaluation.rating} de 5)</span>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Status Inicial</label>
                           <div className="grid grid-cols-2 gap-2 h-10">
                              <button
                                type="button"
                                onClick={() => setNewEvaluation({ ...newEvaluation, status: 'approved' })}
                                className={cn(
                                  "rounded-xl font-bold uppercase tracking-widest text-[8px] transition-all border cursor-pointer",
                                  newEvaluation.status === 'approved' 
                                    ? "bg-brand-lime text-black border-brand-lime" 
                                    : "bg-zinc-900/40 text-zinc-400 border-white/5 hover:border-white/10"
                                )}
                              >
                                Ativo / Aprovado
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewEvaluation({ ...newEvaluation, status: 'pending' })}
                                className={cn(
                                  "rounded-xl font-bold uppercase tracking-widest text-[8px] transition-all border cursor-pointer",
                                  newEvaluation.status === 'pending' 
                                    ? "bg-amber-500 text-black border-amber-500" 
                                    : "bg-zinc-900/40 text-zinc-400 border-white/5 hover:border-white/10"
                                )}
                              >
                                Pendente Moderar
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Comentário / Relato</label>
                        <textarea 
                          required
                          rows={3}
                          placeholder="Digite ou cole aqui o depoimento do seu cliente..."
                          value={newEvaluation.comment}
                          onChange={(e) => setNewEvaluation({ ...newEvaluation, comment: e.target.value })}
                          className="w-full px-4 py-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-brand-lime/40 transition-colors resize-none font-serif italic"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Foto da Joia (Opcional)</label>
                        <div className="flex gap-4 items-center">
                           <input 
                             type="file" 
                             id="dashboard-eval-photo" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={handleManualReviewImageChange} 
                           />
                           <label 
                             htmlFor="dashboard-eval-photo" 
                             className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-white transition-all"
                           >
                              <Upload size={12} className="text-zinc-400" />
                              {newEvaluation.imageUrl ? "Alterar Imagem" : "Subir Foto"}
                           </label>
                           {newEvaluation.imageUrl && (
                              <div className="flex items-center gap-2">
                                 <img src={newEvaluation.imageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                 <button 
                                   type="button" 
                                   onClick={() => setNewEvaluation({ ...newEvaluation, imageUrl: '' })}
                                   className="p-1 hover:bg-white/5 rounded text-red-400 cursor-pointer"
                                 >
                                    <X size={12} />
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex justify-end gap-2 pt-2 border-t border-white/5 font-sans">
                        <button
                          type="button"
                          onClick={() => setIsAddingEvaluation(false)}
                          className="px-4 py-2 bg-transparent text-zinc-400 hover:text-white font-bold text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                           Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-brand-lime text-black font-extrabold text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-lime/10 cursor-pointer"
                        >
                           Salvar Avaliação
                        </button>
                     </div>
                  </motion.form>
                )}
             </AnimatePresence>

             {/* Stats Cards / Clickable list filters */}
             <div className="grid grid-cols-3 gap-4 font-sans">
                <button
                   onClick={() => setEvaluationFilter('all')}
                   className={cn(
                     "p-4 text-left border rounded-2xl transition-all cursor-pointer focus:outline-none",
                     evaluationFilter === 'all' 
                       ? "bg-brand-lime/[0.04] border-brand-lime ring-1 ring-brand-lime/20" 
                       : "bg-zinc-900/60 border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
                   )}
                >
                   <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Total Recebido</p>
                   <p className="text-xl font-serif text-white mt-1">{(config.evaluations || []).length}</p>
                   <div className="h-1 w-6 bg-white/20 rounded mt-2 opacity-50" style={{ backgroundColor: evaluationFilter === 'all' ? '#bef264' : 'transparent' }} />
                </button>
                <button
                   onClick={() => setEvaluationFilter('approved')}
                   className={cn(
                     "p-4 text-left border rounded-2xl transition-all cursor-pointer focus:outline-none",
                     evaluationFilter === 'approved' 
                       ? "bg-brand-lime/[0.04] border-brand-lime ring-1 ring-brand-lime/20" 
                       : "bg-zinc-900/60 border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
                   )}
                >
                   <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Aprovadas (Visíveis)</p>
                   <p className="text-xl font-serif text-brand-lime mt-1">{(config.evaluations || []).filter(e => e.status === 'approved').length}</p>
                   <div className="h-1 w-6 bg-brand-lime rounded mt-2" style={{ backgroundColor: evaluationFilter === 'approved' ? '#bef264' : 'transparent' }} />
                </button>
                <button
                   onClick={() => setEvaluationFilter('pending')}
                   className={cn(
                     "p-4 text-left border rounded-2xl transition-all cursor-pointer focus:outline-none",
                     evaluationFilter === 'pending' 
                       ? "bg-brand-lime/[0.04] border-brand-lime ring-1 ring-brand-lime/20" 
                       : "bg-zinc-900/60 border-white/5 hover:border-white/10 hover:bg-zinc-900/80"
                   )}
                >
                   <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">Pendentes</p>
                   <p className="text-xl font-mono text-amber-500 mt-1">{(config.evaluations || []).filter(e => e.status === 'pending').length}</p>
                   <div className="h-1 w-6 bg-amber-500 rounded mt-2" style={{ backgroundColor: evaluationFilter === 'pending' ? '#bef264' : 'transparent' }} />
                </button>
             </div>

             {/* Real reviews loop mapped directly from our config */}
             <div className="space-y-6">
                {(() => {
                  const filteredReviews = (config.evaluations || []).filter((review) => {
                    if (evaluationFilter === 'all') return true;
                    return review.status === evaluationFilter;
                  });

                  if (filteredReviews.length === 0) {
                    return (
                      <div className="p-12 text-center bg-zinc-900/10 border border-white/5 rounded-[32px] space-y-2">
                         <Star size={24} className="text-zinc-700 mx-auto" />
                         <p className="text-xs font-serif italic text-zinc-500">
                           {evaluationFilter === 'all' && "Nenhuma avaliação recebida ainda."}
                           {evaluationFilter === 'approved' && "Nenhuma avaliação aprovada e ativa no site."}
                           {evaluationFilter === 'pending' && "Nenhuma avaliação pendente para moderar."}
                         </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                       {filteredReviews.map((review) => {
                         const initials = review.clientName
                           ? review.clientName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                           : 'U';
                         return (
                           <div 
                             key={review.id} 
                             className={cn(
                               "p-6 bg-zinc-900 border rounded-3xl space-y-4 transition-all",
                               review.status === 'pending' 
                                 ? "border-amber-500/25 bg-amber-500/5" 
                                 : review.status === 'rejected'
                                   ? "border-red-500/10 bg-red-950/5 opacity-75"
                                   : "border-white/5"
                             )}
                           >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                 <div className="flex items-center gap-3">
                                    {review.imageUrl ? (
                                      <img 
                                        src={review.imageUrl} 
                                        alt={review.clientName} 
                                        className="w-12 h-12 rounded-full object-cover border border-white/10" 
                                        referrerPolicy="no-referrer" 
                                      />
                                    ) : (
                                      <div 
                                        style={{ backgroundColor: review.avatarColor || '#bef264' }} 
                                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs text-zinc-950 font-mono shadow-inner"
                                      >
                                         {initials}
                                      </div>
                                    )}
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <p className="text-xs uppercase font-extrabold tracking-wider text-white">{review.clientName}</p>
                                          <span className={cn(
                                            "text-[7px] px-2 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase",
                                            review.status === 'pending' 
                                              ? "bg-amber-500/10 text-amber-400" 
                                              : review.status === 'rejected'
                                                ? "bg-red-500/10 text-red-400"
                                                : "bg-brand-lime/10 text-brand-lime"
                                          )}>
                                             {review.status === 'pending' && 'Pendente'}
                                             {review.status === 'approved' && 'Ativa/Aprovada'}
                                             {review.status === 'rejected' && 'Excluída / Arquivada'}
                                          </span>
                                       </div>
                                       <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{review.createdAt}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                    {(review.status === 'pending' || review.status === 'rejected') && (
                                       <button
                                         onClick={() => approveEvaluation(review.id)}
                                         className="px-4 py-2 bg-brand-lime hover:scale-[1.02] active:scale-[0.98] text-black font-bold text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none"
                                       >
                                          <CheckCircle2 size={12} />
                                          {review.status === 'rejected' ? 'Restaurar & Publicar' : 'Aprovar & Publicar'}
                                       </button>
                                    )}
                                    {review.status !== 'rejected' ? (
                                       <button
                                         onClick={() => triggerConfirm(
                                           'Excluir / Arquivar Avaliação',
                                           `Deseja arquivar e não exibir o depoimento de "${review.clientName}" no site? Ele ainda constará em seus registros de auditoria total.`,
                                           () => deleteEvaluation(review.id)
                                         )}
                                         className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors cursor-pointer"
                                         title="Mover para Excluídas"
                                       >
                                          <Trash2 size={14} />
                                       </button>
                                    ) : (
                                       <button
                                         onClick={() => triggerConfirm(
                                           'Deletar Permanentemente',
                                           `Deseja apagar definitivamente e permanentemente o depoimento de "${review.clientName}"? Essa ação não poderá ser desfeita.`,
                                           () => permanentlyDeleteEvaluation(review.id)
                                         )}
                                         className="p-2.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                         title="Deletar Permanentemente"
                                       >
                                          <X size={14} />
                                       </button>
                                    )}
                                 </div>
                              </div>

                              {/* Ratings & comment lines */}
                              <div className="space-y-4">
                                 <div className="flex gap-0.5 text-amber-400 font-sans">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={12} 
                                        className={cn(i < review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-800")} 
                                      />
                                    ))}
                                 </div>
                                 <p className="text-xs font-serif italic text-zinc-300 leading-relaxed bg-black/15 p-4 rounded-xl border border-white/5">
                                   "{review.comment}"
                                 </p>
                                 {review.imageUrl && (
                                   <div className="mt-2">
                                     <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Foto enviada:</p>
                                     <img src={review.imageUrl} alt="Joia do Cliente" className="max-h-40 rounded-xl object-contain border border-white/5 bg-black/40 p-1" />
                                   </div>
                                 )}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  );
                })()}
             </div>
          </motion.div>
        )}

        {/* -------------------- 5. TAB: MERCADO PAGO INTEGRATION -------------------- */}
        {activeTab === 'pagamento' && (
          <PaymentConfigTab />
        )}

        {/* -------------------- 6. TAB: MERCADO PAGO SIMULATOR -------------------- */}
        {activeTab === 'gerar_pagamento' && (
          <GenerateSimulatorTab />
        )}

      </main>

      {/* Persistence tracker pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-full shadow-2xl z-[70]">
         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
         <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Auditoria & Atendimento Local Ativo</span>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl space-y-6"
             >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                   <AlertCircle className="text-red-500" size={32} />
                </div>
                <div className="text-center space-y-2">
                   <h3 className="text-lg font-serif text-white uppercase tracking-widest">{confirmModal.title}</h3>
                   <p className="text-xs text-zinc-500 leading-relaxed">{confirmModal.message}</p>
                </div>
                <div className="flex flex-col gap-3">
                   <button 
                     type="button"
                     onClick={() => {
                       confirmModal.onConfirm();
                       setConfirmModal(prev => ({ ...prev, isOpen: false }));
                     }}
                     className="w-full py-4 bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-650 transition-colors cursor-pointer"
                   >
                     Confirmar Exclusão
                   </button>
                   <button 
                     type="button"
                     onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                     className="w-full py-4 bg-white/5 text-zinc-400 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors cursor-pointer"
                   >
                     Cancelar
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
