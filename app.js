const SUPABASE_URL = "https://oyitmutmtvuoynwhiymy.supabase.co";
const SUPABASE_KEY = "sb_publishable_6e1fQtQfhVa8LjWUbdPrJw_IwhhxLRF";

const DADOS_DEMO = {
  contas: [
    { nome: "Conta Demo 01", ativa: true, usadas: 0, vbucks: 10000 },
    { nome: "Conta Demo 02", ativa: true, usadas: 0, vbucks: 8500 }
  ],
  vendas: [
    {
      id: "demo-1",
      conta: "Conta Demo 01",
      valor: 20,
      quantidade: 1,
      cliente: "Visitante",
      nickCliente: "PlayerDemo",
      item: "Skin Exemplo",
      itens: ["Skin Exemplo"],
      data: "17/08/2026",
      hora: "12:00"
    }
  ],
  reservas: [],
  valorBase100: 2.5,
  historicoVendas: [
    {
      id: "demo-1",
      conta: "Conta Demo 01",
      valor: 20,
      quantidade: 1,
      cliente: "Visitante",
      nickCliente: "PlayerDemo",
      item: "Skin Exemplo",
      itens: ["Skin Exemplo"],
      data: "17/08/2026",
      hora: "12:00"
    }
  ],
  metasLucro: { retiradas: 0 }
};

let currentUser = null;
let authToken = localStorage.getItem("vendas_auth_token") || null;
let state = null;

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
    alert("Preencha o e-mail e a senha.");
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
      alert("Falha no login: " + (data.error_description || data.msg || "Credenciais inválidas."));
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
    currentUser = data.user;
    localStorage.setItem("vendas_auth_token", authToken);

    fecharModalAuth();
    await inicializar();
  } catch (err) {
    console.error("Erro no login:", err);
    alert("Erro ao tentar conectar ao serviço de login.");
  }
}

function fazerLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("vendas_auth_token");
  fecharModalAuth();
  inicializar();
}

async function verificarSessao() {
  if (!authToken) {
    currentUser = null;
    return;
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
      currentUser = null;
      authToken = null;
      localStorage.removeItem("vendas_auth_token");
    }
  } catch (e) {
    currentUser = null;
  }
}

async function inicializar() {
  const footer = document.getElementById("statusFooter");
  await verificarSessao();
  atualizarInterfaceAuth();

  if (!currentUser) {
    if (footer) footer.textContent = "👀 Modo Visitante (Alterações locais de teste — não afetam o banco)";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
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

    if (footer) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
    render();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    if (footer) footer.textContent = "⚠️ Erro ao sincronizar dados com o banco";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
    render();
  }
}

