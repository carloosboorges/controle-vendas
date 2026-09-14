// ========================================================
// MÓDULO DA ABA DE CLIENTES E PERFIS
// ========================================================

let clientesPaginaAtual = 1;
let clientesTermoBusca = "";

function filtrarClientesInput(val) {
  clientesTermoBusca = String(val || "").trim().toLowerCase();
  clientesPaginaAtual = 1;
  const btnClear = document.getElementById("clearClienteSearchBtn");
  if (btnClear) btnClear.style.display = clientesTermoBusca ? "block" : "none";
  renderizarHistoricoClientesCompleto();
}

function limparBuscaClientes() {
  clientesTermoBusca = "";
  clientesPaginaAtual = 1;
  if (document.getElementById("clienteSearchInput")) document.getElementById("clienteSearchInput").value = "";
  if (document.getElementById("clearClienteSearchBtn")) document.getElementById("clearClienteSearchBtn").style.display = "none";
  renderizarHistoricoClientesCompleto();
}

function mudarPaginaClientes(p) {
  clientesPaginaAtual = p;
  renderizarHistoricoClientesCompleto();
  const barraBusca = document.querySelector("#conteudoAbaClientes .history-search-bar-box");
  if (barraBusca) barraBusca.scrollIntoView({ behavior: "smooth", block: "start" });
}

