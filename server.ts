import express from "express";
import path from "path";
import fs from "fs";
import webpush from "web-push";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini client lazily to avoid startup crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper for smart local fallback generation if API is rate-limited or fails
function getLocalFallbackSymbolism(name: string): string {
  const normalized = name.toLowerCase();

  // Woods / Madeiras (Deeply spiritual, sentimental, esoteric)
  if (normalized.includes("canela")) {
    return "Consagrada pelo fogo do afeto e do magnetismo místico, a Canela atua como um escudo espiritual protetor. Suas vibrações despertam o calor da paixão, a cura de laços antigos e a prosperidade mística, unindo o casal sob o aroma eterno da paixão sagrada.";
  }
  if (normalized.includes("jacarandá") || normalized.includes("jacaranda")) {
    return "Soberano dos templos invisíveis da floresta, o Jacarandá conecta a alma aos mistérios mais antigos da sabedoria oculta. É a madeira da elevação espiritual definitiva e da fidelidade eterna, ancorando sentimentos nobres que transcendem o próprio tempo.";
  }
  if (normalized.includes("imbuia")) {
    return "Portadora das memórias profundas da Mãe Terra, a Imbuia pulsa com a energia do acolhimento cósmico e do equilíbrio absoluto. Suas marcas sagradas simbolizam as raízes invisíveis que sustentam o amor maduro, oferecendo proteção e estabilidade espiritual aos corações.";
  }
  if (normalized.includes("madeira") || normalized.includes("cedro") || normalized.includes("eucalipto") || normalized.includes("pinus") || normalized.includes("marfim")) {
    return `Canalizadora das forças vivas da Criação, a nobre madeira de ${name} atua como um amuleto viva de resiliência e renascimento. Ela carrega a essência espiritual do sopro divina das florestas, entrelaçando a vida do casal com o vigor, o crescimento mútuo e a proteção dos anjos da guarda.`;
  }

  // Minerals / Stones
  if (normalized.includes("esmeralda")) {
    return "Radiante com o raio verde da cura divina, a Esmeralda abre o Portal do Chakra Cardíaco para acolher o amor incondicional. Símbolo esotérico do renascimento e do fluxo de abundância espiritual, ela eterniza promessas, atraindo fidelidade, rejuvenescimento e comunhão de almas.";
  }
  if (normalized.includes("ametista")) {
    return "A pedra sagrada da transmutação espiritual e do raio violeta. A Ametista eleva a vibração do casal ao plano sutil, blindando sua união contra energias densas, pacificando a mente divina e abrindo portais de intuição espiritual pura e serenidade mística.";
  }
  if (normalized.includes("quartzo") || normalized.includes("cristal")) {
    return `Puro condutor de luz cósmica divina; o ${name} purifica a aura e amplifica as intenções mais sinceras da alma. Esotericamente, ele age como um cristal de sintonização vibracional elevada, registrando e irradiando o amor mais puro e a união imaculada do casal.`;
  }
  if (normalized.includes("pirita")) {
    return "O espelho sagrado da alma e do Sol, a Pirita irradia a energia dourada da prosperidade cósmica, da autoconfiança de fogo e do alinhamento divino. Ela atrai sorte, desbloqueia caminhos e fortifica a coragem mística para vencer qualquer desafio da existência terrena.";
  }
  if (normalized.includes("pedra da lua")) {
    return "Uma gema impregnada de magia celular e fluidos lunares. A Pedra da Lua sintoniza os corações às marés de intuição feminina, sensitividade profunda e novos recomeços sagrados, abençoando o amor com a energia receptiva da Deusa Divina.";
  }
  if (normalized.includes("pedra") || normalized.includes("cristal") || normalized.includes("gema") || normalized.includes("topázio") || normalized.includes("rubi") || normalized.includes("jaspe") || normalized.includes("ágata")) {
    return `Cristalização sagrada da própria paciência cósmica da Terra, a gema de ${name} age como um centro gerador de harmonia espiritual e ancoramento cósmico. Ela conecta os amantes com a magia oculta dos minerais, selando o destino em uma jura de persistência e amor indestrutível.`;
  }

  // Metals
  if (normalized.includes("ouro")) {
    return "Condutor alquímico do grande sopro solar, o Ouro Puro simboliza a iluminação divina, a indestrutibilidade da alma e a chama eterna da sabedoria. Ele coroa a união sagrada com a energia da perfeição mística superior, atração ilimitada de bênçãos e riqueza.";
  }
  if (normalized.includes("prata")) {
    return "Espelho místico das marés e da intuição intuitiva lunar, a Prata capta e reflete as frequências mais sutis do inconsciente emocional. É um metal de purificação fluida e blindagem espiritual, acolhendo os amantes sob a suave luz d'alma de proteção mística.";
  }
  if (normalized.includes("metal") || normalized.includes("cobre") || normalized.includes("bronze") || normalized.includes("aço") || normalized.includes("platina")) {
    return `Altar de união de antigos segredos materiais, o elemento metálico de ${name} representa o fogo sagrado da alquimia evolutiva. Ele confere blindagem espiritual inquebrável, firmeza moral mística e purifica as energias diárias que cercam o templo vivo que é a sua joia.`;
  }

  // Default elegant fallback if no keyword matches
  return `Elemento vivo carimbado pelas energias mais nobres do Cosmo, as forças místicas resididas em '${name}' servem como um elo etéreo entre os planos invisíveis e os seus sentimentos mais sagrados, projetando harmonia cósmica absoluta e magnetismo divino sobre sua união.`;
}

