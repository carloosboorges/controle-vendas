// ==========================================
// MÓDULO DE CORE (Estado Global e Utilitários)
// ==========================================

const SUPABASE_URL = "https://oyitmutmtvuoynwhiymy.supabase.co";
const SUPABASE_KEY = "sb_publishable_6e1fQtQfhVa8LjWUbdPrJw_IwhhxLRF";
const CATEGORIAS_ITENS = ["Traje", "Gesto", "Picareta", "Música", "Pacote", "Pacotão", "Asa-delta", "Envelopamento", "Calçado", "Acessório", "Carro", "Mascote", "Outro"];
const MARGEM_LUCRO = 100 / 310;
const MARGEM_CUSTO = 210 / 310;

let ultimoValorSugeridoAuto = 0; // Escudo protetor de descontos manuais

// Tabela Oficial de Preços Especiais (A partir de 2.000 V-Bucks) - Mapeada da arte oficial
const TABELA_PRECOS_ESPECIAIS = {
  2000: 48.00,  2200: 52.50,  2400: 57.00,  2500: 59.00,  2600: 61.00,
  2800: 65.50,  3000: 70.00,  3200: 75.00,  3400: 80.00,  3500: 82.50,
  3600: 85.00,  3800: 90.00,  4000: 95.00,  4200: 100.00, 4400: 105.00,
  4500: 107.50, 4600: 110.00, 4800: 115.00, 5000: 120.00, 5500: 130.00,
  6000: 140.00, 6500: 150.00, 7000: 160.00, 7500: 170.00, 8000: 180.00,
  8500: 190.00, 9000: 200.00, 9500: 210.00, 10000: 220.00, 10500: 230.00,
  11000: 240.00, 11500: 250.00, 12000: 260.00, 12500: 270.00
};

const DADOS_DEMO = {
  contas: [
    { nome: "Putz0101", ativa: true, usadas: 0, vbucks: 10000 },
    { nome: "Putz0202", ativa: true, usadas: 0, vbucks: 8500 }
  ],
  vendas: [],
  reservas: [],
  valorBase100: 2.5,        // Valor base normal padrão (ex: R$ 2,50)
  valorBasePromo: 2.00,     // Valor base promocional de volume (ex: R$ 2,00)
  modoPrecificacao: "padrao", // "padrao", "global_promo", "volume_promo"
  limiteVolumePromo: 1500,   // Limite mínimo em V-Bucks para ativar a promoção por volume
  historicoVendas: [],
  lixeiraVendas: [],
  apoiadorRegistros: {},
  clientesInfo: {},
  agendamentos: []
};

let currentUser = null;
let authToken = localStorage.getItem("vendas_auth_token") || null;
let refreshToken = localStorage.getItem("vendas_refresh_token") || null;
let state = null;

const syncChannel = new BroadcastChannel('putz_sync_channel');

syncChannel.onmessage = (event) => {
  if (event.data === 'update' && currentUser) {
    sincronizarSilencioso();
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentUser) {
    sincronizarSilencioso();
  }
});

function parseDataBR(str) {
  if (!str) return 0;
  const partes = str.split('/');
  if (partes.length !== 3) return 0;
  return new Date(partes[2], partes[1] - 1, partes[0]).setHours(0, 0, 0, 0);
}

