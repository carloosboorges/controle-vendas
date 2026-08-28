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
  "Mascote",
  "Outro"
];

const MARGEM_LUCRO = 100 / 310;
const MARGEM_CUSTO = 210 / 310;

const DADOS_DEMO = {
  contas: [
    { nome: "Putz0101", ativa: true, usadas: 0, vbucks: 10000 },
    { nome: "Putz0202", ativa: true, usadas: 0, vbucks: 8500 }
  ],
  vendas: [],
  reservas: [],
  valorBase100: 2.5,
  historicoVendas: [],
  lixeiraVendas: [],
  apoiadorRegistros: {}
};

let currentUser = null;
let authToken = localStorage.getItem("vendas_auth_token") || null;
let refreshToken = localStorage.getItem("vendas_refresh_token") || null;
let state = null;

let abaHistoricoAtiva = 'vendas';
let contasAberto = false;

let calViewMes = new Date().getMonth();
let calViewAno = new Date().getFullYear();
let calPopoverAberto = false;

let mesPopoverAberto = false;
let mesViewAno = new Date().getFullYear();

let anoPopoverAberto = false;
let anoViewDecada = new Date().getFullYear();

let apoiadorPopoverAberto = false;
let apoiadorPopoverAno = new Date().getFullYear();
let apoiadorMesSelecionadoTemp = `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`;

let diaFiltroSelecionado = null;
let mesFiltroSelecionado = null;
let anoFiltroSelecionado = null;
let ultimaDataHojeConhecida = "";

const ITENS_POR_PAGINA = 8;
let historicoPaginaAtual = 1;
let historicoTermoBusca = "";
let balancoAberto = false;

function copiarTexto(texto, tipo = "Texto", event = null) {
  if (event) event.stopPropagation();
  if (!texto || texto === "—") return;
  navigator.clipboard.writeText(texto).then(() => {
    mostrarNotificacao(`📋 ${tipo} copiado: "${texto}"`, "sucesso");
  }).catch(() => {
    mostrarNotificacao("Não foi possível copiar.", "erro");
  });
}

function extrairApenasNomeItem(itemStr) {
  if (!itemStr) return "";
  const { nome } = parseItemString(itemStr);
  return nome || itemStr;
}