function abrirModalDetalhesCliente(nome) {
  const clientePedidos = (state.historicoVendas || []).filter(v => String(v.cliente || "").trim() === nome).reverse();
  const totalGasto = clientePedidos.reduce((acc, v) => acc + Number(v.valor || 0), 0);
  const totalVbucks = clientePedidos.reduce((acc, v) => acc + (v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento)), 0);
  
  let wpp = "—";
  let tk = "—";
  const info = (state.clientesInfo || {})[nome] || {};
  
  if (info.whatsapp) wpp = info.whatsapp;
  if (info.tiktok) tk = info.tiktok;
  
  if (wpp === "—" || tk === "—") {
    for (let i = 0; i < clientePedidos.length; i++) {
      const v = clientePedidos[i];
      if (wpp === "—" && v.whatsapp) wpp = v.whatsapp;
      if (tk === "—" && v.tiktok) tk = v.tiktok;
      if (wpp !== "—" && tk !== "—") break;
    }
  }
  
  const tituloEl = document.getElementById("detalhesClienteTitulo");
  if (tituloEl) {
    tituloEl.style.flex = "1 1 auto";
    tituloEl.style.minWidth = "0"; 
    tituloEl.style.overflow = "hidden";
    tituloEl.style.paddingRight = "15px"; 
    
    tituloEl.innerHTML = `
      <div style="display: flex; flex-direction: column; min-width: 0;">
        <div style="font-size: 10px; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">👤 Histórico de Cliente</div>
        <h3 style="margin:0; color:#fff; font-size: 21px; font-weight: 800; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${esc(nome)}">
          <span class="copyable-text" onclick="copiarTexto('${esc(nome).replace(/'/g, "\\'")}', 'Nome do Cliente', event)">${esc(nome)}</span>
        </h3>
        <div style="display:flex; flex-direction: row; gap:16px; margin-top:8px; font-size:14px; color:#fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <span style="display:inline-flex; align-items:center; gap:6px; flex-shrink: 0;">
            📱 <span class="copyable-text" onclick="copiarTexto('${esc(wpp).replace(/'/g, "\\'")}', 'WhatsApp', event)">${esc(wpp)}</span>
          </span>
          <span style="display:inline-flex; align-items:center; gap:6px; flex-shrink: 0;">
            ${TIKTOK_SVG} <span class="copyable-text" onclick="copiarTexto('${esc(tk).replace(/'/g, "\\'")}', 'TikTok', event)">${esc(tk)}</span>
          </span>
        </div>
      </div>
    `;

    const modalHead = tituloEl.closest('.modal-head');
    if (modalHead) {
      modalHead.style.display = "flex";
      modalHead.style.flexWrap = "nowrap";
      modalHead.style.alignItems = "flex-start";
      modalHead.style.justifyContent = "space-between";
    }
  }
  
  const ultimoNick = clientePedidos.length > 0 ? clientePedidos[0].nickCliente : "";
  
  const btnArea = document.getElementById("containerBtnNovaVendaCliente");
  if (btnArea) {
    const rightActionsGroup = btnArea.parentNode;
    if (rightActionsGroup) {
      rightActionsGroup.style.display = "flex";
      rightActionsGroup.style.flexWrap = "nowrap";
      rightActionsGroup.style.alignItems = "flex-start";
      rightActionsGroup.style.gap = "8px";
      rightActionsGroup.style.flexShrink = "0"; 
      rightActionsGroup.style.margin = "0"; 
    }

    btnArea.style.display = "flex";
    btnArea.style.gap = "8px";
    btnArea.style.flexWrap = "nowrap";
    btnArea.innerHTML = `
      <button type="button" class="btn-gray" style="height: 36px; padding: 0 16px; font-size: 12px; white-space: nowrap; display:flex; align-items:center; justify-content:center; gap:6px; border-radius: 8px; box-sizing: border-box; margin:0;" onclick="abrirModalEdicaoCliente('${esc(nome).replace(/'/g, "\\'")}')">✏️ Editar Perfil</button>
      <button type="button" class="btn-green" style="height: 36px; padding: 0 16px; font-size: 12px; white-space: nowrap; display:flex; align-items:center; justify-content:center; gap:6px; border-radius: 8px; box-sizing: border-box; margin:0;" onclick="preencherNovaVendaModal('${esc(nome).replace(/'/g, "\\'")}', '${esc(ultimoNick).replace(/'/g, "\\'")}')">🛒 Nova Venda</button>
    `;
  }
  
  const modal = document.getElementById("clienteDetalhesModal");
  if (modal) {
    const closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) {
      closeBtn.style.height = "36px";
      closeBtn.style.width = "36px";
      closeBtn.style.padding = "0";
      closeBtn.style.display = "flex";
      closeBtn.style.alignItems = "center";
      closeBtn.style.justifyContent = "center";
      closeBtn.style.borderRadius = "8px"; 
      closeBtn.style.boxSizing = "border-box";
      closeBtn.style.margin = "0";
      closeBtn.style.flexShrink = "0";
    }

    const cardModal = modal.querySelector('.modal-card-large');
    if (cardModal) {
      cardModal.style.maxWidth = '850px'; 
      cardModal.style.width = '100%';
    }
  }
  
  const gastoEl = document.getElementById("detalhesClienteTotalGasto");
  if (gastoEl) gastoEl.textContent = money(totalGasto); 
  
  const vbucksEl = document.getElementById("detalhesClienteTotalVbucks");
  if (vbucksEl) {
    vbucksEl.style.color = "#ffb74d";
    vbucksEl.textContent = `🪙 ${formatVBucks(totalVbucks)} VB`;
  }
  
  const pedidosEl = document.getElementById("detalhesClienteTotalPedidos");
  if (pedidosEl) pedidosEl.textContent = clientePedidos.length;
  
  const listaHtml = clientePedidos.map((v, index) => {
    const vb = v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
    const numeroPedido = clientePedidos.length - index;
    return `
      <div style="background: transparent; border: 1px solid var(--border); padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div style="display: flex; flex-direction: column; gap: 6px; max-width: 75%;">
          <div style="font-size: 13px; font-weight: 800; color: var(--accent-light);">📦 Pedido #${numeroPedido} · Conta: <span style="color: #fff; font-weight: 600;">${esc(v.conta)}</span></div>
          <div style="font-size: 13px; color: var(--muted); font-weight: 600;">🎮 Nick: <span style="color: #fff; font-weight: 800;">${esc(v.nickCliente)}</span></div>
          <div style="font-size: 13px; color: #fff; margin-top: 2px;">${renderizarListaItensHtml(v.itens || [v.item])}</div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">📅 ${esc(v.data)} às ${esc(v.hora)}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <div style="color: var(--green); font-size: 17px; font-weight: 900;">${money(v.valor)}</div>
          <div style="color: #ffb74d; font-size: 12px; font-weight: 800;">🪙 ${formatVBucks(vb)} VB</div>
        </div>
      </div>`;
  }).join("");
  
  const listaContainer = document.getElementById("detalhesClienteListaPedidos");
  if (listaContainer) {
    listaContainer.innerHTML = listaHtml || `<div style="text-align:center; padding:20px; color:var(--muted); font-size:13px;">Nenhum pedido encontrado.</div>`;
  }

  if (modal) modal.style.display = "flex";
}

function fecharModalDetalhesCliente() {
  const modal = document.getElementById("clienteDetalhesModal");
  if (modal) modal.style.display = "none";
}