function obterDataHojeFormatada() {
  const agora = new Date();
  return `${String(agora.getDate()).padStart(2, "0")}/${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
}

function money(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatVBucks(v) {
  return Math.max(0, Math.round(Number(v) || 0)).toLocaleString("pt-BR");
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function mostrarNotificacao(msg, tipo = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast ${tipo === "sucesso" ? "toast-success" : tipo === "erro" ? "toast-error" : ""}`;
  toast.textContent = msg;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(30px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function copiarTexto(texto, tipo = "Texto", event = null) {
  if (event) event.stopPropagation();
  if (!texto || texto === "—") return;
  if (window.getSelection) window.getSelection().removeAllRanges();
  
  navigator.clipboard.writeText(texto).then(() => {
    if (tipo === 'E-mail') mostrarNotificacao("📋 E-mail copiado!", "sucesso");
    else if (tipo === 'Senha') mostrarNotificacao("📋 Senha copiada!", "sucesso");
    else mostrarNotificacao(`📋 ${tipo} copiado: "${texto}"`, "sucesso");
  }).catch(() => mostrarNotificacao("Não foi possível copiar.", "erro"));
}

function mascaraTelefone(e) {
  let input = e.target;
  let numeros = input.value.replace(/\D/g, "");
  
  if (!numeros) {
    input.value = "";
    return;
  }
  
  if (numeros.length === 11 && numeros[2] === '9' && !numeros.startsWith("55")) {
    numeros = "55" + numeros;
  }
  
  if (numeros.startsWith("55")) {
    numeros = numeros.substring(0, 13);
    let formatted = "+" + numeros.substring(0, 2);
    if (numeros.length > 2) formatted += " (" + numeros.substring(2, 4);
    if (numeros.length > 4) formatted += ") " + numeros.substring(4, 9);
    if (numeros.length > 9) formatted += "-" + numeros.substring(9, 13);
    input.value = formatted;
  } else {
    input.value = "+" + numeros;
  }
}

async function sincronizarSilencioso() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.1&select=*`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
      state = rows[0].data;
      sanitizarDados();
      if (typeof render === 'function') render();
    }
  } catch (err) {
    console.error("Erro na sincronização silenciosa", err);
  }
}

function sanitizarDados() {
  if (!state) return;
  if (!Array.isArray(state.vendas)) state.vendas = [];
  if (!Array.isArray(state.reservas)) state.reservas = [];
  if (!Array.isArray(state.historicoVendas)) state.historicoVendas = [];
  if (!Array.isArray(state.lixeiraVendas)) state.lixeiraVendas = [];
  if (!state.apoiadorRegistros) state.apoiadorRegistros = {};
  if (!state.clientesInfo) state.clientesInfo = {};
  if (!Array.isArray(state.agendamentos)) state.agendamentos = [];
  if (!state.sessaoIniciadaEm) state.sessaoIniciadaEm = Date.now();
  if (!state.modoPrecificacao) state.modoPrecificacao = "padrao";
  if (!state.limiteVolumePromo) state.limiteVolumePromo = 1500;
  if (!state.valorBasePromo) state.valorBasePromo = 2.00;
}

function sincronizarDadosCliente(nome, whatsapp, tiktok) {
  if (!nome) return;
  const nomeTrim = String(nome).trim();
  
  if (!state.clientesInfo) state.clientesInfo = {};
  if (!state.clientesInfo[nomeTrim]) state.clientesInfo[nomeTrim] = {};
  
  if (whatsapp) state.clientesInfo[nomeTrim].whatsapp = whatsapp;
  if (tiktok) state.clientesInfo[nomeTrim].tiktok = tiktok;
}

async function save() {
  sanitizarDados();
  if (typeof render === 'function') render();
  
  const footer = document.getElementById("statusFooter");
  if (!currentUser) return;
  
  try {
    if (footer) footer.textContent = "☁️ Salvando na nuvem...";
    await fetch(`${SUPABASE_URL}/rest/v1/app_state`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        id: 1,
        data: state,
        updated_at: new Date().toISOString()
      })
    });
    
    if (footer) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
    syncChannel.postMessage('update');
  } catch (err) {
    if (footer) footer.textContent = "⚠️ Erro ao salvar na nuvem";
  }
}

async function renovarTokenSupabase() {
  const storedRefresh = localStorage.getItem("vendas_refresh_token");
  if (!storedRefresh) return false;
  
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: storedRefresh })
    });
    const data = await res.json();
    
    if (res.ok && data.access_token) {
      authToken = data.access_token;
      refreshToken = data.refresh_token;
      currentUser = data.user;
      localStorage.setItem("vendas_auth_token", authToken);
      if (refreshToken) localStorage.setItem("vendas_refresh_token", refreshToken);
      return true;
    }
  } catch (e) {
    console.error("Erro ao renovar token", e);
  }
  return false;
}

async function verificarSessao() {
  if (!authToken) {
    const renovou = await renovarTokenSupabase();
    if (!renovou) {
      currentUser = null;
      return;
    }
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${authToken}`
      }
    });
    
    if (res.ok) {
      currentUser = await res.json();
    } else {
      const renovou = await renovarTokenSupabase();
      if (!renovou) {
        currentUser = null;
        authToken = null;
        refreshToken = null;
        localStorage.removeItem("vendas_auth_token");
        localStorage.removeItem("vendas_refresh_token");
      }
    }
  } catch (e) {
    currentUser = null;
  }
}

