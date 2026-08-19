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

const DADOS_DEMO = {
  contas: [
    { nome: "Conta Demo 01", ativa: true, usadas: 0, vbucks: 10000 },
    { nome: "Conta Demo 02", ativa: true, usadas: 0, vbucks: 8500 }
  ],
  vendas: [],
  reservas: [],
  valorBase100: 2.5,
  historicoVendas: [],
  lixeiraVendas: [],
  metasLucro: { retiradas: 0 }
};

let currentUser = null;
let authToken = localStorage.getItem("vendas_auth_token") || null;
let refreshToken = localStorage.getItem("vendas_refresh_token") || null;
let state = null;

let mesFiltroSelecionado = null;
let anoFiltroSelecionado = null;

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
// MODAL EDITAR CONTA
// ==========================================
function abrirModalEditConta(i) {
  const conta = state.contas[i];
  if (!conta) return;

  document.getElementById("editContaIndex").value = i;
  document.getElementById("editContaNomeInput").value = conta.nome;
  document.getElementById("editContaVbucksInput").value = Number(conta.vbucks) || 0;

  const modal = document.getElementById("editContaModal");
  if (modal) modal.style.display = "flex";
}

function fecharModalEditConta() {
  const modal = document.getElementById("editContaModal");
  if (modal) modal.style.display = "none";
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
  mostrarNotificacao(`Dados da conta ${conta.nome} atualizados!`, "sucesso");
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
  if (!state || !Array.isArray(state.reservas)) return;
  const agora = Date.now();
  const novas = state.reservas.filter(r => r.expiresAt > agora);
  if (novas.length !== state.reservas.length) {
    state.reservas = novas;
    save();
  }
}

