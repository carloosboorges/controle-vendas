const SUPABASE_URL = "https://oyitmutmtvuoynwhiymy.supabase.co";
const SUPABASE_KEY = "sb_publishable_6e1fQtQfhVa8LjWUbdPrJw_IwhhxLRF";

const CATEGORIAS_ITENS = [
  "Traje",
  "Gesto",
  "Picareta",
  "Música",
  "Pacotão",
  "Asa-delta",
  "Envelopamento",
  "Calçado",
  "Acessório",
  "Carro",
  "Outro"
];

// Margem de lucro contínua baseada no custo de R$ 210 para faturamento de R$ 310 (100 / 310)
const MARGEM_LUCRO = 100 / 310;

const DADOS_DEMO = {
  contas: [
    { nome: "Conta Demo 01", ativa: true, usadas: 0, vbucks: 10000 },
    { nome: "Conta Demo 02", ativa: true, usadas: 0, vbucks: 8500 }
  ],
  vendas: [],
  reservas: [],
  valorBase100: 2.5,
  historicoVendas: [],
  lixeiraVendas: []
};

let currentUser = null;
let authToken = localStorage.getItem("vendas_auth_token") || null;
let refreshToken = localStorage.getItem("vendas_refresh_token") || null;
let state = null;

// Controle do Calendário Personalizado
let calViewMes = new Date().getMonth();
let calViewAno = new Date().getFullYear();
let calPopoverAberto = false;

let diaFiltroSelecionado = null;
let mesFiltroSelecionado = null;
let anoFiltroSelecionado = null;

// Controle de Paginação e Busca do Histórico
const ITENS_POR_PAGINA = 8;
let historicoPaginaAtual = 1;
let historicoTermoBusca = "";

// ==========================================
// FUNÇÃO DE COPIAR TEXTO CIRÚRGICA
// ==========================================
function copiarTexto(texto, tipo = "Texto", event = null) {
  if (event) event.stopPropagation();
  if (!texto || texto === "—") return;
  
  navigator.clipboard.writeText(texto).then(() => {
    mostrarNotificacao(`📋 ${tipo} copiado: "${texto}"`, "sucesso");
  }).catch(() => {
    mostrarNotificacao("Não foi possível copiar automaticamente.", "erro");
  });
}

function extrairApenasNomeItem(itemStr) {
  if (!itemStr) return "";
  const { nome } = parseItemString(itemStr);
  return nome || itemStr;
}

// ==========================================
// CONTROLE DO CALENDÁRIO PERSONALIZADO
// ==========================================
function toggleCalendarioPopover(e) {
  if (e) e.stopPropagation();
  calPopoverAberto = !calPopoverAberto;
  render();
}

function fecharCalendarioPopover() {
  if (calPopoverAberto) {
    calPopoverAberto = false;
    render();
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".period-card-calendar-container")) {
    fecharCalendarioPopover();
  }
});

function navegarMesCalendario(direcao, e) {
  if (e) e.stopPropagation();
  calViewMes += direcao;
  if (calViewMes < 0) {
    calViewMes = 11;
    calViewAno--;
  } else if (calViewMes > 11) {
    calViewMes = 0;
    calViewAno++;
  }
  render();
}

function selecionarDiaCalendario(diaStr, e) {
  if (e) e.stopPropagation();
  diaFiltroSelecionado = diaStr;
  calPopoverAberto = false;
  render();
}

function gerarHtmlCalendarioPopover() {
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
  
  const primeiroDiaSemana = new Date(calViewAno, calViewMes, 1).getDay();
  const totalDiasMes = new Date(calViewAno, calViewMes + 1, 0).getDate();
  
  const hoje = new Date();
  const hojeChave = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
  
  const diasComVendas = new Set((state.historicoVendas || []).map(v => v.data));

  let diasHtml = "";
  for (let i = 0; i < primeiroDiaSemana; i++) {
    diasHtml += `<div class="cal-day-empty"></div>`;
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dataStr = `${String(dia).padStart(2, "0")}/${String(calViewMes + 1).padStart(2, "0")}/${calViewAno}`;
    const dataObj = new Date(calViewAno, calViewMes, dia);
    const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const isFuturo = dataObj > hojeZero;
    const isToday = dataStr === hojeChave;
    const isSelected = dataStr === diaFiltroSelecionado;
    const hasSales = diasComVendas.has(dataStr);

    diasHtml += `
      <button type="button" class="cal-day-btn ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${hasSales ? "has-sales" : ""}"
        ${isFuturo ? "disabled" : ""} onclick="selecionarDiaCalendario('${dataStr}', event)" title="${isToday ? "Hoje" : dataStr}">
        ${dia}
      </button>
    `;
  }

  return `
    <div class="custom-calendar-popover" onclick="event.stopPropagation()">
      <div class="calendar-header-nav">
        <button type="button" class="calendar-nav-btn" onclick="navegarMesCalendario(-1, event)">‹</button>
        <strong>${nomesMeses[calViewMes]} ${calViewAno}</strong>
        <button type="button" class="calendar-nav-btn" onclick="navegarMesCalendario(1, event)">›</button>
      </div>
      <div class="calendar-weekdays-grid">
        ${diasSemana.map(d => `<span>${d}</span>`).join("")}
      </div>
      <div class="calendar-days-grid">
        ${diasHtml}
      </div>
      <div style="font-size:11px; color:var(--muted); text-align:center; margin-top:6px; display:flex; align-items:center; justify-content:center; gap:5px; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">
        <span style="width:6px; height:6px; background:var(--green); border-radius:50%; display:inline-block; box-shadow:0 0 6px var(--green);"></span>
        <span style="font-weight:600;">Com vendas</span>
      </div>
    </div>
  `;
}

// ==========================================
// CONTROLE DE BUSCA & PAGINAÇÃO
// ==========================================
function filtrarHistoricoInput(val) {
  historicoTermoBusca = String(val || "").trim().toLowerCase();
  historicoPaginaAtual = 1;
  const btnClear = document.getElementById("clearSearchBtn");
  if (btnClear) {
    btnClear.style.display = historicoTermoBusca ? "block" : "none";
  }
  render();
}

function limparBuscaHistorico() {
  historicoTermoBusca = "";
  historicoPaginaAtual = 1;
  const input = document.getElementById("historySearchInput");
  if (input) input.value = "";
  const btnClear = document.getElementById("clearSearchBtn");
  if (btnClear) btnClear.style.display = "none";
  render();
}