// API endpoint to fetch texture / material symbolism using Gemini with Search Grounding
app.post("/api/gemini/symbolism", async (req, res) => {
  const { name, image } = req.body;
  if (!name && !image) {
    return res.status(400).json({ error: "Missing material/texture name or image" });
  }

  // If the Gemini API key is missing, fall back quietly to preserve UX
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallbackName = name || "Material Natural";
    const customSymbolism = getLocalFallbackSymbolism(fallbackName);
    return res.json({
      symbolism: `-----------------------------------\n\nMATERIAL IDENTIFICADO:\n${fallbackName}\n\nSIMBOLISMO:\n${customSymbolism}\n\nVERSÃO CURTA:\n“Um elo de amor e conexão com a força nobre da natureza.”\n\n-----------------------------------`,
      identifiedName: fallbackName,
      pureSymbolism: customSymbolism,
      sources: [],
      info: "No GEMINI_API_KEY configured. Used high-quality local fallback symbolism."
    });
  }

  try {
    const ai = getAiClient();
    let text = "";
    let sources: any[] = [];

    if (image) {
      // Formato multimodal para identificar imagem de textura
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      let mimeType = "image/png";
      const match = image.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const prompt = `Você é um especialista em gemas, pedras, metais nobres, resinas e madeiras exóticas para uma marca de biojoias artesanais de luxo natural altamente exclusiva.
Analise visualmente a imagem deste material que foi enviada.
Identifique com precisão o material presente na imagem (por exemplo, se é uma madeira Roxinho, madeira Canela, Malaquita, Turquesa, Filete de Ouro, etc. Caso o nome sugerido seja "${name || ''}", use essa dica para guiar sua identificação).

Após identificar, gere uma descrição de simbolismo emocional premium para ele.
Por favor, escreva com tom premium, emocional e cinematográfico, adaptando perfeitamente o simbolismo do material ao contexto de relacionamentos amorosos e alianças de casamento/noivado.

REGRAS DE ESCRITA:
1. Siga a estrutura narrativa obrigatória: MATERIAL → EMOÇÃO → RELAÇÃO.
2. Evite jargões científicos, frios ou técnicos.
3. Não exagere no misticismo esotérico ou misticismo excessivo, foque na profundidade dos sentimentos humanos, durabilidade, autenticidade, raridade e conexão autêntica da natureza.
4. Garanta que o texto evoque exclusividade, elegância e acabamento artesanal único.

Gere exatamente no formato abaixo, sem aspas externas e sem markdown adicional:

-----------------------------------

MATERIAL IDENTIFICADO:
[Substitua pelo Nome do material identificado na imagem, ex: Madeira Roxinho]

SIMBOLISMO:
[Texto poético e requintado, contendo de 2 a 3 frases, descrevendo a profundidade do simbolismo e conexão]

VERSÃO CURTA:
“[Frase curta e marcante de impacto emocional]”

-----------------------------------`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, { text: prompt }] }
      });
      text = response.text || "";
    } else {
      // Formato baseado somente em texto com grounding de busca na web
      const prompt = `Você é o redator sênior de uma marca de biojoias artesanais de luxo natural altamente exclusiva.
Realize uma pesquisa mística, emocional, cultural e sensorial profunda sobre o simbolismo associado ao elemento: "${name}".

Por favor, gere uma descrição extremamente requintada, poética e de impacto (escreva com tom premium, emocional e cinematográfico).
Adapte perfeitamente o simbolismo do material ao contexto de relacionamentos amorosos e alianças de casamento/noivado.

REGRAS DE ESCRITA:
1. Siga a estrutura narrativa obrigatória: MATERIAL → EMOÇÃO → RELAÇÃO.
2. Evite jargões científicos, frios ou técnicos.
3. Não exagere no misticismo excessivo, foque na profundidade dos sentimentos humanos, durabilidade, autenticidade, raridade e conexão autêntica da natureza.
4. Garanta que o texto evoque exclusividade, elegância e acabamento artesanal único.

Gere exatamente no formato abaixo, sem aspas externas e sem markdown adicional:

-----------------------------------

MATERIAL IDENTIFICADO:
${name}

SIMBOLISMO:
[Texto poético e requintado, contendo de 2 a 3 frases, descrevendo a profundidade do simbolismo e conexão]

VERSÃO CURTA:
“[Frase curta e marcante de impacto emocional]”

-----------------------------------`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      text = response.text || "";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      sources = chunks
        .map((c: any) => ({
          uri: c.web?.uri || "",
          title: c.web?.title || "",
        }))
        .filter((s: any) => s.uri !== "");
    }

    // Parsing robusto do formato retornado
    let identifiedName = name || "";
    let pureSymbolism = "";
    let shortVersion = "";

    const matMatch = text.match(/MATERIAL IDENTIFICADO:\s*([^\n\r]+)/i);
    if (matMatch) {
      identifiedName = matMatch[1].trim();
    }

    const symMatch = text.match(/SIMBOLISMO:\s*([\s\S]*?)(?=VERSÃO CURTA:|$)/i);
    if (symMatch) {
      pureSymbolism = symMatch[1].trim();
    } else {
      pureSymbolism = text.trim();
    }

    const shortMatch = text.match(/VERSÃO CURTA:\s*([\s\S]*?)(?=---+|$)/i);
    if (shortMatch) {
      shortVersion = shortMatch[1].trim().replace(/^“|”$/g, "").replace(/^"|"$/g, "");
    }

    res.json({
      symbolism: text.trim(),
      identifiedName,
      pureSymbolism,
      shortVersion,
      sources,
    });
  } catch (error: any) {
    const isQuotaError = error?.message?.includes("quota") || error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED";
    const lookupName = name || "Material Natural";
    
    if (isQuotaError) {
      console.warn(`[Gemini API] Quota or Rate Limit exceeded for material "${lookupName}". Using ultra-premium local fallback symbolism.`);
    } else {
      console.warn(`[Gemini API] Temporary error generating symbolism for "${lookupName}":`, error.message || error);
    }

    const customSymbolism = getLocalFallbackSymbolism(lookupName);
    res.json({
      symbolism: `-----------------------------------\n\nMATERIAL IDENTIFICADO:\n${lookupName}\n\nSIMBOLISMO:\n${customSymbolism}\n\nVERSÃO CURTA:\n“Um elo de amor e conexão com a força nobre da natureza.”\n\n-----------------------------------`,
      identifiedName: lookupName,
      pureSymbolism: customSymbolism,
      sources: [],
      error: isQuotaError ? "API rate limit reached, fell back to local metadata." : error.message
    });
  }
});