function usadasDaConta(nome) {
  limparReservasExpiradas();
  return (state.reservas || []).filter(r => r.conta === nome).length;
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

function totais() {
  let t = {};
  (state.contas || []).forEach(c => (t[c.nome] = 0));
  (state.vendas || []).forEach(v => (t[v.conta] = (t[v.conta] || 0) + Number(v.valor || 0)));
  return t;
}

function mudarMesFiltro(val) {
  mesFiltroSelecionado = val;
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
  const t = totais(),
    total = (state.vendas || []).reduce((a, v) => a + Number(v.valor || 0), 0);

  document.getElementById("totalGeral").textContent = money(total);
  
  const qtdPedidosSessao = (state.vendas || []).length;
  const qtdItensSessao = (state.vendas || []).reduce((a, v) => a + (Number(v.quantidade) || 1), 0);
  document.getElementById("qtdVendas").textContent = `${qtdPedidosSessao} (${qtdItensSessao} itens)`;

  let top = "—", tv = 0;
  Object.entries(t).forEach(([n, v]) => {
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

  document.getElementById("totaisPorConta").innerHTML = (state.contas || [])
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
      return `<div class="total-account ${quantidade >= 5 ? "limit-reached" : ""}">
      <div class="account-card-head"><div class="name">${esc(c.nome)}</div><button type="button" class="btn-danger reset-timer-btn" onclick="removerTimersConta(${state.contas.indexOf(c)})">🗑️ Remover timers</button></div>
      <div class="amount">${money(t[c.nome] || 0)}</div><div class="sales-count">🪙 ${formatVBucks(c.vbucks)} V-Bucks</div>
      <div class="sales-count">🛒 ${quantidade} ${quantidade === 1 ? "venda" : "vendas"} nesta conta</div>
      <div class="sales-count">📦 ${quantidade}/5 usadas · ${disponiveis} ${disponiveis === 1 ? "disponível" : "disponíveis"}</div>
      ${quantidade >= 5 ? `<div class="limit">🔴 LIMITE ATINGIDO — 5/5</div>` : ""}
      <div class="timer">${tempos.length ? tempos.join("") : `<div class="timer">🟢 5 vagas disponíveis</div>`}</div>
      <div class="state">${quantidade >= 5 ? "🔴 Sem envios disponíveis" : "🟢 Ativa"}</div>
    </div>`;
    })
    .join("");

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

  // Atualiza contador da lixeira
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
  const somaFiltro = fn => historico.filter(fn).reduce((s, v) => s + Number(v.valor || 0), 0);
  const qtdPedidosFiltro = fn => historico.filter(fn).length;
  const qtdItensFiltro = fn => historico.filter(fn).reduce((s, v) => s + (Number(v.quantidade) || 1), 0);

  const hojeInicio = new Date(agoraData.getFullYear(), agoraData.getMonth(), agoraData.getDate());
  const amanhaInicio = new Date(hojeInicio);
  amanhaInicio.setDate(amanhaInicio.getDate() + 1);
  const hojeTotal = somaFiltro(v => {
    const d = chaveData(v);
    return d && d >= hojeInicio && d < amanhaInicio;
  });
  const hojePedidos = qtdPedidosFiltro(v => {
    const d = chaveData(v);
    return d && d >= hojeInicio && d < amanhaInicio;
  });
  const hojeItens = qtdItensFiltro(v => {
    const d = chaveData(v);
    return d && d >= hojeInicio && d < amanhaInicio;
  });

  const semInicio = inicioSemana(agoraData);
  const semFim = new Date(semInicio);
  semFim.setDate(semFim.getDate() + 7);
  const semanaTotal = somaFiltro(v => {
    const d = chaveData(v);
    return d && d >= semInicio && d < semFim;
  });
  const semanaPedidos = qtdPedidosFiltro(v => {
    const d = chaveData(v);
    return d && d >= semInicio && d < semFim;
  });
  const semanaItens = qtdItensFiltro(v => {
    const d = chaveData(v);
    return d && d >= semInicio && d < semFim;
  });

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
  const mesTotal = somaFiltro(v => {
    const d = chaveData(v);
    return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA;
  });
  const mesPedidos = qtdPedidosFiltro(v => {
    const d = chaveData(v);
    return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA;
  });
  const mesItens = qtdItensFiltro(v => {
    const d = chaveData(v);
    return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA;
  });

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
  const anoTotal = somaFiltro(v => {
    const d = chaveData(v);
    return d && d.getFullYear() === selAnoNum;
  });
  const anoPedidos = qtdPedidosFiltro(v => {
    const d = chaveData(v);
    return d && d.getFullYear() === selAnoNum;
  });
  const anoItens = qtdItensFiltro(v => {
    const d = chaveData(v);
    return d && d.getFullYear() === selAnoNum;
  });

  const metasAtingidas = Math.floor(totalHistorico / 310);
  const metasRetiradas = Math.min(state.metasLucro?.retiradas || 0, metasAtingidas);
  const metasDisponiveis = Math.max(0, metasAtingidas - metasRetiradas);
  const lucroHistorico = metasAtingidas * 100;
  const vendasParaProximoLucro = (metasAtingidas + 1) * 310 - totalHistorico;

  const lucroAlertEl = document.getElementById("lucroMetaAlert");
  if (lucroAlertEl) {
    lucroAlertEl.innerHTML =
      metasDisponiveis > 0
        ? `🎉 <b>${metasDisponiveis === 1 ? "META DE LUCRO ATINGIDA!" : "METAS DE LUCRO ATINGIDAS!"}</b><br>${metasDisponiveis} ${metasDisponiveis === 1 ? "meta de R$ 100" : "metas de R$ 100"} disponível${metasDisponiveis === 1 ? "" : "eis"} para retirada.`
        : "";
    lucroAlertEl.style.display = metasDisponiveis > 0 ? "block" : "none";
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
    <div class="period-card">
      <span>📍 Hoje</span>
      <strong>${money(hojeTotal)}</strong>
      <small>${hojePedidos} ${hojePedidos === 1 ? "pedido" : "pedidos"} (${hojeItens} ${hojeItens === 1 ? "item" : "itens"})</small>
    </div>
    <div class="period-card">
      <span>📅 Esta semana</span>
      <strong>${money(semanaTotal)}</strong>
      <small>${semanaPedidos} ${semanaPedidos === 1 ? "pedido" : "pedidos"} (${semanaItens} ${semanaItens === 1 ? "item" : "itens"})</small>
    </div>
    <div class="period-card period-card-select">
      <div class="period-header-select">
        <span>🗓️</span>
        <select class="period-select" onchange="mudarMesFiltro(this.value)">
          ${optionsMesHtml}
        </select>
      </div>
      <strong>${money(mesTotal)}</strong>
      <small>${mesPedidos} ${mesPedidos === 1 ? "pedido" : "pedidos"} (${mesItens} ${mesItens === 1 ? "item" : "itens"})</small>
    </div>
    <div class="period-card period-card-select">
      <div class="period-header-select">
        <span>📆</span>
        <select class="period-select" onchange="mudarAnoFiltro(this.value)">
          ${optionsAnoHtml}
        </select>
      </div>
      <strong>${money(anoTotal)}</strong>
      <small>${anoPedidos} ${anoPedidos === 1 ? "pedido" : "pedidos"} (${anoItens} ${anoItens === 1 ? "item" : "itens"})</small>
    </div>
    <div class="period-card profit-card">
      <span>📈 Lucro</span>
      <strong>${money(lucroHistorico)}</strong>
      <small>🎯 Meta restante: ${money(vendasParaProximoLucro)}</small>
      <small>💵 ${metasDisponiveis} ${metasDisponiveis === 1 ? "meta disponível" : "metas disponíveis"}</small>
      ${metasDisponiveis > 0 ? '<button type="button" class="profit-goal-btn" onclick="marcarMetasRetiradas(); return false;">✓ Já retirei</button>' : ""}
    </div>
  `;
  }

  document.getElementById("historico").innerHTML = (state.historicoVendas || []).length
    ? state.historicoVendas
        .slice()
        .reverse()
        .map((v, ri) => {
          const i = state.historicoVendas.length - 1 - ri;
          const itens = v.quantidade || 1;
          const vb = v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
          return `<div class="history-card">
          <div class="history-main">
            <div class="history-number">#${String(i + 1).padStart(2, "0")}</div>
            <div class="history-info">
              <div class="history-account">${esc(v.conta)}</div>
              <div class="history-client">👤 ${esc(v.cliente || "Cliente não informado")}</div>
              <div class="history-client">🎮 ${esc(v.nickCliente || "Nick não informado")}</div>
              <div class="history-item">🎁 ${
                Array.isArray(v.itens) && v.itens.length
                  ? v.itens.map((item, n) => `${n === 0 ? "" : "🎁 "}${n + 1}. ${esc(item)}`).join("<br>")
                  : esc(v.item || "Item não informado")
              }</div>
              <div class="history-date">📅 ${esc(v.data || "—")} às ${esc(v.hora || "—")}</div>
            </div>
            <div class="history-value">${money(v.valor)}</div>
          </div>
          <div class="history-details">
            <span>🎁 ${itens} ${itens === 1 ? "item" : "itens"}</span>
            <span>🪙 ${formatVBucks(vb)} V-Bucks</span>
            <div class="history-actions">
              <button type="button" class="btn-gray" onclick="abrirModalEdicao(${i})">✏️ Editar</button>
              <button type="button" class="btn-danger" onclick="excluirHistorico(${i})">🗑️ Excluir</button>
            </div>
          </div>
        </div>`;
        })
        .join("")
    : `<div class="empty">Nenhuma venda registrada ainda.</div>`;
}

function valorRapido(v) {
  const input = document.getElementById("valorInput");
  if (!input) return;
  const atual = parseFloat(input.value) || 0;
  input.value = (atual + Number(v)).toFixed(2);
  input.dispatchEvent(new Event("input", { bubbles: true }));
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
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
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
  save();
  mostrarNotificacao("Venda registrada com sucesso!", "sucesso");
}

// ==========================================
// EXCLUSÃO COM MOVIMENTAÇÃO PARA A LIXEIRA
// ==========================================
function excluirHistorico(i) {
  const venda = state.historicoVendas[i];
  if (!venda) return;

  abrirModalConfirmacao("🗑️ Mover para Lixeira", `Deseja mover a venda de ${venda.cliente} (${money(venda.valor)}) para a lixeira? Os V-Bucks serão devolvidos à conta.`, () => {
    // 1. Devolve V-Bucks para a conta
    const conta = (state.contas || []).find(c => c.nome === venda.conta);
    if (conta) {
      const vbDevolver = venda.vbucks !== undefined ? Number(venda.vbucks) : valorParaVBucks(venda.valor, venda.valorBaseMomento);
      conta.vbucks = (Number(conta.vbucks) || 0) + Number(vbDevolver);
    }

    // 2. Remove timers ativos
    if (venda.id) {
      state.reservas = (state.reservas || []).filter(r => r.vendaId !== venda.id);
      state.vendas = (state.vendas || []).filter(v => v.id !== venda.id);
    }

    // 3. Adiciona à lixeira com data de exclusão
    const d = new Date();
    venda.excluidaEm = `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    if (!Array.isArray(state.lixeiraVendas)) state.lixeiraVendas = [];
    state.lixeiraVendas.unshift(venda);

    // 4. Remove do histórico ativo
    state.historicoVendas.splice(i, 1);
    save();
    mostrarNotificacao("Venda movida para a lixeira! Pode ser restaurada a qualquer momento.", "sucesso");
  });
}