function abrirModalEdicaoCliente(nomeAntigo) {
  const info = (state.clientesInfo || {})[nomeAntigo] || {};
  let wpp = info.whatsapp;
  let tk = info.tiktok;

  if (!wpp || !tk) {
    const historicoReverso = [...(state.historicoVendas || [])].reverse();
    const ultimaVenda = historicoReverso.find(v => String(v.cliente).trim() === nomeAntigo);
    if (ultimaVenda) {
      if (!wpp) wpp = ultimaVenda.whatsapp;
      if (!tk) tk = ultimaVenda.tiktok;
    }
  }
  
  const elOriginal = document.getElementById("editClienteNomeOriginal");
  if(elOriginal) elOriginal.value = nomeAntigo;
  
  const elNome = document.getElementById("editClienteNomeInput");
  if(elNome) elNome.value = nomeAntigo;
  
  const elWpp = document.getElementById("editClienteWhatsappInput");
  if(elWpp) elWpp.value = wpp || "";
  
  const elTk = document.getElementById("editClienteTiktokInput");
  if(elTk) elTk.value = tk || "";
  
  const elObs = document.getElementById("editClienteObservacaoInput");
  if(elObs) elObs.value = info.observacao || "";
  
  const modal = document.getElementById("editClienteModal");
  if (modal) modal.style.display = "flex";
}

function fecharModalEdicaoCliente() {
  const modal = document.getElementById("editClienteModal");
  if (modal) modal.style.display = "none";
}

function salvarEdicaoCliente() {
  const nomeOriginal = document.getElementById("editClienteNomeOriginal")?.value;
  const novoNome = document.getElementById("editClienteNomeInput")?.value.trim();
  const novoWpp = document.getElementById("editClienteWhatsappInput")?.value.trim();
  const novoTk = document.getElementById("editClienteTiktokInput")?.value.trim();
  const novaObs = document.getElementById("editClienteObservacaoInput")?.value.trim();

  if (!novoNome) {
    mostrarNotificacao("O nome do cliente não pode estar vazio.", "erro");
    return;
  }

  if (!state.clientesInfo) state.clientesInfo = {};
  
  if (nomeOriginal && nomeOriginal !== novoNome) {
    state.clientesInfo[novoNome] = state.clientesInfo[nomeOriginal] || {};
    delete state.clientesInfo[nomeOriginal];
  } else if (!state.clientesInfo[novoNome]) {
    state.clientesInfo[novoNome] = {};
  }
  
  state.clientesInfo[novoNome].whatsapp = novoWpp;
  state.clientesInfo[novoNome].tiktok = novoTk;
  state.clientesInfo[novoNome].observacao = novaObs;

  const atualizarRegistros = (lista) => {
    if (!lista) return;
    lista.forEach(v => {
      if (String(v.cliente).trim() === nomeOriginal) {
        v.cliente = novoNome;
        v.whatsapp = novoWpp;
        v.tiktok = novoTk;
      }
    });
  };

  atualizarRegistros(state.vendas);
  atualizarRegistros(state.historicoVendas);
  atualizarRegistros(state.agendamentos);
  atualizarRegistros(state.lixeiraVendas);

  save();
  fecharModalEdicaoCliente();
  fecharModalDetalhesCliente(); 
  mostrarNotificacao("Perfil atualizado em todo o histórico!", "sucesso");
  
  if (abaHistoricoAtiva === 'clientes') renderizarHistoricoClientesCompleto();
  render();
}