// API endpoint to unify multiple materials into a single rich narrative symbolism
app.post("/api/gemini/unify-symbolism", async (req, res) => {
  const { materials } = req.body;
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ error: "Missing or invalid materials array" });
  }

  const materialsList = materials.join(", ");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallbackText = `A união desses elementos cria uma aliança que simboliza profundidade, proteção e conexão verdadeira. A alquimia natural entre ${materialsList} desperta raízes sólidas e estabilidade emocional, harmonizando tons e energias místicas. Juntos, esses materiais transformam a peça em um símbolo de um amor autêntico, sofisticado e construído para atravessar o tempo com rara elegância artesanal.`;
    return res.json({ symbolism: fallbackText });
  }

  try {
    const ai = getAiClient();
    const prompt = `Você é um especialista em simbolismo emocional para alianças artesanais premium e biojoias de luxo natural.

Os materiais utilizados nesta aliança são: ${materialsList}.
Seu objetivo é UNIFICAR o simbolismo de todos esses materiais em uma única narrativa emocional sofisticada.

IMPORTANTE:
NÃO descreva os materiais separadamente.
NÃO faça listas individuais de simbolismo.
NÃO explique cada material isoladamente.

O objetivo é criar UM ÚNICO SIMBOLISMO CENTRAL da aliança como se todos os materiais se transformassem em um único significado emocional.

A resposta deve transmitir:
- profundidade emocional
- conexão verdadeira
- exclusividade
- luxo natural
- sofisticação artesanal
- autenticidade
- força do relacionamento
- elegância orgânica
- sensação cinematográfica e premium

ESTILO DE ESCRITA:
- emocional
- refinado
- sofisticado
- sensorial
- poético na medida certa
- semelhante à comunicação de marcas de luxo artesanal

NÃO use:
- linguagem técnica
- excesso de espiritualidade
- textos genéricos
- descrições frias
- repetição de palavras

A escrita deve parecer feita para:
- alianças de casamento premium
- joias naturais exclusivas
- casais que valorizam significado e autenticidade

ESTRUTURA OBRIGATÓRIA:

SIMBOLISMO DA ALIANÇA:
[Texto emocional único de 3 a 5 frases unificando todos os materiais, sem aspas extras, sem markdown]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    let cleanSymbolism = text.replace(/SIMBOLISMO DA ALIANÇA:\s*/i, "").trim();
    // Strip leading/trailing quotation marks if returned
    cleanSymbolism = cleanSymbolism.replace(/^“|”$/g, "").replace(/^"|"$/g, "").trim();

    res.json({ symbolism: cleanSymbolism });
  } catch (error: any) {
    console.error("[Gemini API] Error unifying symbolism:", error);
    const fallbackText = `A união desses elementos cria uma aliança que simboliza profundidade, proteção e conexão verdadeira. A alquimia natural entre ${materialsList} desperta raízes sólidas e estabilidade emocional. Juntos, esses materiais transformam a peça em um símbolo de um amor autêntico, sofisticado e construído para atravessar o tempo.`;
    res.json({ symbolism: fallbackText });
  }
});

// ==========================================
// PAYMENT CONFIGURATION PERSISTENCE
// ==========================================
const CONFIG_FILE_PATH = path.join(process.cwd(), 'payment-config.json');

function getPaymentConfig() {
  const defaultCfg = {
    mercadoPagoMode: 'simulation',
    mercadoPagoPublicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
    mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
  };
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
      return { ...defaultCfg, ...saved };
    }
  } catch (err) {
    console.error("[Config Engine] Error reading payment-config.json:", err);
  }
  return defaultCfg;
}

function savePaymentConfig(cfg: any) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.error("[Config Engine] Error writing payment-config.json:", err);
  }
}

// Admin payment configurations API
app.get("/api/admin/payment-config", (req, res) => {
  res.json(getPaymentConfig());
});

app.post("/api/admin/payment-config", (req, res) => {
  const { modo, public_key, access_token } = req.body;
  const current = getPaymentConfig();
  current.mercadoPagoMode = modo || 'simulation';
  current.mercadoPagoPublicKey = public_key || '';
  current.mercadoPagoAccessToken = access_token || '';
  savePaymentConfig(current);
  console.log(`[Config Engine] Mercado Pago Payment Configuration updated. Mode: ${current.mercadoPagoMode}`);
  res.json({ success: true, message: "Configurações de pagamento atualizadas!" });
});

// Dynamic Checkout Pro Preference generation (Real vs Simulated)
app.post("/api/checkout/mercadopago", async (req, res) => {
  const { cart, fullName, email, shippingCost } = req.body;
  const paymentConfig = getPaymentConfig();

  // If operational mode is SIMULATION, bypass and return simulation payload
  if (paymentConfig.mercadoPagoMode !== 'live') {
    return res.json({ 
      success: true,
      mode: "simulation",
      message: "Operating in simulated checkout mode."
    });
  }

  const token = paymentConfig.mercadoPagoAccessToken;
  if (!token) {
    return res.status(200).json({ 
      error: "MISSING_TOKEN",
      message: "Mercado Pago Access Token not configured in Admin Dashboard. Showing simulated manual checkout." 
    });
  }

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Carrinho vazio ou inválido." });
  }

  try {
    const items = cart.map((item: any) => {
      const price = parseFloat(item.price);
      return {
        id: String(item.id),
        title: `${item.name} (Tamanho ${item.size})`,
        quantity: parseInt(item.quantity) || 1,
        unit_price: price,
        currency_id: "BRL",
        picture_url: item.image,
      };
    });

    const costOfShipping = parseFloat(shippingCost) || 0;
    if (costOfShipping > 0) {
      items.push({
        id: "shipping_fee",
        title: "Envio Expresso Segurado Joias Naturais",
        quantity: 1,
        unit_price: costOfShipping,
        currency_id: "BRL",
        picture_url: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=120&q=80",
      });
    }

    const origin = req.headers.origin || process.env.APP_URL || "https://ais-dev-l52qmkn3iabszbrkr2ttex-189084264645.us-west1.run.app";
    const orderId = "JN" + Date.now().toString().substring(6);

    const body = {
      items,
      payer: {
        name: fullName || "Cliente Joias Naturais",
        email: email || "comprador@joiasnaturaiss.com.br",
      },
      back_urls: {
        success: `${origin}/checkout?status=success&orderId=${orderId}`,
        pending: `${origin}/checkout?status=pending&orderId=${orderId}`,
        failure: `${origin}/checkout?status=failure&orderId=${orderId}`,
      },
      auto_return: "approved",
      statement_descriptor: "JOIAS NATURAIS",
      external_reference: orderId,
      notification_url: `${origin}/api/webhook/pagamentos`
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[Mercado Pago Webhook error]: Unable to initialize session. Using simulation.", errText);
      return res.status(200).json({ 
        error: "MERCADO_PAGO_API_ERROR", 
        message: "Erro no processamento da aliança Mercado Pago. Usando simulação.", 
        details: errText 
      });
    }

    const data = await response.json();
    res.json({ 
      initPoint: data.init_point,
      preferenceId: data.id 
    });
  } catch (error: any) {
    console.error("[Mercado Pago Connection Failure]:", error);
    res.status(200).json({ 
      error: "UNEXPECTED_ERROR", 
      message: "Falha na inicialização de pagamento. Usando simulação.", 
      details: error.message 
    });
  }
});

// Dynamic Checkout PIX generation (Real vs Simulated)
app.post("/api/checkout/pix", async (req, res) => {
  const { orderId, email, fullName } = req.body;
  const paymentConfig = getPaymentConfig();

  if (!orderId) {
    return res.status(400).json({ error: "Número do pedido não fornecido." });
  }

  const orders = getOrders();
  const orderIndex = orders.findIndex((o: any) => o.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ error: "Pedido não localizado no servidor." });
  }

  const order = orders[orderIndex];
  const amount = Number(order.value);

  const generateServerPixCode = (amount: number, id: string): string => {
    return `00020101021226830014br.gov.bcb.pix2561joiasnaturaiss@gmail.com5204000053039865405${amount.toFixed(2)}5802BR5915Joias Naturais6009Sao Paulo62070503${id.substring(0, 4)}6304`;
  };

  const pixCode = generateServerPixCode(amount, orderId);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;

  // Return simulated PIX if environment is not simulation
  if (paymentConfig.mercadoPagoMode !== 'live') {
    return res.json({
      success: true,
      mode: "simulation",
      qr_code: pixCode,
      qr_code_base64: null,
      qr_code_url: qrCodeUrl,
      amount,
      orderId
    });
  }

  const token = paymentConfig.mercadoPagoAccessToken;
  if (!token) {
    console.warn("[PIX GATEWAY] Live mode set but Token missing. Using Simulation Fallback.");
    return res.json({
      success: true,
      mode: "simulation_fallback",
      qr_code: pixCode,
      qr_code_base64: null,
      qr_code_url: qrCodeUrl,
      amount,
      orderId
    });
  }

  try {
    const origin = req.headers.origin || process.env.APP_URL || "https://ais-dev-l52qmkn3iabszbrkr2ttex-189084264645.us-west1.run.app";
    
    const body = {
      transaction_amount: amount,
      description: `Joias Naturais - Pedido ${orderId}`,
      payment_method_id: "pix",
      payer: {
        email: email || order.clientEmail || "comprador@joiasnaturaiss.com.br",
        first_name: fullName ? fullName.split(" ")[0] : (order.clientName ? order.clientName.split(" ")[0] : "Cliente"),
        last_name: fullName ? fullName.split(" ").slice(1).join(" ") || "Naturais" : (order.clientName ? order.clientName.split(" ").slice(1).join(" ") || "Naturais" : "Naturais"),
        identification: {
          type: "CPF",
          number: "19100000000"
        }
      },
      external_reference: orderId,
      notification_url: `${origin}/api/webhook/pagamentos`
    };

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `pix-${orderId}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[Mercado Pago PIX Engine Failed]:", errText);
      return res.json({
        success: true,
        mode: "simulation_fallback",
        qr_code: pixCode,
        qr_code_base64: null,
        qr_code_url: qrCodeUrl,
        amount,
        orderId,
        message: "Operando em modo simulação por erro na comunicação API."
      });
    }

    const data = await response.json();
    const transactionData = data.point_of_interaction?.transaction_data;

    // Update locally stored order object with mp payment reference id
    if (orderIndex !== -1) {
      orders[orderIndex].mp_payment_id = data.id;
      orders[orderIndex].paymentMethod = "Pix";
      saveOrders(orders);
      console.log(`[PIX Checkout Engine] Connected order ${orderId} with live payment ${data.id}`);
    }

    res.json({
      success: true,
      mode: "live",
      qr_code: transactionData?.qr_code || pixCode,
      qr_code_base64: transactionData?.qr_code_base64 || null,
      qr_code_url: qrCodeUrl,
      amount,
      orderId,
      mp_payment_id: data.id
    });

  } catch (error: any) {
    console.error("[PIX Gate System Error]:", error);
    res.json({
      success: true,
      mode: "simulation_error_fallback",
      qr_code: pixCode,
      qr_code_base64: null,
      qr_code_url: qrCodeUrl,
      amount,
      orderId
    });
  }
});