function obterDataHojeFormatada() {
  const agora = new Date();
  return `${String(agora.getDate()).padStart(2, "0")}/${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
}

function toggleGerenciarContas() {
  contasAberto = !contasAberto;
  const content = document.getElementById("contasContent");
  const arrow = document.getElementById("contasToggleArrow");
  if (content && arrow) {
    content.style.display = contasAberto ? "block" : "none";
    arrow.textContent = contasAberto ? "▴" : "▾";
  }
}

function mudarAbaHistorico(aba) {
  abaHistoricoAtiva = aba;
  const btnVendas = document.getElementById("tabBtnVendas");
  const btnApoiador = document.getElementById("tabBtnApoiador");
  const divVendas = document.getElementById("conteudoAbaVendas");
  const divApoiador = document.getElementById("conteudoAbaApoiador");

  if (aba === 'vendas') {
    if (btnVendas) {
      btnVendas.classList.add("active");
      btnVendas.style.background = "var(--accent-color, #a855f7)";
      btnVendas.style.color = "#fff";
      btnVendas.style.opacity = "1";
    }
    if (btnApoiador) {
      btnApoiador.classList.remove("active");
      btnApoiador.style.background = "transparent";
      btnApoiador.style.color = "var(--muted, #9ca3af)";
      btnApoiador.style.opacity = "0.6";
    }
    if (divVendas) divVendas.style.display = "block";
    if (divApoiador) divApoiador.style.display = "none";
  } else {
    if (btnApoiador) {
      btnApoiador.classList.add("active");
      btnApoiador.style.background = "var(--accent-color, #a855f7)";
      btnApoiador.style.color = "#fff";
      btnApoiador.style.opacity = "1";
    }
    if (btnVendas) {
      btnVendas.classList.remove("active");
      btnVendas.style.background = "transparent";
      btnVendas.style.color = "var(--muted, #9ca3af)";
      btnVendas.style.opacity = "0.6";
    }
    if (divApoiador) divApoiador.style.display = "block";
    if (divVendas) divVendas.style.display = "none";
    renderizarHistoricoApoiadorCompleto();
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".period-card-calendar-container") && 
      !e.target.closest(".period-card-mes-container") && 
      !e.target.closest(".period-card-ano-container") &&
      !e.target.closest(".apoiador-popover-container")) {
    calPopoverAberto = false;
    mesPopoverAberto = false;
    anoPopoverAberto = false;
    apoiadorPopoverAberto = false;
    render();
  }
});

function toggleCalendarioPopover(e) {
  if (e) e.stopPropagation();
  mesPopoverAberto = false; anoPopoverAberto = false; apoiadorPopoverAberto = false;
  calPopoverAberto = !calPopoverAberto;
  render();
}

function navegarMesCalendario(direcao, e) {
  if (e) e.stopPropagation();
  calViewMes += direcao;
  if (calViewMes < 0) { calViewMes = 11; calViewAno--; }
  else if (calViewMes > 11) { calViewMes = 0; calViewAno++; }
  render();
}

function selecionarDiaCalendario(diaStr, e) {
  if (e) e.stopPropagation();
  const hoje = obterDataHojeFormatada();
  diaFiltroSelecionado = (diaStr === hoje) ? null : diaStr;
  calPopoverAberto = false;
  render();
}

function gerarHtmlCalendarioPopover() {
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
  const primeiroDiaSemana = new Date(calViewAno, calViewMes, 1).getDay();
  const totalDiasMes = new Date(calViewAno, calViewMes + 1, 0).getDate();
  const hojeChave = obterDataHojeFormatada();
  const diaAtivo = diaFiltroSelecionado || hojeChave;
  const diasComVendas = new Set((state?.historicoVendas || []).map(v => v.data));

  let diasHtml = "";
  for (let i = 0; i < primeiroDiaSemana; i++) { diasHtml += `<div class="cal-day-empty"></div>`; }
  const agoraZero = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dataStr = `${String(dia).padStart(2, "0")}/${String(calViewMes + 1).padStart(2, "0")}/${calViewAno}`;
    const dataObj = new Date(calViewAno, calViewMes, dia);
    const isFuturo = dataObj > agoraZero;
    const isToday = dataStr === hojeChave;
    const isSelected = dataStr === diaAtivo;
    const hasSales = diasComVendas.has(dataStr);

    diasHtml += `
      <button type="button" class="cal-day-btn ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${hasSales ? "has-sales" : ""}"
        ${isFuturo ? "disabled" : ""} onclick="selecionarDiaCalendario('${dataStr}', event)">
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
      <div class="calendar-weekdays-grid">${diasSemana.map(d => `<span>${d}</span>`).join("")}</div>
      <div class="calendar-days-grid">${diasHtml}</div>
    </div>
  `;
}

function toggleMesPopover(e) {
  if (e) e.stopPropagation();
  calPopoverAberto = false; anoPopoverAberto = false; apoiadorPopoverAberto = false;
  mesPopoverAberto = !mesPopoverAberto;
  render();
}

function navegarAnoMesPopover(direcao, e) {
  if (e) e.stopPropagation();
  mesViewAno += direcao;
  render();
}

function selecionarMesPopover(mesIndex, e) {
  if (e) e.stopPropagation();
  mesFiltroSelecionado = `${String(mesIndex + 1).padStart(2, "0")}/${mesViewAno}`;
  diaFiltroSelecionado = null;
  mesPopoverAberto = false;
  render();
}

function gerarHtmlMesPopover() {
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const agora = new Date();
  const mesAtualKey = `${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
  const mesAtivo = mesFiltroSelecionado || mesAtualKey;

  let gridMesesHtml = "";
  nomesMeses.forEach((nomeMes, idx) => {
    const chaveMes = `${String(idx + 1).padStart(2, "0")}/${mesViewAno}`;
    const isSelected = chaveMes === mesAtivo;
    const isCurrent = chaveMes === mesAtualKey;

    gridMesesHtml += `
      <button type="button" class="cal-day-btn ${isCurrent ? "is-today" : ""} ${isSelected ? "is-selected" : ""}"
        style="width:100%; aspect-ratio:unset; padding:10px 4px; font-size:12px; border-radius:8px;"
        onclick="selecionarMesPopover(${idx}, event)">
        ${nomeMes.slice(0, 3)}
      </button>
    `;
  });

  return `
    <div class="custom-calendar-popover" style="width:260px;" onclick="event.stopPropagation()">
      <div class="calendar-header-nav">
        <button type="button" class="calendar-nav-btn" onclick="navegarAnoMesPopover(-1, event)">‹</button>
        <strong>Ano ${mesViewAno}</strong>
        <button type="button" class="calendar-nav-btn" onclick="navegarAnoMesPopover(1, event)">›</button>
      </div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:10px;">
        ${gridMesesHtml}
      </div>
    </div>
  `;
}

function toggleAnoPopover(e) {
  if (e) e.stopPropagation();
  calPopoverAberto = false; mesPopoverAberto = false; apoiadorPopoverAberto = false;
  anoPopoverAberto = !anoPopoverAberto;
  render();
}

function navegarDecadaAnoPopover(direcao, e) {
  if (e) e.stopPropagation();
  anoViewDecada += direcao * 12;
  render();
}

function selecionarAnoPopover(anoVal, e) {
  if (e) e.stopPropagation();
  anoFiltroSelecionado = String(anoVal);
  anoPopoverAberto = false;
  render();
}

function gerarHtmlAnoPopover() {
  const agoraAno = new Date().getFullYear();
  const anoAtivo = Number(anoFiltroSelecionado || agoraAno);

  let anosHtml = "";
  const inicio = anoViewDecada - 5;
  const fim = anoViewDecada + 6;

  for (let a = inicio; a <= fim; a++) {
    const isSelected = a === anoAtivo;
    const isCurrent = a === agoraAno;
    anosHtml += `
      <button type="button" class="cal-day-btn ${isCurrent ? "is-today" : ""} ${isSelected ? "is-selected" : ""}"
        style="width:100%; aspect-ratio:unset; padding:10px 4px; font-size:12px; border-radius:8px;"
        onclick="selecionarAnoPopover(${a}, event)">
        ${a}
      </button>
    `;
  }

  return `
    <div class="custom-calendar-popover" style="width:260px;" onclick="event.stopPropagation()">
      <div class="calendar-header-nav">
        <button type="button" class="calendar-nav-btn" onclick="navegarDecadaAnoPopover(-1, event)">‹</button>
        <strong>${inicio} – ${fim}</strong>
        <button type="button" class="calendar-nav-btn" onclick="navegarDecadaAnoPopover(1, event)">›</button>
      </div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:10px;">
        ${anosHtml}
      </div>
    </div>
  `;
}

function toggleApoiadorPopover(e) {
  if (e) e.stopPropagation();
  apoiadorPopoverAberto = !apoiadorPopoverAberto;
  atualizarModalApoiadorHTML();
}

function navegarAnoApoiadorPopover(direcao, e) {
  if (e) e.stopPropagation();
  apoiadorPopoverAno += direcao;
  atualizarModalApoiadorHTML();
}

function selecionarMesApoiadorPopover(mesIndex, e) {
  if (e) e.stopPropagation();
  apoiadorMesSelecionadoTemp = `${String(mesIndex + 1).padStart(2, "0")}/${apoiadorPopoverAno}`;
  apoiadorPopoverAberto = false;
  atualizarModalApoiadorHTML();
  carregarDadosApoiadorNoFormulario();
}

function gerarHtmlApoiadorPopover() {
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  let gridMesesHtml = "";
  
  nomesMeses.forEach((nomeMes, idx) => {
    const chaveMes = `${String(idx + 1).padStart(2, "0")}/${apoiadorPopoverAno}`;
    const isSelected = chaveMes === apoiadorMesSelecionadoTemp;

    gridMesesHtml += `
      <button type="button" class="cal-day-btn ${isSelected ? "is-selected" : ""}"
        style="width:100%; aspect-ratio:unset; padding:10px 4px; font-size:12px; border-radius:8px;"
        onclick="selecionarMesApoiadorPopover(${idx}, event)">
        ${nomeMes.slice(0, 3)}
      </button>
    `;
  });

  return `
    <div class="custom-calendar-popover" style="width:260px; top:105%; left:0; transform:none;" onclick="event.stopPropagation()">
      <div class="calendar-header-nav">
        <button type="button" class="calendar-nav-btn" onclick="navegarAnoApoiadorPopover(-1, event)">‹</button>
        <strong>Ano ${apoiadorPopoverAno}</strong>
        <button type="button" class="calendar-nav-btn" onclick="navegarAnoApoiadorPopover(1, event)">›</button>
      </div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:10px;">
        ${gridMesesHtml}
      </div>
    </div>
  `;
}

function abrirModalApoiador() {
  const modal = document.getElementById("apoiadorModal");
  const agora = new Date();
  apoiadorPopoverAno = agora.getFullYear();
  apoiadorMesSelecionadoTemp = `${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
  apoiadorPopoverAberto = false;
  
  atualizarModalApoiadorHTML();
  if (modal) modal.style.display = "flex";
}

function fecharModalApoiador() {
  const modal = document.getElementById("apoiadorModal");
  if (modal) modal.style.display = "none";
}

function atualizarModalApoiadorHTML() {
  const container = document.getElementById("apoiadorSeletorContainer");
  if (!container) return;

  const [m, a] = apoiadorMesSelecionadoTemp.split("/").map(Number);
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const labelMesAno = `${nomesMeses[m - 1]} ${a}`;

  container.innerHTML = `
    <div class="apoiador-popover-container" style="position:relative;">
      <label>Mês / Ano</label>
      <button type="button" class="period-select" style="width:100%; padding:10px; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:#fff; text-align:left; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="toggleApoiadorPopover(event)">
        <span>📅 ${labelMesAno}</span>
        <span>▾</span>
      </button>
      ${apoiadorPopoverAberto ? gerarHtmlApoiadorPopover() : ""}
    </div>
  `;
  carregarDadosApoiadorNoFormulario();
}

function carregarDadosApoiadorNoFormulario() {
  const reg = (state.apoiadorRegistros || {})[apoiadorMesSelecionadoTemp] || { brutoUsd: 0, liquidoBrl: 0 };
  const inputBruto = document.getElementById("apoiadorBrutoUsd");
  const inputLiquido = document.getElementById("apoiadorLiquidoBrl");
  if (inputBruto) inputBruto.value = reg.brutoUsd || "";
  if (inputLiquido) inputLiquido.value = reg.liquidoBrl || "";
}

function salvarRegistroApoiador() {
  const brutoUsd = parseFloat(document.getElementById("apoiadorBrutoUsd").value) || 0;
  const liquidoBrl = parseFloat(document.getElementById("apoiadorLiquidoBrl").value) || 0;

  if (!state.apoiadorRegistros) state.apoiadorRegistros = {};
  state.apoiadorRegistros[apoiadorMesSelecionadoTemp] = { brutoUsd, liquidoBrl };

  save();
  renderizarHistoricoApoiadorCompleto();
  mostrarNotificacao(`Código apoiador de ${apoiadorMesSelecionadoTemp} salvo com sucesso!`, "sucesso");
  fecharModalApoiador();
}

function renderizarHistoricoApoiadorCompleto() {
  const container = document.getElementById("tabelaHistoricoApoiadorCompleto");
  if (!container) return;
  const registros = state.apoiadorRegistros || {};
  const chaves = Object.keys(registros).sort().reverse();

  if (chaves.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">Nenhum registro de código apoiador cadastrado ainda.</div>`;
    return;
  }

  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="financial-table" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:12px; text-align:left; border-bottom:1px solid var(--border);">Mês / Ano</th>
            <th style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">Valor Bruto ($ USD)</th>
            <th style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">Valor Líquido (R$)</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${chaves.map(k => {
            const r = registros[k];
            const [m, a] = k.split("/").map(Number);
            const labelFormatado = `${nomesMeses[m - 1]} de ${a}`;
            return `
              <tr>
                <td style="padding:12px; border-bottom:1px solid var(--border); font-weight:600; color:var(--accent-light);">📅 ${labelFormatado}</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">$${Number(r.brutoUsd || 0).toFixed(2)} USD</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid var(--border); color:var(--green); font-weight:700;">${money(r.liquidoBrl)}</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">
                  <button type="button" class="btn-danger" style="padding:4px 8px; font-size:11px;" onclick="removerRegistroApoiadorCompleto('${k}')">Excluir</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function removerRegistroApoiadorCompleto(k) {
  if (state.apoiadorRegistros && state.apoiadorRegistros[k]) {
    delete state.apoiadorRegistros[k];
    save();
    renderizarHistoricoApoiadorCompleto();
    mostrarNotificacao(`Registro de ${k} removido.`, "info");
  }
}

function toggleBalancoFinanceiro() {
  balancoAberto = !balancoAberto;
  const content = document.getElementById("financialBalanceContent");
  const arrow = document.getElementById("financialToggleArrow");
  const btn = document.getElementById("btnFinancialToggle");
  if (content && arrow) {
    content.style.display = balancoAberto ? "block" : "none";
    arrow.textContent = balancoAberto ? "▴" : "▾";
    if (btn) btn.style.borderRadius = balancoAberto ? "12px 12px 0 0" : "12px";
  }
}

function filtrarHistoricoInput(val) {
  historicoTermoBusca = String(val || "").trim().toLowerCase();
  historicoPaginaAtual = 1;
  const btnClear = document.getElementById("clearSearchBtn");
  if (btnClear) btnClear.style.display = historicoTermoBusca ? "block" : "none";
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

function mudarPaginaHistorico(p) { historicoPaginaAtual = p; render(); }

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
    if (typeof cb === "function") cb();
  };
  if (modal) modal.style.display = "flex";
}

function fecharModalConfirmacao() {
  const modal = document.getElementById("genericConfirmModal");
  if (modal) modal.style.display = "none";
  pendingConfirmCallback = null;
}

function abrirModalValorBase() {
  const modal = document.getElementById("valorBaseModal");
  const input = document.getElementById("novoValorBaseInput");
  if (input) input.value = Number(state?.valorBase100 || 2.5).toFixed(2);
  if (modal) modal.style.display = "flex";
}

function fecharModalValorBase() { document.getElementById("valorBaseModal").style.display = "none"; }

function salvarValorBaseModal() {
  const input = document.getElementById("novoValorBaseInput");
  const valor = parseFloat(input?.value);
  if (!Number.isFinite(valor) || valor <= 0) { mostrarNotificacao("Digite um valor válido.", "erro"); return; }
  state.valorBase100 = Math.round(valor * 100) / 100;
  save();
  fecharModalValorBase();
  mostrarNotificacao(`Valor base alterado para ${money(state.valorBase100)}!`, "sucesso");
}

function abrirModalAddConta() {
  document.getElementById("novaContaNomeInput").value = "";
  document.getElementById("novaContaVbucksInput").value = "0";
  document.getElementById("addContaModal").style.display = "flex";
}
function fecharModalAddConta() { document.getElementById("addContaModal").style.display = "none"; }

function salvarNovaContaModal() {
  const nome = document.getElementById("novaContaNomeInput")?.value.trim();
  const vbucks = parseInt(String(document.getElementById("novaContaVbucksInput")?.value || "0").replace(/\D/g, ""), 10) || 0;
  if (!nome) { mostrarNotificacao("Digite o nome da conta.", "erro"); return; }
  state.contas.push({ nome, ativa: false, vbucks: Number(vbucks) || 0 });
  save();
  fecharModalAddConta();
  mostrarNotificacao(`Conta ${nome} adicionada!`, "sucesso");
}

function abrirModalEditConta(i) {
  const conta = state.contas[i];
  if (!conta) return;
  document.getElementById("editContaIndex").value = i;
  document.getElementById("editContaNomeInput").value = conta.nome;
  document.getElementById("editContaVbucksInput").value = Number(conta.vbucks) || 0;
  document.getElementById("editContaSomarVbucksInput").value = "";
  document.getElementById("editContaModal").style.display = "flex";
}
function fecharModalEditConta() { document.getElementById("editContaModal").style.display = "none"; }

function somarPacoteRapido(qtd) {
  const saldoInput = document.getElementById("editContaVbucksInput");
  if (!saldoInput) return;
  saldoInput.value = (parseInt(String(saldoInput.value || "0").replace(/\D/g, ""), 10) || 0) + qtd;
  mostrarNotificacao(`+${qtd.toLocaleString("pt-BR")} VB somados!`, "sucesso");
}

function aplicarSomaVbucksModal() {
  const saldoInput = document.getElementById("editContaVbucksInput");
  const somarInput = document.getElementById("editContaSomarVbucksInput");
  const valorSomar = parseInt(String(somarInput?.value || "0").replace(/\D/g, ""), 10) || 0;
  if (valorSomar > 0) {
    saldoInput.value = (parseInt(String(saldoInput.value || "0").replace(/\D/g, ""), 10) || 0) + valorSomar;
    somarInput.value = "";
    mostrarNotificacao(`+${valorSomar.toLocaleString("pt-BR")} VB somados!`, "sucesso");
  }
}

function salvarEdicaoContaModal() {
  const i = parseInt(document.getElementById("editContaIndex").value, 10);
  const conta = state.contas[i];
  if (!conta) return;
  const novoNome = document.getElementById("editContaNomeInput").value.trim();
  const novoVbucks = parseInt(String(document.getElementById("editContaVbucksInput").value || "0").replace(/\D/g, ""), 10);
  if (!novoNome) return;
  conta.nome = novoNome;
  conta.vbucks = Number(novoVbucks) || 0;
  save();
  fecharModalEditConta();
  mostrarNotificacao("Conta atualizada!", "sucesso");
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
  document.getElementById("authModal").style.display = "flex";
  atualizarInterfaceAuth();
}
function fecharModalAuth() { document.getElementById("authModal").style.display = "none"; }

async function fazerLogin() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const lembrar = document.getElementById("lembrarCredenciais")?.checked;
  if (!email || !password) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) { mostrarNotificacao("Credenciais inválidas.", "erro"); return; }
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
  authToken = null; refreshToken = null; currentUser = null;
  localStorage.removeItem("vendas_auth_token");
  localStorage.removeItem("vendas_refresh_token");
  fecharModalAuth();
  inicializar();
}

async function renovarTokenSupabase() {
  const storedRefresh = localStorage.getItem("vendas_refresh_token");
  if (!storedRefresh) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
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
  } catch (e) {}
  return false;
}

async function verificarSessao() {
  if (!authToken) {
    const renovou = await renovarTokenSupabase();
    if (!renovou) { currentUser = null; return; }
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${authToken}` }
    });
    if (res.ok) {
      currentUser = await res.json();
    } else {
      const renovou = await renovarTokenSupabase();
      if (!renovou) { currentUser = null; authToken = null; refreshToken = null; localStorage.removeItem("vendas_auth_token"); localStorage.removeItem("vendas_refresh_token"); }
    }
  } catch (e) { currentUser = null; }
}

