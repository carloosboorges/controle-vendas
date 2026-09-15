// ========================================================
// MÓDULO DO HISTÓRICO DE VENDAS E RESUMOS FINANCEIROS
// ========================================================

let historicoPaginaAtual = 1;
let historicoTermoBusca = "";

// Verifica se o modo de privacidade global está ativo
function estaPrivacidadeAtiva() {
  return document.body.classList.contains('privacidade-ativa') || 
         (document.getElementById('historicoTotal') && document.getElementById('historicoTotal').textContent.includes('*'));
}

function pMoeda(val) {
  return estaPrivacidadeAtiva() ? 'R$ *****' : money(val);
}

function pVbHistorico(vb) {
  return estaPrivacidadeAtiva() ? '🪙 •••••• V-Bucks' : `🪙 ${formatVBucks(vb)} V-Bucks`;
}

function pVbTabela(vb) {
  return estaPrivacidadeAtiva() ? '🪙 •••••• VB' : `🪙 ${formatVBucks(vb)} VB`;
}

function filtrarHistoricoInput(val) {
  historicoTermoBusca = String(val || "").trim().toLowerCase();
  historicoPaginaAtual = 1;
  if (document.getElementById("clearSearchBtn")) {
    document.getElementById("clearSearchBtn").style.display = historicoTermoBusca ? "block" : "none";
  }
  render();
}

function limparBuscaHistorico() {
  historicoTermoBusca = "";
  historicoPaginaAtual = 1;
  if (document.getElementById("historySearchInput")) document.getElementById("historySearchInput").value = "";
  if (document.getElementById("clearSearchBtn")) document.getElementById("clearSearchBtn").style.display = "none";
  render();
}