// Dynamic Webhook processor (Real + Simulated)
app.post("/api/webhook/pagamentos", async (req, res) => {
  const { action, id, data, type, simulated_order_id, simulated_status } = req.body;
  const paymentConfig = getPaymentConfig();
  
  console.log("[Payment Webhook Received] Body:", JSON.stringify(req.body));

  // 1. Support developer simulator testing
  if (simulated_order_id) {
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => cleanId(o.id) === cleanId(simulated_order_id));
    if (orderIndex !== -1) {
      if (simulated_status === "approved") {
        orders[orderIndex].status = "Pago";
        const now = new Date();
        orders[orderIndex].date = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        
        saveOrders(orders);
        console.log(`[Webhook Simulation] Successfully validated simulated order ${simulated_order_id} and updated to Pago.`);
        triggerPushNotifications(orders[orderIndex]);
        return res.json({ success: true, message: "Simulated payment successfully cleared." });
      }
    }
    return res.status(404).json({ error: "Simulated order not found." });
  }

  // 2. Real Mercado Pago Webhook lookup
  const mpPaymentId = data?.id || id;
  const notificationType = type || req.body.topic;
  const token = paymentConfig.mercadoPagoAccessToken;

  if (mpPaymentId && (notificationType === "payment" || action?.includes("payment"))) {
    if (!token) {
      console.warn("[Webhook Processor] Live callback received but Access Token not configured.");
      return res.status(200).json({ error: "MERCADO_PAGO_ACCESS_TOKEN not configured." });
    }

    try {
      console.log(`[Webhook Processing] Querying live payment ${mpPaymentId} dynamically...`);
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
        headers: {
          "Authorization": `Bearer ${token.trim()}`
        }
      });

      if (!mpRes.ok) {
        throw new Error(`Failed to lookup payment status: ${mpRes.statusText}`);
      }

      const paymentData = await mpRes.json();
      const orderId = paymentData.external_reference;
      const paymentStatus = paymentData.status;

      console.log(`[Webhook Info] Payment: ${mpPaymentId} | Order: ${orderId} | Status: ${paymentStatus}`);

      if (orderId && paymentStatus === "approved") {
        const orders = getOrders();
        const orderIndex = orders.findIndex((o: any) => o.id === orderId);
        if (orderIndex !== -1) {
          if (orders[orderIndex].status !== "Pago") {
            orders[orderIndex].status = "Pago";
            const now = new Date();
            orders[orderIndex].date = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            saveOrders(orders);
            console.log(`[Webhook Success] Checked payment. Set Order ${orderId} status to PAGO.`);
            triggerPushNotifications(orders[orderIndex]);
          }
          return res.json({ success: true, message: `Order ${orderId} payment finalized.` });
        }
      }
    } catch (err: any) {
      console.error("[Webhook Processing Error]:", err.message);
      return res.status(500).json({ error: "Webhook verification error." });
    }
  }

  res.status(200).send("Notification acknowledged.");
});

