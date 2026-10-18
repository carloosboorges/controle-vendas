// ==========================================
// MÓDULO DE CORE (Estado Global e Utilitários)
// ==========================================

const SUPABASE_URL = "https://oyitmutmtvuoynwhiymy.supabase.co";
const SUPABASE_KEY = "sb_publishable_6e1fQtQfhVa8LjWUbdPrJw_IwhhxLRF";
const CATEGORIAS_ITENS = ["Traje", "Gesto", "Picareta", "Música", "Pacote", "Pacotão", "Asa-delta", "Envelopamento", "Calçado", "Acessório", "Carro", "Mascote", "Outro"];
const MARGEM_LUCRO = 100 / 310;
const MARGEM_CUSTO = 210 / 310;

let ultimoValorSugeridoAuto = 0; 

// 🚀 A TABELA VICIADA FOI MORTA AQUI! Agora o sistema é obrigado a fazer matemática exata!
const TABELA_PRECOS_ESPECIAIS = {};

const DADOS_DEMO = {
  contas: [
    { nome: "Putz0101", ativa: true, usadas: 0, vbucks: 10000 },
    { nome: "Putz0202", ativa: true, usadas: 0, vbucks: 8500 }
  ],
  vendas: [],
  reservas: [],
  valorBase100: 2.5,          
  valorBasePromo: 2.00,       
  modoPrecificacao: "padrao",   
  limiteVolumePromo: 1500,     
  modoVolumeRegra: "individual", 
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

async function copiarTexto(texto, tipoLabel = "Texto", evento = null) {
  if (evento) {
      evento.preventDefault();
      evento.stopPropagation();
  }

  if (!texto || texto === "—") {
      mostrarNotificacao(`Não há ${tipoLabel} para copiar!`, "erro");
      return;
  }

  const msgSucesso = () => {
    if (tipoLabel === 'E-mail') mostrarNotificacao("📋 E-mail copiado!", "sucesso");
    else if (tipoLabel === 'Senha') mostrarNotificacao("📋 Senha copiada!", "sucesso");
    else mostrarNotificacao(`📋 ${tipoLabel} copiado: "${texto}"`, "sucesso");
  };

  const forceCopy = () => {
      try {
          const t = document.createElement("textarea");
          t.value = texto;
          t.style.position = "fixed";
          t.style.opacity = "0";
          document.body.appendChild(t);
          t.focus();
          t.select();
          const worked = document.execCommand("copy");
          document.body.removeChild(t);
          if (worked) msgSucesso();
          else mostrarNotificacao("Não foi possível copiar.", "erro");
      } catch (err) {
          mostrarNotificacao("Não foi possível copiar.", "erro");
      }
  };

  if (navigator.clipboard && window.isSecureContext) {
      try {
          await navigator.clipboard.writeText(texto);
          msgSucesso();
      } catch (e) {
          forceCopy();
      }
  } else {
      forceCopy();
  }
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
  if (!state.modoVolumeRegra) state.modoVolumeRegra = "individual";
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

function alterarModoRegraVolume(novoModo) {
  if (!state) return;
  state.modoVolumeRegra = novoModo;
  if (typeof save === 'function') save();
  if (typeof render === 'function') render();
  if (typeof calcularPrecoInteligente === 'function') calcularPrecoInteligente();
  mostrarNotificacao(`Modo de volume alterado para: ${novoModo === 'individual' ? 'Por Item Individual' : 'Soma Acumulada'}`, "sucesso");
}

function calcularPrecoInteligente(vbucks) {
  const inputQtd = document.getElementById("quantidadeInput");
  const qtd = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  
  const itensVbList = [];
  for (let i = 0; i < qtd; i++) {
    const vbInput = document.getElementById(`itemVbucksInput_${i}`);
    if (vbInput && vbInput.value) {
      itensVbList.push(Number(vbInput.value) || 0);
    }
  }

  const vbTotal = itensVbList.reduce((acc, v) => acc + v, 0);
  const vb = itensVbList.length > 0 ? vbTotal : (Number(vbucks) || 0);
  if (vb <= 0) return 0;

  const modo = state?.modoPrecificacao || 'padrao';
  const baseNormal = Number(state?.valorBase100 || 2.5); 
  const basePromo = Number(state?.valorBasePromo || 2.00); 
  const limiteVolume = Number(state?.limiteVolumePromo || 1500); 
  const modoRegraVolume = state?.modoVolumeRegra || 'individual';

  let precoCalculado = 0;

  if (modo === 'volume_promo') {
    if (modoRegraVolume === 'individual' && itensVbList.length > 0) {
      itensVbList.forEach(itemVb => {
        if (itemVb >= limiteVolume) {
          precoCalculado += (itemVb / 100) * basePromo;
        } else {
          precoCalculado += (itemVb / 100) * baseNormal;
        }
      });
    } else {
      if (vb >= limiteVolume) {
        precoCalculado = (vb / 100) * basePromo;
      } else {
        precoCalculado = (vb / 100) * baseNormal;
      }
    }
  } else {
    // PADRÃO OU GLOBAL: MATEMÁTICA EXATA SEMPRE
    precoCalculado = (vb / 100) * baseNormal; 
  }

  const finalValor = Number(precoCalculado.toFixed(2));
  const valorInput = document.getElementById("valorInput");

  if (valorInput) {
    let limpo = String(valorInput.value).replace('R$', '').trim();
    if (limpo.includes(',')) {
        limpo = limpo.replace(/\./g, '').replace(',', '.');
    }
    const valorAtual = parseFloat(limpo) || 0;

    if (valorAtual === 0 || Math.abs(valorAtual - ultimoValorSugeridoAuto) < 0.02) {
      valorInput.value = finalValor.toFixed(2).replace('.', ',');
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

  if (modo === 'volume_promo') {
    const limiteVolume = Number(state?.limiteVolumePromo || 1500);
    const precoLimite = (limiteVolume / 100) * basePromo;
    if (val >= precoLimite) {
      return Math.round((val / basePromo) * 100);
    }
  }

  // CÁLCULO EXATO! 90 reais -> 3600 VB. Nunca mais dará 3800.
  return Math.round((val / baseNormal) * 100);
}

// 🚀 CÁLCULO JUSTO DAS CONTAS: Divide o dinheiro corretamente se os itens saírem de contas diferentes!
function totais() {
  let t = {};
  // Inicializa todas as contas ativas com 0
  (state?.contas || []).forEach(c => (t[c.nome] = 0));
  
  (state?.vendas || []).forEach(v => {
    const valorTotalDaVenda = Number(v.valor || 0);
    
    // Verifica se a venda tem itens detalhados com V-Bucks
    if (v.itens && v.itens.length > 0) {
        const somaVbDosItens = v.itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
        
        if (somaVbDosItens > 0) {
            // Distribui o dinheiro (R$) para cada conta com base no V-Buck que ela enviou
            v.itens.forEach(it => {
                const contaDoItem = it.contaEnvio || v.conta; // Usa a conta do item ou a principal
                const proporcaoEmReais = valorTotalDaVenda * ((Number(it.vbucks) || 0) / somaVbDosItens);
                t[contaDoItem] = (t[contaDoItem] || 0) + proporcaoEmReais;
            });
        } else {
            // Se os itens não tiverem V-Bucks definidos, vai tudo para a conta principal
            t[v.conta] = (t[v.conta] || 0) + valorTotalDaVenda;
        }
    } else {
        // Venda simples (sem itens divididos), vai tudo para a conta principal
        t[v.conta] = (t[v.conta] || 0) + valorTotalDaVenda;
    }
  });
  
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