function mudarPaginaHistorico(p) {
  historicoPaginaAtual = p;
  render();
  if (document.querySelector(".history-search-bar-box")) {
    document.querySelector(".history-search-bar-box").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderizarResumoPeriodos() {
  const periodosEl = document.getElementById("historicoPeriodos");
  if (!periodosEl) return;

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
  
  const diaParaFiltrar = typeof diaFiltroSelecionado !== 'undefined' && diaFiltroSelecionado ? diaFiltroSelecionado : obterDataHojeFormatada();
  
  const diaTotal = somaFiltro(v => v.data === diaParaFiltrar);
  const diaVbucks = somaVbucksFiltro(v => v.data === diaParaFiltrar);
  const diaPedidos = qtdPedidosFiltro(v => v.data === diaParaFiltrar);
  const diaItens = qtdItensFiltro(v => v.data === diaParaFiltrar);
  
  const semInicio = inicioSemana(agoraData);
  const semFim = new Date(semInicio);
  semFim.setDate(semFim.getDate() + 7);
  
  const semanaTotal = somaFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  const semanaItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d >= semInicio && d < semFim; });
  
  let mesLocal = typeof mesFiltroSelecionado !== 'undefined' && mesFiltroSelecionado ? mesFiltroSelecionado : `${String(agoraData.getMonth() + 1).padStart(2, "0")}/${agoraData.getFullYear()}`;
  const [selM, selA] = mesLocal.split("/").map(Number);
  const mesTotalVendas = somaFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  
  const margemReal = typeof MARGEM_LUCRO !== 'undefined' ? MARGEM_LUCRO : 0.5;
  
  const lucroVendasMes = mesTotalVendas * margemReal;
  const lucroApoiadorMes = Number(((state.apoiadorRegistros || {})[mesLocal] || {}).liquidoBrl || 0);
  
  let anoLocal = typeof anoFiltroSelecionado !== 'undefined' && anoFiltroSelecionado ? anoFiltroSelecionado : String(agoraData.getFullYear());
  const selAnoNum = Number(anoLocal);
  
  const anoTotalVendas = somaFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  const anoItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d.getFullYear() === selAnoNum; });
  
  const lucroVendasAno = anoTotalVendas * margemReal;
  let lucroApoiadorAno = 0;
  Object.entries(state.apoiadorRegistros || {}).forEach(([k, reg]) => {
    if (k.endsWith(`/${selAnoNum}`)) lucroApoiadorAno += Number(reg.liquidoBrl || 0);
  });
  
  let totalLiquidoApoiadorGlobal = 0;
  Object.values(state.apoiadorRegistros || {}).forEach(reg => {
    totalLiquidoApoiadorGlobal += Number(reg.liquidoBrl || 0);
  });
  
  const totalHistorico = historico.reduce((s, v) => s + Number(v.valor || 0), 0);
  const lucroContinuoGeralVendas = totalHistorico * margemReal;
  
  periodosEl.innerHTML = `
    <div class="period-card period-card-calendar-container" style="position:relative; cursor:pointer;" onclick="toggleCalendarioPopover(event)">
      <div class="period-header-select"><span>📅</span><strong style="font-size:12px; color:var(--accent-light);">${diaParaFiltrar} ▾</strong></div>
      <strong>${pMoeda(diaTotal)}</strong>
      <small>${diaPedidos} pedidos (${diaItens} itens)</small>
      <small class="period-vbucks-text">${pVbHistorico(diaVbucks)}</small>
      ${typeof calPopoverAberto !== 'undefined' && calPopoverAberto && typeof gerarHtmlCalendarioPopover === 'function' ? gerarHtmlCalendarioPopover() : ""}
    </div>
    <div class="period-card">
      <span>📅 Esta semana</span>
      <strong>${pMoeda(semanaTotal)}</strong>
      <small>${semanaPedidos} pedidos (${semanaItens} itens)</small>
      <small class="period-vbucks-text">${pVbHistorico(semanaVbucks)}</small>
    </div>
    <div class="period-card period-card-mes-container" style="position:relative; cursor:pointer;" onclick="toggleMesPopover(event)">
      <div class="period-header-select"><span>🗓️</span><strong style="font-size:12px; color:var(--accent-light);">Mês ▾</strong></div>
      <strong>${pMoeda(mesTotalVendas)}</strong>
      <small>${mesPedidos} pedidos (${mesItens} itens)</small>
      <small class="period-vbucks-text">${pVbHistorico(mesVbucks)}</small>
      <div style="font-size:10px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px; line-height:1.3;">
        <span style="color:var(--muted);">Vendas:</span> ${pMoeda(lucroVendasMes)}<br>
        <span style="color:var(--muted);">Apoiador:</span> ${pMoeda(lucroApoiadorMes)}<br>
        <strong style="color:var(--green);">Total: ${pMoeda(lucroVendasMes + lucroApoiadorMes)}</strong>
      </div>
      ${typeof mesPopoverAberto !== 'undefined' && mesPopoverAberto && typeof gerarHtmlMesPopover === 'function' ? gerarHtmlMesPopover() : ""}
    </div>
    <div class="period-card period-card-ano-container" style="position:relative; cursor:pointer;" onclick="toggleAnoPopover(event)">
      <div class="period-header-select"><span>📆</span><strong style="font-size:12px; color:var(--accent-light);">Ano ${anoLocal} ▾</strong></div>
      <strong>${pMoeda(anoTotalVendas)}</strong>
      <small>${anoPedidos} pedidos (${anoItens} itens)</small>
      <small class="period-vbucks-text">${pVbHistorico(anoVbucks)}</small>
      <div style="font-size:10px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px; line-height:1.3;">
        <span style="color:var(--muted);">Vendas:</span> ${pMoeda(lucroVendasAno)}<br>
        <span style="color:var(--muted);">Apoiador:</span> ${pMoeda(lucroApoiadorAno)}<br>
        <strong style="color:var(--green);">Total: ${pMoeda(lucroVendasAno + lucroApoiadorAno)}</strong>
      </div>
      ${typeof anoPopoverAberto !== 'undefined' && anoPopoverAberto && typeof gerarHtmlAnoPopover === 'function' ? gerarHtmlAnoPopover() : ""}
    </div>
    <div class="period-card profit-card">
      <span>📈 Lucro Global</span>
      <strong>${pMoeda(lucroContinuoGeralVendas + totalLiquidoApoiadorGlobal)}</strong>
      <small style="color:var(--green); font-weight:700;">Vendas: ${pMoeda(lucroContinuoGeralVendas)}</small>
      <small style="color:var(--accent-light); font-weight:700;">Apoiador: ${pMoeda(totalLiquidoApoiadorGlobal)}</small>
    </div>`;
}