// Helper function to proactively query Mercado Pago payment status and update the order
async function checkAndUpdateMPPayment(orderId: string): Promise<boolean> {
  const paymentConfig = getPaymentConfig();
  const token = paymentConfig.mercadoPagoAccessToken;
  
  if (paymentConfig.mercadoPagoMode !== 'live' || !token) {
    return false;
  }

  try {
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => cleanId(o.id) === cleanId(orderId));
    if (orderIndex === -1) {
      return false;
    }

    const order = orders[orderIndex];
    if (order.status === "Pago") {
      return true;
    }

    let paymentStatus = "";
    
    // 1. If we have a saved mp_payment_id, check it directly
    if (order.mp_payment_id) {
      console.log(`[Proactive Check] Querying Mercado Pago payment status directly for mp_id: ${order.mp_payment_id}`);
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${order.mp_payment_id}`, {
        headers: {
          "Authorization": `Bearer ${token.trim()}`
        }
      });
      if (mpRes.ok) {
        const paymentData = await mpRes.json();
        paymentStatus = paymentData.status;
        console.log(`[Proactive Check] Direct query status for ${order.mp_payment_id}: ${paymentStatus}`);
      }
    }

    // 2. Fallback: Search payments by external reference (order ID)
    if (paymentStatus !== "approved") {
      console.log(`[Proactive Check] Searching Mercado Pago payments by external_reference: ${orderId}`);
      const searchRes = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(orderId)}`, {
        headers: {
          "Authorization": `Bearer ${token.trim()}`
        }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = searchData.results || [];
        const approvedPayment = results.find((p: any) => p.status === "approved");
        if (approvedPayment) {
          paymentStatus = "approved";
          orders[orderIndex].mp_payment_id = approvedPayment.id;
        }
      }
    }

    if (paymentStatus === "approved") {
      orders[orderIndex].status = "Pago";
      const now = new Date();
      orders[orderIndex].date = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      saveOrders(orders);
      console.log(`[Proactive Success] Proactively verified approved payment for Order ${orderId}. Marked as PAGO.`);
      triggerPushNotifications(orders[orderIndex]);
      return true;
    }
  } catch (err: any) {
    console.error("[Proactive Check Exception]:", err.message);
  }
  return false;
}

app.get("/api/orders/status", async (req, res) => {
  const { orderId } = req.query;
  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  // Attempt live verification to bypass sandboxed webhook blockages
  await checkAndUpdateMPPayment(String(orderId));

  const orders = getOrders();
  const order = orders.find((o: any) => cleanId(o.id) === cleanId(String(orderId)));
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json({ id: order.id, status: order.status });
});

// ==========================================
// ANTI-FRAUD INTENSE AUDITING ENGINE
// ==========================================

function serverVerifyCPF(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10), 10)) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11), 10)) return false;
  
  return true;
}

