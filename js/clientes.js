// ========================================================
// MÓDULO DA ABA DE CLIENTES E PERFIS
// ========================================================

let clientesPaginaAtual = 1;
let clientesTermoBusca = "";

let clienteEmEdicaoId = null;
let clienteEmEdicaoNome = null;

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

function abrirModalDetalhesCliente(id, nome) {
  const clientePedidos = (state.historicoVendas || []).filter(v => {
    const vId = v.clienteId || String(v.cliente || "").trim();
    return vId === id || String(v.cliente || "").trim().toLowerCase() === String(nome).trim().toLowerCase();
  }).reverse();
  
  const totalGasto = clientePedidos.reduce((acc, v) => acc + Number(v.valor || 0), 0);
  const totalVbucks = clientePedidos.reduce((acc, v) => acc + (v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento)), 0);
  
  let wpp = "—";
  let tk = "—";

  // 1. Tenta buscar das vendas do cliente (garantindo que se parecer nome no campo de wpp, a gente ignora)
  for (let i = 0; i < clientePedidos.length; i++) {
    const v = clientePedidos[i];
    const wVal = String(v.whatsapp || "").trim();
    const tVal = String(v.tiktok || "").trim();
    
    // Se o wpp tem cara de número/telefone e ainda não temos, pega
    if (wpp === "—" && wVal && wVal.toLowerCase() !== nome.toLowerCase() && /\d/.test(wVal)) {
      wpp = wVal;
    }
    // Se o tiktok está preenchido e ainda não temos, pega
    if (tk === "—" && tVal && tVal.toLowerCase() !== nome.toLowerCase()) {
      tk = tVal;
    }
    if (wpp !== "—" && tk !== "—") break;
  }

  // 2. Se ainda faltar, busca do state.clientesInfo
  const info = (state.clientesInfo || {})[id] || (state.clientesInfo || {})[nome] || {};
  if (wpp === "—" && info.whatsapp && String(info.whatsapp).toLowerCase() !== nome.toLowerCase()) {
    wpp = info.whatsapp;
  }
  if (tk === "—" && info.tiktok && String(info.tiktok).toLowerCase() !== nome.toLowerCase()) {
    tk = info.tiktok;
  }

  // Blindagem final para evitar que o nome apareça no lugar do telefone
  if (wpp.toLowerCase() === nome.toLowerCase()) wpp = "—";
  if (tk.toLowerCase() === nome.toLowerCase()) tk = "—";
  
  const ultimoNick = clientePedidos.length > 0 ? clientePedidos[0].nickCliente : (info.nick || "");
  const modal = document.getElementById("clienteDetalhesModal");
  if (!modal) return;

  const TIKTOK_ICON = typeof TIKTOK_SVG !== "undefined" ? TIKTOK_SVG : '<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: middle; margin-top: -2px;"><path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/></svg>';

  const modalHead = modal.querySelector('.modal-head');
  if (modalHead) {
    modalHead.style.display = "block";
    modalHead.style.width = "100%";

    modalHead.innerHTML = `
      <div style="position: relative; width: 100%;">
        
        <button type="button" class="btn-danger close-modal-btn" style="position: absolute; top: -5px; right: 0; height: 36px; width: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; padding: 0; flex-shrink: 0; z-index: 10;" onclick="fecharModalDetalhesCliente()">✕</button>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding-right: 50px; gap: 10px; flex-wrap: wrap;">
          
          <div style="font-size: 12px; color: var(--muted); text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-top: 10px;">
            👤 Histórico de Cliente
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
            <button type="button" class="btn-green" style="height: 36px; padding: 0 16px; font-size: 12px; font-weight: bold; border-radius: 8px; white-space: nowrap;" onclick="document.getElementById('clienteIdInput').value='${esc(id).replace(/'/g, "\\'")}'; preencherNovaVendaModal('${esc(nome).replace(/'/g, "\\'")}', '${esc(ultimoNick).replace(/'/g, "\\'")}')">🛒 Nova Venda</button>
            <button type="button" class="btn-gray" style="height: 36px; padding: 0 16px; font-size: 12px; font-weight: bold; border-radius: 8px; white-space: nowrap;" onclick="abrirModalEdicaoCliente('${esc(id).replace(/'/g, "\\'")}','${esc(nome).replace(/'/g, "\\'")}')">✏️ Editar Perfil</button>
            <button type="button" class="btn-gray" style="height: 36px; padding: 0 16px; font-size: 12px; font-weight: bold; border-radius: 8px; white-space: nowrap;" onclick="abrirModalMesclar('${esc(id).replace(/'/g, "\\'")}', '${esc(nome).replace(/'/g, "\\'")}')">🔗 Mesclar</button>
            <button type="button" class="btn-danger" style="height: 36px; padding: 0 16px; font-size: 12px; font-weight: bold; border-radius: 8px; white-space: nowrap;" onclick="excluirCliente('${esc(id).replace(/'/g, "\\'")}', '${esc(nome).replace(/'/g, "\\'")}'); fecharModalDetalhesCliente();">🗑️ Excluir</button>
          </div>

        </div>
        
        <div style="width: 100%; margin-top: 16px;">
          <h3 style="margin:0; color:#fff; font-size: 26px; font-weight: 900; line-height: 1.3; word-wrap: break-word; padding-right: 20px;">
            <span class="copyable-text" onclick="copiarTexto('${esc(nome).replace(/'/g, "\\'")}', 'Nome do Cliente', event)">${esc(nome)}</span>
          </h3>
          <div style="display:flex; flex-wrap: wrap; gap:16px; margin-top:10px; font-size:14px; color:#fff; font-weight: 600;">
            <span style="display:inline-flex; align-items:center; gap:6px;">
              📱 <span class="copyable-text" onclick="copiarTexto('${esc(wpp).replace(/'/g, "\\'")}', 'WhatsApp', event)">${esc(wpp)}</span>
            </span>
            <span style="display:inline-flex; align-items:center; gap:6px;">
              ${TIKTOK_ICON} <span class="copyable-text" onclick="copiarTexto('${esc(tk).replace(/'/g, "\\'")}', 'TikTok', event)">${esc(tk)}</span>
            </span>
          </div>
        </div>

      </div>
    `;
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
        <div style="display: flex; flex-direction: column; gap: 6px; max-width: 70%;">
          <div style="font-size: 13px; font-weight: 800; color: var(--accent-light);">📦 Pedido #${numeroPedido} · Conta: <span style="color: #fff; font-weight: 600;">${esc(v.conta)}</span></div>
          <div style="font-size: 13px; color: var(--muted); font-weight: 600;">🎮 Nick: <span style="color: #fff; font-weight: 800;">${esc(v.nickCliente)}</span></div>
          <div style="font-size: 13px; color: #fff; margin-top: 2px;">${typeof renderizarListaItensHtml === 'function' ? renderizarListaItensHtml(v.itens || [v.item]) : esc(v.item)}</div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">📅 ${esc(v.data)} às ${esc(v.hora)}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
            <div style="color: var(--green); font-size: 17px; font-weight: 900;">${money(v.valor)}</div>
            <div style="color: #ffb74d; font-size: 12px; font-weight: 800;">🪙 ${formatVBucks(vb)} VB</div>
          </div>
          <button type="button" class="btn-gray" style="padding: 4px 10px; font-size: 11px; border-radius: 6px;" onclick="fecharModalDetalhesCliente(); abrirModalEdicaoPorId('${esc(v.id)}', '${esc(id)}', '${esc(nome)}')">✏️ Editar Pedido</button>
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

function abrirModalEdicaoCliente(id, nomeAntigo) {
  clienteEmEdicaoId = id;
  clienteEmEdicaoNome = nomeAntigo;

  const info = (state.clientesInfo || {})[id] || (state.clientesInfo || {})[nomeAntigo] || {};
  let wpp = info.whatsapp;
  let tk = info.tiktok;

  if (!wpp || !tk) {
    const historicoReverso = [...(state.historicoVendas || [])].reverse();
    const ultimaVenda = historicoReverso.find(v => {
      const vId = v.clienteId || String(v.cliente || "").trim();
      return vId === id;
    });
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
  clienteEmEdicaoId = null;
  clienteEmEdicaoNome = null;
}

function salvarEdicaoCliente() {
  const id = clienteEmEdicaoId;
  const nomeOriginal = clienteEmEdicaoNome;
  const novoNome = document.getElementById("editClienteNomeInput")?.value.trim();
  const novoWpp = document.getElementById("editClienteWhatsappInput")?.value.trim();
  const novoTk = document.getElementById("editClienteTiktokInput")?.value.trim();
  const novaObs = document.getElementById("editClienteObservacaoInput")?.value.trim();

  if (!novoNome) {
    mostrarNotificacao("O nome do cliente não pode estar vazio.", "erro");
    return;
  }

  if (!state.clientesInfo) state.clientesInfo = {};
  
  let currentId = id;
  if (id === nomeOriginal && nomeOriginal !== novoNome) {
    state.clientesInfo[novoNome] = state.clientesInfo[nomeOriginal] || {};
    delete state.clientesInfo[nomeOriginal];
    currentId = novoNome;
  } else {
    if (!state.clientesInfo[currentId]) state.clientesInfo[currentId] = {};
  }
  
  state.clientesInfo[currentId].nome = novoNome;
  state.clientesInfo[currentId].whatsapp = novoWpp;
  state.clientesInfo[currentId].tiktok = novoTk;
  state.clientesInfo[currentId].observacao = novaObs;

  const atualizarRegistros = (lista) => {
    if (!lista) return;
    lista.forEach(v => {
      const vId = v.clienteId || String(v.cliente || "").trim();
      if (vId === id) {
        v.cliente = novoNome;
        v.whatsapp = novoWpp;
        v.tiktok = novoTk;
        if (!v.clienteId) v.clienteId = currentId; 
      }
    });
  };

  atualizarRegistros(state.vendas);
  atualizarRegistros(state.historicoVendas);
  atualizarRegistros(state.agendamentos);
  atualizarRegistros(state.lixeiraVendas);

  if (typeof save === 'function') save();
  fecharModalEdicaoCliente();
  fecharModalDetalhesCliente(); 
  mostrarNotificacao("Perfil atualizado em todo o histórico!", "sucesso");
  
  if (abaHistoricoAtiva === 'clientes') renderizarHistoricoClientesCompleto();
  if (typeof render === 'function') render();
}

function renderizarHistoricoClientesCompleto() {
  const container = document.getElementById("tabelaHistoricoClientesCompleto");
  const resumoEl = document.getElementById("totalClientesResumo");
  const paginacaoContainer = document.getElementById("clientesPagination");
  if (!container) return;
  
  const historico = state.historicoVendas || [];
  const clientesMap = {};
  
  if (state.clientesInfo) {
    Object.entries(state.clientesInfo).forEach(([id, info]) => {
      if (info && info.nome && !clientesMap[id]) {
        clientesMap[id] = { id: id, nome: info.nome, totalGasto: 0, totalVbucks: 0, totalPedidos: 0, searchString: info.nome.toLowerCase() };
      }
    });
  }

  historico.forEach(v => {
    const nomeCliente = String(v.cliente || "").trim();
    const id = v.clienteId || nomeCliente; 
    
    if (!nomeCliente) return;
    if (!clientesMap[id]) {
      clientesMap[id] = { id: id, nome: nomeCliente, totalGasto: 0, totalVbucks: 0, totalPedidos: 0, searchString: nomeCliente.toLowerCase() };
    }
    clientesMap[id].totalGasto += Number(v.valor || 0);
    clientesMap[id].totalVbucks += v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
    clientesMap[id].totalPedidos += 1;
    const tkLimpo = String(v.tiktok || "").toLowerCase().replace(/@/g, "");
    const wppLimpo = String(v.whatsapp || "").toLowerCase().replace(/\D/g, "");
    clientesMap[id].searchString += ` ${String(v.nickCliente || "").toLowerCase()} ${String(v.tiktok || "").toLowerCase()} ${tkLimpo} ${String(v.whatsapp || "").toLowerCase()} ${wppLimpo} `;
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
  
  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="financial-table" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:12px; text-align:left; border-bottom:1px solid var(--border);">Nome do Cliente</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Total de Pedidos</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">V-Bucks Acumulados</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Total Gasto (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${clientesPagina.map(c => {
            const hasObs = state.clientesInfo && state.clientesInfo[c.id] && state.clientesInfo[c.id].observacao;
            const obsIcon = hasObs ? ' <span style="font-size:12px;" title="Possui observação">📌</span>' : '';
            return `
              <tr style="cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='rgba(142,68,255,0.08)'" onmouseout="this.style.background='transparent'" onclick="abrirModalDetalhesCliente('${esc(c.id).replace(/'/g, "\\'")}', '${esc(c.nome).replace(/'/g, "\\'")}')">
                <td style="padding:12px; border-bottom:1px solid var(--border); font-weight:700; color:var(--accent-light);">👤 ${esc(c.nome)}${obsIcon} 🔍</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:var(--muted); font-weight:700;">${c.totalPedidos}</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:var(--green); font-weight:700;">🪙 ${formatVBucks(c.totalVbucks)} VB</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:var(--green); font-weight:900;">${money(c.totalGasto)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>`;
  
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

function excluirCliente(clienteId, nomeCliente) {
  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao(
      "🚨 Excluir Cliente Permanente",
      `ATENÇÃO: Você está prestes a excluir o cliente "${nomeCliente}". Isso moverá TODAS as vendas dele para a Lixeira e apagará o seu perfil. Deseja continuar?`,
      () => {
        const ehEsteCliente = (v) => {
          const vId = v.clienteId || String(v.cliente || "").trim();
          return vId === clienteId;
        };

        const vendasDoCliente = (state.historicoVendas || []).filter(ehEsteCliente);
        
        if (!state.lixeiraVendas) state.lixeiraVendas = [];
        state.lixeiraVendas.unshift(...vendasDoCliente);

        state.historicoVendas = (state.historicoVendas || []).filter(v => !ehEsteCliente(v));
        state.vendas = (state.vendas || []).filter(v => !ehEsteCliente(v));
        
        if (state.clientesInfo && state.clientesInfo[clienteId]) {
          delete state.clientesInfo[clienteId];
        }

        if (typeof render === 'function') render();
        if (typeof save === 'function') save();
        if (typeof renderizarHistoricoClientesCompleto === 'function') renderizarHistoricoClientesCompleto(); 
        mostrarNotificacao(`Cliente excluído com sucesso!`, "sucesso");
      }
    );
  }
}

// --- NOVO CLIENTE SIMPLES (SEM VENDA ANTIGA) ---

function abrirModalAdicionarClienteRetroativo() {
  document.getElementById("retroClienteInput").value = "";
  document.getElementById("retroNickInput").value = "";
  document.getElementById("retroWhatsappInput").value = "";
  document.getElementById("retroTiktokInput").value = "";
  document.getElementById("retroObservacaoInput").value = "";

  const modal = document.getElementById("modalAdicionarClienteRetroativo");
  if (modal) modal.style.display = "flex";
}

function fecharModalAdicionarClienteRetroativo() {
  const modal = document.getElementById("modalAdicionarClienteRetroativo");
  if (modal) modal.style.display = "none";
}

function confirmarClienteExistenteCadastro(idEscolhido, nomeEscolhido) {
  const modalAntiDup = document.getElementById('modalAntiDuplicacao');
  if (modalAntiDup) modalAntiDup.style.display = 'none';
  fecharModalAdicionarClienteRetroativo();

  let telefoneSalvo = "";
  let tiktokSalvo = "";
  let nickSalvo = "";

  const infoCliente = (state.clientesInfo || {})[idEscolhido];
  if (infoCliente) {
    telefoneSalvo = infoCliente.whatsapp || "";
    tiktokSalvo = infoCliente.tiktok || "";
    nickSalvo = infoCliente.nick || "";
  } else {
    const historico = state.historicoVendas || [];
    const ultimaVenda = historico.find(v => (v.clienteId || String(v.cliente).trim()) === idEscolhido);
    if (ultimaVenda) {
      telefoneSalvo = ultimaVenda.whatsapp || "";
      tiktokSalvo = ultimaVenda.tiktok || "";
      nickSalvo = ultimaVenda.nickCliente || "";
    }
  }

  if (document.getElementById("clienteInput")) document.getElementById("clienteInput").value = nomeEscolhido;
  if (document.getElementById("clienteIdInput")) document.getElementById("clienteIdInput").value = idEscolhido;
  if (document.getElementById("nickClienteInput") && nickSalvo) document.getElementById("nickClienteInput").value = nickSalvo;
  if (document.getElementById("whatsappInput")) document.getElementById("whatsappInput").value = telefoneSalvo;
  if (document.getElementById("tiktokInput")) document.getElementById("tiktokInput").value = tiktokSalvo;

  mostrarNotificacao(`Cliente ${nomeEscolhido} selecionado com os dados salvos!`, "sucesso");
}

function salvarClienteSimples() {
  const cliente = document.getElementById("retroClienteInput")?.value.trim();
  const nickCliente = document.getElementById("retroNickInput")?.value.trim();
  const whatsapp = document.getElementById("retroWhatsappInput")?.value.trim() || "";
  const tiktok = document.getElementById("retroTiktokInput")?.value.trim() || "";
  const observacao = document.getElementById("retroObservacaoInput")?.value.trim() || "";

  if (!cliente) {
    mostrarNotificacao("Preencha o nome do cliente.", "erro");
    return;
  }
  if (!nickCliente) {
    mostrarNotificacao("O Nick do cliente é obrigatório.", "erro");
    return;
  }

  // Trava anti-duplicação
  if (!window.ignorarChecagemDuplicacao) {
    const nomeFormatado = cliente.toLowerCase();
    const historico = state.historicoVendas || [];
    const homonimosMap = {};

    historico.forEach(v => {
      if (String(v.cliente).trim().toLowerCase() === nomeFormatado) {
        const vId = v.clienteId || String(v.cliente).trim();
        if (!homonimosMap[vId]) {
          homonimosMap[vId] = { id: vId, nome: v.cliente, nick: v.nickCliente };
        }
      }
    });

    if (state.clientesInfo) {
      Object.entries(state.clientesInfo).forEach(([id, info]) => {
        if (info && info.nome && info.nome.trim().toLowerCase() === nomeFormatado) {
          if (!homonimosMap[id]) {
            homonimosMap[id] = { id: id, nome: info.nome, nick: info.nick || "Cadastrado" };
          }
        }
      });
    }

    const homonimos = Object.values(homonimosMap);
    if (homonimos.length > 0) {
      document.getElementById('antiDupNomeTexto').textContent = cliente;
      const listaEl = document.getElementById('listaHomonimos');
      
      listaEl.innerHTML = homonimos.map(h => `
        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer;" onclick="confirmarClienteExistenteCadastro('${esc(h.id).replace(/'/g, "\\'")}', '${esc(h.nome).replace(/'/g, "\\'")}')">
           <div style="font-weight:bold; color:#fff; font-size:14px;">👤 ${esc(h.nome)}</div>
           <div style="font-size:13px; color:var(--muted); margin-top:4px;">🎮 Nick: <strong style="color:#fff;">${esc(h.nick)}</strong> (Já cadastrado)</div>
        </div>
      `).join("");

      document.getElementById('modalAntiDuplicacao').style.display = 'flex';
      return;
    }
  }

  if (window.ignorarChecagemDuplicacao) {
    window.ignorarChecagemDuplicacao = false;
  }

  const agora = Date.now();
  const clienteId = "cli-" + agora + "-" + Math.random().toString(36).substr(2, 4);

  if (!state.clientesInfo) state.clientesInfo = {};
  state.clientesInfo[clienteId] = {
    nome: cliente,
    nick: nickCliente,
    whatsapp: whatsapp,
    tiktok: tiktok,
    observacao: observacao
  };

  if (typeof sincronizarDadosCliente === 'function') {
    sincronizarDadosCliente(clienteId, cliente, whatsapp, tiktok);
  }

  if (typeof save === 'function') save();
  fecharModalAdicionarClienteRetroativo();
  mostrarNotificacao("✅ Novo cliente cadastrado com sucesso!", "sucesso");

  if (typeof render === 'function') render();
  if (abaHistoricoAtiva === 'clientes' && typeof renderizarHistoricoClientesCompleto === 'function') {
    renderizarHistoricoClientesCompleto();
  }
}