function mudarPaginaHistorico(p) {
  historicoPaginaAtual = p;
  render();
  const sec = document.querySelector(".history-search-bar-box");
  if (sec) sec.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ==========================================
// PREVIEW DINÂMICO DE V-BUCKS
// ==========================================
function atualizarPreviewVBucks() {
  const input = document.getElementById("valorInput");
  const badge = document.getElementById("valorVbucksPreview");
  if (!badge) return;

  const val = parseFloat(input?.value) || 0;
  const base = Number(state?.valorBase100 || 2.5);
  const vb = val > 0 ? Math.round((val / base) * 100) : 0;
  badge.textContent = `🪙 ${vb.toLocaleString("pt-BR")} V-Bucks`;
}

function atualizarPreviewVBucksEdicao() {
  const input = document.getElementById("editValorInput");
  const badge = document.getElementById("editVbucksPreview");
  if (!badge) return;

  const val = parseFloat(input?.value) || 0;
  const base = Number(state?.valorBase100 || 2.5);
  const vb = val > 0 ? Math.round((val / base) * 100) : 0;
  badge.textContent = `🪙 ${vb.toLocaleString("pt-BR")} V-Bucks`;
}

// ==========================================
// NOTIFICAÇÕES TOAST
// ==========================================
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

// ==========================================
// MODAL DE CONFIRMAÇÃO GENÉRICO
// ==========================================
let pendingConfirmCallback = null;

function abrirModalConfirmacao(titulo, descricao, onConfirm) {
  const modal = document.getElementById("genericConfirmModal");
  const titleEl = document.getElementById("genericConfirmTitle");
  const descEl = document.getElementById("genericConfirmDesc");
  const okBtn = document.getElementById("genericConfirmOkBtn");

  if (titleEl) titleEl.textContent = titulo;
  if (descEl) descEl.textContent = descricao;

  pendingConfirmCallback = onConfirm;
  okBtn.onclick = () => {
    const cb = pendingConfirmCallback;
    fecharModalConfirmacao();
    if (typeof cb === "function") {
      cb();
    }
  };

  if (modal) modal.style.display = "flex";
}

function fecharModalConfirmacao() {
  const modal = document.getElementById("genericConfirmModal");
  if (modal) modal.style.display = "none";
  pendingConfirmCallback = null;
}

// ==========================================
// MODAL ALTERAR VALOR BASE
// ==========================================
function abrirModalValorBase() {
  const modal = document.getElementById("valorBaseModal");
  const input = document.getElementById("novoValorBaseInput");
  if (input) input.value = Number(state?.valorBase100 || 2.5).toFixed(2);
  if (modal) modal.style.display = "flex";
}

function fecharModalValorBase() {
  const modal = document.getElementById("valorBaseModal");
  if (modal) modal.style.display = "none";
}

function salvarValorBaseModal() {
  const input = document.getElementById("novoValorBaseInput");
  const valor = parseFloat(input?.value);

  if (!Number.isFinite(valor) || valor <= 0) {
    mostrarNotificacao("Digite um valor válido maior que zero.", "erro");
    return;
  }

  const atual = state.valorBase100 || 2.5;

  if (Array.isArray(state.historicoVendas)) {
    state.historicoVendas.forEach(v => {
      if (v.vbucks === undefined) {
        v.vbucks = valorParaVBucks(v.valor, v.valorBaseMomento || atual);
        v.valorBaseMomento = v.valorBaseMomento || atual;
      }
    });
  }
  if (Array.isArray(state.vendas)) {
    state.vendas.forEach(v => {
      if (v.vbucks === undefined) {
        v.vbucks = valorParaVBucks(v.valor, v.valorBaseMomento || atual);
        v.valorBaseMomento = v.valorBaseMomento || atual;
      }
    });
  }

  state.valorBase100 = Math.round(valor * 100) / 100;
  save();
  atualizarPreviewVBucks();
  fecharModalValorBase();
  mostrarNotificacao(`Valor base alterado para ${money(state.valorBase100)}!`, "sucesso");
}

// ==========================================
// MODAL ADICIONAR CONTA
// ==========================================
function abrirModalAddConta() {
  const modal = document.getElementById("addContaModal");
  const nomeInput = document.getElementById("novaContaNomeInput");
  const vbInput = document.getElementById("novaContaVbucksInput");
  if (nomeInput) nomeInput.value = "";
  if (vbInput) vbInput.value = "0";
  if (modal) modal.style.display = "flex";
}

function fecharModalAddConta() {
  const modal = document.getElementById("addContaModal");
  if (modal) modal.style.display = "none";
}

function salvarNovaContaModal() {
  const nomeInput = document.getElementById("novaContaNomeInput");
  const vbInput = document.getElementById("novaContaVbucksInput");
  const nome = nomeInput?.value.trim();
  const vbucks = parseInt(String(vbInput?.value || "0").replace(/\D/g, ""), 10) || 0;

  if (!nome) {
    mostrarNotificacao("Digite o nome ou nick da conta.", "erro");
    return;
  }

  if (state.contas.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
    mostrarNotificacao("Já existe uma conta com esse nome.", "erro");
    return;
  }

  state.contas.push({ nome, ativa: false, vbucks: Number(vbucks) || 0 });
  save();
  fecharModalAddConta();
  mostrarNotificacao(`Conta ${nome} adicionada com sucesso!`, "sucesso");
}

// ==========================================
// MODAL EDITAR CONTA & RECARGA RÁPIDA
// ==========================================
function abrirModalEditConta(i) {
  const conta = state.contas[i];
  if (!conta) return;

  document.getElementById("editContaIndex").value = i;
  document.getElementById("editContaNomeInput").value = conta.nome;
  document.getElementById("editContaVbucksInput").value = Number(conta.vbucks) || 0;
  
  const somarInput = document.getElementById("editContaSomarVbucksInput");
  if (somarInput) somarInput.value = "";

  const modal = document.getElementById("editContaModal");
  if (modal) modal.style.display = "flex";
}

function fecharModalEditConta() {
  const modal = document.getElementById("editContaModal");
  if (modal) modal.style.display = "none";
}

function somarPacoteRapido(qtd) {
  const saldoInput = document.getElementById("editContaVbucksInput");
  if (!saldoInput) return;
  const atual = parseInt(String(saldoInput.value || "0").replace(/\D/g, ""), 10) || 0;
  saldoInput.value = atual + qtd;
  mostrarNotificacao(`+${qtd.toLocaleString("pt-BR")} V-Bucks somados ao saldo!`, "sucesso");
}

function aplicarSomaVbucksModal() {
  const saldoInput = document.getElementById("editContaVbucksInput");
  const somarInput = document.getElementById("editContaSomarVbucksInput");
  if (!saldoInput || !somarInput) return;

  const saldoAtual = parseInt(String(saldoInput.value || "0").replace(/\D/g, ""), 10) || 0;
  const valorSomar = parseInt(String(somarInput.value || "0").replace(/\D/g, ""), 10) || 0;

  if (valorSomar > 0) {
    saldoInput.value = saldoAtual + valorSomar;
    somarInput.value = "";
    mostrarNotificacao(`+${valorSomar.toLocaleString("pt-BR")} V-Bucks somados ao saldo!`, "sucesso");
  } else {
    mostrarNotificacao("Digite uma quantidade válida para somar.", "info");
  }
}

function salvarEdicaoContaModal() {
  const i = parseInt(document.getElementById("editContaIndex").value, 10);
  const conta = state.contas[i];
  if (!conta) return;

  const novoNome = document.getElementById("editContaNomeInput").value.trim();
  const novoVbucks = parseInt(String(document.getElementById("editContaVbucksInput").value || "0").replace(/\D/g, ""), 10);

  if (!novoNome) {
    mostrarNotificacao("O nome da conta não pode ficar vazio.", "erro");
    return;
  }
  if (!Number.isFinite(novoVbucks) || novoVbucks < 0) {
    mostrarNotificacao("Quantidade de V-Bucks inválida.", "erro");
    return;
  }

  const existe = state.contas.some((c, idx) => idx !== i && c.nome.toLowerCase() === novoNome.toLowerCase());
  if (existe) {
    mostrarNotificacao("Já existe outra conta com esse nome.", "erro");
    return;
  }

  const nomeAntigo = conta.nome;
  conta.nome = novoNome;
  conta.vbucks = Number(novoVbucks) || 0;

  if (nomeAntigo !== novoNome) {
    state.vendas.forEach(v => { if (v.conta === nomeAntigo) v.conta = novoNome; });
    state.historicoVendas.forEach(v => { if (v.conta === nomeAntigo) v.conta = novoNome; });
    state.reservas.forEach(r => { if (r.conta === nomeAntigo) r.conta = novoNome; });
  }

  save();
  fecharModalEditConta();
  mostrarNotificacao(`Dados da conta ${conta.nome} atualizados! Saldo: ${formatVBucks(conta.vbucks)} VB`, "sucesso");
}

// ==========================================
// AUTENTICAÇÃO E SESSÃO PERSISTENTE
// ==========================================
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
  const modal = document.getElementById("authModal");
  if (modal) modal.style.display = "flex";

  const salvoEmail = localStorage.getItem("vendas_saved_email") || "";
  const salvoPass = localStorage.getItem("vendas_saved_pass") || "";
  const checkLembrar = document.getElementById("lembrarCredenciais");

  if (salvoEmail && salvoPass) {
    document.getElementById("authEmail").value = salvoEmail;
    document.getElementById("authPassword").value = salvoPass;
    if (checkLembrar) checkLembrar.checked = true;
  }

  atualizarInterfaceAuth();
}

function fecharModalAuth() {
  const modal = document.getElementById("authModal");
  if (modal) modal.style.display = "none";
}