function calculateAntiFraudMetrics(req: express.Request, cart: any[], total: number, cpf: string) {
  let riskScore = 15; // Legit start score
  const flags: string[] = [];
  
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  
  if (!userAgent || userAgent.includes("curl") || userAgent.includes("Postman") || userAgent.includes("python-requests")) {
    riskScore += 45;
    flags.push("AGENT_BOT_REQUISICAO");
  }
  
  if (cart && Array.isArray(cart)) {
    let expectedTotal = 0;
    cart.forEach(item => {
      const price = Number(item.price);
      if (price < 150) {
        riskScore += 20;
        flags.push("ALERTA_PRECO_SUSPEITO_REBAIXADO");
      }
      expectedTotal += price * (Number(item.quantity) || 1);
    });
    
    if (Math.abs(expectedTotal - total) > 5) {
      riskScore += 50;
      flags.push("DIVERGENCIA_METADADOS_PRECO");
    }
  }
  
  if (!cpf) {
    riskScore += 25;
    flags.push("CPF_PENDENTE_CADASTRO");
  } else if (!serverVerifyCPF(cpf)) {
    riskScore += 80;
    flags.push("CPF_MATEMATICAMENTE_INVALIDO");
  }
  
  let securityClass = "Baixo Risco (Verificado)";
  if (riskScore >= 75) {
    securityClass = "Alto Risco (Fraude)";
  } else if (riskScore >= 35) {
    securityClass = "Médio Risco (Review)";
  }
  
  return {
    securityScore: `${securityClass} (${riskScore}%)`,
    fingerprint: `FPR-${Buffer.from(ip + userAgent.slice(0, 15)).toString("hex").slice(0, 16).toUpperCase()}`,
    riskScore,
    flags
  };
}

// ==========================================
// WEB PUSH & FLIGHT SYSTEM PERSISTENT ENGINE
// ==========================================

const ORDERS_FILE_PATH = path.join(process.cwd(), 'orders.json');
const SUBSCRIPTIONS_FILE_PATH = path.join(process.cwd(), 'subscriptions.json');

// Generate and persist stable VAPID Keys
let vapidKeys: any;
const vapidPath = path.join(process.cwd(), 'vapid.json');
try {
  if (fs.existsSync(vapidPath)) {
    vapidKeys = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidPath, JSON.stringify(vapidKeys, null, 2), 'utf8');
  }
  
  webpush.setVapidDetails(
    'mailto:joiasnaturaiss@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('[Web Push Setup] VAPID keys loaded successfully.');
} catch (vErr) {
  console.error('[Web Push Setup Failed] Cannot load/generate keys:', vErr);
}

// Order book read/write
function getOrders(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE_PATH, 'utf8'));
    }
  } catch (e) {
    console.error("Error reading orders:", e);
  }
  return [];
}

function saveOrders(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.error("Error writing orders:", e);
  }
}

function cleanId(sid: string): string {
  if (!sid) return "";
  return decodeURIComponent(sid).replace(/^#+/, '').trim().toLowerCase();
}

// Subscriptions read/write
function getSubscriptions(): any[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE_PATH, 'utf8'));
    }
  } catch (e) {
    console.error("Error reading subscriptions:", e);
  }
  return [];
}

function saveSubscription(sub: any) {
  try {
    const subs = getSubscriptions();
    const exists = subs.some(s => s.endpoint === sub.endpoint);
    if (!exists) {
      subs.push(sub);
      fs.writeFileSync(SUBSCRIPTIONS_FILE_PATH, JSON.stringify(subs, null, 2), 'utf8');
      console.log('[Web Push Registry] Added new subscriber device endpoint.');
    }
  } catch (e) {
    console.error("Error saving subscription:", e);
  }
}

function removeSubscription(endpoint: string) {
  try {
    let subs = getSubscriptions();
    subs = subs.filter(s => s.endpoint !== endpoint);
    fs.writeFileSync(SUBSCRIPTIONS_FILE_PATH, JSON.stringify(subs, null, 2), 'utf8');
    console.log("[Web Push Registry] Pruned expired subscriber endpoint.");
  } catch (e) {
    console.error("Error pruning subscription:", e);
  }
}

// Dispatch push notifications
async function triggerPushNotifications(order: any) {
  const subs = getSubscriptions();
  if (subs.length === 0) {
    console.log('[Web Push Alert] Omitted: No admin browsers registered to receive push warnings.');
    return;
  }
  
  console.log(`[Web Push Dispatcher] Distributing sales alert to ${subs.length} listening browsers...`);
  
  const payload = JSON.stringify({
    title: "✨ Novo Pedido Pago! R$ " + order.value + " ✨",
    body: `Cliente: ${order.clientName} | Joia: ${order.ringSpecs?.woodBase || 'Aliança de Madeira'}`
  });

  subs.forEach((sub: any) => {
    webpush.sendNotification(sub, payload).catch((err: any) => {
      console.warn("[Web Push Dispatcher] Sent warning failed for endpoint:", err.statusCode || err.message);
      if (err.statusCode === 410 || err.statusCode === 404) {
        removeSubscription(sub.endpoint);
      }
    });
  });
}