async function inicializar() {
  const footer = document.getElementById("statusFooter");
  await verificarSessao();
  atualizarInterfaceAuth();
  atualizarCamposItens();
  atualizarPreviewVBucks();

  if (!currentUser) {
    if (footer) footer.textContent = "👀 Modo Visitante (Faça login como Admin)";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    render();
    return;
  }

  try {
    if (footer) footer.textContent = "☁️ Carregando dados da nuvem...";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.1&select=*`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await res.json();
    state = (Array.isArray(rows) && rows.length > 0 && rows[0].data) ? rows[0].data : JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    if (footer) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
    render();
  } catch (err) {
    if (footer) footer.textContent = "⚠️ Erro ao sincronizar dados com o banco";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    render();
  }
}

function sanitizarDados() {
  if (!state) return;
  if (!Array.isArray(state.vendas)) state.vendas = [];
  if (!Array.isArray(state.reservas)) state.reservas = [];
  if (!Array.isArray(state.historicoVendas)) state.historicoVendas = [];
  if (!Array.isArray(state.lixeiraVendas)) state.lixeiraVendas = [];
  if (!state.apoiadorRegistros) state.apoiadorRegistros = {};
}

async function save() {
  sanitizarDados();
  render();
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
      body: JSON.stringify({ id: 1, data: state, updated_at: new Date().toISOString() })
    });
    if (footer) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
  } catch (err) {
    if (footer) footer.textContent = "⚠️ Erro ao salvar na nuvem";
  }
}

function limparReservasExpiradas() {
  if (!state || !Array.isArray(state.reservas)) return false;
  const agora = Date.now();
  const novas = state.reservas.filter(r => r.expiresAt > agora);
  if (novas.length !== state.reservas.length) { state.reservas = novas; return true; }
  return false;
}

function usadasDaConta(nome) {
  return (state.reservas || []).filter(r => r.conta === nome && r.expiresAt > Date.now()).length;
}

function tempoRestante(ms) {
  if (ms <= 0) return "liberado";
  let s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  s %= 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function valorParaVBucks(valor, baseCustom) {
  const base = Number(baseCustom || state?.valorBase100 || 2.5);
  return Math.round((Number(valor) / base) * 100);
}

function formatVBucks(v) { return Math.max(0, Math.round(Number(v) || 0)).toLocaleString("pt-BR"); }
function money(v) { return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function esc(s) { return String(s || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])); }

function totais() {
  let t = {};
  (state?.contas || []).forEach(c => (t[c.nome] = 0));
  (state?.vendas || []).forEach(v => (t[v.conta] = (t[v.conta] || 0) + Number(v.valor || 0)));
  return t;
}

function totaisHistoricoPorConta() {
  let t = {}, vbMap = {};
  (state?.contas || []).forEach(c => { t[c.nome] = 0; vbMap[c.nome] = 0; });
  (state?.historicoVendas || []).forEach(v => {
    t[v.conta] = (t[v.conta] || 0) + Number(v.valor || 0);
    vbMap[v.conta] = (vbMap[v.conta] || 0) + (v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento));
  });
  return { faturamento: t, vbucks: vbMap };
}

function parseItemString(str) {
  const s = String(str || "").trim();
  const sep = s.indexOf("–") >= 0 ? "–" : (s.indexOf("-") >= 0 ? "-" : null);
  if (!sep) return { tipo: "Outro", nome: s };
  const partes = s.split(sep);
  const match = CATEGORIAS_ITENS.find(c => c.toLowerCase() === partes[0].trim().toLowerCase());
  return match ? { tipo: match, nome: partes.slice(1).join(sep).trim() } : { tipo: "Outro", nome: s };
}

function formatItemString(tipo, nome) {
  const t = String(tipo || "").trim();
  const n = String(nome || "").trim();
  return !t ? n : `${t} – ${n}`;
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
        <select class="item-type-select" id="itemTypeSelect_${i}">${optionsHtml}</select>
        <input class="item-name-input" id="itemNameInput_${i}" type="text" maxlength="120" placeholder="Nome do item">
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
    if (nome) lista.push(formatItemString(tipo, nome));
  }
  return lista;
}

function render() {
  if (!state) return;
  const baseEl = document.getElementById("valorBaseDisplay");
  if (baseEl) baseEl.textContent = money(state.valorBase100 || 2.5);

  limparReservasExpiradas();
  const tSessao = totais();
  const totalSessao = (state.vendas || []).reduce((a, v) => a + Number(v.valor || 0), 0);
  document.getElementById("totalGeral").textContent = money(totalSessao);
  
  const qtdPedidosSessao = (state.vendas || []).length;
  const qtdItensSessao = (state.vendas || []).reduce((a, v) => a + (Number(v.quantidade) || 1), 0);
  document.getElementById("qtdVendas").textContent = `${qtdPedidosSessao} (${qtdItensSessao} itens)`;

  let top = "—", tv = 0;
  Object.entries(tSessao).forEach(([n, v]) => { if (v > tv) { top = n; tv = v; } });
  document.getElementById("topConta").textContent = tv ? `${top} — ${money(tv)}` : "—";

  const sel = document.getElementById("contaSelect");
  const old = sel.value;
  sel.innerHTML = (state.contas || []).filter(c => c.ativa).map(c => `<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join("");
  if ([...sel.options].some(o => o.value === old)) sel.value = old;

  renderContasCards(tSessao);

  document.getElementById("contas").innerHTML = (state.contas || []).map((c, i) => `
    <div class="account-row">
      <div class="account-info">
        <div class="account-header-line">
          <div class="account-name">${esc(c.nome)}</div>
          <span class="badge ${c.ativa ? "" : "off"}">${c.ativa ? "🟢 ATIVA" : "⚫ DESATIVADA"}</span>
        </div>
        <div class="small">${c.ativa ? `Saldo: ${formatVBucks(c.vbucks)} V-Bucks` : "Desativada"}</div>
      </div>
      <div class="account-actions">
        <button type="button" class="btn-gray" onclick="abrirModalEditConta(${i})">✏️ Editar</button>
        <button type="button" class="${c.ativa ? "btn-gray" : "btn-green"}" onclick="toggleConta(${i})">${c.ativa ? "Desativar" : "Ativar"}</button>
        <button type="button" class="btn-danger" onclick="removerConta(${i})">🗑️ Remover</button>
      </div>
    </div>`).join("");

  const totalHistorico = (state.historicoVendas || []).reduce((s, v) => s + Number(v.valor || 0), 0);
  const totalPedidosHistorico = (state.historicoVendas || []).length;
  const totalItensHistorico = (state.historicoVendas || []).reduce((s, v) => s + (Number(v.quantidade) || 1), 0);

  document.getElementById("historicoQtdTotal").textContent = `${totalPedidosHistorico} pedidos · ${totalItensHistorico} itens enviados`;
  document.getElementById("historicoTotal").textContent = `Total do histórico: ${money(totalHistorico)}`;
  document.getElementById("lixeiraBtn").textContent = `🗑️ Lixeira (${(state.lixeiraVendas || []).length})`;

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
  const somaVbucksFiltro = fn => historico.filter(fn).reduce((s, v) => s + (v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento)), 0);
  const qtdPedidosFiltro = fn => historico.filter(fn).length;
  const qtdItensFiltro = fn => historico.filter(fn).reduce((s, v) => s + (Number(v.quantidade) || 1), 0);

  const hojeChave = obterDataHojeFormatada();
  const diaParaFiltrar = diaFiltroSelecionado || hojeChave;
  const isModoHoje = diaParaFiltrar === hojeChave;

  const diaTotal = somaFiltro(v => v.data === diaParaFiltrar);
  const diaVbucks = somaVbucksFiltro(v => v.data === diaParaFiltrar);
  const diaPedidos = qtdPedidosFiltro(v => v.data === diaParaFiltrar);
  const diaItens = qtdItensFiltro(v => v.data === diaParaFiltrar);

  const semInicio = inicioSemana(agoraData);
  const semFim = new Date(semInicio); semFim.setDate(semFim.getDate() + 7);
  const semanaTotal = somaFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });

  const nomesMes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const mesAtualKey = `${String(agoraData.getMonth() + 1).padStart(2, "0")}/${agoraData.getFullYear()}`;
  if (!mesFiltroSelecionado) mesFiltroSelecionado = mesAtualKey;

  const [selM, selA] = mesFiltroSelecionado.split("/").map(Number);
  const mesTotalVendas = somaFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });

  const lucroVendasMes = mesTotalVendas * MARGEM_LUCRO;
  const regApoiadorMes = (state.apoiadorRegistros || {})[mesFiltroSelecionado] || { brutoUsd: 0, liquidoBrl: 0 };
  const lucroApoiadorMes = Number(regApoiadorMes.liquidoBrl || 0);
  const lucroTotalMesCombinado = lucroVendasMes + lucroApoiadorMes;

  const setAnos = new Set();
  setAnos.add(String(agoraData.getFullYear()));
  historico.forEach(v => { const d = chaveData(v); if (d) setAnos.add(String(d.getFullYear())); });
  const anosLista = Array.from(setAnos).sort((a, b) => Number(b) - Number(a));
  if (!anoFiltroSelecionado) anoFiltroSelecionado = String(agoraData.getFullYear());

  const selAnoNum = Number(anoFiltroSelecionado);
  const anoTotalVendas = somaFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });

  const lucroVendasAno = anoTotalVendas * MARGEM_LUCRO;
  let lucroApoiadorAno = 0;
  Object.entries(state.apoiadorRegistros || {}).forEach(([k, reg]) => {
    if (k.endsWith(`/${selAnoNum}`)) lucroApoiadorAno += Number(reg.liquidoBrl || 0);
  });
  const lucroTotalAnoCombinado = lucroVendasAno + lucroApoiadorAno;

  let totalLiquidoApoiadorGlobal = 0;
  Object.values(state.apoiadorRegistros || {}).forEach(reg => { totalLiquidoApoiadorGlobal += Number(reg.liquidoBrl || 0); });

  const lucroContinuoGeralVendas = totalHistorico * MARGEM_LUCRO;
  const lucroLiquidoGlobalTotal = lucroContinuoGeralVendas + totalLiquidoApoiadorGlobal;

  const periodosEl = document.getElementById("historicoPeriodos");
  if (periodosEl) {
    const nomeMesSelecionadoLabel = `${nomesMes[selM - 1]} ${selA}`;

    periodosEl.innerHTML = `
    <div class="period-card period-card-calendar-container" style="position:relative; cursor:pointer;" onclick="toggleCalendarioPopover(event)">
      <div class="period-header-select">
        <span>📅</span>
        <strong style="font-size:12px; color:var(--accent-light);">${isModoHoje ? `Hoje (${diaParaFiltrar.slice(0, 5)})` : diaParaFiltrar} ▾</strong>
      </div>
      <strong>${money(diaTotal)}</strong>
      <small>${diaPedidos} pedidos (${diaItens} itens)</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(diaVbucks)} V-Bucks</small>
      ${calPopoverAberto ? gerarHtmlCalendarioPopover() : ""}
    </div>

    <div class="period-card">
      <span>📅 Esta semana</span>
      <strong>${money(semanaTotal)}</strong>
      <small>${semanaPedidos} pedidos (${semanaItens} itens)</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(semanaVbucks)} V-Bucks</small>
    </div>

    <div class="period-card period-card-mes-container" style="position:relative; cursor:pointer;" onclick="toggleMesPopover(event)">
      <div class="period-header-select">
        <span>🗓️</span>
        <strong style="font-size:12px; color:var(--accent-light);">${nomeMesSelecionadoLabel} ▾</strong>
      </div>
      <strong>${money(mesTotalVendas)}</strong>
      <small>${mesPedidos} pedidos (${mesItens} itens)</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(mesVbucks)} V-Bucks</small>
      <div style="font-size:10px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px; line-height:1.3;">
        <span style="color:var(--muted);">Vendas:</span> ${money(lucroVendasMes)}<br>
        <span style="color:var(--muted);">Apoiador:</span> ${money(lucroApoiadorMes)}<br>
        <strong style="color:var(--green);">Total: ${money(lucroTotalMesCombinado)}</strong>
      </div>
      ${mesPopoverAberto ? gerarHtmlMesPopover() : ""}
    </div>

    <div class="period-card period-card-ano-container" style="position:relative; cursor:pointer;" onclick="toggleAnoPopover(event)">
      <div class="period-header-select">
        <span>📆</span>
        <strong style="font-size:12px; color:var(--accent-light);">Ano ${anoFiltroSelecionado} ▾</strong>
      </div>
      <strong>${money(anoTotalVendas)}</strong>
      <small>${anoPedidos} pedidos (${anoItens} itens)</small>
      <small class="period-vbucks-text">🪙 ${formatVBucks(anoVbucks)} V-Bucks</small>
      <div style="font-size:10px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px; line-height:1.3;">
        <span style="color:var(--muted);">Vendas:</span> ${money(lucroVendasAno)}<br>
        <span style="color:var(--muted);">Apoiador:</span> ${money(lucroApoiadorAno)}<br>
        <strong style="color:var(--green);">Total: ${money(lucroTotalAnoCombinado)}</strong>
      </div>
      ${anoPopoverAberto ? gerarHtmlAnoPopover() : ""}
    </div>

    <div class="period-card profit-card">
      <span>📈 Lucro Global</span>
      <strong>${money(lucroLiquidoGlobalTotal)}</strong>
      <small style="color:var(--green); font-weight:700;">Vendas: ${money(lucroContinuoGeralVendas)}</small>
      <small style="color:var(--accent-light); font-weight:700;">Apoiador: ${money(totalLiquidoApoiadorGlobal)}</small>
    </div>
  `;
  }

  const financialContent = document.getElementById("financialBalanceContent");
  if (financialContent) {
    const dadosContas = totaisHistoricoPorConta();
    const faturamentoHistorico = dadosContas.faturamento;
    const vbucksHistorico = dadosContas.vbucks;
    const contasAtivas = (state.contas || []).filter(c => c.ativa);

    let somaFatGeral = 0, somaVbucksGeral = 0, somaCustoGeral = 0, somaLucroGeral = 0;

    const linhasHtml = contasAtivas.map(c => {
      const fat = faturamentoHistorico[c.nome] || 0;
      const vbUsados = vbucksHistorico[c.nome] || 0;
      const custo = fat * MARGEM_CUSTO;
      const lucro = fat * MARGEM_LUCRO;
      somaFatGeral += fat; somaVbucksGeral += vbUsados; somaCustoGeral += custo; somaLucroGeral += lucro;

      return `
        <tr>
          <td><b>${esc(c.nome)}</b></td>
          <td style="color:var(--green); font-weight:700;">🪙 ${formatVBucks(vbUsados)} VB</td>
          <td style="color:#fff;">${money(fat)}</td>
          <td style="color:var(--muted);">${money(custo)}</td>
          <td style="color:var(--green); font-weight:800;">${money(lucro)}</td>
        </tr>
      `;
    }).join("");

    financialContent.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="financial-table">
          <thead>
            <tr>
              <th>Conta</th>
              <th>V-Bucks Utilizados</th>
              <th>Faturamento Total</th>
              <th>Custo Reposição</th>
              <th>Lucro Líquido (Vendas)</th>
            </tr>
          </thead>
          <tbody>
            ${linhasHtml.length ? linhasHtml : `<tr><td colspan="5" style="text-align:center; color:var(--muted); padding:15px;">Nenhuma conta ativa.</td></tr>`}
          </tbody>
          ${linhasHtml.length ? `
          <tfoot>
            <tr style="border-top: 2px solid var(--accent); background: rgba(142, 68, 255, 0.12);">
              <td style="font-weight:900; color:var(--accent-light);">TOTAL GERAL</td>
              <td style="font-weight:900; color:var(--green);">🪙 ${formatVBucks(somaVbucksGeral)} VB</td>
              <td style="font-weight:900; color:#fff;">${money(somaFatGeral)}</td>
              <td style="font-weight:900; color:var(--muted);">${money(somaCustoGeral)}</td>
              <td style="font-weight:900; color:var(--green);">${money(somaLucroGeral)}</td>
            </tr>
          </tfoot>` : ""}
        </table>
      </div>
    `;
  }

  const historicoContainer = document.getElementById("historico");
  if (historicoContainer) {
    const listaComIndices = historico.map((v, originalIdx) => ({
      ...v, originalIdx, numeroPedido: `#${String(originalIdx + 1).padStart(2, "0")}`
    })).reverse();

    let listaFiltrada = listaComIndices;
    if (historicoTermoBusca) {
      listaFiltrada = listaComIndices.filter(v => {
        const itensStr = Array.isArray(v.itens) ? v.itens.join(" ").toLowerCase() : String(v.item || "").toLowerCase();
        const obsStr = String(v.observacao || "").toLowerCase();
        return v.numeroPedido.toLowerCase().includes(historicoTermoBusca) ||
          String(v.cliente || "").toLowerCase().includes(historicoTermoBusca) ||
          String(v.nickCliente || "").toLowerCase().includes(historicoTermoBusca) ||
          String(v.conta || "").toLowerCase().includes(historicoTermoBusca) ||
          itensStr.includes(historicoTermoBusca) ||
          obsStr.includes(historicoTermoBusca);
      });
    }

    const totalItensFiltrados = listaFiltrada.length;
    const totalPaginas = Math.ceil(totalItensFiltrados / ITENS_POR_PAGINA) || 1;
    if (historicoPaginaAtual > totalPaginas) historicoPaginaAtual = totalPaginas;
    if (historicoPaginaAtual < 1) historicoPaginaAtual = 1;

    const itensPagina = listaFiltrada.slice((historicoPaginaAtual - 1) * ITENS_POR_PAGINA, historicoPaginaAtual * ITENS_POR_PAGINA);

    if (itensPagina.length === 0) {
      historicoContainer.innerHTML = `<div class="empty">Nenhuma venda encontrada.</div>`;
    } else {
      historicoContainer.innerHTML = itensPagina.map(v => {
        const vb = v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
        const itensListHtml = Array.isArray(v.itens) && v.itens.length
          ? v.itens.map((itemStr, n) => `${n === 0 ? "" : "<br>"}🎁 ${n + 1}. <span class="copyable-text" onclick="copiarTexto('${esc(extrairApenasNomeItem(itemStr))}', 'Item', event)" title="Clique para copiar">${esc(itemStr)}</span>`).join("")
          : `🎁 <span class="copyable-text" onclick="copiarTexto('${esc(extrairApenasNomeItem(v.item))}', 'Item', event)" title="Clique para copiar">${esc(v.item)}</span>`;

        const observacaoHtml = v.observacao ? `
          <div style="margin-top: 6px; font-size: 12px; color: var(--accent-light); background: rgba(142,68,255,0.08); padding: 4px 8px; border-radius: 6px; border-left: 3px solid var(--accent);">
            💬 <b>Observação:</b> ${esc(v.observacao)}
          </div>
        ` : "";

        return `<div class="history-card">
          <div class="history-main">
            <div class="history-number">${v.numeroPedido}</div>
            <div class="history-info">
              <div class="history-account">
                <span class="copyable-text" onclick="copiarTexto('${esc(v.conta)}', 'Conta', event)" title="Clique para copiar">${esc(v.conta)}</span>
              </div>
              <div class="history-client">
                👤 <span class="copyable-text" onclick="copiarTexto('${esc(v.cliente)}', 'Cliente', event)" title="Clique para copiar">${esc(v.cliente)}</span>
              </div>
              <div class="history-client">
                🎮 <span class="copyable-text" onclick="copiarTexto('${esc(v.nickCliente)}', 'Nick', event)" title="Clique para copiar">${esc(v.nickCliente)}</span>
              </div>
              <div class="history-item">${itensListHtml}</div>
              <div class="history-date">📅 ${esc(v.data)} às ${esc(v.hora)}</div>
              ${observacaoHtml}
            </div>
            <div class="history-value">${money(v.valor)}</div>
          </div>
          <div class="history-details">
            <span>🪙 ${formatVBucks(vb)} V-Bucks</span>
            <div class="history-actions">
              <button type="button" class="btn-gray" onclick="abrirModalEdicaoPorId('${esc(v.id)}')">✏️ Editar</button>
              <button type="button" class="btn-danger" onclick="excluirHistoricoPorId('${esc(v.id)}')">🗑️ Excluir</button>
            </div>
          </div>
        </div>`;
      }).join("");
    }

    const paginacaoContainer = document.getElementById("historyPagination");
    if (paginacaoContainer) {
      if (totalItensFiltrados === 0) {
        paginacaoContainer.innerHTML = "";
      } else {
        let botoesPaginasHtml = "";
        for (let p = 1; p <= totalPaginas; p++) {
          if (p === 1 || p === totalPaginas || (p >= historicoPaginaAtual - 1 && p <= historicoPaginaAtual + 1)) {
            botoesPaginasHtml += `<button type="button" class="pagination-btn ${p === historicoPaginaAtual ? "active" : ""}" onclick="mudarPaginaHistorico(${p})">${p}</button>`;
          } else if (p === historicoPaginaAtual - 2 || p === historicoPaginaAtual + 2) {
            botoesPaginasHtml += `<span style="color:var(--muted); font-size:12px; padding:0 2px;">...</span>`;
          }
        }
        paginacaoContainer.innerHTML = `
          <div class="pagination-controls-row">
            <button type="button" class="pagination-btn" ${historicoPaginaAtual === 1 ? "disabled" : ""} onclick="mudarPaginaHistorico(${historicoPaginaAtual - 1})">‹ Anterior</button>
            ${botoesPaginasHtml}
            <button type="button" class="pagination-btn" ${historicoPaginaAtual === totalPaginas ? "disabled" : ""} onclick="mudarPaginaHistorico(${historicoPaginaAtual + 1})">Próxima ›</button>
          </div>
          <div class="pagination-info-text">
            Página ${historicoPaginaAtual} de ${totalPaginas} · Exibindo ${itensPagina.length} de ${totalItensFiltrados} vendas
          </div>
        `;
      }
    }
  }

  if (abaHistoricoAtiva === 'apoiador') {
    renderizarHistoricoApoiadorCompleto();
  }
}

