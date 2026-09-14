// ========================================================
// MÓDULO DA ABA APOIADOR
// ========================================================

let apoiadorPopoverAberto = false;
let apoiadorPopoverAno = new Date().getFullYear();
let apoiadorMesSelecionadoTemp = `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`;

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
  let gridMesesHtml = nomesMeses.map((nm, idx) => {
    return `<button type="button" class="cal-day-btn ${`${String(idx + 1).padStart(2, "0")}/${apoiadorPopoverAno}` === apoiadorMesSelecionadoTemp ? "is-selected" : ""}" style="width:100%; aspect-ratio:unset; padding:10px 4px; font-size:12px; border-radius:8px;" onclick="selecionarMesApoiadorPopover(${idx}, event)">${nm.slice(0, 3)}</button>`;
  }).join("");
  return `<div class="custom-calendar-popover" style="width:260px; top:105%; left:0; transform:none;" onclick="event.stopPropagation()"><div class="calendar-header-nav"><button type="button" class="calendar-nav-btn" onclick="navegarAnoApoiadorPopover(-1, event)">‹</button><strong>Ano ${apoiadorPopoverAno}</strong><button type="button" class="calendar-nav-btn" onclick="navegarAnoApoiadorPopover(1, event)">›</button></div><div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:10px;">${gridMesesHtml}</div></div>`;
}

function abrirModalApoiador(mesEspecifico = null) {
  const modal = document.getElementById("apoiadorModal");
  if (mesEspecifico) {
    const [m, a] = mesEspecifico.split("/");
    apoiadorPopoverAno = Number(a);
    apoiadorMesSelecionadoTemp = mesEspecifico;
  } else {
    const agora = new Date();
    apoiadorPopoverAno = agora.getFullYear();
    apoiadorMesSelecionadoTemp = `${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
  }
  
  apoiadorPopoverAberto = false;
  atualizarModalApoiadorHTML();
  if (modal) modal.style.display = "flex";
}

function fecharModalApoiador() {
  if (document.getElementById("apoiadorModal")) document.getElementById("apoiadorModal").style.display = "none";
}

function atualizarModalApoiadorHTML() {
  const container = document.getElementById("apoiadorSeletorContainer");
  if (!container) return;
  const [m, a] = apoiadorMesSelecionadoTemp.split("/").map(Number);
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  container.innerHTML = `<div class="apoiador-popover-container" style="position:relative;"><label>Mês / Ano</label><button type="button" class="period-select" style="width:100%; padding:10px; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:#fff; text-align:left; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="toggleApoiadorPopover(event)"><span>📅 ${nomesMeses[m - 1]} ${a}</span><span>▾</span></button>${apoiadorPopoverAberto ? gerarHtmlApoiadorPopover() : ""}</div>`;
  carregarDadosApoiadorNoFormulario();
}

function carregarDadosApoiadorNoFormulario() {
  const reg = (state.apoiadorRegistros || {})[apoiadorMesSelecionadoTemp] || { brutoUsd: 0, liquidoBrl: 0 };
  if (document.getElementById("apoiadorBrutoUsd")) document.getElementById("apoiadorBrutoUsd").value = reg.brutoUsd || "";
  if (document.getElementById("apoiadorLiquidoBrl")) document.getElementById("apoiadorLiquidoBrl").value = reg.liquidoBrl || "";
}

function salvarRegistroApoiador() {
  const brutoUsd = parseFloat(document.getElementById("apoiadorBrutoUsd").value) || 0;
  const liquidoBrl = parseFloat(document.getElementById("apoiadorLiquidoBrl").value) || 0;
  if (!state.apoiadorRegistros) state.apoiadorRegistros = {};
  state.apoiadorRegistros[apoiadorMesSelecionadoTemp] = { brutoUsd, liquidoBrl };
  if (typeof save === 'function') save();
  renderizarHistoricoApoiadorCompleto();
  mostrarNotificacao(`Código apoiador salvo!`, "sucesso");
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
  
  container.innerHTML = `<div style="overflow-x:auto;"><table class="financial-table" style="width:100%; border-collapse:collapse;"><thead><tr><th style="padding:12px; text-align:left; border-bottom:1px solid var(--border);">Mês / Ano</th><th style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">Valor Bruto ($ USD)</th><th style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">Valor Líquido (R$)</th><th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Ações</th></tr></thead><tbody>${chaves.map(k => {
    const r = registros[k];
    const [m, a] = k.split("/").map(Number);
    const nomeMesPorExtenso = `${nomesMeses[m - 1]} de ${a}`;
    
    return `<tr>
      <td style="padding:12px; border-bottom:1px solid var(--border); font-weight:600; color:var(--accent-light);">📅 ${nomeMesPorExtenso}</td>
      <td style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">$${Number(r.brutoUsd || 0).toFixed(2)} USD</td>
      <td style="padding:12px; text-align:right; border-bottom:1px solid var(--border); color:var(--green); font-weight:700;">${maskMoney(money(r.liquidoBrl))}</td>
      <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">
        <div style="display:flex; justify-content:center; gap:6px;">
          <button type="button" class="btn-gray" style="padding:4px 10px; font-size:11px;" onclick="abrirModalApoiador('${k}')">✏️ Editar</button>
          <button type="button" class="btn-danger" style="padding:4px 10px; font-size:11px;" onclick="confirmarRemoverRegistroApoiador('${k}', '${nomeMesPorExtenso}')">✕ Excluir</button>
        </div>
      </td>
    </tr>`;
  }).join("")}</tbody></table></div>`;
}

function confirmarRemoverRegistroApoiador(k, nomeMesPorExtenso) {
  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao(
      "🗑️ Excluir Registro", 
      `Tem certeza que deseja excluir o registro de Apoiador de "${nomeMesPorExtenso}"? Essa ação não pode ser desfeita.`, 
      () => {
        delete state.apoiadorRegistros[k];
        if (typeof save === 'function') save();
        renderizarHistoricoApoiadorCompleto();
        mostrarNotificacao(`Registro excluído com sucesso!`, "info");
      }
    );
  } else {
    removerRegistroApoiadorCompleto(k);
  }
}

function removerRegistroApoiadorCompleto(k) {
  delete state.apoiadorRegistros[k];
  if (typeof save === 'function') save();
  renderizarHistoricoApoiadorCompleto();
}