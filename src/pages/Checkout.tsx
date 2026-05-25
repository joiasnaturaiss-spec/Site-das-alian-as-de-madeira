import { motion } from 'framer-motion';
import { Editable } from '../components/Editable';
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  Wallet, 
  ShoppingBag, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { isValidCPF, isValidLuhn, detectCardBrand } from '../lib/validation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Procedural SVG Pix QR Code for realistic, premium payment experience
const PixQrCode = () => (
  <svg width="160" height="160" viewBox="0 0 100 100" className="bg-white p-3 rounded-2xl mx-auto shadow-xl">
    {/* QR code corners (alignment squares) */}
    <rect x="5" y="5" width="25" height="25" fill="#000" />
    <rect x="10" y="10" width="15" height="15" fill="#fff" />
    <rect x="13" y="13" width="9" height="9" fill="#000" />

    <rect x="70" y="5" width="25" height="25" fill="#000" />
    <rect x="75" y="10" width="15" height="15" fill="#fff" />
    <rect x="78" y="13" width="9" height="9" fill="#000" />

    <rect x="5" y="70" width="25" height="25" fill="#000" />
    <rect x="10" y="75" width="15" height="15" fill="#fff" />
    <rect x="13" y="78" width="9" height="9" fill="#000" />

    {/* Some random QR noise blocks */}
    <rect x="35" y="5" width="10" height="5" fill="#000" />
    <rect x="50" y="15" width="5" height="15" fill="#000" />
    <rect x="60" y="5" width="5" height="5" fill="#000" />
    <rect x="35" y="25" width="15" height="10" fill="#000" />
    <rect x="55" y="25" width="10" height="5" fill="#000" />

    <rect x="35" y="45" width="30" height="10" fill="#000" />
    <rect x="5" y="35" width="5" height="15" fill="#000" />
    <rect x="15" y="40" width="15" height="5" fill="#000" />
    
    <rect x="75" y="35" width="10" height="15" fill="#000" />
    <rect x="70" y="55" width="15" height="5" fill="#000" />
    <rect x="85" y="60" width="10" height="20" fill="#000" />

    <rect x="35" y="70" width="15" height="15" fill="#000" />
    <rect x="55" y="70" width="10" height="5" fill="#000" />
    <rect x="55" y="80" width="10" height="15" fill="#000" />
    
    <rect x="35" y="90" width="25" height="5" fill="#000" />
    <rect x="70" y="90" width="10" height="5" fill="#000" />

    {/* Central PIX logo simulation in the brand color (#32bcad) */}
    <circle cx="50" cy="50" r="10" fill="#32bcad" />
    <path d="M47 50 L53 50 M50 47 L50 53" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Dynamic valid Pix EMV Code Generator with proper length metadata and CRC-16-CCITT checksum
const generatePixCode = (amount: number): string => {
  const formatField = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', 'joiasnaturaiss@gmail.com');
  const merchantAccount = formatField('26', merchantAccountInfo);
  
  const additionalData = formatField('05', '***');
  const transactionTemplates = formatField('62', additionalData);

  let payload = 
    formatField('00', '01') +
    merchantAccount +
    formatField('52', '0000') +
    formatField('53', '986');

  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  payload += 
    formatField('58', 'BR') +
    formatField('59', 'Joias Naturais') +
    formatField('60', 'Sao Paulo') +
    transactionTemplates +
    '6304';

  // Calculate CRC-16 CCITT (false)
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return `${payload}${crcHex}`;
};

const formatCountdown = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function Checkout() {
  const navigate = useNavigate();
  const { cart, cartCount, clearCart } = useCart();
  const { config } = useConfig();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | 'debit'>('credit');
  const [installments, setInstallments] = useState(1);
  const [pixCopied, setPixCopied] = useState(false);

  // Delivery details form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  
  // Card Details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  // Debit card details state
  const [debitNumber, setDebitNumber] = useState('');
  const [debitExpiry, setDebitExpiry] = useState('');
  const [debitCvv, setDebitCvv] = useState('');
  const [debitName, setDebitName] = useState('');
  const [selectedBank, setSelectedBank] = useState('nubank');

  // Input Formatting logic
  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const formatPhone = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  const formatCEP = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
  };

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, "");
    return clean.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatCardExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 2) return clean;
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  };

  // ViaCEP automatic Brazilian lookup
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          if (res.ok) {
            const data = await res.json();
            if (!data.erro) {
              setAddress(data.logradouro || "");
              setCity(data.localidade || "");
              setState(data.uf || "");
            }
          }
        } catch (err) {
          console.warn("Erro ao carregar endereço por CEP:", err);
        }
      };
      fetchAddress();
    }
  }, [cep]);

  // Validation Error state
  const [addressError, setAddressError] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = !!config.uiAssets.freeShippingPromoActive;
  const shippingCost = isFreeShipping ? 0 : 25;
  const total = subtotal + shippingCost;

  // Pix key copy function
  const handleCopyPixKey = () => {
    const pixKey = pixCode || generatePixCode(total);
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  // Form validations
  const validateAddressForm = () => {
    if (!fullName || !email || !cep || !address || !city || !state || !cpf || !phone) {
      setAddressError('Por favor, preencha todos os campos do endereço de entrega, CPF e Telefone de contato.');
      return false;
    }
    if (!email.includes('@')) {
      setAddressError('Por favor, insira um e-mail de contato válido.');
      return false;
    }
    if (!isValidCPF(cpf)) {
      setAddressError('CPF matematicamente inválido. Insira um CPF válido para prosseguir de forma segura.');
      return false;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setAddressError('Insira um telefone de contato celular válido incluindo DDD.');
      return false;
    }
    setAddressError('');
    return true;
  };

  const validatePaymentForm = () => {
    if (paymentMethod === 'credit') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        setPaymentError('Por favor, preencha todos os campos do cartão de crédito.');
        return false;
      }
      if (!isValidLuhn(cardNumber)) {
        setPaymentError('Cartão de Crédito matematicamente inválido (Verificação de algoritmo Luhn falhou).');
        return false;
      }
      const brand = detectCardBrand(cardNumber);
      if (brand === 'unknown') {
        setPaymentError('Bandeira de cartão de crédito não reconhecida ou não suportada.');
        return false;
      }
    } else if (paymentMethod === 'debit') {
      if (!debitNumber || !debitExpiry || !debitCvv || !debitName) {
        setPaymentError('Por favor, preencha todos os campos do cartão de débito.');
        return false;
      }
      if (!isValidLuhn(debitNumber)) {
        setPaymentError('Cartão de Débito matematicamente inválido (Algoritmo de Luhn falhou).');
        return false;
      }
    }
    setPaymentError('');
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateAddressForm()) {
        setStep(2);
      }
    }
  };

  // Save the state to clear the cart AFTER entering the success screen (so they still see what they ordered on success page, then clear)
  const [orderedItems, setOrderedItems] = useState<typeof cart>([]);
  const [orderedTotal, setOrderedTotal] = useState(0);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [externalPaymentStatus, setExternalPaymentStatus] = useState<string | null>(null);
  const [pixSimulatedPaymentStatus, setPixSimulatedPaymentStatus] = useState<'pending' | 'checking' | 'received' | 'processing'>('pending');
  const [pixCode, setPixCode] = useState<string>('');
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixQrUrl, setPixQrUrl] = useState<string | null>(null);
  const [isLoadingPix, setIsLoadingPix] = useState<boolean>(false);
  const [pixCountdown, setPixCountdown] = useState<number>(600); // 10 minutes (600 seconds)

  // Countdown timer for PIX payment
  useEffect(() => {
    if (step !== 2 || paymentMethod !== 'pix') return;
    const intervalId = setInterval(() => {
      setPixCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [step, paymentMethod]);

  // Reset payment session back to step 1 and discard old order ID
  const handleResetSession = () => {
    setStep(1);
    setCurrentOrderId(null);
    currentOrderIdRef.current = null;
    isCreatingPending.current = false;
    isMarkingPaid.current = false;
    localStorage.removeItem('checkout_current_order_id');
    // Clear card & payment forms
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setDebitNumber('');
    setDebitExpiry('');
    setDebitCvv('');
    setDebitName('');
    setPaymentError('');
    setAddressError('');
    setPixCountdown(600);
  };

  const [currentOrderId, setCurrentOrderId] = useState<string | null>(() => {
    return localStorage.getItem('checkout_current_order_id') || null;
  });

  const currentOrderIdRef = useRef<string | null>(localStorage.getItem('checkout_current_order_id') || null);
  const isCreatingPending = useRef(false);
  const isMarkingPaid = useRef(false);

  // Saves initial pending order to track cart abandonments and step 2 actions
  const createPendingOrder = (items: any[], amount: number, paymentMethodStr: string) => {
    const existingOrderId = currentOrderIdRef.current || currentOrderId || localStorage.getItem('checkout_current_order_id');
    const orderName = fullName || localStorage.getItem('last_order_fullName') || 'Cliente Geral';
    const orderEmail = email || localStorage.getItem('last_order_email') || 'cliente@joiasnaturaiss.com';
    const orderAddress = address || localStorage.getItem('last_order_address') || 'Av. das Alianças, 100';
    const orderCity = city || localStorage.getItem('last_order_city') || 'São Paulo';
    const orderState = state || localStorage.getItem('last_order_state') || 'SP';
    const orderCep = cep || localStorage.getItem('last_order_cep') || '01000-000';
    const orderPhone = phone || localStorage.getItem('last_order_phone') || '(11) 98888-7777';
    const orderCpf = cpf || localStorage.getItem('last_order_cpf') || '000.000.000-00';

    const now = new Date();
    const dateStr = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const firstItem = items[0] || {};
    
    let woodBase = 'Cabreúva Imperial';
    let core = 'Aço Inox Cirúrgico';
    let stoneInlay = 'Sem Gema (Clássica)';
    let filigree = 'Sem Filete (Minimalista)';

    if (firstItem.material) {
      const parts = firstItem.material.split('+').map((p: any) => p.trim());
      if (parts.length >= 4) {
        woodBase = parts[0];
        core = parts[1];
        stoneInlay = parts[2];
        filigree = parts[3];
      } else if (parts.length === 3) {
        woodBase = parts[0];
        core = parts[1];
        stoneInlay = parts[2];
        filigree = 'Sem Filete (Minimalista)';
      } else if (parts.length === 2) {
        woodBase = parts[0];
        core = parts[1];
        stoneInlay = 'Sem Gema (Clássica)';
        filigree = 'Sem Filete (Minimalista)';
      } else if (parts.length === 1) {
        woodBase = parts[0];
        core = 'Aço Inox Cirúrgico';
        stoneInlay = 'Sem Gema (Clássica)';
        filigree = 'Sem Filete (Minimalista)';
      }
    } else if (firstItem.name) {
      woodBase = firstItem.name.replace('Aliança ', '');
    }

    const ringSpecs = {
      woodBase: woodBase,
      core: core,
      stoneInlay: stoneInlay,
      filigree: filigree,
      size: firstItem.size || 20,
      engraving: 'Joias Naturais'
    };

    const syncWithBackend = async (targetId: string, name: string, mail: string) => {
      const finalName = name || 'Cliente Geral';
      const finalEmail = mail || 'comprador@joiasnaturais.com.br';
      try {
        await fetch('/api/orders/pending-cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cart: items,
            currentOrderId: targetId,
            email: finalEmail,
            fullName: finalName,
            shippingCost: shippingCost,
            total: amount,
            cpf: orderCpf,
            phone: orderPhone,
            paymentMethod: paymentMethodStr
          }),
        });
        console.log('[Checkout Sync] Successfully synchronized pending order to the server:', targetId);
      } catch (err) {
        console.error('[Checkout Sync Fail] Could not sync with server:', err);
      }
    };

    const syncWithFirestore = async (targetId: string, name: string, mail: string) => {
      try {
        const orderDocRef = doc(db, 'orders', targetId);
        await setDoc(orderDocRef, {
          id: targetId,
          clientName: name,
          clientEmail: mail,
          date: dateStr,
          status: 'Pendente',
          value: amount,
          address: `${orderAddress}, ${orderCity} - ${orderState}, CEP: ${orderCep}`,
          cpf: orderCpf
        });
        console.log('[Firestore Sync] Pending order successfully written to Firestore.');
      } catch (err) {
        console.warn('[Firestore Sync Fail] Could not save document to firestore collection.', err);
      }
    };

    if (existingOrderId) {
      // Update existing pending order in case the user went back and edited form values
      try {
        const saved = localStorage.getItem('admin_mock_orders');
        if (saved) {
          let currentOrders = JSON.parse(saved);
          const orderIndex = currentOrders.findIndex((o: any) => o.id === existingOrderId);
          if (orderIndex !== -1) {
            currentOrders[orderIndex].clientName = orderName;
            currentOrders[orderIndex].clientEmail = orderEmail;
            currentOrders[orderIndex].clientPhone = orderPhone;
            currentOrders[orderIndex].cpf = orderCpf;
            currentOrders[orderIndex].paymentMethod = paymentMethodStr;
            currentOrders[orderIndex].value = amount;
            currentOrders[orderIndex].address = `${orderAddress}, ${orderCity} - ${orderState}, ${orderCep}`;
            currentOrders[orderIndex].ringSpecs = ringSpecs;
            localStorage.setItem('admin_mock_orders', JSON.stringify(currentOrders));
            console.log("[Checkout createPendingOrder] Existing pending order updated:", existingOrderId);
          }
        }
        syncWithBackend(existingOrderId, orderName, orderEmail);
        syncWithFirestore(existingOrderId, orderName, orderEmail);
      } catch (e) {
        console.error("Failed to update pending order:", e);
      }
      return existingOrderId;
    }

    if (isCreatingPending.current) {
      return currentOrderIdRef.current || localStorage.getItem('checkout_current_order_id') || '';
    }
    isCreatingPending.current = true;

    const orderId = `#INV-${Math.floor(2050 + Math.random() * 8000)}`;
    currentOrderIdRef.current = orderId;
    setCurrentOrderId(orderId);
    localStorage.setItem('checkout_current_order_id', orderId);

    const newOrder = {
      id: orderId,
      clientName: orderName,
      clientEmail: orderEmail,
      clientPhone: orderPhone,
      cpf: orderCpf,
      paymentMethod: paymentMethodStr,
      date: dateStr,
      status: 'Pendente' as const,
      value: amount,
      ringSpecs: ringSpecs,
      address: `${orderAddress}, ${orderCity} - ${orderState}, ${orderCep}`
    };

    try {
      const saved = localStorage.getItem('admin_mock_orders');
      let currentOrders = [];
      if (saved) {
        currentOrders = JSON.parse(saved);
      }
      currentOrders.unshift(newOrder);
      localStorage.setItem('admin_mock_orders', JSON.stringify(currentOrders));
      console.log("[Checkout createPendingOrder] Fresh pending order created:", newOrder);
      syncWithBackend(orderId, orderName, orderEmail);
      syncWithFirestore(orderId, orderName, orderEmail);
      return orderId;
    } catch (e) {
      console.error("[Checkout createPendingOrder] Failed to save fresh pending order:", e);
      return orderId;
    }
  };

  const markCurrentOrderAsPaid = async (orderIdToPay?: string) => {
    const targetId = orderIdToPay || currentOrderId || localStorage.getItem('checkout_current_order_id');
    if (!targetId) {
      console.log("[Checkout markCurrentOrderAsPaid] No order ID to mark as paid");
      return;
    }

    const orderFullName = fullName || localStorage.getItem('last_order_fullName') || 'Cliente Joias Naturais';
    const orderEmail = email || localStorage.getItem('last_order_email') || 'comprador@joiasnaturais.com.br';
    const orderCep = cep || localStorage.getItem('last_order_cep') || '01000-000';
    const orderAddress = address || localStorage.getItem('last_order_address') || 'Av. das Alianças, 100';
    const orderCity = city || localStorage.getItem('last_order_city') || 'São Paulo';
    const orderState = state || localStorage.getItem('last_order_state') || 'SP';
    const orderPhone = phone || localStorage.getItem('last_order_phone') || '(11) 98888-7777';
    const orderCpf = cpf || localStorage.getItem('last_order_cpf') || '000.000.000-00';

    const firstItem = cart[0] || {};
    let woodBase = 'Cabreúva Imperial';
    let core = 'Aço Inox Cirúrgico';
    let stoneInlay = 'Sem Gema (Clássica)';
    let filigree = 'Sem Filete (Minimalista)';

    if (firstItem.material) {
      const parts = firstItem.material.split('+').map((p: any) => p.trim());
      if (parts.length >= 4) {
        woodBase = parts[0];
        core = parts[1];
        stoneInlay = parts[2];
        filigree = parts[3];
      } else if (parts.length === 3) {
        woodBase = parts[0];
        core = parts[1];
        stoneInlay = parts[2];
        filigree = 'Sem Filete (Minimalista)';
      } else if (parts.length === 2) {
        woodBase = parts[0];
        core = parts[1];
        stoneInlay = 'Sem Gema (Clássica)';
        filigree = 'Sem Filete (Minimalista)';
      }
    } else if (firstItem.name) {
      woodBase = firstItem.name.replace('Aliança ', '');
    }

    const ringSpecs = {
      woodBase: woodBase,
      core: core,
      stoneInlay: stoneInlay,
      filigree: filigree,
      size: firstItem.size || 20,
      engraving: 'Joias Naturais'
    };

    // Update state on fullstack backend and trigger Web Push!
    try {
      await fetch('/api/orders/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: targetId,
          fullName: orderFullName,
          email: orderEmail,
          phone: orderPhone,
          cpf: orderCpf,
          address: orderAddress,
          city: orderCity,
          state: orderState,
          cep: orderCep,
          paymentMethod: paymentMethod,
          cart,
          total
        }),
      });
      console.log('[Checkout markCurrentOrderAsPaid] Sent payment confirmation to backend server.');
    } catch (err) {
      console.error('[Checkout markCurrentOrderAsPaid] Failed server sync:', err);
    }

    // Sync with Firestore directly conforming to custom rules
    try {
      const ordRef = doc(db, 'orders', targetId);
      const now = new Date();
      const dateStr = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      await setDoc(ordRef, {
        id: targetId,
        clientName: orderFullName,
        clientEmail: orderEmail,
        date: dateStr,
        status: 'Pago',
        value: total,
        address: `${orderAddress}, ${orderCity} - ${orderState}, CEP: ${orderCep}`,
        cpf: orderCpf
      });
      console.log('[Firestore Sync] Transitioned status order to PAGO in Firestore collection.');
    } catch (err) {
      console.warn('[Firestore Sync Fail] Could not write Pago to Firestore.', err);
    }

    try {
      const saved = localStorage.getItem('admin_mock_orders');
      if (saved) {
        let currentOrders = JSON.parse(saved).filter((o: any) => o.id !== '#INV-2041' && o.id !== '#INV-2042' && o.id !== '#INV-2043' && o.id !== '#INV-2044' && o.clientName !== 'Cliente Sacola');
        const orderIndex = currentOrders.findIndex((o: any) => o.id === targetId);
        if (orderIndex !== -1) {
          currentOrders[orderIndex].status = 'Pago';
          currentOrders[orderIndex].cpf = orderCpf;
          currentOrders[orderIndex].clientPhone = orderPhone;
          currentOrders[orderIndex].paymentMethod = paymentMethod;
          localStorage.setItem('admin_mock_orders', JSON.stringify(currentOrders));
          console.log("[Checkout markCurrentOrderAsPaid] Order updated to Pago in admin dashboard:", targetId);
        } else {
          console.warn("[Checkout markCurrentOrderAsPaid] Order ID not found during pay action, making new order...", targetId);
        }
      }
      localStorage.setItem('last_order_recorded', 'true');
      localStorage.removeItem('checkout_current_order_id');
      setCurrentOrderId(null);
    } catch (e) {
      console.error("[Checkout markCurrentOrderAsPaid] Failed to transition to paid:", e);
    }
  };

  useEffect(() => {
    if (step === 2) {
      createPendingOrder(cart, total, paymentMethod);
    }
  }, [step, cart, total, paymentMethod]);

  useEffect(() => {
    const fetchPixDetails = async () => {
      const targetId = currentOrderId || localStorage.getItem('checkout_current_order_id');
      if (!targetId || paymentMethod !== 'pix' || step !== 2) return;

      setIsLoadingPix(true);
      try {
        const res = await fetch('/api/checkout/pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: targetId,
            email: email || localStorage.getItem('last_order_email'),
            fullName: fullName || localStorage.getItem('last_order_fullName'),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPixCode(data.qr_code);
            setPixQrBase64(data.qr_code_base64);
            setPixQrUrl(data.qr_code_url);
          }
        }
      } catch (err) {
        console.error("Failed to generate PIX", err);
      } finally {
        setIsLoadingPix(false);
      }
    };

    fetchPixDetails();
  }, [step, paymentMethod, currentOrderId, email, fullName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let isTransitioning = false;

    if (step === 2 && paymentMethod === 'pix') {
      setPixSimulatedPaymentStatus('pending');

      const checkPaymentStatus = async () => {
        const targetId = currentOrderId || localStorage.getItem('checkout_current_order_id');
        if (!targetId || isTransitioning) return;

        try {
          // Poll the real full-stack backend endpoint
          const res = await fetch(`/api/orders/status?orderId=${encodeURIComponent(targetId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'Pago' || data.status === 'Pago' || data.status === 'pago') {
              isTransitioning = true;
              if (interval) clearInterval(interval);

              // 1. Progress state to Checking/Verifying
              setPixSimulatedPaymentStatus('checking');

              // Inline firestore and local sync for PIX pay confirmation
              try {
                const docRef = doc(db, 'orders', targetId);
                const nowStr = `Hoje, às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                const orderName = fullName || localStorage.getItem('last_order_fullName') || 'Cliente Joias Naturais';
                const orderEmail = email || localStorage.getItem('last_order_email') || 'comprador@joiasnaturais.com.br';
                const orderAddress = address || localStorage.getItem('last_order_address') || 'Av. das Alianças, 100';
                const orderCity = city || localStorage.getItem('last_order_city') || 'São Paulo';
                const orderState = state || localStorage.getItem('last_order_state') || 'SP';
                const orderCep = cep || localStorage.getItem('last_order_cep') || '01000-000';
                const orderCpf = cpf || localStorage.getItem('last_order_cpf') || '000.000.000-00';
                const orderPhone = phone || localStorage.getItem('last_order_phone') || '(11) 98888-7777';

                setDoc(docRef, {
                  id: targetId,
                  clientName: orderName,
                  clientEmail: orderEmail,
                  date: nowStr,
                  status: 'Pago',
                  value: total,
                  address: `${orderAddress}, ${orderCity} - ${orderState}, CEP: ${orderCep}`,
                  cpf: orderCpf
                }).then(() => {
                  console.log('[Firestore Sync via Polling API] Confirmed status PAGO in Firestore.');
                }).catch((err) => {
                  console.warn('[Firestore Sync via Polling Fail] Promise rejection saving Pago:', err);
                });

                // Sync mock local storage dashboard
                const saved = localStorage.getItem('admin_mock_orders');
                if (saved) {
                  const currentOrders = JSON.parse(saved);
                  const orderIndex = currentOrders.findIndex((o: any) => o.id === targetId);
                  if (orderIndex !== -1) {
                    currentOrders[orderIndex].status = 'Pago';
                    currentOrders[orderIndex].cpf = orderCpf;
                    currentOrders[orderIndex].clientPhone = orderPhone;
                    currentOrders[orderIndex].paymentMethod = 'pix';
                    localStorage.setItem('admin_mock_orders', JSON.stringify(currentOrders));
                  }
                }
              } catch (fsErr) {
                console.warn('[Firestore Sync via Polling Fail] Could not save order as Pago:', fsErr);
              }

              // 2. Transition to Received after a smooth delay
              timer1 = setTimeout(() => {
                setPixSimulatedPaymentStatus('received');
              }, 1200);

              // 3. Finalize order and advance to Step 3 (Success Screen)
              timer2 = setTimeout(() => {
                setPixSimulatedPaymentStatus('processing');
                setOrderedItems([...cart]);
                setOrderedTotal(total);
                setStep(3);
                clearCart();
              }, 2600);
            }
          }
        } catch (e: any) {
          const errMsg = String(e?.message || e || "").toLowerCase();
          if (
            errMsg.includes("failed to fetch") || 
            errMsg.includes("networkerror") || 
            errMsg.includes("fetch") ||
            e?.name === "TypeError"
          ) {
            console.warn("[Checkout polling] Connection temporarily down or server is restarting. Retrying shortly...");
          } else {
            console.error("[Checkout polling] Error checking Order status:", e);
          }
        }
      };

      // Poll status every 1000ms to monitor real-time server changes automatically!
      interval = setInterval(checkPaymentStatus, 1000);
      
      // Also check immediately
      checkPaymentStatus();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
  }, [step, paymentMethod, currentOrderId, cart, total]);

  // Check URL query parameters for return status from Mercado Pago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status) {
      setExternalPaymentStatus(status);
      setStep(3);
      
      const savedTotal = localStorage.getItem('last_order_total');
      if (savedTotal) {
        setOrderedTotal(parseFloat(savedTotal));
      }
      const savedItems = localStorage.getItem('last_order_items');
      if (savedItems) {
        try {
          setOrderedItems(JSON.parse(savedItems));
        } catch (e) {
          console.error("Failed to parse saved items", e);
        }
      }
      
      // Clean up search query parameters so they don't get stuck on the success screen
      window.history.replaceState({}, document.title, window.location.pathname);
      clearCart();
    } else {
      // CLEAR the order recorded state on normal flow initialization
      localStorage.removeItem('last_order_recorded');
    }
  }, []);

  const handleConfirmPayment = async () => {
    if (!validatePaymentForm()) {
      return;
    }

    setIsLoadingPayment(true);
    setPaymentError('');

    try {
      // Save items and total in localStorage
      localStorage.setItem('last_order_total', String(total));
      localStorage.setItem('last_order_items', JSON.stringify(cart));
      
      // Save delivery details to localStorage
      localStorage.setItem('last_order_fullName', fullName);
      localStorage.setItem('last_order_email', email);
      localStorage.setItem('last_order_cep', cep);
      localStorage.setItem('last_order_address', address);
      localStorage.setItem('last_order_city', city);
      localStorage.setItem('last_order_state', state);

      // Clean, elegant local simulation: directly set step 3
      setOrderedItems([...cart]);
      setOrderedTotal(total);
      
      // Simulate a small transition delay for professional look and feel
      setTimeout(() => {
        setStep(3);
        setIsLoadingPayment(false);
      }, 800);
    } catch (error: any) {
      console.warn("Using offline simulation:", error);
      setOrderedItems([...cart]);
      setOrderedTotal(total);
      setStep(3);
      setIsLoadingPayment(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      if (isMarkingPaid.current) return;
      isMarkingPaid.current = true;

      // Record or finalize order as Paid when reaching Step 3
      if (localStorage.getItem('last_order_recorded') !== 'true') {
        localStorage.setItem('last_order_recorded', 'true');
        const orderItems = orderedItems.length > 0 ? orderedItems : cart;
        const orderTotal = orderedTotal > 0 ? orderedTotal : total;
        
        const existingId = currentOrderIdRef.current || localStorage.getItem('checkout_current_order_id');
        if (existingId) {
          markCurrentOrderAsPaid(existingId);
        } else {
          // Fallback: create pending order first, then mark as Paid immediately
          const newId = createPendingOrder(orderItems, orderTotal, paymentMethod);
          markCurrentOrderAsPaid(newId);
        }
      }
      clearCart();
    }
  }, [step]);

  // If cart is empty and we're not inside the success screen, and we didn't just return from Mercado Pago, redirect back to cart
  const hasStatusParam = new URLSearchParams(window.location.search).get('status');
  if (cart.length === 0 && step !== 3 && !hasStatusParam) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-24 min-h-[60vh] space-y-6">
        <AlertCircle size={44} className="text-zinc-600 animate-pulse" />
        <h2 className="text-xl font-serif text-white uppercase tracking-wider">Nenhum item no carrinho</h2>
        <p className="text-xs text-zinc-500 max-w-sm font-sans leading-relaxed">
          Sua sacola parece estar vazia para prosseguir ao pagamento.
        </p>
        <button 
          onClick={() => navigate('/catalogo')}
          className="py-4 px-8 bg-brand-lime text-black font-extrabold uppercase tracking-wider text-[10px] rounded-2xl hover:bg-white transition-all cursor-pointer font-sans"
        >
          Ver Catálogo
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 text-center max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-brand-lime rounded-full flex items-center justify-center glow-green shadow-xl shadow-brand-lime/20"
        >
          <CheckCircle2 size={40} className="text-black" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-3xl font-serif text-white uppercase tracking-tight">PEDIDO RECEBIDO!</h2>
          <p className="text-brand-lime text-[10px] sm:text-xs tracking-[0.2em] uppercase font-mono font-bold">
            Obrigado por apoiar a excelência artesanal brasileira.
          </p>
        </div>

        {/* Purchase Receipt Container */}
        <div className="w-full bg-zinc-950/60 border border-white/5 rounded-3xl p-6 text-left space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase">Resumo da Compra</h3>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 no-scrollbar">
            {orderedItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover bg-neutral-900 border border-white/5" />
                  <div>
                    <span className="text-white font-serif tracking-tight block uppercase">{item.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Size {item.size} • Qty {item.quantity}</span>
                  </div>
                </div>
                <span className="font-mono text-zinc-300 font-medium">
                  R$ {(item.price * item.quantity).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2.5 text-xs text-zinc-400 font-light">
            <div className="flex justify-between">
              <span>Forma de Pagamento:</span>
              <span className="font-bold text-white uppercase tracking-wider font-mono">
                {paymentMethod === 'credit' && 'Cartão de Crédito'}
                {paymentMethod === 'debit' && 'Cartão de Débito'}
                {paymentMethod === 'pix' && 'PIX instantâneo'}
              </span>
            </div>
            {paymentMethod === 'credit' && (
              <div className="flex justify-between">
                <span>Parcelamento:</span>
                <span className="font-bold text-white font-mono">{installments}x sem juros</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Entregar para:</span>
              <span className="text-white uppercase font-sans font-medium">{fullName}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-3 text-sm font-bold text-white">
              <span>Total Pago:</span>
              <span className="text-brand-lime font-serif">R$ {orderedTotal.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-500 max-w-sm leading-relaxed uppercase tracking-wider font-sans">
          Você receberá as atualizações da produção manual no seu e-mail <span className="text-white font-semibold">{email}</span>. O código de envio será gerado no encerramento da joia.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="px-10 py-4.5 bg-brand-lime text-black text-[10px] font-extrabold tracking-[0.3em] rounded-2xl hover:bg-white scale-100 hover:scale-105 transition-all shadow-xl shadow-brand-lime/10 cursor-pointer font-sans"
        >
          CONFIRMAR E RETORNAR
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full px-4 sm:px-6 py-8 pb-24 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="text-zinc-500 hover:text-white p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="space-y-0.5">
          <Editable id="checkout-title" type="text" className="text-4xl font-serif text-brand-lime uppercase tracking-tight">
            CHECKOUT
          </Editable>
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Finalização segura da sua encomenda</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="flex gap-3 mb-12">
        <div className="flex-1 flex flex-col gap-2">
          <div className={`h-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-brand-lime glow-green' : 'bg-zinc-800'}`} />
          <span className={`text-[8.5px] uppercase tracking-wider font-bold ${step === 1 ? 'text-brand-lime' : 'text-zinc-500'}`}>1. Envio</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className={`h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-brand-lime glow-green' : 'bg-zinc-800'}`} />
          <span className={`text-[8.5px] uppercase tracking-wider font-bold ${step === 2 ? 'text-brand-lime' : 'text-zinc-500'}`}>2. Pagamento</span>
        </div>
      </div>

      {/* Main Grid: Forms Left, Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Body section */}
        <div className="lg:col-span-7">
          {step === 1 && (
            <motion.div 
              initial={{ x: 10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              className="space-y-6"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Truck className="text-brand-lime shrink-0" size={18} />
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest font-mono">Endereço de Entrega</h3>
              </div>

              {addressError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{addressError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">Nome Completo</label>
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="NOME COMPLETO DO DESTINATÁRIO" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors uppercase" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">E-mail para Atualizações</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EX: CONTATO@EXEMPLO.COM.BR" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">Telefone Celular (com DDD)</label>
                  <input 
                    type="text"
                    maxLength={15}
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors font-mono" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">CPF do Comprador (Seguro Anti-Fraude)</label>
                  <input 
                    type="text"
                    maxLength={14}
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors font-mono" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">CEP (Consulta Automática)</label>
                  <input 
                    type="text"
                    maxLength={9}
                    value={cep}
                    onChange={(e) => setCep(formatCEP(e.target.value))}
                    placeholder="01001-000" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors font-mono" 
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">Endereço Completo</label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="RUA, NÚMERO, APTO/BLOCO" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors uppercase" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">Cidade</label>
                  <input 
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="CIDADE" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors uppercase" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono">Estado</label>
                  <input 
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="EX: SP" 
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-600 outline-none focus:border-brand-lime/40 transition-colors uppercase" 
                  />
                </div>
              </div>

              <button 
                onClick={handleNextStep}
                className="w-full py-5 bg-brand-lime text-black font-extrabold uppercase tracking-[0.4em] text-[10px] rounded-2xl flex items-center justify-center gap-3 glow-green duration-200 cursor-pointer shadow-xl shadow-brand-lime/10"
              >
                PROSSEGUIR PARA O PAGAMENTO
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ x: 10, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              className="space-y-8"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Wallet className="text-brand-lime shrink-0" size={18} />
                <h3 className="text-xs uppercase font-extrabold text-white tracking-widest font-mono">Forma de Pagamento</h3>
              </div>

              {paymentError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* HIGH ACCESS PAYMENT QUICK SELECTION TABS */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-950/60 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('credit'); setPaymentError(''); }}
                  className={`py-3.5 px-2 rounded-xl text-[9px] uppercase tracking-wider font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'credit' 
                      ? 'bg-brand-lime text-black font-extrabold shadow-lg shadow-brand-lime/5' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <CreditCard size={15} />
                  Crédito
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('pix'); setPaymentError(''); }}
                  className={`py-3.5 px-2 rounded-xl text-[9px] uppercase tracking-wider font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'pix' 
                      ? 'bg-brand-lime text-black font-extrabold shadow-lg shadow-brand-lime/5' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <QrCode size={15} />
                  PIX Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('debit'); setPaymentError(''); }}
                  className={`py-3.5 px-2 rounded-xl text-[9px] uppercase tracking-wider font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'debit' 
                      ? 'bg-brand-lime text-black font-extrabold shadow-lg shadow-brand-lime/5' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Wallet size={15} />
                  Débito
                </button>
              </div>

              {/* DYNAMIC FORMS BASED ON METHOD */}
              {paymentMethod === 'credit' && (
                <div className="space-y-4">
                  <div className="p-5 border border-white/5 bg-zinc-950/40 rounded-3xl space-y-4">
                    <div className="space-y-1.5 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">Número do Cartão de Crédito</label>
                        {cardNumber.length >= 4 && (
                          <span className="text-[8.5px] uppercase font-mono tracking-wider font-extrabold text-brand-lime bg-zinc-900 border border-white/5 px-2.5 py-0.5 rounded-md">
                            Bandeira: {detectCardBrand(cardNumber)}
                          </span>
                        )}
                      </div>
                      <input 
                        type="text"
                        maxLength={19}
                        placeholder="0000 0000 0000 0000" 
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-widest placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 focus:bg-zinc-900/80 transition-all font-mono" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">Validade</label>
                        <input 
                          type="text"
                          maxLength={5}
                          placeholder="MM/AA" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                          className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-widest placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 transition-all font-mono" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">CVV (Código Traseiro)</label>
                        <input 
                          type="text"
                          maxLength={4}
                          placeholder="EX: 123" 
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-widest placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 transition-all font-mono" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">Nome Gravado no Cartão</label>
                      <input 
                        type="text"
                        placeholder="NOME IGUAL GRÁFICO" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 transition-all uppercase" 
                      />
                    </div>

                    {/* Installments Option Selector */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono block">Parcelamento Sem Juros</label>
                      <select 
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full bg-zinc-900 text-zinc-200 text-xs font-semibold font-sans border border-white/5 rounded-xl px-4 py-3.5 focus:border-brand-lime/40 outline-none cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((installment) => (
                          <option key={installment} value={installment}>
                            {installment}x de R$ {((total) / installment).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'pix' && (
                <div className="space-y-5 p-6 border border-white/5 bg-zinc-950/40 rounded-3xl text-center">
                  <div className="space-y-2">
                    <h4 className="text-sm font-serif text-white uppercase tracking-tight">PAGUE DE FORMA IMEDIATA COM PIX</h4>
                    <p className="text-[10px] text-zinc-400 font-sans max-w-sm mx-auto leading-relaxed">
                      Escaneie o código com seu celular ou copie a linha digitável abaixo. O pedido começará a produção do ateliê na confirmação imediata.
                    </p>
                  </div>

                  {/* Visual Countdown Timer expiration header */}
                  <div className="max-w-sm mx-auto p-4.5 bg-zinc-900 border border-white/5 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
                      <span className="text-zinc-400 flex items-center gap-1.5 font-semibold">
                        <span className={`w-2 h-2 rounded-full ${pixCountdown > 0 ? 'bg-brand-lime animate-pulse' : 'bg-red-500'}`}></span>
                        O CÓDIGO EXPIRA EM:
                      </span>
                      <span className={`font-extrabold ${pixCountdown <= 60 ? 'text-red-500 animate-pulse' : 'text-brand-lime glow-green'}`}>
                        {pixCountdown > 0 ? formatCountdown(pixCountdown) : 'EXPIRADO'}
                      </span>
                    </div>

                    {/* Progress indicator bar */}
                    <div className="h-1.5 bg-zinc-950/60 rounded-full overflow-hidden w-full relative">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${
                          pixCountdown <= 60 
                            ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse' 
                            : 'bg-gradient-to-r from-brand-lime to-emerald-400'
                        }`}
                        style={{ width: `${(pixCountdown / 600) * 100}%` }}
                      ></div>
                    </div>

                    {pixCountdown === 0 && (
                      <p className="text-[8.5px] text-red-400 font-sans leading-relaxed pt-1 select-none">
                        Este código expirou de forma segura. Utilize o botão inferior "Resetar Sessão" para iniciar um novo ciclo de cobrança.
                      </p>
                    )}
                  </div>

                  {/* QR Code Presentation */}
                  <div className="py-2">
                    {pixCountdown === 0 ? (
                      <div className="w-40 h-40 bg-zinc-900 border border-red-505/10 rounded-2xl mx-auto flex flex-col items-center justify-center p-3 text-center space-y-1.5 shadow-xl">
                        <AlertCircle className="text-red-500" size={24} />
                        <span className="text-[9px] text-red-400 font-mono font-bold uppercase tracking-wider">CÓDIGO EXPIRADO</span>
                        <span className="text-[8.5px] text-zinc-500 font-sans leading-tight">Reinicie a sessão para obter um novo código.</span>
                      </div>
                    ) : isLoadingPix ? (
                      <div className="w-40 h-40 bg-zinc-900 border border-white/5 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
                        <RefreshCw className="text-brand-lime animate-spin" size={24} />
                      </div>
                    ) : pixQrBase64 ? (
                      <img src={`data:image/png;base64,${pixQrBase64}`} className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto shadow-xl" alt="QR Code PIX" />
                    ) : pixQrUrl ? (
                      <img src={pixQrUrl} className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto shadow-xl" referrerPolicy="no-referrer" alt="QR Code PIX" />
                    ) : (
                      <PixQrCode />
                    )}
                  </div>

                  {/* Dynamic Automated Verification Status (Real-time Simulation) */}
                  <div className="max-w-sm mx-auto p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-500">Status da Transação</span>
                      <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800/80 text-brand-lime uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
                        </span>
                        Tempo Real
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                      {pixSimulatedPaymentStatus === 'pending' && (
                        <>
                          <RefreshCw className="text-zinc-400 animate-spin shrink-0" size={16} />
                          <div className="text-left leading-tight">
                            <p className="text-[9.5px] text-white font-bold font-mono uppercase">AGUARDANDO PAGAMENTO</p>
                            <p className="text-[8.5px] text-zinc-500 font-sans mt-0.5">Gere a transferência pelo app do seu banco...</p>
                          </div>
                        </>
                      )}
                      {pixSimulatedPaymentStatus === 'checking' && (
                        <>
                          <RefreshCw className="text-brand-lime animate-spin shrink-0" size={16} />
                          <div className="text-left leading-tight">
                            <p className="text-[9.5px] text-brand-lime font-bold font-mono uppercase">CONCILIANDO TRANSAÇÃO</p>
                            <p className="text-[8.5px] text-zinc-400 font-sans mt-0.5">Aguardando confirmação de recepção do Banco Central...</p>
                          </div>
                        </>
                      )}
                      {pixSimulatedPaymentStatus === 'received' && (
                        <>
                          <Check className="text-brand-lime shrink-0" size={16} />
                          <div className="text-left leading-tight">
                            <p className="text-[9.5px] text-brand-lime font-bold font-mono uppercase">PIX CONFIRMADO!</p>
                            <p className="text-[8.5px] text-zinc-300 font-sans mt-0.5 font-medium">Valor recebido com sucesso de forma integrada.</p>
                          </div>
                        </>
                      )}
                      {pixSimulatedPaymentStatus === 'processing' && (
                        <>
                          <RefreshCw className="text-white animate-spin shrink-0" size={16} />
                          <div className="text-left leading-tight">
                            <p className="text-[9.5px] text-white font-bold font-mono uppercase">ESTABELECENDO PEDIDO</p>
                            <p className="text-[8.5px] text-zinc-400 font-sans mt-0.5">Gravando o pedido automaticamente no painel administrativo...</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <p className="text-[8px] text-zinc-500 font-sans leading-none">
                      O sistema sincroniza com o banco sem necessidade de cliques.
                    </p>
                  </div>

                  {/* Sandbox de Recebimento Bancário (Simulador de Webhook) */}
                  <div className="max-w-sm mx-auto p-4 border border-emerald-500/30 bg-emerald-950/15 rounded-2xl space-y-2.5 text-left">
                    <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider font-extrabold text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Simulador de Webhook do Banco (Área de Testes)
                    </div>
                    <p className="text-[8.5px] text-zinc-400 font-sans leading-relaxed">
                      Para fins de testes e homologação de faturamento automático integrado, clique no botão abaixo para simular que o banco recebeu o pagamento de Pix e notificou a retaguarda do e-commerce automaticamente:
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        const targetId = currentOrderId || localStorage.getItem('checkout_current_order_id');
                        if (targetId) {
                          try {
                            const saved = localStorage.getItem('admin_mock_orders');
                            if (saved) {
                              let currentOrders = JSON.parse(saved);
                              const orderIndex = currentOrders.findIndex((o: any) => o.id === targetId);
                              if (orderIndex !== -1) {
                                currentOrders[orderIndex].status = 'Pago';
                                localStorage.setItem('admin_mock_orders', JSON.stringify(currentOrders));
                              }
                            }

                            // Post directly to our backend webhook route with the simulated payload!
                            await fetch('/api/webhook/pagamentos', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                action: 'payment.updated',
                                id: '123456789_simulated',
                                data: { id: '123456789_simulated' },
                                simulated_order_id: targetId,
                                simulated_status: 'approved',
                              }),
                            });
                            console.log("[Simulator Sandbox] Dispatched simulated webhook successfully to /api/webhook/pagamentos");
                          } catch (err) {
                            console.error("Erro ao simular faturamento bancario:", err);
                          }
                        }
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                    >
                      SIMULAR CONFIRMAÇÃO DO BANCO (PIX PAGO)
                    </button>
                    <p className="text-[7.5px] text-zinc-500 font-sans leading-none text-center">
                      Ou você pode ir ao Painel Administrativo em outra aba e pagar o pedido #{currentOrderId || 'Pendente'}.
                    </p>
                  </div>

                  {/* "Copia e Cola" key input group with active copy confirmation */}
                  <div className="space-y-2 max-w-sm mx-auto">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-600 tracking-widest block">PIX Copia e Cola</span>
                    <div className="flex bg-zinc-900 border border-white/5 rounded-xl overflow-hidden p-1">
                      <input 
                        readOnly 
                        value={pixCode || generatePixCode(total)} 
                        className="flex-1 bg-transparent border-none text-[9.5px] font-mono font-light text-zinc-500 px-3 outline-none select-all truncate" 
                      />
                      <button 
                        type="button"
                        onClick={handleCopyPixKey}
                        className="bg-brand-lime hover:bg-white text-black text-[9px] font-extrabold uppercase px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 font-sans"
                      >
                        {pixCopied ? <Check size={11} className="text-black" /> : <Copy size={11} className="text-black" />}
                        {pixCopied ? 'COPIADO' : 'COPIAR'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'debit' && (
                <div className="space-y-4">
                  <div className="p-5 border border-white/5 bg-zinc-950/40 rounded-3xl space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">Selecione seu Banco Emissor</label>
                      <select 
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-zinc-900 text-zinc-200 text-xs font-semibold font-sans border border-white/5 rounded-xl px-4 py-3.5 focus:border-brand-lime/40 outline-none cursor-pointer"
                      >
                        <option value="nubank">NUBANK</option>
                        <option value="itau">ITAÚ UNIBANCO</option>
                        <option value="bradesco">BRADESCO</option>
                        <option value="santander">SANTANDER BRASIL</option>
                        <option value="bb">BANCO DO BRASIL</option>
                        <option value="caixa">CAIXA ECONÔMICA FEDERAL</option>
                        <option value="inter">BANCO INTER</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">Número do Cartão de Débito</label>
                      <input 
                        type="text"
                        maxLength={19}
                        placeholder="0000 0000 0000 0000" 
                        value={debitNumber}
                        onChange={(e) => setDebitNumber(formatCardNumber(e.target.value))}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-widest placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 transition-all font-mono" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">Validade</label>
                        <input 
                          type="text"
                          maxLength={5}
                          placeholder="MM/AA" 
                          value={debitExpiry}
                          onChange={(e) => setDebitExpiry(formatCardExpiry(e.target.value))}
                          className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-widest placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 transition-all font-mono" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">CVV</label>
                        <input 
                          type="text"
                          maxLength={4}
                          placeholder="EX: 123" 
                          value={debitCvv}
                          onChange={(e) => setDebitCvv(e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-widest placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 transition-all font-mono" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono">Nome do Titular do Cartão</label>
                      <input 
                        type="text"
                        placeholder="NOME COMPLETO" 
                        value={debitName}
                        onChange={(e) => setDebitName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white tracking-wider placeholder:text-zinc-700 outline-none focus:border-brand-lime/40 transition-all uppercase" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => setStep(1)}
                    disabled={isLoadingPayment}
                    className="flex-1 sm:flex-initial px-5 py-5 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest rounded-2xl disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetSession}
                    disabled={isLoadingPayment}
                    className="flex-1 sm:flex-initial px-4 py-5 bg-red-950/20 border border-red-500/10 hover:bg-red-950/45 hover:border-red-500/20 text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest rounded-2xl disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Reiniciar os dados e criar uma nova cobrança limpa"
                  >
                    <RefreshCw size={11} className="shrink-0" />
                    Resetar Sessão
                  </button>
                </div>
                <button 
                  onClick={handleConfirmPayment}
                  disabled={isLoadingPayment || paymentMethod === 'pix'}
                  className={`flex-1 py-5 text-black font-extrabold uppercase tracking-[.4em] text-[10px] rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all ${
                    paymentMethod === 'pix'
                      ? 'bg-zinc-800/80 text-zinc-500 font-semibold cursor-not-allowed border border-white/5 shadow-none'
                      : 'bg-brand-lime glow-green shadow-brand-lime/10 hover:bg-brand-lime/95'
                  }`}
                >
                  {isLoadingPayment ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-black" />
                      PROCESSANDO COBRANÇA...
                    </span>
                  ) : paymentMethod === 'pix' ? (
                    pixSimulatedPaymentStatus === 'pending' ? (
                      <span className="flex items-center gap-2 text-zinc-500">
                        <RefreshCw size={11} className="animate-spin text-zinc-600" />
                        AGUARDANDO RECEBIMENTO NO BANCO...
                      </span>
                    ) : pixSimulatedPaymentStatus === 'checking' ? (
                      <span className="flex items-center gap-2 text-brand-lime">
                        <RefreshCw size={11} className="animate-spin text-brand-lime" />
                        SISTEMA CONCILIANDO PIX...
                      </span>
                    ) : pixSimulatedPaymentStatus === 'received' ? (
                      <span className="flex items-center gap-2 text-brand-lime font-extrabold">
                        <Check size={11} className="text-brand-lime font-extrabold" />
                        PAGAMENTO DETECTADO DE FORMA INTEGRADA!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-white">
                        <RefreshCw size={11} className="animate-spin text-white" />
                        CADASTRANDO SEU PEDIDO...
                      </span>
                    )
                  ) : (
                    'FINALIZAR E PAGAR'
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-2.5 text-zinc-600 text-[8.5px] uppercase tracking-widest font-mono">
                <ShieldCheck size={14} className="text-zinc-500" />
                <span>Transação Segura SSL 256-bit certificada por e-Finanças</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Fixed Order Summary Side-Panel (Integrated with Cart Context) */}
        <div className="lg:col-span-5">
          <div className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl space-y-5 sticky top-28">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-300 pb-2 border-b border-white/5 font-mono">
              Sua Compra
            </h3>

            {/* Micro List of Selected rings */}
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/5">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-white font-serif tracking-tight block uppercase text-[11px] leading-tight max-w-[140px] truncate">{item.name}</span>
                      <span className="text-[8.5px] text-zinc-500 font-mono">Aro {item.size} • Qtd {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-mono text-zinc-300">
                    R$ {(item.price * item.quantity).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>

            {/* Breakdown lines */}
            <div className="space-y-2.5 pt-3 border-t border-white/5 text-[11px] text-zinc-400 font-sans">
              <div className="flex justify-between">
                <span>Produtos ({cartCount} {cartCount === 1 ? 'aliança' : 'alianças'}):</span>
                <span className="text-white font-mono">R$ {subtotal.toLocaleString('pt-BR')}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                {isFreeShipping ? (
                  <span className="text-brand-lime font-extrabold uppercase tracking-wide">GRÁTIS</span>
                ) : (
                  <span className="text-white font-mono">R$ {shippingCost.toLocaleString('pt-BR')},00</span>
                )}
              </div>
              
              <div className="pt-3.5 border-t border-white/5 flex justify-between items-end">
                <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">Total Geral</span>
                <div className="text-right">
                  <span className="text-xl font-serif text-brand-lime font-bold">
                    R$ {total.toLocaleString('pt-BR')}
                  </span>
                  <span className="block text-[7.5px] text-zinc-500 uppercase tracking-wider font-mono mt-0.5">
                    ou até 12x de R$ {(total / 12).toFixed(2).replace('.', ',')} sem juros
                  </span>
                </div>
              </div>
            </div>

            {/* Brand benefits badge */}
            <div className="pt-2 flex flex-col gap-1.5 text-[8px] text-zinc-500 uppercase tracking-widest leading-relaxed font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck size={11} className="text-brand-lime/80" />
                <span>Garantia Vitalícia & Ajuste de Aro Grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={11} className="text-brand-lime/80 animate-spin-slow" />
                <span>Madeiras Nobres de Descarte Certificado</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