function renderContasCards(t) {
  if (!t) t = totais();
  const container = document.getElementById("totaisPorConta");
  if (!container || !state) return;

  container.innerHTML = (state.contas || []).filter(c => c.ativa).map(c => {
    const quantidade = usadasDaConta(c.nome);
    const disponiveis = Math.max(0, 5 - quantidade);
    const reservasAtivas = (state.reservas || []).filter(r => r.conta === c.nome && r.expiresAt > Date.now());
    
    const tempos = reservasAtivas.map((r, n) => `
      <div class="timer-line">
        <span>Venda ${n + 1}: ${tempoRestante(r.expiresAt - Date.now())}</span>
        <button type="button" class="btn-danger timer-remove-btn" onclick="removerTimerEspecifico(${state.reservas.indexOf(r)})">✕</button>
      </div>
    `);

    return `<div class="total-account ${quantidade >= 5 ? "limit-reached" : ""}">
      <div class="account-card-head">
        <div class="name">${esc(c.nome)}</div>
        <button type="button" class="btn-danger reset-timer-btn" onclick="removerTimersConta(${state.contas.indexOf(c)})">🗑️ Resetar</button>
      </div>
      <div class="amount">${money(t[c.nome] || 0)}</div>
      <div class="sales-count">🪙 ${formatVBucks(c.vbucks)} V-Bucks</div>
      <div class="sales-count">🛒 ${quantidade} ${quantidade === 1 ? "venda" : "vendas"} nesta sessão</div>
      <div class="sales-count">📦 ${quantidade}/5 usadas · ${disponiveis} ${disponiveis === 1 ? "disponível" : "disponíveis"}</div>
      <div class="timer">${tempos.length ? tempos.join("") : `🟢 5 vagas disponíveis`}</div>
    </div>`;
  }).join("");
}