function renderizarListaHistorico() {
  const historicoContainer = document.getElementById("historico");
  if (!historicoContainer) return;

  const historico = state.historicoVendas || [];
  const listaComIndices = historico.map((v, originalIdx) => ({ ...v, originalIdx, numeroPedido: `#${String(originalIdx + 1).padStart(2, "0")}` })).reverse();
  let listaFiltrada = listaComIndices;
  
  if (historicoTermoBusca) {
    listaFiltrada = listaComIndices.filter(v => JSON.stringify(v).toLowerCase().includes(historicoTermoBusca));
  }
  
  const totalItensFiltrados = listaFiltrada.length;
  const itensLimit = typeof ITENS_POR_PAGINA !== 'undefined' ? ITENS_POR_PAGINA : 8; 
  const totalPaginas = Math.ceil(totalItensFiltrados / itensLimit) || 1;
  
  if (historicoPaginaAtual > totalPaginas) historicoPaginaAtual = totalPaginas;
  if (historicoPaginaAtual < 1) historicoPaginaAtual = 1;
  
  const itensPagina = listaFiltrada.slice((historicoPaginaAtual - 1) * itensLimit, historicoPaginaAtual * itensLimit);
  
  if (itensPagina.length === 0) {
    historicoContainer.innerHTML = `<div class="empty">Nenhuma venda encontrada.</div>`;
  } else {
    historicoContainer.innerHTML = itensPagina.map(v => {
      const vb = v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
      const baseMomento = Number(v.valorBaseMomento || state.valorBase100 || 2.5);
      const valorIdealSemDesconto = (vb / 100) * baseMomento;
      const diferencaDesconto = valorIdealSemDesconto - Number(v.valor || 0);

      // Se o desconto for maior que 1 centavo, exibe a tag de aviso de desconto
      const descontoHtml = diferencaDesconto > 0.01 
        ? `<div style="margin-top: 4px; font-size: 11px; color: #ffb74d; font-weight: 700;">🏷️ Desconto aplicado: -${money(diferencaDesconto)}</div>` 
        : "";

      const obsHtml = v.observacao ? `<div style="margin-top: 6px; font-size: 12px; color: var(--accent-light); background: rgba(142,68,255,0.08); padding: 4px 8px; border-radius: 6px; border-left: 3px solid var(--accent);">💬 <b>Observação:</b> ${esc(v.observacao)}</div>` : "";
      
      return `
        <div class="history-card">
          <div class="history-main">
            <div class="history-number">${v.numeroPedido}</div>
            <div class="history-info">
              <div class="history-account"><span class="copyable-text" onclick="copiarTexto('${esc(v.conta)}', 'Conta', event)">${esc(v.conta)}</span></div>
              <div class="history-client" style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
                <div style="color: #fff; font-weight: 700;">👤 <span class="copyable-text" onclick="copiarTexto('${esc(v.cliente)}', 'Cliente', event)">${esc(v.cliente)}</span></div>
                <div style="color: var(--accent-light); font-weight: 600;">🎮 <span class="copyable-text" onclick="copiarTexto('${esc(v.nickCliente)}', 'Nick', event)">${esc(v.nickCliente)}</span></div>
                <div style="display: flex; gap: 12px; color: var(--muted); font-size: 12px; white-space: nowrap; flex-wrap: wrap;">
                  ${v.whatsapp ? `<span>📱 <span class="copyable-text" onclick="copiarTexto('${esc(v.whatsapp)}', 'WhatsApp', event)">${esc(v.whatsapp)}</span></span>` : `<span>📱 —</span>`}
                  ${v.tiktok ? `<span>${typeof TIKTOK_SVG !== 'undefined' ? TIKTOK_SVG : '🎵'} <span class="copyable-text" onclick="copiarTexto('${esc(v.tiktok)}', 'TikTok', event)">${esc(v.tiktok)}</span></span>` : `<span>${typeof TIKTOK_SVG !== 'undefined' ? TIKTOK_SVG : '🎵'} —</span>`}
                </div>
              </div>
              <div class="history-item" style="margin-top: 8px;">${typeof renderizarListaItensHtml === 'function' ? renderizarListaItensHtml(v.itens || [v.item]) : esc(v.item)}</div>
              <div class="history-date">📅 ${esc(v.data)} às ${esc(v.hora)}</div>
              ${obsHtml}
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start;">
              <div class="history-value">${money(v.valor)}</div>
              ${descontoHtml}
            </div>
          </div>
          <div class="history-details">
            <span>🪙 ${formatVBucks(vb)} V-Bucks</span>
            <div class="history-actions">
              <button type="button" class="btn-green" style="padding:6px 12px;" onclick="preencherNovaVenda('${esc(v.cliente).replace(/'/g, "\\'")}', '${esc(v.nickCliente).replace(/'/g, "\\'")}')">♻️ Repetir</button>
              <button type="button" class="btn-gray" onclick="abrirModalEdicaoPorId('${esc(v.id)}')">✏️ Editar</button>
              <button type="button" class="btn-danger" onclick="excluirHistoricoPorId('${esc(v.id)}')">🗑️ Excluir</button>
            </div>
          </div>
        </div>`;
    }).join("");
  }
  
  const paginacaoContainer = document.getElementById("historyPagination");
  if (paginacaoContainer) {
    if (totalItensFiltrados <= itensLimit) {
      paginacaoContainer.innerHTML = "";
    } else {
      let bHtml = "";
      for (let p = 1; p <= totalPaginas; p++) {
        if (p === 1 || p === totalPaginas || (p >= historicoPaginaAtual - 1 && p <= historicoPaginaAtual + 1)) {
          bHtml += `<button type="button" class="pagination-btn ${p === historicoPaginaAtual ? "active" : ""}" onclick="mudarPaginaHistorico(${p})">${p}</button>`;
        } else if (p === historicoPaginaAtual - 2 || p === historicoPaginaAtual + 2) {
          bHtml += `<span style="color:var(--muted); font-size:12px; padding:0 2px;">...</span>`;
        }
      }
      paginacaoContainer.innerHTML = `
        <div class="pagination-controls-row">
          <button type="button" class="pagination-btn" ${historicoPaginaAtual === 1 ? "disabled" : ""} onclick="mudarPaginaHistorico(${historicoPaginaAtual - 1})">‹ Anterior</button>
          ${bHtml}
          <button type="button" class="pagination-btn" ${historicoPaginaAtual === totalPaginas ? "disabled" : ""} onclick="mudarPaginaHistorico(${historicoPaginaAtual + 1})">Próxima ›</button>
        </div>
      `;
    }
  }

  const balancoContent = document.getElementById("financialBalanceContent");
  if (balancoContent && balancoContent.style.display === "block") {
    renderizarBalancoFinanceiro();
  }
}

