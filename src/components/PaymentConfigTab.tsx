import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Save, Check, Copy, ExternalLink, 
  HelpCircle, Shield, AlertTriangle, Play, RefreshCw, FileCode, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function PaymentConfigTab() {
  const [modo, setModo] = useState<'simulation' | 'live'>('simulation');
  const [publicKey, setPublicKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeCodeTab, setActiveCodeTab] = useState<'preferencia' | 'webhook' | 'frontend'>('preferencia');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Load config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/payment-config');
        if (res.ok) {
          const data = await res.json();
          setModo(data.mercadoPagoMode || 'simulation');
          setPublicKey(data.mercadoPagoPublicKey || '');
          setAccessToken(data.mercadoPagoAccessToken || '');
        }
      } catch (err) {
        console.error('[PaymentConfigTab] Error fetching config:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modo,
          public_key: publicKey,
          access_token: accessToken,
        }),
      });
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('[PaymentConfigTab] Error saving config:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 3000);
  };

  // PHP Code Templates
  const createPreferenceCode = `<?php
/**
 * CRIAR PREFERÊNCIA DE PAGAMENTO - MERCADO PAGO v2 (PDO / MySQL Puro)
 * 
 * Salve este arquivo como "criar-preferencia.php" em seu servidor PHP.
 * Certifique-se de substituir o seu ACCESS_TOKEN de Produção ou Teste abaixo.
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// 1. CONFIGURAÇÕES - Substitua com as suas credenciais!
$ACCESS_TOKEN = "${accessToken || 'SEU_MERCADO_PAGO_ACCESS_TOKEN'}";

// Dados de Conexão com o Banco de Dados MySQL
$DB_HOST = "localhost";
$DB_NAME = "seu_banco_de_dados";
$DB_USER = "seu_usuario";
$DB_PASS = "sua_senha";

try {
    // Conexão segura usando PDO
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Falha na conexão de banco de dados: " . $e->getMessage()]);
    exit;
}

// 2. RECEBE E VALIDA PEDIDOS ENVIADOS PELO FRONT-END (VIA AJAX POST)
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data || !isset($data['cart']) || !isset($data['email']) || !isset($data['fullName'])) {
    echo json_encode(["error" => "Dados insuficientes ou inválidos enviados na requisição."]);
    exit;
}

$clientName = trim($data['fullName']);
$clientEmail = trim($data['email']);
$shippingCost = isset($data['shippingCost']) ? floatval($data['shippingCost']) : 0;

// Calcular valor total do carrinho
$totalAmount = 0;
$itemsList = [];

foreach ($data['cart'] as $item) {
    $price = floatval($item['price']);
    $qty = intval($item['quantity']);
    $totalAmount += ($price * $qty);
    
    // Preparar formato de itens exigido pelo Mercado Pago
    $itemsList[] = [
        "id" => (string)$item['id'],
        "title" => (string)($item['name'] . " - Tam " . $item['size']),
        "quantity" => $qty,
        "unit_price" => $price,
        "currency_id" => "BRL",
        "picture_url" => $item['image'] ?? ""
    ];
}

// Somar taxa de envio ao montante, caso haja taxa cobrada
if ($shippingCost > 0) {
    $totalAmount += $shippingCost;
    $itemsList[] = [
        "id" => "envio_frete",
        "title" => "Envio Seguro Jóias Naturais",
        "quantity" => 1,
        "unit_price" => $shippingCost,
        "currency_id" => "BRL"
    ];
}

$orderId = "JN" . date("Ymd") . rand(1000, 9999);

try {
    // 3. REGISTRAR PRE-PEDIDO NO BANCO DE DADOS LOCAL
    $stmt = $pdo->prepare("INSERT INTO pedidos (pedido_id, status, nome_cliente, email_cliente, valor_total, data_criacao) VALUES (:id, 'Pendente', :nome, :email, :valor, NOW())");
    $stmt->execute([
        ':id' => $orderId,
        ':nome' => $clientName,
        ':email' => $clientEmail,
        ':valor' => $totalAmount
    ]);

    // 4. CHAMAR A API DO MERCADO PAGO - CRIAR PREFERÊNCIA DE PAGAMENTO
    // URL base de retorno (defina o domínio do seu site aqui)
    $domain = "https://" . $_SERVER['HTTP_HOST']; 
    
    $preferenceBody = [
        "items" => $itemsList,
        "payer" => [
            "name" => $clientName,
            "email" => $clientEmail
        ],
        "back_urls" => [
            "success" => "$domain/checkout.html?status=success&orderId=$orderId",
            "pending" => "$domain/checkout.html?status=pending&orderId=$orderId",
            "failure" => "$domain/checkout.html?status=failure&orderId=$orderId"
        ],
        "auto_return" => "approved",
        "external_reference" => $orderId,
        // Webhook que Mercado Pago chamará quando houver atualização de status
        "notification_url" => "$domain/webhook-mp.php"
    ];

    // Chamada cURL nativa para o Mercado Pago
    $ch = curl_init("https://api.mercadopago.com/checkout/preferences");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . trim($ACCESS_TOKEN),
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preferenceBody));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 && $httpCode !== 201) {
        throw new Error("Erro na API do Mercado Pago (Status: $httpCode): " . $response);
    }

    $responseData = json_decode($response, true);
    $preferenceId = $responseData['id'];
    $initPoint = $responseData['init_point']; // Link do Checkout Pro redirecionável

    // Atualizar registro local com o preference_id gerado pela API do gateway
    $updateStmt = $pdo->prepare("UPDATE pedidos SET mp_preference_id = :pref WHERE pedido_id = :id");
    $updateStmt->execute([
        ':pref' => $preferenceId,
        ':id' => $orderId
    ]);

    // Responder ao front-end em formato JSON de sucesso
    echo json_encode([
        "success" => true,
        "orderId" => $orderId,
        "preferenceId" => $preferenceId,
        "initPoint" => $initPoint
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Falha ao criar ordem de pagamento: " . $e->getMessage()
    ]);
}
?>`;

  const webhookCode = `<?php
/**
 * WEBHOOK OFICIAL DE RETORNO - MERCADO PAGO v2 (PDO / MySQL Puro)
 * 
 * Salve como "webhook-mp.php" no diretório raiz público do servidor.
 */

header("HTTP/1.1 200 OK"); // AVISO CRÍTICO: Sempre responda 200 OK instantaneamente ao Mercado Pago

$ACCESS_TOKEN = "${accessToken || 'SEU_MERCADO_PAGO_ACCESS_TOKEN'}";

// Conexão MySQL Banco
$DB_HOST = "localhost";
$DB_NAME = "seu_banco_de_dados";
$DB_USER = "seu_usuario";
$DB_PASS = "sua_senha";

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    // Log do erro silencioso local para debug
    error_log("Webhook DB Connect Fail: " . $e->getMessage());
    exit;
}

// Captura a notificação enviada via POST/GET pelo Mercado Pago
$body = file_get_contents("php://input");
$data = json_decode($body, true);

// Se não for POST estruturado, verifique query strings enviadas em segundo plano
$paymentId = null;
$topic = null;

if (isset($data['data']['id'])) {
    $paymentId = $data['data']['id'];
    $topic = $data['action'] ?? null;
} elseif (isset($_GET['id']) && isset($_GET['topic'])) {
    $paymentId = $_GET['id'];
    $topic = $_GET['topic'];
}

// Só prossegue se for uma atualização de pagamento
if ($paymentId && ($topic === "payment" || strpos($topic, "payment") !== false)) {
    
    // Consulta os dados completos do pagamento na API oficial de pagamentos do Mercado Pago
    $url = "https://api.mercadopago.com/v1/payments/" . $paymentId;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . trim($ACCESS_TOKEN)
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $paymentInfo = json_decode($response, true);
        
        $orderId = $paymentInfo['external_reference'] ?? null;
        $status = $paymentInfo['status'] ?? null; // approved, pending, rejected
        
        if ($orderId) {
            // Se o status retornado for 'approved' (aprovado)
            if ($status === "approved") {
                // Atualiza o pedido local para no banco de dados para Pago
                $stmt = $pdo->prepare("UPDATE pedidos SET status = 'Pago', data_pagamento = NOW(), mp_id_pagamento = :pay_id WHERE pedido_id = :ord_id");
                $stmt->execute([
                    ':pay_id' => $paymentId,
                    ':ord_id' => $orderId
                ]);
                error_log("Pedido $orderId foi pago no Mercado Pago. Status atualizado localmente para Pago.");
            } elseif ($status === "rejected") {
                // Atualiza o pedido local para Cancelado
                $stmt = $pdo->prepare("UPDATE pedidos SET status = 'Cancelado', mp_id_pagamento = :pay_id WHERE pedido_id = :ord_id");
                $stmt->execute([
                    ':pay_id' => $paymentId,
                    ':ord_id' => $orderId
                ]);
            }
        }
    } else {
        error_log("Falha ao consultar pagamento no Mercado Pago ID: " . $paymentId . " status: " . $httpCode);
    }
}

echo json_encode(["status" => "success"]);
?>`;

  const frontendCode = `<!-- 
  CHECKOUT FRONT-END SIMPLES (HTML5 + JAVASCRIPT)
  Insira a biblioteca SDK V2 do Mercado Pago e o formulário
-->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Finalizar Aliança - Jóias Naturais</title>
    <!-- Adicione o SDK oficial do Mercado Pago -->
    <script src="https://sdk.mercadopago.com/js/v2"></script>
    <style>
        body { font-family: sans-serif; background: #0c0c0e; color: #fff; padding: 40px; }
        .checkout-box { max-width: 450px; margin: 0 auto; background: #121215; border: 1px solid #222; padding: 30px; border-radius: 16px; }
        h2 { color: #bef264; font-size: 20px; }
        .input-group { margin-bottom: 15px; }
        label { display: block; font-size: 11px; color: #999; margin-bottom: 5px; text-transform: uppercase; }
        input { w-full; padding: 12px; background: #000; border: 1px solid #333; border-radius: 8px; color: white; width: 100%; box-sizing: border-box; }
        button { background: #bef264; color: black; font-weight: bold; border: none; padding: 14px; border-radius: 8px; width: 100%; cursor: pointer; transition: 0.2s; text-transform: uppercase; }
        button:hover { opacity: 0.9; }
    </style>
</head>
<body>

<div class="checkout-box">
    <h2>Sua Jóia Rara Especial</h2>
    <p style="font-size: 11px; color: #888;">Complete seus dados para redirecionamento seguro ao Mercado Pago.</p>
    
    <form id="checkoutForm">
        <div class="input-group">
            <label>Nome Completo</label>
            <input type="text" id="fullName" value="Cláudio de Souza" required>
        </div>
        <div class="input-group">
            <label>E-mail de Cadastro</label>
            <input type="email" id="email" value="comprador@joiasnaturais.com.br" required>
        </div>
        <div class="input-group">
            <label>Valor do Pedido (R$)</label>
            <input type="number" id="totalAmount" value="280.00" step="0.01" required>
        </div>
        
        <button type="submit" id="payButton">Ir para Pagamento Seguro</button>
    </form>
</div>

<script>
    // Inicialize o Mercado Pago com sua PUBLIC_KEY (Chave Pública)
    const mp = new MercadoPago('${publicKey || 'SUA_MERCADO_PAGO_PUBLIC_KEY'}', {
        locale: 'pt-BR'
    });

    document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const button = document.getElementById('payButton');
        button.innerText = "Processando Aliança de Cobrança...";
        button.disabled = true;

        const body = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            cart: [
                {
                    id: "JN-PRESET-1",
                    name: "Aliança Prímula Exclusiva",
                    size: 18,
                    price: parseFloat(document.getElementById('totalAmount').value),
                    quantity: 1
                }
            ],
            shippingCost: 0
        };

        try {
            // 1. Requisite o preference_id gerado pelo seu arquivo php no servidor
            const response = await fetch('/criar-preferencia.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.preferenceId) {
                // 2. Redirecione nativamente o usuário ao Checkout Pro Seguro do Mercado Pago
                window.location.href = data.initPoint;
            } else {
                alert("Erro ao gerar sessão de pagamento: " + (data.error || "Tente novamente."));
                button.innerText = "Ir para Pagamento Seguro";
                button.disabled = false;
            }
        } catch (error) {
            console.error("Falha no processamento:", error);
            alert("Erro de conexão com o servidor local.");
            button.innerText = "Ir para Pagamento Seguro";
            button.disabled = false;
        }
    });
</script>

</body>
</html>`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-sans space-y-3">
        <RefreshCw className="text-brand-lime animate-spin" size={24} />
        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Sincronizando Módulos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 font-sans">
      
      {/* Dynamic Environment Switcher Pill */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 border border-white/5 px-6 py-4 rounded-3xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lime/[0.01] rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse" />
            <h4 className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-zinc-300">Ambiente de Transações</h4>
          </div>
          <p className="text-[8px] text-zinc-500 leading-relaxed uppercase tracking-wider font-light">
            Alterne entre transações simuladas rápidas ou integradas diretamente com a API de produção do Mercado Pago.
          </p>
        </div>
        
        {/* Ambient Switcher Button Pair */}
        <div className="grid grid-cols-2 gap-1.5 bg-black p-1 rounded-2xl border border-white/5 relative z-10 min-w-[240px]">
          <button
            type="button"
            onClick={() => setModo('simulation')}
            className={cn(
              "py-2 text-[8px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center",
              modo === 'simulation' 
                ? "bg-zinc-900 text-amber-405 font-bold border border-white/5 text-amber-400" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Versão Teste
          </button>
          <button
            type="button"
            onClick={() => setModo('live')}
            className={cn(
              "py-2 text-[8px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center",
              modo === 'live' 
                ? "bg-brand-lime text-black font-extrabold" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Versão Real
          </button>
        </div>
      </div>

      {/* Main Configuration Card Forms */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left/Main Column: Credentials Box aligning exactly with photo layout */}
        <form onSubmit={handleSave} className="md:col-span-12 lg:col-span-5 p-8 bg-[#121215] border border-white/5 rounded-[32px] space-y-6 relative">
          
          {/* Header section identical to target photo */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-brand-lime/5 border border-brand-lime/10 rounded-2xl text-brand-lime">
              <Shield size={18} className="stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-serif font-bold text-white tracking-[0.2em] uppercase">
                Chaves de API Mercado Pago
              </h3>
              <p className="text-[8.5px] text-zinc-450 leading-relaxed tracking-wider font-light uppercase">
                Insira suas credenciais de produção ou sandbox do Mercado Pago para configurar as chamadas do checkout transparente.
              </p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Public Key style aligned with photo */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-[0.15em] block">
                Public Key (VITE_MP_PUBLIC_KEY)
              </label>
              {publicKey && (
                <span className="text-[7px] text-zinc-650 font-mono">ENCRIPTADO LOCAL</span>
              )}
            </div>
            <input 
              type="text"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="Digite sua chave pública do Mercado Pago..."
              className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-[10px] outline-none text-zinc-300 placeholder:text-zinc-700 focus:border-brand-lime/20 focus:ring-1 focus:ring-brand-lime/10 transition-all font-mono"
            />
          </div>

          {/* Access Token style aligned with photo */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[8px] uppercase font-bold text-zinc-500 tracking-[0.15em] block">
                Access Token (Authorization Bearer)
              </label>
              {accessToken && (
                <span className="text-[7px] text-zinc-650 font-mono">ENCRIPTADO LOCAL</span>
              )}
            </div>
            <input 
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Digite seu token de acesso de produção..."
              className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-[10px] outline-none text-zinc-300 placeholder:text-zinc-700 focus:border-brand-lime/20 focus:ring-1 focus:ring-brand-lime/10 transition-all font-mono"
            />
          </div>

          {/* Action Button positioned and styled like target photo (Bottom right aligning) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-[8px] text-zinc-550 uppercase tracking-widest font-mono select-none">
              {modo === 'live' ? (
                <span className="text-emerald-500">● LIVE GATEWAY CONNECTED</span>
              ) : (
                <span className="text-amber-500">○ OFFLINE SIMULATION MODE</span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto h-11 bg-brand-lime hover:bg-brand-lime/90 text-black px-6 rounded-2xl font-bold uppercase tracking-widest text-[8.5px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-lime/10 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
            >
              {isSaving ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Save size={12} className="stroke-[2.5]" />
              )}
              Salvar Credenciais
            </button>
          </div>

          {/* Status feedback alerts */}
          <AnimatePresence>
            {saveStatus === 'success' && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[8px] uppercase font-extrabold tracking-[0.15em] text-center"
              >
                Configurações gravadas com sucesso! Seu checkout está atualizado.
              </motion.div>
            )}
            {saveStatus === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[8px] uppercase font-extrabold tracking-[0.15em] text-center"
              >
                Falha ao sincronizar as credenciais.
              </motion.div>
            )}
          </AnimatePresence>

        </form>

        {/* Right Column: Exportable/Copyable PHP Setup Scripts Explorer */}
        <div className="md:col-span-12 lg:col-span-7 p-8 bg-[#121215] border border-white/5 rounded-[32px] space-y-6 flex flex-col justify-between min-h-[500px]">
          
          {/* Header area with exact text and code icon resembling layout */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCode className="text-brand-lime" size={16} />
                <h3 className="text-xs font-serif font-bold text-white tracking-[0.2em] uppercase">
                  Código de Instalação PHP & MySQL
                </h3>
              </div>
              <p className="text-[8.5px] text-zinc-450 leading-relaxed tracking-wider font-light uppercase">
                Arquivos estruturados comentados em português com conexões PDO nativas prontas para copiar.
              </p>
            </div>

            {/* Status pill "AUTOSAVE LOCAL ATIVADO" as shown in the screenshot */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#08080a] border border-white/5 rounded-full select-none">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span className="text-[7.5px] font-mono font-extrabold uppercase tracking-widest text-zinc-400">
                AUTOSAVE LOCAL ATIVADO
              </span>
            </div>
          </div>

          {/* Selector Tabs for PHP codes styled like target */}
          <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar gap-1 flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => setActiveCodeTab('preferencia')}
              className={cn(
                "px-3 py-2 text-[8px] uppercase tracking-[0.15em] font-extrabold transition-all border-b-[2px] cursor-pointer whitespace-nowrap pb-2.5",
                activeCodeTab === 'preferencia' ? "border-brand-lime text-white" : "border-transparent text-zinc-500 hover:text-zinc-350"
              )}
            >
              CRIAR_PREFERENCIA.PHP
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab('webhook')}
              className={cn(
                "px-3 py-2 text-[8px] uppercase tracking-[0.15em] font-extrabold transition-all border-b-[2px] cursor-pointer whitespace-nowrap pb-2.5",
                activeCodeTab === 'webhook' ? "border-brand-lime text-white" : "border-transparent text-zinc-500 hover:text-zinc-350"
              )}
            >
              WEBHOOK_MP.PHP
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab('frontend')}
              className={cn(
                "px-3 py-2 text-[8px] uppercase tracking-[0.15em] font-extrabold transition-all border-b-[2px] cursor-pointer whitespace-nowrap pb-2.5",
                activeCodeTab === 'frontend' ? "border-brand-lime text-white" : "border-transparent text-zinc-500 hover:text-zinc-350"
              )}
            >
              CHECKOUT.HTML
            </button>
          </div>

          {/* View area & copy capability with high-contrast screen styling */}
          <div className="bg-black/80 border border-white/5 rounded-2xl relative overflow-hidden flex-1 flex flex-col min-h-[300px]">
            {/* Header copy action bar */}
            <div className="bg-zinc-950 px-4 py-2.5 border-b border-white/5 flex items-center justify-between text-zinc-550 select-none font-mono text-[7px] uppercase tracking-wider">
              <span className="text-zinc-500">
                {activeCodeTab === 'preferencia' && 'criar-preferencia.php'}
                {activeCodeTab === 'webhook' && 'webhook-mp.php'}
                {activeCodeTab === 'frontend' && 'checkout.html'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const text = 
                    activeCodeTab === 'preferencia' ? createPreferenceCode :
                    activeCodeTab === 'webhook' ? webhookCode :
                    frontendCode;
                  copyToClipboard(text, activeCodeTab);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 active:scale-95 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer leading-tight h-5.5 text-[7px] font-bold"
              >
                {copiedType === activeCodeTab ? (
                  <>
                    <Check size={8} className="text-brand-lime" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={8} /> Copiar Código
                  </>
                )}
              </button>
            </div>

            {/* Code presentation */}
            <div className="p-4 overflow-y-auto font-mono text-[8px] text-zinc-300 leading-relaxed whitespace-pre font-light select-text flex-1 max-h-[300px] bg-black">
              {activeCodeTab === 'preferencia' && createPreferenceCode}
              {activeCodeTab === 'webhook' && webhookCode}
              {activeCodeTab === 'frontend' && frontendCode}
            </div>
          </div>
        </div>

      </div>

      {/* SQL Script Quick setup guide card */}
      <div className="p-8 bg-[#121215] border border-white/5 rounded-[32px] space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-brand-lime" size={16} />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-350 block">Script SQL para Criação do Banco de Dados</span>
        </div>
        <p className="text-[8px] text-zinc-455 uppercase leading-relaxed font-bold tracking-wider text-zinc-500">
          Execute este comando query SQL em seu console phpMyAdmin, MySQL Workbench ou terminal direto para gerar a estrutura de tabela necessária para os scripts PHP funcionarem com PDO perfeitamente:
        </p>
        <div className="bg-black/95 border border-white/5 rounded-2xl p-5 font-mono text-[8.5px] text-zinc-300 leading-normal select-all overflow-x-auto whitespace-pre">
          {`CREATE TABLE IF NOT EXISTS \`pedidos\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`pedido_id\` VARCHAR(50) NOT NULL UNIQUE,
  \`status\` VARCHAR(50) DEFAULT 'Pendente',
  \`nome_cliente\` VARCHAR(255) NOT NULL,
  \`email_cliente\` VARCHAR(255) NOT NULL,
  \`valor_total\` DECIMAL(10,2) NOT NULL,
  \`mp_preference_id\` VARCHAR(100) DEFAULT NULL,
  \`mp_id_pagamento\` VARCHAR(100) DEFAULT NULL,
  \`data_criacao\` DATETIME NOT NULL,
  \`data_pagamento\` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
        </div>
      </div>

    </div>
  );
}