// ==========================================
// MODAL DA LIXEIRA & RESTAURAÇÃO
// ==========================================
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

  // Verifica saldo para descontar os V-Bucks novamente
  const conta = (state.contas || []).find(c => c.nome === venda.conta);
  const vbNecessarios = venda.vbucks !== undefined ? Number(venda.vbucks) : valorParaVBucks(venda.valor, venda.valorBaseMomento);

  if (conta && Number(conta.vbucks) < vbNecessarios) {
    mostrarNotificacao(`Não é possível restaurar: a conta ${venda.conta} precisa de ${formatVBucks(vbNecessarios)} V-Bucks e tem apenas ${formatVBucks(conta.vbucks)}.`, "erro");
    return;
  }

  if (conta) {
    conta.vbucks = Math.max(0, (Number(conta.vbucks) || 0) - vbNecessarios);
  }

  // Remove da lixeira e volta para o histórico
  state.lixeiraVendas.splice(idx, 1);
  delete venda.excluidaEm;
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
    limparReservasExpiradas();
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

function abrirModalEdicao(index) {
  const venda = state.historicoVendas[index];
  if (!venda) return;

  document.getElementById("editVendaIndex").value = index;
  document.getElementById("editClientInput").value = venda.cliente || "";
  document.getElementById("editNickInput").value = venda.nickCliente || "";
  document.getElementById("editValorInput").value = Number(venda.valor || 0).toFixed(2);
  
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
  const i = parseInt(document.getElementById("editVendaIndex").value, 10);
  const venda = state.historicoVendas[i];
  if (!venda) return;
  const itens = Array.isArray(venda.itens) ? [...venda.itens] : [venda.item || ""];
  if (itens.length > 1) {
    itens.splice(idx, 1);
    venda.itens = itens;
    venda.quantidade = itens.length;
    abrirModalEdicao(i);
  }
}