// Service worker delivery
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(self.clients.claim());
    });

    self.addEventListener('push', (event) => {
      let data = {};
      try {
        data = event.data ? event.data.json() : {};
      } catch (e) {
        data = { title: "Novo Pedido Pago!", body: event.data ? event.data.text() : "" };
      }

      const title = data.title || "✨ Novo Pedido no Ateliê! ✨";
      const options = {
        body: data.body || "Um novo pedido pago foi recebido com sucesso.",
        icon: "/images/icon.png",
        badge: "/images/icon.png",
        vibrate: [200, 100, 200, 100, 200],
        data: {
          url: "/admin/dashboard"
        }
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          if (clientList.length > 0) {
            let client = clientList[0];
            for (let i = 0; i < clientList.length; i++) {
              if (clientList[i].focused) {
                client = clientList[i];
              }
            }
            return client.focus();
          }
          return clients.openWindow('/admin/dashboard');
        })
      );
    });
  `);
});

// API Orders feed
app.get("/api/orders", (req, res) => {
  res.json(getOrders());
});

// Delete individual order from backend
app.delete("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    const orders = getOrders();
    const filtered = orders.filter((o: any) => cleanId(o.id) !== cleanId(id));
    if (orders.length === filtered.length) {
      return res.status(404).json({ error: "Pedido não encontrado no servidor." });
    }
    saveOrders(filtered);
    console.log(`[Orders System] Order ${id} has been deleted from backend database.`);
    res.json({ success: true, message: `Pedido ${id} removido com sucesso do servidor.` });
  } catch (err: any) {
    console.error("[Orders System Error] Failed to delete order:", err.message);
    res.status(500).json({ error: "Erro ao deletar pedido no servidor." });
  }
});

// Update order status from AdminDashboard
app.post("/api/orders/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["Pago", "Pendente", "Cancelado"].includes(status)) {
      return res.status(400).json({ error: "Parâmetro 'status' inválido." });
    }
    const orders = getOrders();
    const orderIndex = orders.findIndex((o: any) => cleanId(o.id) === cleanId(id));
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido não encontrado no servidor." });
    }
    orders[orderIndex].status = status;
    saveOrders(orders);
    console.log(`[Orders System] Order ${id} status updated to ${status} on backend database.`);
    res.json({ success: true, message: `Status do pedido ${id} atualizado para ${status} no servidor.` });
  } catch (err: any) {
    console.error("[Orders System Error] Failed to update order status:", err.message);
    res.status(500).json({ error: "Erro ao atualizar status do pedido no servidor." });
  }
});

// Create/Update pending cart session order
app.post("/api/orders/pending-cart", (req, res) => {
  const { cart, currentOrderId, email, fullName, shippingCost, total, cpf, paymentMethod, phone } = req.body;
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(200).json({ error: "Empty cart" });
  }

  // Gracefully fallback instead of omitting storage, enabling reliable simulated checkouts
  const clientNameStr = (fullName && fullName.trim() !== "") ? fullName : "Cliente Geral";
  const clientEmailStr = (email && email.trim() !== "") ? email : "comprador@joiasnaturais.com.br";

  // Assess fraud risks in real time
  const metrics = calculateAntiFraudMetrics(req, cart, total || 0, cpf || "");

  const orders = getOrders();
  let orderId = currentOrderId;
  let orderIndex = -1;

  if (orderId) {
    orderIndex = orders.findIndex((o: any) => cleanId(o.id) === cleanId(orderId));
  }

  const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const calculatedShipping = typeof shippingCost === 'number' ? shippingCost : 25;
  const totalSub = typeof total === 'number' ? total : (subtotal + calculatedShipping);

  const firstItem = cart[0] || {};
  const ringSpecs = {
    woodBase: firstItem.name ? firstItem.name.replace('Aliança ', '') : 'Ébano Africano Nobre',
    core: firstItem.material ? firstItem.material.split('+')[1] || 'Aço Inox' : 'Aço Inox Cirúrgico',
    stoneInlay: firstItem.material ? firstItem.material.split('+')[2] || 'Sem Gema' : 'Turquesa Autêntica Triturada',
    filigree: firstItem.material ? firstItem.material.split('+')[3] || 'Sem Filete' : 'Ouro Amarelo 18k',
    size: firstItem.size || 19,
    engraving: 'Joias Naturais'
  };

  const now = new Date();
  const dateStr = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  if (orderIndex !== -1) {
    const existingOrder = orders[orderIndex];
    existingOrder.value = totalSub;
    existingOrder.ringSpecs = ringSpecs;
    existingOrder.rings = cart.map(item => ({
      woodBase: item.name ? item.name.replace('Aliança ', '') : 'Ébano Africano Nobre',
      core: item.material ? item.material.split('+')[1] || 'Aço Inox' : 'Aço Inox Cirúrgico',
      stoneInlay: item.material ? item.material.split('+')[2] || 'Sem Gema' : 'Turquesa Autêntica Triturada',
      filigree: item.material ? item.material.split('+')[3] || 'Sem Filete' : 'Ouro Amarelo 18k',
      size: item.size || 19
    }));
    existingOrder.clientName = clientNameStr;
    existingOrder.clientEmail = clientEmailStr;
    if (phone) existingOrder.clientPhone = phone;
    existingOrder.cpf = cpf || existingOrder.cpf || "000.000.000-00";
    existingOrder.paymentMethod = paymentMethod || existingOrder.paymentMethod || "Pendente";
    existingOrder.securityScore = metrics.securityScore;
    existingOrder.fingerprint = metrics.fingerprint;
    orders[orderIndex] = existingOrder;
    saveOrders(orders);
  } else {
    orderId = currentOrderId || `#INV-${Math.floor(2050 + Math.random() * 8000)}`;
    const newOrder = {
      id: orderId,
      clientName: clientNameStr,
      clientEmail: clientEmailStr,
      clientPhone: phone || "(11) 98888-7777",
      date: dateStr,
      status: "Pendente",
      value: totalSub,
      ringSpecs,
      rings: cart.map(item => ({
        woodBase: item.name ? item.name.replace('Aliança ', '') : 'Ébano Africano Nobre',
        core: item.material ? item.material.split('+')[1] || 'Aço Inox' : 'Aço Inox Cirúrgico',
        stoneInlay: item.material ? item.material.split('+')[2] || 'Sem Gema' : 'Turquesa Autêntica Triturada',
        filigree: item.material ? item.material.split('+')[3] || 'Sem Filete' : 'Ouro Amarelo 18k',
        size: item.size || 19
      })),
      address: "Pendente preenchimento no Checkout",
      cpf: cpf || "000.000.000-00",
      paymentMethod: paymentMethod || "Pendente",
      securityScore: metrics.securityScore,
      fingerprint: metrics.fingerprint
    };
    orders.unshift(newOrder);
    saveOrders(orders);
  }

  res.json({ orderId, security: metrics });
});