async function save() {
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

function valorParaVBucks(valor) {
  const base = Number(state?.valorBase100 || 2.5);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.round((Number(valor) / base) * 100);
}

function formatVBucks(v) {
  return Math.max(0, Math.round(v || 0)).toLocaleString("pt-BR");
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
  (state.vendas || []).forEach(v => (t[v.conta] = (t[v.conta] || 0) + v.valor));
  return t;
}

function render() {
  if (!state) return;

  const baseEl = document.getElementById("valorBaseDisplay");
  if (baseEl) baseEl.textContent = money(state.valorBase100 || 2.5);

  limparReservasExpiradas();
  const t = totais(),
    total = (state.vendas || []).reduce((a, v) => a + v.valor, 0);

  document.getElementById("totalGeral").textContent = money(total);
  
  // Resumo do painel superior: pedidos e itens
  const qtdPedidosSessao = (state.vendas || []).length;
  const qtdItensSessao = (state.vendas || []).reduce((a, v) => a + (v.quantidade || 1), 0);
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
      <div>
        <div class="account-name">${esc(c.nome)}</div>
        <div class="small">${c.ativa ? "Conta disponível para registrar vendas" : "Conta desativada — ative quando começar a usar"}</div>
      </div>
      <div class="account-status"><span class="badge ${c.ativa ? "" : "off"}">${c.ativa ? "🟢 ATIVA" : "⚫ DESATIVADA"}</span></div>
      <div class="actions">
        <button type="button" class="btn-gray" onclick="editarNomeConta(${i})">✏️ Editar nome</button><button type="button" class="btn-danger" onclick="removerConta(${i})">🗑️ Remover</button><button type="button" class="btn-gray" onclick="editarVBucks(${i})">🪙 Editar V-Bucks</button>
        <span class="small">⏱️ Vagas controladas automaticamente</span>
        <button type="button" class="${c.ativa ? "btn-gray" : "btn-green"}" onclick="toggleConta(${i})">${c.ativa ? "Desativar" : "Ativar"}</button>
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
  const qtdItensFiltro = fn => historico.filter(fn).reduce((s, v) => s + (v.quantidade || 1), 0);

  const mesTotal = somaFiltro(v => {
    const d = chaveData(v);
    return d && d.getMonth() === agoraData.getMonth() && d.getFullYear() === agoraData.getFullYear();
  });
  const mesPedidos = qtdPedidosFiltro(v => {
    const d = chaveData(v);
    return d && d.getMonth() === agoraData.getMonth() && d.getFullYear() === agoraData.getFullYear();
  });
  const mesItens = qtdItensFiltro(v => {
    const d = chaveData(v);
    return d && d.getMonth() === agoraData.getMonth() && d.getFullYear() === agoraData.getFullYear();
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

  const anoTotal = somaFiltro(v => {
    const d = chaveData(v);
    return d && d.getFullYear() === agoraData.getFullYear();
  });
  const anoPedidos = qtdPedidosFiltro(v => {
    const d = chaveData(v);
    return d && d.getFullYear() === agoraData.getFullYear();
  });
  const anoItens = qtdItensFiltro(v => {
    const d = chaveData(v);
    return d && d.getFullYear() === agoraData.getFullYear();
  });

  const nomesMes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
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
  if (periodosEl)
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
    <div class="period-card">
      <span>🗓️ ${nomesMes[agoraData.getMonth()]} ${agoraData.getFullYear()}</span>
      <strong>${money(mesTotal)}</strong>
      <small>${mesPedidos} ${mesPedidos === 1 ? "pedido" : "pedidos"} (${mesItens} ${mesItens === 1 ? "item" : "itens"})</small>
    </div>
    <div class="period-card">
      <span>📆 Ano ${agoraData.getFullYear()}</span>
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

  document.getElementById("historico").innerHTML = (state.historicoVendas || []).length
    ? state.historicoVendas
        .slice()
        .reverse()
        .map((v, ri) => {
          const i = state.historicoVendas.length - 1 - ri;
          const itens = v.quantidade || 1;
          const vb = valorParaVBucks(v.valor);
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
              <button type="button" class="btn-gray" onclick="editarHistorico(${i})">✏️ Editar</button>
              <button type="button" class="btn-danger" onclick="excluirHistorico(${i})">🗑️ Excluir</button>
            </div>
          </div>
        </div>`;
        })
        .join("")
    : `<div class="empty">Nenhuma venda registrada ainda.</div>`;
}

function atualizarCamposItens() {
  const qtd = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const box = document.getElementById("itensExtras");
  const singleItem = document.getElementById("singleItemContainer");
  if (!box) return;

  if (qtd <= 1) {
    box.innerHTML = "";
    box.style.display = "none";
    if (singleItem) singleItem.style.display = "flex";
    return;
  }

  if (singleItem) singleItem.style.display = "none";
  box.style.display = "grid";
  box.innerHTML = Array.from(
    { length: qtd },
    (_, i) => `
    <div class="field">
      <label>Item ${i + 1}</label>
      <input class="item-extra" type="text" maxlength="160" placeholder="Nome do item ${i + 1}">
    </div>
  `
  ).join("");
}

function obterItensDaVenda() {
  const qtd = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const extras = [...document.querySelectorAll(".item-extra")].map(i => i.value.trim()).filter(Boolean);
  const principal = document.getElementById("itemInput").value.trim();

  if (qtd <= 1) return principal ? [principal] : [];
  return extras;
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

  if (!conta) { alert("Ative pelo menos uma conta."); return; }
  if (!valor || valor <= 0) { alert("Digite um valor válido."); return; }
  if (!Number.isInteger(quantidade) || quantidade < 1) { alert("A quantidade deve ser pelo menos 1."); return; }
  if (!cliente) { alert("Digite o nome do cliente."); return; }
  if (!nickCliente) { alert("Digite o Nick do cliente."); return; }
  
  if (quantidade === 1 && itens.length === 0) {
    alert("Digite o item vendido.");
    return;
  }
  if (quantidade > 1 && itens.length !== quantidade) {
    alert(`Digite o nome de todos os ${quantidade} itens vendidos.`);
    return;
  }

  const usadas = usadasDaConta(conta);
  if (usadas + quantidade > 5) {
    alert(`A conta ${conta} tem ${usadas}/5 envios ocupados. Você só pode registrar mais ${5 - usadas}.`);
    return;
  }

  const contaObj = (state.contas || []).find(c => c.nome === conta);
  const vbucksNecessarios = Math.round((valor / (state.valorBase100 || 2.5)) * 100);
  const saldoVBucks = Number(contaObj?.vbucks) || 0;

  if (saldoVBucks < vbucksNecessarios) {
    alert(`A conta ${conta} possui ${saldoVBucks.toLocaleString("pt-BR")} V-Bucks, mas esta venda precisa de ${vbucksNecessarios.toLocaleString("pt-BR")} V-Bucks.`);
    return;
  }

  contaObj.vbucks = saldoVBucks - vbucksNecessarios;

  const agora = Date.now(), d = new Date();
  const vendaId = crypto.randomUUID ? crypto.randomUUID() : `venda-${Date.now()}-${Math.random()}`;

  const novaVenda = {
    id: vendaId,
    conta,
    valor,
    quantidade,
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
  document.getElementById("itemInput").value = "";
  document.getElementById("quantidadeInput").value = "1";
  atualizarCamposItens();
  save();
}

function excluirVenda(index) {
  const venda = state.vendas[index];
  if (!venda) return;

  if (!confirm("Excluir esta venda?\n\nO valor será removido dos totais, os V-Bucks serão devolvidos e os timers desta venda serão liberados.")) return;

  const conta = state.contas.find(c => c.nome === venda.conta);
  if (conta) {
    conta.vbucks += valorParaVBucks(venda.valor);
  }

  if (venda.id) {
    state.reservas = state.reservas.filter(r => r.vendaId !== venda.id);
  }

  state.vendas.splice(index, 1);
  state.historicoVendas = state.historicoVendas.filter(v => v.id !== venda.id);
  save();
}

function editarNomeConta(i) {
  const conta = state.contas[i];
  if (!conta) return;

  const novoNome = prompt(`EDITAR NOME DA CONTA\n\nNome atual: ${conta.nome}\n\nDigite o novo nick da conta:`, conta.nome);
  if (novoNome === null) return;

  const nome = novoNome.trim();
  if (!nome) { alert("O nome da conta não pode ficar vazio."); return; }
  if (nome === conta.nome) return;

  const existe = state.contas.some((c, idx) => idx !== i && c.nome.toLowerCase() === nome.toLowerCase());
  if (existe) { alert("Já existe uma conta com esse nome."); return; }

  const nomeAntigo = conta.nome;
  conta.nome = nome;

  state.vendas.forEach(v => { if (v.conta === nomeAntigo) v.conta = nome; });
  save();
}

function editarVBucks(i) {
  const conta = state.contas[i];
  const texto = prompt(`EDITAR V-BUCKS\n\nConta: ${conta.nome}\nSaldo atual: ${formatVBucks(conta.vbucks)} V-Bucks\n\nDigite o novo saldo:`, String(conta.vbucks || 0));
  if (texto === null) return;
  const valor = parseInt(String(texto).replace(/\D/g, ""), 10);
  if (!Number.isFinite(valor) || valor < 0) { alert("Quantidade inválida."); return; }
  conta.vbucks = valor;
  save();
}

function adicionarConta() {
  const nome = prompt("ADICIONAR CONTA\n\nDigite o nick da nova conta:");
  if (nome === null) return;
  const novoNome = nome.trim();
  if (!novoNome) { alert("O nome não pode ficar vazio."); return; }
  if (state.contas.some(c => c.nome.toLowerCase() === novoNome.toLowerCase())) {
    alert("Já existe uma conta com esse nome.");
    return;
  }
  state.contas.push({ nome: novoNome, ativa: false, vbucks: 0 });
  save();
}

function removerConta(i) {
  const conta = state.contas[i];
  if (!conta) return;
  const vendas = state.vendas.filter(v => v.conta === conta.nome).length;
  const timers = state.reservas.filter(r => r.conta === conta.nome && r.expiresAt > Date.now()).length;
  let msg = `Remover a conta ${conta.nome}?`;
  if (vendas || timers) msg += `\n\nEla possui ${vendas} venda(s) e ${timers} timer(s) ativo(s). Esses dados também serão removidos.`;
  if (!confirm(msg)) return;
  state.contas.splice(i, 1);
  state.vendas = state.vendas.filter(v => v.conta !== conta.nome);
  state.reservas = state.reservas.filter(r => r.conta !== conta.nome);
  save();
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
  if (!confirm(`Remover somente este timer da ${timer.conta}?\n\nTempo restante: ${tempoRestante(timer.expiresAt - Date.now())}\n\nApenas esta vaga será liberada.`)) return;
  state.reservas.splice(index, 1);
  save();
}

function removerTimersConta(i) {
  const conta = state.contas[i];
  if (!conta) return;
  const atuais = state.reservas.filter(r => r.conta === conta.nome && r.expiresAt > Date.now());
  if (!atuais.length) {
    alert(`A conta ${conta.nome} não possui timers ativos.`);
    return;
  }
  if (!confirm(`Remover todos os timers de ${conta.nome}? Isso vai deixar a conta com 0/5 vendas usadas e liberar todas as vagas imediatamente.`)) return;
  state.reservas = state.reservas.filter(r => r.conta !== conta.nome);
  save();
}

function editarValorBase() {
  const atual = state.valorBase100 || 2.5;
  const entrada = prompt("Digite o valor cobrado por 100 V-Bucks:", String(atual).replace(".", ","));
  if (entrada === null) return;
  const valor = Number(String(entrada).replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    alert("Digite um valor válido maior que zero.");
    return;
  }
  state.valorBase100 = Math.round(valor * 100) / 100;
  save();
}

function editarHistorico(i) {
  const venda = state.historicoVendas[i];
  if (!venda) return;
  const op = prompt(`EDITAR REGISTRO DO HISTÓRICO\n\n1 - Nome do cliente\n2 - Nick do cliente\n3 - Item vendido\n\nDigite o número:`, `2`);
  if (op === null) return;
  const n = Number(op);

  if (n === 1) {
    const x = prompt("Novo nome do cliente:", venda.cliente || "");
    if (x === null || !x.trim()) return;
    venda.cliente = x.trim();
  } else if (n === 2) {
    const x = prompt("Novo Nick do cliente:", venda.nickCliente || "");
    if (x === null || !x.trim()) return;
    venda.nickCliente = x.trim();
  } else if (n === 3) {
    const novo = prompt("Novo nome do item:", Array.isArray(venda.itens) ? venda.itens.join(", ") : venda.item);
    if (novo === null || !novo.trim()) return;
    venda.item = novo.trim();
    venda.itens = [novo.trim()];
  }
  save();
}

function excluirHistorico(i) {
  const venda = state.historicoVendas[i];
  if (!venda) return;
  const sessaoIndex = state.vendas.findIndex(v => v.id === venda.id);
  if (sessaoIndex >= 0) {
    excluirVenda(sessaoIndex);
    return;
  }
  if (!confirm("Excluir este registro do histórico?")) return;
  state.historicoVendas.splice(i, 1);
  save();
}

function marcarMetasRetiradas() {
  const historico = Array.isArray(state.historicoVendas) ? state.historicoVendas : [];
  const totalHistoricoAtual = historico.reduce((s, v) => s + (Number(v.valor) || 0), 0);
  const metasAtingidas = Math.floor(totalHistoricoAtual / 310);
  const retiradas = state.metasLucro?.retiradas || 0;
  const disponiveis = Math.max(0, metasAtingidas - retiradas);
  if (disponiveis <= 0) {
    alert("Nenhuma meta de R$ 100 está disponível para retirada no momento.");
    return;
  }
  const valor = disponiveis * 100;
  if (!confirm(`💰 RETIRAR LUCRO?\n\nValor para retirar: R$ ${valor.toFixed(2).replace(".", ",")}\n\nConfirmar retirada?`)) return;

  state.metasLucro = state.metasLucro || { retiradas: 0 };
  state.metasLucro.retiradas += disponiveis;
  save();
}

function limparHistorico() {
  if (!state.historicoVendas.length) {
    alert("O histórico já está vazio.");
    return;
  }
  if (!confirm("⚠️ Deseja apagar todo o histórico de vendas?")) return;
  if (!confirm("🚨 Tem certeza absoluta? Essa ação não pode ser desfeita.")) return;

  state.historicoVendas = [];
  save();
}

function novaLive() {
  if (!confirm("Começar uma nova sessão? O histórico e os timers continuarão normalmente.")) return;
  state.vendas = [];
  save();
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