function renderizarHistoricoClientesCompleto() {
  const container = document.getElementById("tabelaHistoricoClientesCompleto");
  const resumoEl = document.getElementById("totalClientesResumo");
  const paginacaoContainer = document.getElementById("clientesPagination");
  if (!container) return;
  
  const historico = state.historicoVendas || [];
  const clientesMap = {};
  
  historico.forEach(v => {
    const nomeCliente = String(v.cliente || "").trim();
    if (!nomeCliente) return;
    if (!clientesMap[nomeCliente]) {
      clientesMap[nomeCliente] = { nome: nomeCliente, totalGasto: 0, totalVbucks: 0, totalPedidos: 0, searchString: nomeCliente.toLowerCase() };
    }
    clientesMap[nomeCliente].totalGasto += Number(v.valor || 0);
    clientesMap[nomeCliente].totalVbucks += v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
    clientesMap[nomeCliente].totalPedidos += 1;
    const tkLimpo = String(v.tiktok || "").toLowerCase().replace(/@/g, "");
    const wppLimpo = String(v.whatsapp || "").toLowerCase().replace(/\D/g, "");
    clientesMap[nomeCliente].searchString += ` ${String(v.nickCliente || "").toLowerCase()} ${String(v.tiktok || "").toLowerCase()} ${tkLimpo} ${String(v.whatsapp || "").toLowerCase()} ${wppLimpo} `;
  });
  
  let listaClientes = Object.values(clientesMap).sort((a, b) => b.totalGasto - a.totalGasto);
  
  if (clientesTermoBusca) {
    let tN = clientesTermoBusca.replace(/\D/g, "");
    let tT = clientesTermoBusca.replace(/@/g, "");
    if (tN.startsWith("55") && tN.length > 2) tN = tN.substring(2);
    listaClientes = listaClientes.filter(c => c.searchString.includes(clientesTermoBusca) || (tT.length >= 2 && c.searchString.includes(tT)) || (tN.length >= 3 && c.searchString.includes(tN)));
  }
  
  const totalClientesFiltrados = listaClientes.length;
  const totalPaginas = Math.ceil(totalClientesFiltrados / ITENS_POR_PAGINA) || 1;
  if (clientesPaginaAtual > totalPaginas) clientesPaginaAtual = totalPaginas;
  if (clientesPaginaAtual < 1) clientesPaginaAtual = 1;
  const clientesPagina = listaClientes.slice((clientesPaginaAtual - 1) * ITENS_POR_PAGINA, clientesPaginaAtual * ITENS_POR_PAGINA);
  
  if (resumoEl) resumoEl.textContent = `${totalClientesFiltrados} ${totalClientesFiltrados === 1 ? 'cliente encontrado' : 'clientes encontrados'}`;
  
  if (clientesPagina.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">Nenhum cliente encontrado.</div>`;
    if (paginacaoContainer) paginacaoContainer.innerHTML = "";
    return;
  }
  
  container.innerHTML = `<div style="overflow-x:auto;"><table class="financial-table" style="width:100%; border-collapse:collapse;"><thead><tr><th style="padding:12px; text-align:left; border-bottom:1px solid var(--border);">Nome do Cliente</th><th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Total de Pedidos</th><th style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">V-Bucks Acumulados</th><th style="padding:12px; text-align:right; border-bottom:1px solid var(--border);">Total Gasto (R$)</th></tr></thead><tbody>${clientesPagina.map(c => {
    const hasObs = state.clientesInfo && state.clientesInfo[c.nome] && state.clientesInfo[c.nome].observacao;
    const obsIcon = hasObs ? ' <span style="font-size:12px;" title="Possui observação">📌</span>' : '';
    return `<tr style="cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='rgba(142,68,255,0.08)'" onmouseout="this.style.background='transparent'" onclick="abrirModalDetalhesCliente('${esc(c.nome).replace(/'/g, "\\'")}')"><td style="padding:12px; border-bottom:1px solid var(--border); font-weight:700; color:var(--accent-light);">👤 ${esc(c.nome)}${obsIcon} 🔍</td><td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:var(--muted);">${c.totalPedidos}</td><td style="padding:12px; text-align:right; border-bottom:1px solid var(--border); color:var(--green); font-weight:700;">🪙 ${formatVBucks(c.totalVbucks)} VB</td><td style="padding:12px; text-align:right; border-bottom:1px solid var(--border); color:var(--green); font-weight:900;">${maskMoney(money(c.totalGasto))}</td></tr>`;
  }).join("")}</tbody></table></div>`;
  
  if (paginacaoContainer) {
    if (totalClientesFiltrados <= ITENS_POR_PAGINA) {
      paginacaoContainer.innerHTML = "";
    } else {
      let bHtml = "";
      for (let p = 1; p <= totalPaginas; p++) {
        if (p === 1 || p === totalPaginas || (p >= clientesPaginaAtual - 1 && p <= clientesPaginaAtual + 1)) {
          bHtml += `<button type="button" class="pagination-btn ${p === clientesPaginaAtual ? "active" : ""}" onclick="mudarPaginaClientes(${p})">${p}</button>`;
        } else if (p === clientesPaginaAtual - 2 || p === clientesPaginaAtual + 2) {
          bHtml += `<span style="color:var(--muted); font-size:12px; padding:0 2px;">...</span>`;
        }
      }
      paginacaoContainer.innerHTML = `<div class="pagination-controls-row"><button type="button" class="pagination-btn" ${clientesPaginaAtual === 1 ? "disabled" : ""} onclick="mudarPaginaClientes(${clientesPaginaAtual - 1})">‹ Anterior</button>${bHtml}<button type="button" class="pagination-btn" ${clientesPaginaAtual === totalPaginas ? "disabled" : ""} onclick="mudarPaginaClientes(${clientesPaginaAtual + 1})">Próxima ›</button></div>`;
    }
  }
}