function adicionarVenda() {
  limparReservasExpiradas();
  const conta = document.getElementById("contaSelect").value;
  const valor = parseFloat(document.getElementById("valorInput").value);
  const cliente = document.getElementById("clienteInput").value.trim();
  const nickCliente = document.getElementById("nickClienteInput").value.trim();
  const observacao = document.getElementById("observacaoInput")?.value.trim() || "";
  const quantidade = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const itens = obterItensDaVenda();
  const baseAtual = state.valorBase100 || 2.5;

  if (!conta) { mostrarNotificacao("Ative pelo menos uma conta.", "erro"); return; }
  if (!valor || valor <= 0) { mostrarNotificacao("Digite um valor válido.", "erro"); return; }
  if (!cliente || !nickCliente) { mostrarNotificacao("Preencha cliente e nick.", "erro"); return; }

  const usadas = usadasDaConta(conta);
  if (usadas + quantidade > 5) { mostrarNotificacao(`Limite excedido na conta ${conta}.`, "erro"); return; }

  const contaObj = (state.contas || []).find(c => c.nome === conta);
  const vbucksNecessarios = Math.round((valor / baseAtual) * 100);
  if (Number(contaObj?.vbucks) < vbucksNecessarios) { mostrarNotificacao("Saldo de V-Bucks insuficiente na conta.", "erro"); return; }

  contaObj.vbucks = Math.max(0, Number(contaObj.vbucks) - vbucksNecessarios);
  const agora = Date.now(), d = new Date();
  const vendaId = crypto.randomUUID ? crypto.randomUUID() : `venda-${Date.now()}`;

  const novaVenda = {
    id: vendaId, conta, valor: Number(valor), vbucks: vbucksNecessarios, valorBaseMomento: baseAtual,
    quantidade, cliente, nickCliente, observacao, item: itens[0] || "", itens,
    data: d.toLocaleDateString("pt-BR"), hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), criadoEmMs: agora
  };

  state.vendas.push(novaVenda);
  state.historicoVendas.push({ ...novaVenda, itens: [...itens] });
  for (let n = 0; n < quantidade; n++) {
    state.reservas.push({ id: `timer-${Date.now()}-${n}`, conta, vendaId, expiresAt: agora + 86400000 });
  }

  document.getElementById("valorInput").value = "";
  document.getElementById("clienteInput").value = "";
  document.getElementById("nickClienteInput").value = "";
  document.getElementById("observacaoInput").value = "";
  document.getElementById("quantidadeInput").value = "1";
  atualizarCamposItens();
  atualizarPreviewVBucks();
  save();
  mostrarNotificacao("Venda registrada com sucesso!", "sucesso");
}