async function fazerLogin() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const lembrar = document.getElementById("lembrarCredenciais")?.checked;

  if (!email || !password) {
    mostrarNotificacao("Preencha o e-mail e a senha.", "erro");
    return;
  }

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
      mostrarNotificacao("Falha no login: credenciais inválidas.", "erro");
      return;
    }

    if (lembrar) {
      localStorage.setItem("vendas_saved_email", email);
      localStorage.setItem("vendas_saved_pass", password);
    } else {
      localStorage.removeItem("vendas_saved_email");
      localStorage.removeItem("vendas_saved_pass");
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
    console.error("Erro no login:", err);
    mostrarNotificacao("Erro ao conectar com o serviço de login.", "erro");
  }
}

function fazerLogout() {
  authToken = null;
  refreshToken = null;
  currentUser = null;
  localStorage.removeItem("vendas_auth_token");
  localStorage.removeItem("vendas_refresh_token");
  fecharModalAuth();
  mostrarNotificacao("Você saiu da conta.", "info");
  inicializar();
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
      localStorage.setItem("vendas_refresh_token", refreshToken);
      return true;
    }
  } catch (e) {
    console.error("Erro ao renovar token:", e);
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

async function inicializar() {
  const footer = document.getElementById("statusFooter");
  await verificarSessao();
  atualizarInterfaceAuth();
  atualizarCamposItens();
  atualizarPreviewVBucks();

  if (!currentUser) {
    if (footer) footer.textContent = "👀 Modo Visitante (Alterações locais de teste — não afetam o banco)";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    render();
    return;
  }

  try {
    if (footer) footer.textContent = "☁️ Carregando dados da nuvem...";

    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.1&select=*`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });

    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
      state = rows[0].data;
    } else {
      state = JSON.parse(JSON.stringify(DADOS_DEMO));
    }

    sanitizarDados();
    if (footer) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
    render();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    if (footer) footer.textContent = "⚠️ Erro ao sincronizar dados com o banco";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    render();
  }
}

function sanitizarDados() {
  if (!state) return;
  if (!Array.isArray(state.lixeiraVendas)) state.lixeiraVendas = [];
  if (Array.isArray(state.contas)) {
    state.contas.forEach(c => {
      c.vbucks = Number(c.vbucks) || 0;
    });
  }
  if (Array.isArray(state.vendas)) {
    state.vendas.forEach(v => {
      v.valor = Number(v.valor) || 0;
      if (v.vbucks !== undefined) v.vbucks = Number(v.vbucks) || 0;
    });
  }
  if (Array.isArray(state.historicoVendas)) {
    state.historicoVendas.forEach(v => {
      v.valor = Number(v.valor) || 0;
      if (v.vbucks !== undefined) v.vbucks = Number(v.vbucks) || 0;
    });
  }
  if (Array.isArray(state.lixeiraVendas)) {
    state.lixeiraVendas.forEach(v => {
      v.valor = Number(v.valor) || 0;
      if (v.vbucks !== undefined) v.vbucks = Number(v.vbucks) || 0;
    });
  }
}

async function save() {
  sanitizarDados();
  render();
  const footer = document.getElementById("statusFooter");

  if (!currentUser) {
    if (footer) footer.textContent = "👀 Modo Visitante (Alterações locais temporárias)";
    return;
  }

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
  } catch (err) {
    console.error("Erro ao salvar:", err);
    if (footer) footer.textContent = "⚠️ Erro ao salvar na nuvem";
  }
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
  let s = Math.ceil(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  s %= 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function valorParaVBucks(valor, baseCustom) {
  const base = Number(baseCustom || state?.valorBase100 || 2.5);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.round((Number(valor) / base) * 100);
}

function formatVBucks(v) {
  return Math.max(0, Math.round(Number(v) || 0)).toLocaleString("pt-BR");
}

function money(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

// Calcula faturamento acumulado por conta em todo o histórico
function totaisHistoricoPorConta() {
  let t = {};
  (state.contas || []).forEach(c => (t[c.nome] = 0));
  (state.historicoVendas || []).forEach(v => {
    t[v.conta] = (t[v.conta] || 0) + Number(v.valor || 0);
  });
  return t;
}

function totais() {
  let t = {};
  (state.contas || []).forEach(c => (t[c.nome] = 0));
  (state.vendas || []).forEach(v => (t[v.conta] = (t[v.conta] || 0) + Number(v.valor || 0)));
  return t;
}

function mudarMesFiltro(val) {
  mesFiltroSelecionado = val;
  diaFiltroSelecionado = null;
  render();
}

function mudarAnoFiltro(val) {
  anoFiltroSelecionado = val;
  render();
}

function parseItemString(str) {
  const s = String(str || "").trim();
  const sep = s.indexOf("–") >= 0 ? "–" : (s.indexOf("-") >= 0 ? "-" : null);
  if (!sep) return { tipo: "Outro", nome: s };
  
  const partes = s.split(sep);
  const tipoCandidato = partes[0].trim();
  const nomeCandidato = partes.slice(1).join(sep).trim();

  const match = CATEGORIAS_ITENS.find(c => c.toLowerCase() === tipoCandidato.toLowerCase());
  if (match) {
    return { tipo: match, nome: nomeCandidato };
  }
  return { tipo: "Outro", nome: s };
}

function formatItemString(tipo, nome) {
  const t = String(tipo || "").trim();
  const n = String(nome || "").trim();
  if (!t || t === "Outro") return n;
  return `${t} – ${n}`;
}

function atualizarCamposItens() {
  const qtd = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const container = document.getElementById("itensGroupContainer");
  if (!container) return;

  const optionsHtml = CATEGORIAS_ITENS.map(c => `<option value="${c}">${c}</option>`).join("");

  container.innerHTML = Array.from({ length: qtd }, (_, i) => `
    <div class="item-picker-box">
      <label>Item ${qtd > 1 ? i + 1 : "Vendido"}</label>
      <div class="item-picker-row">
        <select class="item-type-select" id="itemTypeSelect_${i}">
          ${optionsHtml}
        </select>
        <input class="item-name-input" id="itemNameInput_${i}" type="text" maxlength="120" placeholder="Nome do item (Ex.: Remexa o Esqueleto)">
      </div>
    </div>
  `).join("");
}

function obterItensDaVenda() {
  const qtd = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const lista = [];

  for (let i = 0; i < qtd; i++) {
    const tipo = document.getElementById(`itemTypeSelect_${i}`)?.value || "Outro";
    const nome = document.getElementById(`itemNameInput_${i}`)?.value.trim() || "";
    if (nome) {
      lista.push(formatItemString(tipo, nome));
    }
  }

  return lista;
}

function render() {
  if (!state) return;

  const baseEl = document.getElementById("valorBaseDisplay");
  if (baseEl) baseEl.textContent = money(state.valorBase100 || 2.5);

  limparReservasExpiradas();
  const tSessao = totais(),
    totalSessao = (state.vendas || []).reduce((a, v) => a + Number(v.valor || 0), 0);

  document.getElementById("totalGeral").textContent = money(totalSessao);
  
  const qtdPedidosSessao = (state.vendas || []).length;
  const qtdItensSessao = (state.vendas || []).reduce((a, v) => a + (Number(v.quantidade) || 1), 0);
  document.getElementById("qtdVendas").textContent = `${qtdPedidosSessao} (${qtdItensSessao} itens)`;

  let top = "—", tv = 0;
  Object.entries(tSessao).forEach(([n, v]) => {
    if (v > tv) {
      top = n;
      tv = v;
    }
  });
  document.getElementById("topConta").textContent = tv ? `${top} — ${money(tv)}` : "—";

  const sel = document.getElementById("contaSelect");
  const old = sel.value;
  sel.innerHTML = (state.contas || [])
    .filter(c => c.ativa)
    .map(c => `<option value="${esc(c.nome)}">${esc(c.nome)}</option>`)
    .join("");
  if ([...sel.options].some(o => o.value === old)) sel.value = old;

  renderContasCards();

  document.getElementById("contas").innerHTML = (state.contas || [])
    .map(
      (c, i) => `
    <div class="account-row">
      <div class="account-info">
        <div class="account-header-line">
          <div class="account-name">${esc(c.nome)}</div>
          <span class="badge ${c.ativa ? "" : "off"}">${c.ativa ? "🟢 ATIVA" : "⚫ DESATIVADA"}</span>
        </div>
        <div class="small">${c.ativa ? `Saldo: ${formatVBucks(c.vbucks)} V-Bucks · Disponível` : "Desativada — ative para utilizar"}</div>
      </div>
      <div class="account-actions">
        <button type="button" class="btn-gray" onclick="abrirModalEditConta(${i})">✏️ Editar</button>
        <button type="button" class="${c.ativa ? "btn-gray" : "btn-green"}" onclick="toggleConta(${i})">${c.ativa ? "Desativar" : "Ativar"}</button>
        <button type="button" class="btn-danger" onclick="removerConta(${i})">🗑️ Remover</button>
      </div>
    </div>`
    )
    .join("");

  const totalHistorico = (state.historicoVendas || []).reduce((s, v) => s + Number(v.valor || 0), 0);
  const totalPedidosHistorico = (state.historicoVendas || []).length;
  const totalItensHistorico = (state.historicoVendas || []).reduce((s, v) => s + (Number(v.quantidade) || 1), 0);

  const historicoQtdTotalEl = document.getElementById("historicoQtdTotal");
  if (historicoQtdTotalEl) {
    historicoQtdTotalEl.textContent = `${totalPedidosHistorico} ${totalPedidosHistorico === 1 ? "pedido" : "pedidos"} · ${totalItensHistorico} ${totalItensHistorico === 1 ? "item enviado" : "itens enviados"}`;
  }

  const historicoTotalEl = document.getElementById("historicoTotal");
  if (historicoTotalEl) historicoTotalEl.textContent = `Total do histórico: ${money(totalHistorico)}`;

  const lixeiraBtn = document.getElementById("lixeiraBtn");
  const qtdLixeira = (state.lixeiraVendas || []).length;
  if (lixeiraBtn) lixeiraBtn.textContent = `🗑️ Lixeira (${qtdLixeira})`;

  const historico = state.historicoVendas || [];
  const agoraData = new Date();
  const chaveData = v => {
    const partes = String(v.data || "").split("/");
    if (partes.length !== 3) return null;
    const d = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const inicioSemana = d => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dia = x.getDay();
    const dif = dia === 0 ? -6 : 1 - dia;
    x.setDate(x.getDate() + dif);
    return x;
  };

  // Funções de agregação dos cards de período
  const somaFiltro = fn => historico.filter(fn).reduce((s, v) => s + Number(v.valor || 0), 0);
  const somaVbucksFiltro = fn => historico.filter(fn).reduce((s, v) => s + (v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento)), 0);
  const qtdPedidosFiltro = fn => historico.filter(fn).length;
  const qtdItensFiltro = fn => historico.filter(fn).reduce((s, v) => s + (Number(v.quantidade) || 1), 0);

  // 1. DATA SELECIONADA DO CALENDÁRIO
  const hojeChave = `${String(agoraData.getDate()).padStart(2, "0")}/${String(agoraData.getMonth() + 1).padStart(2, "0")}/${agoraData.getFullYear()}`;
  if (!diaFiltroSelecionado) {
    diaFiltroSelecionado = hojeChave;
  }

  const diaTotal = somaFiltro(v => v.data === diaFiltroSelecionado);
  const diaVbucks = somaVbucksFiltro(v => v.data === diaFiltroSelecionado);
  const diaPedidos = qtdPedidosFiltro(v => v.data === diaFiltroSelecionado);
  const diaItens = qtdItensFiltro(v => v.data === diaFiltroSelecionado);

  // 2. SEMANA
  const semInicio = inicioSemana(agoraData);
  const semFim = new Date(semInicio);
  semFim.setDate(semFim.getDate() + 7);
  const semanaTotal = somaFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });

  // 3. MÊS
  const nomesMes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const mapaMeses = {};
  const mesAtualKey = `${String(agoraData.getMonth() + 1).padStart(2, "0")}/${agoraData.getFullYear()}`;
  mapaMeses[mesAtualKey] = `${nomesMes[agoraData.getMonth()]} ${agoraData.getFullYear()}`;

  historico.forEach(v => {
    const d = chaveData(v);
    if (d) {
      const k = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      mapaMeses[k] = `${nomesMes[d.getMonth()]} ${d.getFullYear()}`;
    }
  });

  if (!mesFiltroSelecionado || !mapaMeses[mesFiltroSelecionado]) {
    mesFiltroSelecionado = mesAtualKey;
  }

  const [selM, selA] = mesFiltroSelecionado.split("/").map(Number);
  const mesTotal = somaFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });

  // 4. ANO
  const setAnos = new Set();
  setAnos.add(String(agoraData.getFullYear()));
  historico.forEach(v => {
    const d = chaveData(v);
    if (d) setAnos.add(String(d.getFullYear()));
  });

  const anosLista = Array.from(setAnos).sort((a, b) => Number(b) - Number(a));
  if (!anoFiltroSelecionado || !setAnos.has(anoFiltroSelecionado)) {
    anoFiltroSelecionado = String(agoraData.getFullYear());
  }

  const selAnoNum = Number(anoFiltroSelecionado);
  const anoTotal = somaFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });

  // ==========================================
  // 5. CÁLCULO DO LUCRO CONTÍNUO (32,26%)
  // ==========================================
  const lucroContinuoTotal = totalHistorico * MARGEM_LUCRO;

  const lucroAlertEl = document.getElementById("lucroMetaAlert");
  if (lucroAlertEl) {
    lucroAlertEl.style.display = "none";
  }

  const periodosEl = document.getElementById("historicoPeriodos");
  if (periodosEl) {
    const optionsMesHtml = Object.entries(mapaMeses)
      .map(([k, label]) => `<option value="${k}" ${k === mesFiltroSelecionado ? "selected" : ""}>${label}</option>`)
      .join("");

    const optionsAnoHtml = anosLista
      .map(a => `<option value="${a}" ${a === anoFiltroSelecionado ? "selected" : ""}>Ano ${a}</option>`)
      .join("");

    periodosEl.innerHTML = `
    <!-- Card 1: Calendário Popover Personalizado -->
    <div class="period-card period-card-calendar-container" style="position:relative; cursor:pointer;" onclick="toggleCalendarioPopover(event)">
      <div class="period-header-select">
        <span>📅</span>
        <strong style="font-size:12px; color:var(--accent-light);">${diaFiltroSelecionado === hojeChave ? `Hoje (${diaFiltroSelecionado.slice(0, 5)})` : diaFiltroSelecionado} ▾</strong>
      </div>
      <strong>${money(diaTotal)}</strong>
      <small>${diaPedidos} ${diaPedidos === 1 ? "pedido" : "pedidos"} (${diaItens} ${diaItens === 1 ? "item" : "itens"})</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(diaVbucks)} V-Bucks</small>
      ${calPopoverAberto ? gerarHtmlCalendarioPopover() : ""}
    </div>

    <!-- Card 2: Esta Semana -->
    <div class="period-card">
      <span>📅 Esta semana</span>
      <strong>${money(semanaTotal)}</strong>
      <small>${semanaPedidos} ${semanaPedidos === 1 ? "pedido" : "pedidos"} (${semanaItens} ${semanaItens === 1 ? "item" : "itens"})</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(semanaVbucks)} V-Bucks</small>
    </div>

    <!-- Card 3: Mês Selecionado -->
    <div class="period-card period-card-select">
      <div class="period-header-select">
        <span>🗓️</span>
        <select class="period-select" onchange="mudarMesFiltro(this.value)">
          ${optionsMesHtml}
        </select>
      </div>
      <strong>${money(mesTotal)}</strong>
      <small>${mesPedidos} ${mesPedidos === 1 ? "pedido" : "pedidos"} (${mesItens} ${mesItens === 1 ? "item" : "itens"})</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(mesVbucks)} V-Bucks</small>
    </div>

    <!-- Card 4: Ano Selecionado -->
    <div class="period-card period-card-select">
      <div class="period-header-select">
        <span>📆</span>
        <select class="period-select" onchange="mudarAnoFiltro(this.value)">
          ${optionsAnoHtml}
        </select>
      </div>
      <strong>${money(anoTotal)}</strong>
      <small>${anoPedidos} ${anoPedidos === 1 ? "pedido" : "pedidos"} (${anoItens} ${anoItens === 1 ? "item" : "itens"})</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(anoVbucks)} V-Bucks</small>
    </div>

    <!-- Card 5: Lucro Total Contínuo (Limpo) -->
    <div class="period-card profit-card">
      <span>📈 Lucro Líquido</span>
      <strong>${money(lucroContinuoTotal)}</strong>
      <small style="color:var(--green); font-weight:700;">Margem real: 32,26%</small>
      <small>Total bruto: ${money(totalHistorico)}</small>
    </div>
  `;
  }

  // ==========================================
  // MOTOR DE BUSCA UNIVERSAL NO HISTÓRICO
  // ==========================================
  const totalOriginal = historico.length;
  
  const listaComIndices = historico.map((v, originalIdx) => ({
    ...v,
    originalIdx,
    numeroPedido: `#${String(originalIdx + 1).padStart(2, "0")}`,
    numeroPuro: String(originalIdx + 1)
  })).reverse();

  let listaFiltrada = listaComIndices;

  if (historicoTermoBusca) {
    const termo = historicoTermoBusca.replace("#", "").trim();
    listaFiltrada = listaComIndices.filter(v => {
      const vb = String(v.vbucks !== undefined ? v.vbucks : valorParaVBucks(v.valor, v.valorBaseMomento));
      const vbFormat = formatVBucks(vb).toLowerCase();
      const valReal = String(v.valor || "").replace(".", ",");
      const valPuro = String(v.valor || "");
      const itensStr = Array.isArray(v.itens) ? v.itens.join(" ").toLowerCase() : String(v.item || "").toLowerCase();

      return (
        v.numeroPedido.toLowerCase().includes(historicoTermoBusca) ||
        v.numeroPuro === termo ||
        String(v.cliente || "").toLowerCase().includes(historicoTermoBusca) ||
        String(v.nickCliente || "").toLowerCase().includes(historicoTermoBusca) ||
        String(v.conta || "").toLowerCase().includes(historicoTermoBusca) ||
        String(v.data || "").toLowerCase().includes(historicoTermoBusca) ||
        itensStr.includes(historicoTermoBusca) ||
        vb === termo ||
        vbFormat.includes(historicoTermoBusca) ||
        valReal.includes(historicoTermoBusca) ||
        valPuro.includes(historicoTermoBusca)
      );
    });
  }

  // ==========================================
  // PAGINAÇÃO (8 POR PÁGINA)
  // ==========================================
  const totalItensFiltrados = listaFiltrada.length;
  const totalPaginas = Math.ceil(totalItensFiltrados / ITENS_POR_PAGINA) || 1;

  if (historicoPaginaAtual > totalPaginas) {
    historicoPaginaAtual = totalPaginas;
  }
  if (historicoPaginaAtual < 1) {
    historicoPaginaAtual = 1;
  }

  const inicioIdx = (historicoPaginaAtual - 1) * ITENS_POR_PAGINA;
  const fimIdx = inicioIdx + ITENS_POR_PAGINA;
  const itensPagina = listaFiltrada.slice(inicioIdx, fimIdx);

  const historicoContainer = document.getElementById("historico");
  if (historicoContainer) {
    if (itensPagina.length === 0) {
      historicoContainer.innerHTML = historicoTermoBusca
        ? `<div class="empty">Nenhuma venda encontrada para a busca "<b>${esc(historicoTermoBusca)}</b>".</div>`
        : `<div class="empty">Nenhuma venda registrada ainda.</div>`;
    } else {
      historicoContainer.innerHTML = itensPagina.map(v => {
        const itensCount = v.quantidade || 1;
        const vb = v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
        
        const itensListHtml = Array.isArray(v.itens) && v.itens.length
          ? v.itens.map((itemStr, n) => {
              const apenasNome = extrairApenasNomeItem(itemStr);
              return `${n === 0 ? "" : "<br>"}🎁 ${n + 1}. <span class="copyable-text" onclick="copiarTexto('${esc(apenasNome)}', 'Item', event)" title="Clique para copiar apenas: ${esc(apenasNome)}">${esc(itemStr)}</span>`;
            }).join("")
          : `🎁 <span class="copyable-text" onclick="copiarTexto('${esc(extrairApenasNomeItem(v.item || ""))}', 'Item', event)" title="Clique para copiar apenas: ${esc(extrairApenasNomeItem(v.item || ""))}">${esc(v.item || "Item não informado")}</span>`;

        return `<div class="history-card">
          <div class="history-main">
            <div class="history-number">${v.numeroPedido}</div>
            <div class="history-info">
              <div class="history-account">
                <span class="copyable-text" onclick="copiarTexto('${esc(v.conta)}', 'Conta', event)" title="Clique para copiar a conta">${esc(v.conta)}</span>
              </div>
              <div class="history-client">
                👤 <span class="copyable-text" onclick="copiarTexto('${esc(v.cliente)}', 'Nome do Cliente', event)" title="Clique para copiar o nome">${esc(v.cliente || "Cliente não informado")}</span>
              </div>
              <div class="history-client">
                🎮 <span class="copyable-text" onclick="copiarTexto('${esc(v.nickCliente)}', 'Nick do Cliente', event)" title="Clique para copiar o nick">${esc(v.nickCliente || "Nick não informado")}</span>
              </div>
              <div class="history-item">
                ${itensListHtml}
              </div>
              <div class="history-date">📅 ${esc(v.data || "—")} às ${esc(v.hora || "—")}</div>
            </div>
            <div class="history-value">${money(v.valor)}</div>
          </div>
          <div class="history-details">
            <span>🎁 ${itensCount} ${itensCount === 1 ? "item" : "itens"}</span>
            <span>🪙 ${formatVBucks(vb)} V-Bucks</span>
            <div class="history-actions">
              <button type="button" class="btn-gray" onclick="abrirModalEdicaoPorId('${esc(v.id)}')">✏️ Editar</button>
              <button type="button" class="btn-danger" onclick="excluirHistoricoPorId('${esc(v.id)}')">🗑️ Excluir</button>
            </div>
          </div>
        </div>`;
      }).join("");
    }
  }

  const paginacaoContainer = document.getElementById("historyPagination");
  if (paginacaoContainer) {
    if (totalItensFiltrados === 0) {
      paginacaoContainer.innerHTML = "";
    } else {
      let botoesPaginasHtml = "";
      
      for (let p = 1; p <= totalPaginas; p++) {
        if (
          p === 1 || 
          p === totalPaginas || 
          (p >= historicoPaginaAtual - 1 && p <= historicoPaginaAtual + 1)
        ) {
          botoesPaginasHtml += `
            <button type="button" class="pagination-btn ${p === historicoPaginaAtual ? "active" : ""}" onclick="mudarPaginaHistorico(${p})">${p}</button>
          `;
        } else if (
          p === historicoPaginaAtual - 2 || 
          p === historicoPaginaAtual + 2
        ) {
          botoesPaginasHtml += `<span style="color:var(--muted); font-size:12px; padding:0 2px;">...</span>`;
        }
      }

      const exibindoQtd = itensPagina.length;
      paginacaoContainer.innerHTML = `
        <div class="pagination-controls-row">
          <button type="button" class="pagination-btn" ${historicoPaginaAtual === 1 ? "disabled" : ""} onclick="mudarPaginaHistorico(${historicoPaginaAtual - 1})">‹ Anterior</button>
          ${botoesPaginasHtml}
          <button type="button" class="pagination-btn" ${historicoPaginaAtual === totalPaginas ? "disabled" : ""} onclick="mudarPaginaHistorico(${historicoPaginaAtual + 1})">Próxima ›</button>
        </div>
        <div class="pagination-info-text">
          Página ${historicoPaginaAtual} de ${totalPaginas} · Exibindo ${exibindoQtd} de ${totalItensFiltrados} vendas${historicoTermoBusca ? ` (Filtrado de ${totalOriginal})` : ""}
        </div>
      `;
    }
  }
}