function atualizarInterfaceAuth() {
  const authBtn = document.getElementById("authBtn");
  const formArea = document.getElementById("authFormArea");
  const userInfo = document.getElementById("authUserInfo");
  const userText = document.getElementById("userLoggedText");
  
  if (currentUser) {
    if (authBtn) authBtn.textContent = `👤 ${currentUser.email.split("@")[0]} (Sair)`;
    if (formArea) formArea.style.display = "none";
    if (userInfo) userInfo.style.display = "block";
    if (userText) userText.innerHTML = `Logado como: <b>${esc(currentUser.email)}</b>`;
  } else {
    if (authBtn) authBtn.textContent = "🔑 Entrar (Admin)";
    if (formArea) formArea.style.display = "block";
    if (userInfo) userInfo.style.display = "none";
  }
}

function abrirModalAuth() {
  if (document.getElementById("authModal")) {
    document.getElementById("authModal").style.display = "flex";
    atualizarInterfaceAuth();
  }
}

function fecharModalAuth() {
  if (document.getElementById("authModal")) {
    document.getElementById("authModal").style.display = "none";
  }
}

async function fazerLogin() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const lembrar = document.getElementById("lembrarCredenciais")?.checked;
  
  if (!email || !password) return;
  
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (!res.ok || !data.access_token) {
      mostrarNotificacao("Credenciais inválidas.", "erro");
      return;
    }
    
    if (lembrar) {
      localStorage.setItem("vendas_saved_email", email);
      localStorage.setItem("vendas_saved_pass", password);
    }
    
    authToken = data.access_token;
    refreshToken = data.refresh_token || null;
    currentUser = data.user;
    
    localStorage.setItem("vendas_auth_token", authToken);
    if (refreshToken) localStorage.setItem("vendas_refresh_token", refreshToken);
    
    fecharModalAuth();
    mostrarNotificacao("Login realizado com sucesso!", "sucesso");
    await inicializar();
  } catch (err) {
    mostrarNotificacao("Erro ao conectar.", "erro");
  }
}

function fazerLogout() {
  authToken = null;
  refreshToken = null;
  currentUser = null;
  localStorage.removeItem("vendas_auth_token");
  localStorage.removeItem("vendas_refresh_token");
  fecharModalAuth();
  inicializar();
}

function limparReservasExpiradas() {
  if (!state || !Array.isArray(state.reservas)) return false;
  const agora = Date.now();
  const novas = state.reservas.filter(r => r.expiresAt > agora);
  
  if (novas.length !== state.reservas.length) {
    state.reservas = novas;
    return true;
  }
  return false;
}

function usadasDaConta(nome) {
  return (state.reservas || []).filter(r => r.conta === nome && r.expiresAt > Date.now()).length;
}