function fecharModalEdicao() {
  const modal = document.getElementById("editSaleModal");
  if (modal) modal.style.display = "none";
}

function salvarEdicaoVenda() {
  const i = parseInt(document.getElementById("editVendaIndex").value, 10);
  const venda = state.historicoVendas[i];
  if (!venda) return;

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
  const diferencaVBucks = vbucksNovos - vbucksAntigos;

  const contaObj = (state.contas || []).find(c => c.nome === venda.conta);
  if (contaObj) {
    contaObj.vbucks = Math.max(0, (Number(contaObj.vbucks) || 0) - Number(diferencaVBucks));
  }

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
  mostrarNotificacao("Registro de venda atualizado com sucesso!", "sucesso");
}

function marcarMetasRetiradas() {
  const historico = Array.isArray(state.historicoVendas) ? state.historicoVendas : [];
  const totalHistoricoAtual = historico.reduce((s, v) => s + (Number(v.valor) || 0), 0);
  const metasAtingidas = Math.floor(totalHistoricoAtual / 310);
  const retiradas = state.metasLucro?.retiradas || 0;
  const disponiveis = Math.max(0, metasAtingidas - retiradas);
  if (disponiveis <= 0) return;

  const valor = disponiveis * 100;
  abrirModalConfirmacao("💰 Retirada de Lucro", `Confirmar retirada de R$ ${valor.toFixed(2).replace(".", ",")} de lucro atingido?`, () => {
    state.metasLucro = state.metasLucro || { retiradas: 0 };
    state.metasLucro.retiradas += disponiveis;
    save();
    mostrarNotificacao("Retirada de lucro confirmada!", "sucesso");
  });
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
  document.getElementById("valorInput").focus();
});

document.getElementById("valorInput").addEventListener("keydown", e => {
  if (e.key === "Enter") adicionarVenda();
});

inicializar();
setInterval(() => {
  limparReservasExpiradas();
  render();
}, 1000);