// ==========================================
// RENDERIZAÇÃO DOS CARDS DAS CONTAS COM LUCRO
// ==========================================
function renderContasCards() {
  const container = document.getElementById("totaisPorConta");
  if (!container || !state) return;

  const faturamentoHistorico = totaisHistoricoPorConta();

  container.innerHTML = (state.contas || [])
    .filter(c => c.ativa)
    .map(c => {
      const quantidade = usadasDaConta(c.nome);
      const disponiveis = Math.max(0, 5 - quantidade);
      const reservasAtivas = (state.reservas || [])
        .filter(r => r.conta === c.nome && r.expiresAt > Date.now())
        .sort((a, b) => a.expiresAt - b.expiresAt);
      
      const tempos = reservasAtivas.map(
        (r, n) => `
        <div class="timer-line">
          <span>Venda ${n + 1}: ${tempoRestante(r.expiresAt - Date.now())}</span>
          <button type="button" class="btn-danger timer-remove-btn" onclick="removerTimerEspecifico(${state.reservas.indexOf(r)})">✕</button>
        </div>
      `
      );

      const fatConta = faturamentoHistorico[c.nome] || 0;
      const lucroConta = fatConta * MARGEM_LUCRO;

      return `<div class="total-account ${quantidade >= 5 ? "limit-reached" : ""}">
      <div class="account-card-head">
        <div class="name">${esc(c.nome)}</div>
        <button type="button" class="btn-danger reset-timer-btn" onclick="removerTimersConta(${state.contas.indexOf(c)})">🗑️ Remover timers</button>
      </div>
      
      <div class="amount">${money(fatConta)}</div>
      <div style="font-size:12px; color:var(--green); font-weight:800; margin-top:2px;">📈 Lucro: ${money(lucroConta)}</div>
      
      <div class="sales-count" style="margin-top:6px;">🪙 ${formatVBucks(c.vbucks)} V-Bucks</div>
      <div class="sales-count">📦 ${quantidade}/5 usadas · ${disponiveis} ${disponiveis === 1 ? "disponível" : "disponíveis"}</div>
      ${quantidade >= 5 ? `<div class="limit">🔴 LIMITE ATINGIDO — 5/5</div>` : ""}
      <div class="timer">${tempos.length ? tempos.join("") : `<div class="timer">🟢 5 vagas disponíveis</div>`}</div>
      <div class="state">${quantidade >= 5 ? "🔴 Sem envios disponíveis" : "🟢 Ativa"}</div>
    </div>`;
    })
    .join("");
}