// ========================================================
// CONTROLE DO BALANÇO FINANCEIRO
// ========================================================

function abrirPainelContas() {
  const content = document.getElementById("financialBalanceContent");
  const arrow = document.getElementById("financialToggleArrow");
  if (!content) return;

  if (content.style.display === "none" || content.style.display === "") {
    content.style.display = "block";
    if (arrow) arrow.textContent = "▴";
    renderizarBalancoFinanceiro(); 
  } else {
    content.style.display = "none";
    if (arrow) arrow.textContent = "▾";
  }
}

function renderizarBalancoFinanceiro() {
  const container = document.getElementById("financialBalanceContent");
  if (!container) return;

  const historico = state.historicoVendas || [];
  const contasRegistradas = state.contas || [];
  
  const mLucro = typeof MARGEM_LUCRO !== 'undefined' ? MARGEM_LUCRO : (100 / 310);
  const mCusto = typeof MARGEM_CUSTO !== 'undefined' ? MARGEM_CUSTO : (210 / 310);

  const balancoContas = {};

  contasRegistradas.forEach(c => {
    balancoContas[c.nome] = { totalVbucks: 0, totalValor: 0 };
  });

  historico.forEach(v => {
    const nomeConta = v.conta;
    if (!balancoContas[nomeConta]) {
      balancoContas[nomeConta] = { totalVbucks: 0, totalValor: 0 };
    }
    balancoContas[nomeConta].totalValor += Number(v.valor || 0);
    balancoContas[nomeConta].totalVbucks += v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
  });

  const arrayBalanco = Object.keys(balancoContas).map(nome => {
    const arr = balancoContas[nome];
    const lucroLiquido = arr.totalValor * mLucro;
    const custoEstimado = arr.totalValor * mCusto;
    return {
      nome: nome,
      vbucks: arr.totalVbucks,
      custo: custoEstimado,
      lucro: lucroLiquido,
      bruto: arr.totalValor
    };
  }).sort((a, b) => {
    const indexA = contasRegistradas.findIndex(c => c.nome === a.nome);
    const indexB = contasRegistradas.findIndex(c => c.nome === b.nome);
    const pesoA = indexA !== -1 ? indexA : 999;
    const pesoB = indexB !== -1 ? indexB : 999;
    return pesoA - pesoB;
  }); 

  if (arrayBalanco.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--muted); font-size: 13px;">Nenhum dado financeiro para exibir.</div>`;
    return;
  }

  const totaisGerais = arrayBalanco.reduce((acc, item) => {
    acc.vbucks += item.vbucks;
    acc.custo += item.custo;
    acc.lucro += item.lucro;
    acc.bruto += item.bruto;
    return acc;
  }, { vbucks: 0, custo: 0, lucro: 0, bruto: 0 });

  container.innerHTML = `
    <div style="overflow-x: auto; margin-top: 10px;">
      <table class="financial-table" style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr>
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid var(--border); color: var(--muted);">Nome da Conta</th>
            <th style="padding: 10px; border-bottom: 1px solid var(--border); color: var(--muted);">V-Bucks Vendidos</th>
            <th style="padding: 10px; border-bottom: 1px solid var(--border); color: var(--muted);">Custo Estimado</th>
            <th style="padding: 10px; border-bottom: 1px solid var(--border); color: var(--muted);">Lucro Líquido</th>
            <th style="padding: 10px; border-bottom: 1px solid var(--border); color: var(--muted);">Total Arrecadado</th>
          </tr>
        </thead>
        <tbody>
          ${arrayBalanco.map(item => `
            <tr>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid var(--border); font-weight: 700; color: #fff;">${esc(item.nome)}</td>
              <td style="padding: 10px; border-bottom: 1px solid var(--border); color: #ffb74d; font-weight: 700;">${pVbTabela(item.vbucks)}</td>
              <td style="padding: 10px; border-bottom: 1px solid var(--border); color: #ff6b81;">${pMoeda(item.custo)}</td>
              <td style="padding: 10px; border-bottom: 1px solid var(--border); color: var(--green); font-weight: 800;">${pMoeda(item.lucro)}</td>
              <td style="padding: 10px; border-bottom: 1px solid var(--border); font-weight: 700; color: var(--accent-light);">${pMoeda(item.bruto)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot style="background: rgba(142,68,255,0.1); border-top: 2px solid var(--accent-light);">
          <tr>
            <td style="padding: 12px 10px; text-align: left; font-weight: 900; color: #fff; text-transform: uppercase;">Total Geral</td>
            <td style="padding: 12px 10px; color: #ffb74d; font-weight: 900;">${pVbTabela(totaisGerais.vbucks)}</td>
            <td style="padding: 12px 10px; color: #ff6b81; font-weight: 900;">${pMoeda(totaisGears = totaisGerais.custo)}</td>
            <td style="padding: 12px 10px; color: var(--green); font-weight: 900;">${pMoeda(totaisGerais.lucro)}</td>
            <td style="padding: 12px 10px; color: var(--accent-light); font-weight: 900;">${pMoeda(totaisGerais.bruto)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}