function abrirModalEdicaoPorId(vendaId) {
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  document.getElementById("editVendaId").value = vendaId;
  const selectConta = document.getElementById("editContaSelect");
  if (selectConta) {
    selectConta.innerHTML = (state.contas || []).map(c => `
      <option value="${esc(c.nome)}" ${c.nome === venda.conta ? "selected" : ""}>
        ${esc(c.nome)} (${formatVBucks(c.vbucks)} VB)
      </option>
    `).join("");
    selectConta.value = venda.conta;
  }

  document.getElementById("editClientInput").value = venda.cliente || "";
  document.getElementById("editNickInput").value = venda.nickCliente || "";
  document.getElementById("editObservacaoInput").value = venda.observacao || "";
  document.getElementById("editDataInput").value = venda.data || "";
  document.getElementById("editHoraInput").value = venda.hora || "";
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
          <select class="item-type-select edit-modal-item-type">${optionsHtml}</select>
          <input class="item-name-input edit-modal-item-name" type="text" maxlength="120" value="${esc(nome)}" placeholder="Nome do item">
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("editSaleModal").style.display = "flex";
}

function salvarEdicaoVenda() {
  const vendaId = document.getElementById("editVendaId").value;
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  const cliente = document.getElementById("editClientInput").value.trim();
  const nick = document.getElementById("editNickInput").value.trim();
  const observacao = document.getElementById("editObservacaoInput").value.trim();
  const novaData = document.getElementById("editDataInput").value.trim();
  const novaHora = document.getElementById("editHoraInput").value.trim();
  const valor = parseFloat(document.getElementById("editValorInput").value);

  if (!cliente || !nick || !novaData || !valor) {
    mostrarNotificacao("Preencha os campos obrigatórios.", "erro");
    return;
  }

  venda.cliente = cliente;
  venda.nickCliente = nick;
  venda.observacao = observacao;
  venda.data = novaData;
  venda.hora = novaHora || venda.hora || "—";
  venda.valor = Number(valor);

  const sessaoVenda = (state.vendas || []).find(v => v.id === venda.id);
  if (sessaoVenda) {
    sessaoVenda.cliente = cliente;
    sessaoVenda.nickCliente = nick;
    sessaoVenda.observacao = observacao;
    sessaoVenda.data = novaData;
    sessaoVenda.hora = novaHora;
    sessaoVenda.valor = Number(valor);
  }

  save();
  fecharModalEdicao();
  mostrarNotificacao("Alterações salvas com sucesso!", "sucesso");
}