// Finalize payment & trigger Sales notifications!
app.post("/api/orders/pay", (req, res) => {
  const { orderId, fullName, email, phone, address, city, state, cep, cart, total, cpf, paymentMethod } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  const orders = getOrders();
  const orderIndex = orders.findIndex((o: any) => cleanId(o.id) === cleanId(orderId));
  let orderToNotify: any;

  const now = new Date();
  const dateStr = `Hoje, às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const finalValue = total || 1200;
  const deliveryAddress = address ? `${address}, ${city || ''} - ${state || ''}, CEP: ${cep || ''}` : "Endereço simulado de entrega";
  const finalCpf = cpf || "000.000.000-00";

  // Calculate high accuracy anti-fraud parameters
  const metrics = calculateAntiFraudMetrics(req, cart || [], finalValue, finalCpf);

  if (orderIndex !== -1) {
    orders[orderIndex].status = "Pago";
    orders[orderIndex].clientName = fullName || orders[orderIndex].clientName;
    orders[orderIndex].clientEmail = email || orders[orderIndex].clientEmail;
    if (phone) orders[orderIndex].clientPhone = phone;
    orders[orderIndex].address = deliveryAddress;
    orders[orderIndex].value = finalValue;
    orders[orderIndex].date = dateStr;
    orders[orderIndex].cpf = finalCpf;
    orders[orderIndex].paymentMethod = paymentMethod || orders[orderIndex].paymentMethod || "Pendente";
    orders[orderIndex].securityScore = metrics.securityScore;
    orders[orderIndex].fingerprint = metrics.fingerprint;
    
    orderToNotify = orders[orderIndex];
    saveOrders(orders);
    console.log('[Orders System] Transitioned order to status PAGO:', orderId);
  } else {
    // Direct payment transition fallback
    const firstItem = (cart && cart[0]) || {};
    const ringSpecs = {
      woodBase: firstItem.name ? firstItem.name.replace('Aliança ', '') : 'Ébano Africano Nobre',
      core: firstItem.material ? firstItem.material.split('+')[1] || 'Aço Inox' : 'Aço Inox Cirúrgico',
      stoneInlay: firstItem.material ? firstItem.material.split('+')[2] || 'Sem Gema' : 'Turquesa Autêntica Triturada',
      filigree: firstItem.material ? firstItem.material.split('+')[3] || 'Sem Filete' : 'Ouro Amarelo 18k',
      size: firstItem.size || 19,
      engraving: 'Joias Naturais'
    };

    orderToNotify = {
      id: orderId,
      clientName: fullName || "Cliente Joias Naturais",
      clientEmail: email || "comprador@joiasnaturais.com.br",
      clientPhone: phone || "(11) 98888-7777",
      date: dateStr,
      status: "Pago",
      value: finalValue,
      ringSpecs,
      rings: cart ? cart.map((item: any) => ({
        woodBase: item.name ? item.name.replace('Aliança ', '') : 'Ébano Africano Nobre',
        core: item.material ? item.material.split('+')[1] || 'Aço Inox' : 'Aço Inox Cirúrgico',
        stoneInlay: item.material ? item.material.split('+')[2] || 'Sem Gema' : 'Turquesa Autêntica Triturada',
        filigree: item.material ? item.material.split('+')[3] || 'Sem Filete' : 'Ouro Amarelo 18k',
        size: item.size || 19
      })) : [],
      address: deliveryAddress,
      cpf: finalCpf,
      paymentMethod: paymentMethod || "Pendente",
      securityScore: metrics.securityScore,
      fingerprint: metrics.fingerprint
    };
    orders.unshift(orderToNotify);
    saveOrders(orders);
    console.log('[Orders System] Created fresh PAGO order:', orderId);
  }

  // Fire push warnings asynchronously
  triggerPushNotifications(orderToNotify);

  res.json({ success: true, order: orderToNotify });
});

// Clear all orders in the backend system
app.post("/api/admin/clear-all-orders", (req, res) => {
  try {
    saveOrders([]);
    console.log('[Orders System] ALL orders have been erased and cleared from server database by administrator.');
    res.json({ success: true, message: "Todos os pedidos foram limpos com sucesso!" });
  } catch (err: any) {
    console.error("[Orders System Error] Failed to clear orders:", err.message);
    res.status(500).json({ error: "Erro ao limpar pedidos." });
  }
});

// Subscribe new device to notifications 
app.post("/api/notifications/subscribe", (req, res) => {
  const { subscription } = req.body;
  if (!subscription) {
    return res.status(400).json({ error: "Missing subscription object" });
  }
  saveSubscription(subscription);
  res.json({ success: true });
});

// Retrieve dynamic VAPID cryptographic public key
app.get("/api/notifications/vapid-key", (req, res) => {
  if (!vapidKeys) {
    return res.status(500).json({ error: "VAPID key system not initialized." });
  }
  res.json({ publicKey: vapidKeys.publicKey });
});

// Fire test notification
app.post("/api/notifications/test-send", (req, res) => {
  const subs = getSubscriptions();
  if (subs.length === 0) {
    return res.status(400).json({ error: "Nenhum dispositivo cadastrado neste navegador para receber notificações de teste ainda." });
  }
  
  const payload = JSON.stringify({
    title: "🔔 Teste de Notificação bem-sucedido!",
    body: "Parabéns! Suas notificações em segundo plano do Ateliê Joias Naturais estão ativadas e funcionando de forma estável."
  });

  let successCount = 0;
  const promises = subs.map(sub => 
    webpush.sendNotification(sub, payload)
      .then(() => { successCount++; })
      .catch((err: any) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          removeSubscription(sub.endpoint);
        }
      })
  );

  Promise.all(promises).then(() => {
    res.json({ success: true, count: successCount });
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production build from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