function valorRapido(v) {
  const input = document.getElementById("valorInput");
  if (!input) return;
  const atual = parseFloat(input.value) || 0;
  input.value = (atual + Number(v)).toFixed(2);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  atualizarPreviewVBucks();
  input.focus();
}

function adicionarVenda() {
  limparReservasExpiradas();
  const conta = document.getElementById("contaSelect").value;
  const valor = parseFloat(document.getElementById("valorInput").value);
  const cliente = document.getElementById("clienteInput").value.trim();
  const nickCliente = document.getElementById("nickClienteInput").value.trim();
  const quantidade = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const itens = obterItensDaVenda();
  const baseAtual = state.valorBase100 || 2.5;

  if (!conta) { mostrarNotificacao("Ative pelo menos uma conta.", "erro"); return; }
  if (!valor || valor <= 0) { mostrarNotificacao("Digite um valor válido.", "erro"); return; }
  if (!Number.isInteger(quantidade) || quantidade < 1) { mostrarNotificacao("A quantidade deve ser pelo menos 1.", "erro"); return; }
  if (!cliente) { mostrarNotificacao("Digite o nome do cliente.", "erro"); return; }
  if (!nickCliente) { mostrarNotificacao("Digite o Nick do cliente.", "erro"); return; }
  
  if (itens.length !== quantidade) {
    mostrarNotificacao(`Digite o nome de todos os ${quantidade} itens vendidos.`, "erro");
    return;
  }

  const usadas = usadasDaConta(conta);
  if (usadas + quantidade > 5) {
    mostrarNotificacao(`A conta ${conta} tem ${usadas}/5 envios ocupados. Vagas restantes: ${5 - usadas}.`, "erro");
    return;
  }

  const contaObj = (state.contas || []).find(c => c.nome === conta);
  const vbucksNecessarios = Math.round((valor / baseAtual) * 100);
  const saldoVBucks = Number(contaObj?.vbucks) || 0;

  if (saldoVBucks < vbucksNecessarios) {
    mostrarNotificacao(`Saldo insuficiente! A conta ${conta} tem ${saldoVBucks.toLocaleString("pt-BR")} V-Bucks e a venda requer ${vbucksNecessarios.toLocaleString("pt-BR")}.`, "erro");
    return;
  }

  contaObj.vbucks = Math.max(0, saldoVBucks - vbucksNecessarios);

  const agora = Date.now(), d = new Date();
  const vendaId = crypto.randomUUID ? crypto.randomUUID() : `venda-${Date.now()}-${Math.random()}`;

  const novaVenda = {
    id: vendaId,
    conta,
    valor: Number(valor),
    vbucks: Number(vbucksNecessarios),
    valorBaseMomento: baseAtual,
    quantidade: Number(quantidade),
    cliente,
    nickCliente,
    item: itens[0] || "",
    itens,
    data: d.toLocaleDateString("pt-BR"),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    criadoEmMs: agora
  };

  if (!Array.isArray(state.vendas)) state.vendas = [];
  if (!Array.isArray(state.historicoVendas)) state.historicoVendas = [];
  if (!Array.isArray(state.reservas)) state.reservas = [];

  state.vendas.push(novaVenda);
  state.historicoVendas.push({ ...novaVenda, itens: Array.isArray(itens) ? [...itens] : [] });

  for (let n = 0; n < quantidade; n++) {
    state.reservas.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `timer-${Date.now()}-${Math.random()}-${n}`,
      conta,
      vendaId,
      expiresAt: agora + 86400000
    });
  }

  document.getElementById("valorInput").value = "";
  document.getElementById("clienteInput").value = "";
  document.getElementById("nickClienteInput").value = "";
  document.getElementById("quantidadeInput").value = "1";
  atualizarCamposItens();
  atualizarPreviewVBucks();
  save();
  mostrarNotificacao("Venda registrada com sucesso!", "sucesso");
}