function excluirHistoricoPorId(vendaId) {
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  abrirModalConfirmacao("🗑️ Mover para Lixeira", `Mover venda de ${venda.cliente} para a lixeira?`, () => {
    const conta = (state.contas || []).find(c => c.nome === venda.conta);
    if (conta) conta.vbucks += (venda.vbucks || 0);
    state.reservas = (state.reservas || []).filter(r => r.vendaId !== venda.id);
    state.vendas = (state.vendas || []).filter(v => v.id !== venda.id);
    state.historicoVendas.splice(i, 1);
    if (!state.lixeiraVendas) state.lixeiraVendas = [];
    state.lixeiraVendas.unshift(venda);
    save();
    mostrarNotificacao("Venda movida para a lixeira.", "sucesso");
  });
}

function restaurarVenda(idx) {
  const venda = (state.lixeiraVendas || [])[idx];
  if (!venda) return;
  state.lixeiraVendas.splice(idx, 1);
  state.historicoVendas.push(venda);
  save();
  abrirModalLixeira();
  mostrarNotificacao("Venda restaurada com sucesso!", "sucesso");
}

function excluirDefinitivoLixeira(idx) {
  state.lixeiraVendas.splice(idx, 1);
  save();
  abrirModalLixeira();
  mostrarNotificacao("Venda apagada permanentemente.", "info");
}