function tempoRestante(ms) {
  if (ms <= 0) return "liberado";
  let s = Math.ceil(ms / 1000);
  let h = Math.floor(s / 3600);
  let m = Math.floor((s % 3600) / 60);
  s %= 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function criarTimerReserva(conta, vendaId) {
  const agora = Date.now();
  return {
    id: `timer-${agora}-${Math.random().toString(36).substr(2, 5)}`,
    conta: conta,
    vendaId: vendaId,
    expiresAt: agora + 86400000 + 120000
  };
}

// -------------------------------------------------------------
// MOTOR DE CÁLCULO INTELIGENTE DE PREÇOS E V-BUCKS (COM ESCUDO DE DESCONTO)
// -------------------------------------------------------------
function calcularPrecoInteligente(vbucks) {
  const vb = Number(vbucks) || 0;
  if (vb <= 0) return 0;

  const modo = state?.modoPrecificacao || 'padrao';
  const baseNormal = Number(state?.valorBase100 || 2.5); 
  const basePromo = Number(state?.valorBasePromo || 2.00); 
  const limiteVolume = Number(state?.limiteVolumePromo || 1500); 

  let precoCalculado = 0;

  if (modo === 'global_promo') {
    precoCalculado = (vb / 100) * baseNormal;
  } else if (modo === 'volume_promo') {
    if (vb >= limiteVolume) {
      precoCalculado = (vb / 100) * basePromo;
    } else {
      if (vb < 2000) {
        precoCalculado = (vb / 100) * baseNormal;
      } else if (TABELA_PRECOS_ESPECIAIS[vb]) {
        precoCalculado = TABELA_PRECOS_ESPECIAIS[vb];
      }
    }
  } else {
    if (vb < 2000) {
      precoCalculado = (vb / 100) * baseNormal; 
    } else if (TABELA_PRECOS_ESPECIAIS[vb]) {
      precoCalculado = TABELA_PRECOS_ESPECIAIS[vb];
    } else {
      const chaves = Object.keys(TABELA_PRECOS_ESPECIAIS).map(Number).sort((a, b) => a - b);
      if (vb > chaves[chaves.length - 1]) {
        const ultimoVb = chaves[chaves.length - 1];
        const ultimoPreco = TABELA_PRECOS_ESPECIAIS[ultimoVb];
        precoCalculado = (vb / ultimoVb) * ultimoPreco;
      } else {
        let menor = chaves[0];
        let maior = chaves[chaves.length - 1];
        for (let i = 0; i < chaves.length - 1; i++) {
          if (vb > chaves[i] && vb < chaves[i + 1]) {
            menor = chaves[i];
            maior = chaves[i + 1];
            break;
          }
        }
        const precoMenor = TABELA_PRECOS_ESPECIAIS[menor];
        const precoMaior = TABELA_PRECOS_ESPECIAIS[maior];
        const proporcao = (vb - menor) / (maior - menor);
        precoCalculado = precoMenor + (proporcao * (precoMaior - precoMenor));
      }
    }
  }

  const finalValor = Number(precoCalculado.toFixed(2));
  const valorInput = document.getElementById("valorInput");

  if (valorInput) {
    const stringAtual = String(valorInput.value).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valorAtual = parseFloat(stringAtual) || 0;

    // ESCUDO PROTETOR: Só altera o preço se o campo estiver vazio ou se corresponder à última sugestão automática.
    // Se você digitou um desconto à mão, o sistema NÃO sobrescreve!
    if (valorAtual === 0 || Math.abs(valorAtual - ultimoValorSugeridoAuto) < 0.02) {
      valorInput.value = finalValor.toFixed(2);
      ultimoValorSugeridoAuto = finalValor;
    }
  }

  return finalValor;
}

function valorParaVBucks(valor, baseCustom) {
  const val = Number(valor) || 0;
  if (val <= 0) return 0;
  
  const modo = state?.modoPrecificacao || 'padrao';
  const baseNormal = Number(baseCustom || state?.valorBase100 || 2.5);
  const basePromo = Number(state?.valorBasePromo || 2.00);

  for (let [vb, preco] of Object.entries(TABELA_PRECOS_ESPECIAIS)) {
    if (Math.abs(Number(preco) - val) <= 0.20) {
      return Number(vb);
    }
  }

  if (modo === 'global_promo') {
    return Math.round((val / baseNormal) * 100);
  }

  if (modo === 'volume_promo') {
    const limiteVolume = Number(state?.limiteVolumePromo || 1500);
    const precoLimite = (limiteVolume / 100) * basePromo;
    if (val >= precoLimite) {
      return Math.round((val / basePromo) * 100);
    }
  }

  return Math.round((val / baseNormal) * 100);
}

function totais() {
  let t = {};
  (state?.contas || []).forEach(c => (t[c.nome] = 0));
  (state?.vendas || []).forEach(v => (t[v.conta] = (t[v.conta] || 0) + Number(v.valor || 0)));
  return t;
}

function parseItemString(str) {
  const s = String(str || "").trim();
  const sep = s.indexOf("–") >= 0 ? "–" : (s.indexOf("-") >= 0 ? "-" : null);
  
  if (!sep) return { tipo: "Outro", nome: s };
  
  let partes = s.split(sep);
  let match = CATEGORIAS_ITENS.find(c => c.toLowerCase() === partes[0].trim().toLowerCase());
  
  return match
    ? { tipo: match, nome: partes.slice(1).join(sep).trim() }
    : { tipo: "Outro", nome: s };
}

function formatItemString(tipo, nome) {
  const t = String(tipo || "").trim();
  const n = String(nome || "").trim();
  return !t ? n : `${t} – ${n}`;
}

function extrairApenasNomeItem(itemStr) {
  if (!itemStr) return "";
  if (typeof itemStr === 'object') return itemStr.nome || "";
  let { nome } = parseItemString(itemStr);
  return nome || itemStr;
}