// ==========================================
// EXCLUSÃO SEGURA POR ID
// ==========================================
function excluirHistoricoPorId(vendaId) {
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  abrirModalConfirmacao("🗑️ Mover para Lixeira", `Deseja mover a venda de ${venda.cliente} (${money(venda.valor)}) para a lixeira? Os V-Bucks serão devolvidos à conta.`, () => {
    const conta = (state.contas || []).find(c => c.nome === venda.conta);
    if (conta) {
      const vbDevolver = venda.vbucks !== undefined ? Number(venda.vbucks) : valorParaVBucks(venda.valor, venda.valorBaseMomento);
      conta.vbucks = (Number(conta.vbucks) || 0) + Number(vbDevolver);
    }

    const timersAtuais = (state.reservas || []).filter(r => r.vendaId === venda.id);
    if (timersAtuais.length > 0) {
      venda.timersSalvos = timersAtuais;
    } else {
      const baseTempo = venda.criadoEmMs || Date.now();
      venda.timersSalvos = Array.from({ length: Number(venda.quantidade) || 1 }, (_, n) => ({
        id: `timer-${Date.now()}-${n}`,
        conta: venda.conta,
        vendaId: venda.id,
        expiresAt: baseTempo + 86400000
      }));
    }

    if (venda.id) {
      state.reservas = (state.reservas || []).filter(r => r.vendaId !== venda.id);
      state.vendas = (state.vendas || []).filter(v => v.id !== venda.id);
    }

    const d = new Date();
    venda.excluidaEm = `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    if (!Array.isArray(state.lixeiraVendas)) state.lixeiraVendas = [];
    state.lixeiraVendas.unshift(venda);

    state.historicoVendas.splice(i, 1);
    save();
    mostrarNotificacao("Venda movida para a lixeira! Pode ser restaurada a qualquer momento.", "sucesso");
  });
}

function abrirModalLixeira() {
  const modal = document.getElementById("trashModal");
  const container = document.getElementById("trashListContainer");
  const lixeira = state.lixeiraVendas || [];

  if (!container) return;

  if (lixeira.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">A lixeira está vazia. Nenhuma venda excluída recentemente.</div>`;
  } else {
    container.innerHTML = lixeira.map((v, idx) => {
      const itemTxt = Array.isArray(v.itens) && v.itens.length ? v.itens.join(", ") : (v.item || "Sem item");
      return `
        <div class="trash-item-card">
          <div class="trash-item-info">
            <div class="trash-item-title">${esc(v.cliente)} (${money(v.valor)}) · ${esc(v.conta)}</div>
            <div class="trash-item-desc">🎁 ${esc(itemTxt)}</div>
            <div class="trash-item-desc" style="color:var(--accent-light);">📅 Vendido em: ${esc(v.data)} · Excluído em: ${esc(v.excluidaEm || "—")}</div>
          </div>
          <div class="trash-item-actions">
            <button type="button" class="btn-green" style="padding:6px 10px; font-size:11px;" onclick="restaurarVenda(${idx})">♻️ Restaurar</button>
            <button type="button" class="btn-danger" style="padding:6px 10px; font-size:11px;" onclick="excluirDefinitivoLixeira(${idx})">✕</button>
          </div>
        </div>
      `;
    }).join("");
  }

  if (modal) modal.style.display = "flex";
}

function fecharModalLixeira() {
  const modal = document.getElementById("trashModal");
  if (modal) modal.style.display = "none";
}

function restaurarVenda(idx) {
  const venda = (state.lixeiraVendas || [])[idx];
  if (!venda) return;

  const conta = (state.contas || []).find(c => c.nome === venda.conta);
  const vbNecessarios = venda.vbucks !== undefined ? Number(venda.vbucks) : valorParaVBucks(venda.valor, venda.valorBaseMomento);

  if (conta && Number(conta.vbucks) < vbNecessarios) {
    mostrarNotificacao(`Não é possível restaurar: a conta ${venda.conta} precisa de ${formatVBucks(vbNecessarios)} V-Bucks e tem apenas ${formatVBucks(conta.vbucks)}.`, "erro");
    return;
  }

  const agora = Date.now();
  const timersAtivosParaRestaurar = (venda.timersSalvos || []).filter(t => t.expiresAt > agora);
  const vagasNecessarias = timersAtivosParaRestaurar.length;
  const vagasOcupadasAgora = usadasDaConta(venda.conta);

  if (vagasOcupadasAgora + vagasNecessarias > 5) {
    mostrarNotificacao(`Não é possível restaurar: a conta ${venda.conta} já possui ${vagasOcupadasAgora}/5 envios ocupados. Vagas necessárias: ${vagasNecessarias}.`, "erro");
    return;
  }

  if (conta) {
    conta.vbucks = Math.max(0, (Number(conta.vbucks) || 0) - vbNecessarios);
  }

  if (!Array.isArray(state.reservas)) state.reservas = [];
  timersAtivosParaRestaurar.forEach(t => {
    state.reservas.push(t);
  });

  if (!Array.isArray(state.vendas)) state.vendas = [];
  if (!Array.isArray(state.historicoVendas)) state.historicoVendas = [];

  state.lixeiraVendas.splice(idx, 1);
  delete venda.excluidaEm;
  delete venda.timersSalvos;

  state.vendas.push(venda);
  state.historicoVendas.push(venda);

  save();
  abrirModalLixeira();
  mostrarNotificacao(`Venda de ${venda.cliente} restaurada com sucesso!`, "sucesso");
}

function excluirDefinitivoLixeira(idx) {
  const venda = (state.lixeiraVendas || [])[idx];
  if (!venda) return;

  abrirModalConfirmacao("🔥 Exclusão Permanente", `Apagar definitivamente a venda de ${venda.cliente}? Esta ação não pode ser desfeita.`, () => {
    state.lixeiraVendas.splice(idx, 1);
    save();
    abrirModalLixeira();
    mostrarNotificacao("Venda apagada permanentemente.", "info");
  });
}

function esvaziarLixeira() {
  const lixeira = state.lixeiraVendas || [];
  if (lixeira.length === 0) {
    mostrarNotificacao("A lixeira já está vazia.", "info");
    return;
  }

  abrirModalConfirmacao("🔥 Esvaziar Lixeira", `Deseja apagar definitivamente todas as ${lixeira.length} vendas da lixeira?`, () => {
    state.lixeiraVendas = [];
    save();
    abrirModalLixeira();
    mostrarNotificacao("Lixeira esvaziada com sucesso.", "sucesso");
  });
}

function removerConta(i) {
  const conta = state.contas[i];
  if (!conta) return;
  const nomeConta = conta.nome;

  abrirModalConfirmacao("🗑️ Remover Conta", `Remover a conta ${nomeConta}? Vendas e timers vinculados serão apagados.`, () => {
    const indexAtual = state.contas.findIndex(c => c.nome === nomeConta);
    if (indexAtual >= 0) {
      state.contas.splice(indexAtual, 1);
    }
    state.vendas = state.vendas.filter(v => v.conta !== nomeConta);
    state.reservas = state.reservas.filter(r => r.conta !== nomeConta);
    save();
    mostrarNotificacao(`Conta ${nomeConta} removida com sucesso.`, "info");
  });
}

function toggleConta(i) {
  state.contas[i].ativa = !state.contas[i].ativa;
  save();
}

function removerTimerEspecifico(index) {
  const timer = state.reservas[index];
  if (!timer || timer.expiresAt <= Date.now()) {
    if (limparReservasExpiradas()) save();
    render();
    return;
  }
  abrirModalConfirmacao("Liberar Vaga", `Liberar somente esta vaga da ${timer.conta}?`, () => {
    state.reservas.splice(index, 1);
    save();
    mostrarNotificacao("Vaga liberada imediatamente.", "sucesso");
  });
}

function removerTimersConta(i) {
  const conta = state.contas[i];
  if (!conta) return;
  const atuais = state.reservas.filter(r => r.conta === conta.nome && r.expiresAt > Date.now());
  if (!atuais.length) {
    mostrarNotificacao(`A conta ${conta.nome} não possui timers ativos.`, "info");
    return;
  }
  abrirModalConfirmacao("🗑️ Resetar Vagas", `Liberar todas as 5 vagas da ${conta.nome} agora?`, () => {
    state.reservas = state.reservas.filter(r => r.conta !== conta.nome);
    save();
    mostrarNotificacao(`Vagas de ${conta.nome} resetadas para 5/5!`, "sucesso");
  });
}

// ==========================================
// MODAL DE EDIÇÃO DE VENDA POR ID
// ==========================================
function abrirModalEdicaoPorId(vendaId) {
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  document.getElementById("editVendaId").value = vendaId;
  
  const selectConta = document.getElementById("editContaSelect");
  if (selectConta) {
    const listaContas = state.contas || [];
    selectConta.innerHTML = listaContas.map(c => `
      <option value="${esc(c.nome)}" ${c.nome === venda.conta ? "selected" : ""}>
        ${esc(c.nome)} (${formatVBucks(c.vbucks)} VB)
      </option>
    `).join("");
    selectConta.value = venda.conta;
  }

  document.getElementById("editClientInput").value = venda.cliente || "";
  document.getElementById("editNickInput").value = venda.nickCliente || "";
  document.getElementById("editValorInput").value = Number(venda.valor || 0).toFixed(2);
  
  atualizarPreviewVBucksEdicao();

  const container = document.getElementById("editItensListContainer");
  const itens = Array.isArray(venda.itens) && venda.itens.length ? venda.itens : [venda.item || ""];

  container.innerHTML = itens.map((itemStr, idx) => {
    const { tipo, nome } = parseItemString(itemStr);
    const optionsHtml = CATEGORIAS_ITENS.map(c => `<option value="${c}" ${c === tipo ? "selected" : ""}>${c}</option>`).join("");

    return `
      <div class="item-picker-box">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-size:12px;">Item ${idx + 1}</label>
          ${itens.length > 1 ? `<button type="button" class="btn-danger close-modal-btn" style="padding:2px 6px;" onclick="removerItemEdicao(${idx})">✕</button>` : ""}
        </div>
        <div class="item-picker-row">
          <select class="item-type-select edit-modal-item-type">
            ${optionsHtml}
          </select>
          <input class="item-name-input edit-modal-item-name" type="text" maxlength="120" value="${esc(nome)}" placeholder="Nome do item">
        </div>
      </div>
    `;
  }).join("");

  const modal = document.getElementById("editSaleModal");
  if (modal) modal.style.display = "flex";
}

function removerItemEdicao(idx) {
  const vendaId = document.getElementById("editVendaId").value;
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  const itens = Array.isArray(venda.itens) ? [...venda.itens] : [venda.item || ""];
  if (itens.length > 1) {
    itens.splice(idx, 1);
    venda.itens = itens;
    venda.quantidade = itens.length;
    abrirModalEdicaoPorId(vendaId);
  }
}

function fecharModalEdicao() {
  const modal = document.getElementById("editSaleModal");
  if (modal) modal.style.display = "none";
}

function salvarEdicaoVenda() {
  const vendaId = document.getElementById("editVendaId").value;
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  const novaContaNome = document.getElementById("editContaSelect").value;
  const contaAntigaNome = venda.conta;

  const cliente = document.getElementById("editClientInput").value.trim();
  const nick = document.getElementById("editNickInput").value.trim();
  const valor = parseFloat(document.getElementById("editValorInput").value);

  const types = [...document.querySelectorAll(".edit-modal-item-type")];
  const names = [...document.querySelectorAll(".edit-modal-item-name")];
  const listaItens = [];

  for (let idx = 0; idx < names.length; idx++) {
    const nome = names[idx].value.trim();
    const tipo = types[idx].value;
    if (nome) {
      listaItens.push(formatItemString(tipo, nome));
    }
  }

  if (!cliente) { mostrarNotificacao("O nome do cliente não pode ficar vazio.", "erro"); return; }
  if (!nick) { mostrarNotificacao("O nick do cliente não pode ficar vazio.", "erro"); return; }
  if (!valor || valor <= 0) { mostrarNotificacao("Digite um valor válido.", "erro"); return; }
  if (!listaItens.length) { mostrarNotificacao("Informe pelo menos um item válido.", "erro"); return; }

  const baseUsada = venda.valorBaseMomento || state.valorBase100 || 2.5;
  const vbucksAntigos = venda.vbucks !== undefined ? Number(venda.vbucks) : valorParaVBucks(venda.valor, baseUsada);
  const vbucksNovos = valorParaVBucks(valor, baseUsada);

  const contaAntigaObj = (state.contas || []).find(c => c.nome === contaAntigaNome);
  const contaNovaObj = (state.contas || []).find(c => c.nome === novaContaNome);

  if (novaContaNome !== contaAntigaNome) {
    const saldoDisponivelNova = Number(contaNovaObj?.vbucks) || 0;
    if (saldoDisponivelNova < vbucksNovos) {
      mostrarNotificacao(`Saldo insuficiente! A conta ${novaContaNome} tem ${saldoDisponivelNova.toLocaleString("pt-BR")} V-Bucks e a venda precisa de ${vbucksNovos.toLocaleString("pt-BR")}.`, "erro");
      return;
    }

    const agora = Date.now();
    const timersAtivosDestaVenda = (state.reservas || []).filter(r => r.vendaId === venda.id && r.expiresAt > agora).length;
    const usadasNovaConta = usadasDaConta(novaContaNome);

    if (usadasNovaConta + timersAtivosDestaVenda > 5) {
      mostrarNotificacao(`Não é possível transferir: a conta ${novaContaNome} já tem ${usadasNovaConta}/5 vagas ocupadas.`, "erro");
      return;
    }

    if (contaAntigaObj) {
      contaAntigaObj.vbucks = (Number(contaAntigaObj.vbucks) || 0) + Number(vbucksAntigos);
    }
    if (contaNovaObj) {
      contaNovaObj.vbucks = Math.max(0, (Number(contaNovaObj.vbucks) || 0) - Number(vbucksNovos));
    }
    if (Array.isArray(state.reservas)) {
      state.reservas.forEach(r => {
        if (r.vendaId === venda.id) {
          r.conta = novaContaNome;
        }
      });
    }
  } else {
    const diferencaVBucks = vbucksNovos - vbucksAntigos;
    if (contaAntigaObj) {
      contaAntigaObj.vbucks = Math.max(0, (Number(contaAntigaObj.vbucks) || 0) - Number(diferencaVBucks));
    }
  }

  venda.conta = novaContaNome;
  venda.cliente = cliente;
  venda.nickCliente = nick;
  venda.valor = Number(valor);
  venda.vbucks = Number(vbucksNovos);
  venda.valorBaseMomento = baseUsada;
  venda.item = listaItens[0] || "";
  venda.itens = listaItens;
  venda.quantidade = listaItens.length;

  const sessaoVenda = (state.vendas || []).find(v => v.id === venda.id);
  if (sessaoVenda) {
    sessaoVenda.conta = novaContaNome;
    sessaoVenda.cliente = cliente;
    sessaoVenda.nickCliente = nick;
    sessaoVenda.valor = Number(valor);
    sessaoVenda.vbucks = Number(vbucksNovos);
    sessaoVenda.valorBaseMomento = baseUsada;
    sessaoVenda.item = listaItens[0] || "";
    sessaoVenda.itens = listaItens;
    sessaoVenda.quantidade = listaItens.length;
  }

  save();
  fecharModalEdicao();
  mostrarNotificacao(`Venda atualizada com sucesso! (Conta: ${novaContaNome})`, "sucesso");
}

function solicitarLimpezaHistorico() {
  if (!state.historicoVendas || !state.historicoVendas.length) {
    mostrarNotificacao("O histórico já está vazio.", "info");
    return;
  }

  if (!currentUser || !currentUser.email) {
    mostrarNotificacao("Acesso restrito: Faça login como Administrador para apagar o histórico.", "erro");
    return;
  }

  const modal = document.getElementById("adminAuthActionModal");
  const desc = document.getElementById("adminActionDesc");
  const passInput = document.getElementById("adminActionPassword");
  const confirmBtn = document.getElementById("adminActionConfirmBtn");

  if (desc) desc.textContent = `A exclusão do histórico é definitiva. Digite a senha da conta ${currentUser.email} para confirmar:`;
  if (passInput) passInput.value = "";

  confirmBtn.onclick = async () => {
    const pass = passInput.value.trim();
    if (!pass) {
      mostrarNotificacao("Digite sua senha de administrador.", "erro");
      return;
    }

    confirmBtn.textContent = "⏳ Validando...";
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, password: pass })
      });
      const data = await res.json();

      if (!res.ok || !data.access_token) {
        mostrarNotificacao("Senha incorreta! Exclusão cancelada.", "erro");
        confirmBtn.textContent = "🔒 Autorizar Exclusão";
        return;
      }

      state.historicoVendas = [];
      await save();
      fecharModalAdminAction();
      mostrarNotificacao("Histórico de vendas completamente limpo.", "sucesso");
    } catch (e) {
      mostrarNotificacao("Erro ao conectar com o banco de dados.", "erro");
    } finally {
      confirmBtn.textContent = "🔒 Autorizar Exclusão";
    }
  };

  if (modal) modal.style.display = "flex";
}

function fecharModalAdminAction() {
  const modal = document.getElementById("adminAuthActionModal");
  if (modal) modal.style.display = "none";
}

function novaLive() {
  state.vendas = [];
  save();
  mostrarNotificacao("Nova sessão iniciada!", "sucesso");
}

document.getElementById("limparValorBtn").addEventListener("click", () => {
  document.getElementById("valorInput").value = "";
  atualizarPreviewVBucks();
  document.getElementById("valorInput").focus();
});

document.getElementById("valorInput").addEventListener("keydown", e => {
  if (e.key === "Enter") adicionarVenda();
});

inicializar();

// Temporizador inteligente a cada 1 segundo
setInterval(() => {
  if (limparReservasExpiradas()) {
    save();
  } else {
    renderContasCards();
  }
}, 1000);