function esvaziarLixeira() {
  state.lixeiraVendas = [];
  save();
  abrirModalLixeira();
  mostrarNotificacao("Lixeira esvaziada.", "info");
}

function abrirModalLixeira() {
  const modal = document.getElementById("trashModal");
  const container = document.getElementById("trashListContainer");
  const lixeira = state.lixeiraVendas || [];
  if (!container) return;

  if (lixeira.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">A lixeira está vazia.</div>`;
  } else {
    container.innerHTML = lixeira.map((v, idx) => `
      <div class="trash-item-card" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); border:1px solid var(--border); padding:10px; border-radius:8px; margin-bottom:8px;">
        <div>
          <strong>${esc(v.cliente)}</strong> (${money(v.valor)}) · ${esc(v.conta)}<br>
          <small style="color:var(--muted);">${esc(v.data)} às ${esc(v.hora)}</small>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" class="btn-green" style="padding:4px 8px; font-size:11px;" onclick="restaurarVenda(${idx})">♻️ Restaurar</button>
          <button type="button" class="btn-danger" style="padding:4px 8px; font-size:11px;" onclick="excluirDefinitivoLixeira(${idx})">✕</button>
        </div>
      </div>
    `).join("");
  }
  if (modal) modal.style.display = "flex";
}

function fecharModalLixeira() { document.getElementById("trashModal").style.display = "none"; }
function fecharModalEdicao() { document.getElementById("editSaleModal").style.display = "none"; }

function valorRapido(v) {
  const input = document.getElementById("valorInput");
  if (!input) return;
  input.value = ((parseFloat(input.value) || 0) + Number(v)).toFixed(2);
  atualizarPreviewVBucks();
  input.focus();
}

function toggleConta(i) { state.contas[i].ativa = !state.contas[i].ativa; save(); }
function removerConta(i) { state.contas.splice(i, 1); save(); }
function removerTimerEspecifico(idx) { state.reservas.splice(idx, 1); save(); }
function removerTimersConta(i) {
  const c = state.contas[i];
  if (c) { state.reservas = state.reservas.filter(r => r.conta !== c.nome); save(); }
}
async function novaLive() { state.vendas = []; await save(); mostrarNotificacao("Nova sessão iniciada!", "sucesso"); }

document.getElementById("limparValorBtn").addEventListener("click", () => {
  document.getElementById("valorInput").value = "";
  atualizarPreviewVBucks();
});

inicializar();