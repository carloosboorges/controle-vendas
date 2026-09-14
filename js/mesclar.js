// ========================================================
// MÓDULO DE MESCLAGEM E ANTI-DUPLICAÇÃO
// ========================================================

let vendaPausadaCallback = null; 

// --- 1. SISTEMA ANTI-DUPLICAÇÃO (A TRAVA INTELIGENTE) ---

function checarDuplicacaoAntesDeVender(clienteDigitado, idInvisivel, callbackDaVenda) {
  if (idInvisivel) return false;

  const nomeFormatado = String(clienteDigitado).trim().toLowerCase();
  if (!nomeFormatado) return false;

  const historico = state.historicoVendas || [];
  const agendamentos = state.agendamentos || [];
  const todos = [...historico, ...agendamentos];

  const homonimosMap = {};
  
  // Acha TODOS que tem esse nome
  todos.forEach(v => {
    if (String(v.cliente).trim().toLowerCase() === nomeFormatado) {
       const vId = v.clienteId || String(v.cliente).trim();
       if (!homonimosMap[vId]) {
           homonimosMap[vId] = { id: vId, nome: v.cliente, nick: v.nickCliente, whatsapp: v.whatsapp, tiktok: v.tiktok };
       }
    }
  });

  const homonimos = Object.values(homonimosMap);

  if (homonimos.length > 0) {
    document.getElementById('antiDupNomeTexto').textContent = homonimos[0].nome;
    vendaPausadaCallback = callbackDaVenda;

    const listaEl = document.getElementById('listaHomonimos');
    listaEl.innerHTML = homonimos.map(h => `
      <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; transition: 0.2s;" onmouseover="this.style.borderColor='var(--green)'" onmouseout="this.style.borderColor='var(--border)'" onclick="confirmarVendaClienteExistente('${esc(h.id).replace(/'/g, "\\'")}', '${esc(h.nome).replace(/'/g, "\\'")}')">
         <div style="font-weight:bold; color:#fff; font-size:14px;">👤 ${esc(h.nome)}</div>
         <div style="font-size:13px; color:var(--muted); margin-top:4px;">🎮 Nick: <strong style="color:#fff;">${esc(h.nick)}</strong></div>
         ${h.whatsapp ? `<div style="font-size:12px; color:var(--muted); margin-top:2px;">📱 Zap: ${esc(h.whatsapp)}</div>` : ''}
         ${h.tiktok ? `<div style="font-size:12px; color:var(--muted); margin-top:2px;">🎵 TikTok: ${esc(h.tiktok)}</div>` : ''}
      </div>
    `).join("");

    document.getElementById('modalAntiDuplicacao').style.display = 'flex';
    return true; 
  }

  return false;
}

function confirmarVendaClienteExistente(idEscolhido, nomeEscolhido) {
  document.getElementById('clienteIdInput').value = idEscolhido;
  document.getElementById('clienteInput').value = nomeEscolhido; 

  fecharModalAntiDuplicacao();
  
  window.ignorarChecagemDuplicacao = true;
  if (vendaPausadaCallback) vendaPausadaCallback();
}

function confirmarVendaNovoHomonimo() {
  document.getElementById('clienteIdInput').value = "";
  fecharModalAntiDuplicacao();

  window.ignorarChecagemDuplicacao = true;
  if (vendaPausadaCallback) vendaPausadaCallback();
}

function fecharModalAntiDuplicacao() {
  document.getElementById('modalAntiDuplicacao').style.display = 'none';
  vendaPausadaCallback = null;
}

// --- 2. SISTEMA DE MESCLAGEM (BOTÃO DE UNIFICAR) ---

function abrirModalMesclar(idOrigem, nomeOrigem) {
  document.getElementById('mesclarOrigemId').value = idOrigem;
  document.getElementById('mesclarOrigem').value = nomeOrigem;
  document.getElementById('mesclarDestinoBusca').value = "";
  document.getElementById('mesclarDestinoId').value = "";
  document.getElementById('mesclarSuggestions').style.display = 'none';
  
  document.getElementById('modalMesclarClientes').style.display = 'flex';
}

function fecharModalMesclar() {
  document.getElementById('modalMesclarClientes').style.display = 'none';
}

function buscarSugestoesMesclar(texto) {
  const dropdown = document.getElementById("mesclarSuggestions");
  const origemId = document.getElementById("mesclarOrigemId").value;
  const termo = String(texto).toLowerCase().trim();
  
  if (!termo) { dropdown.style.display = "none"; return; }
  
  const clientesMap = {};
  const historico = state.historicoVendas || [];
  
  historico.forEach(v => {
    const nome = String(v.cliente || "").trim();
    const id = v.clienteId || nome;
    
    if (id === origemId) return;

    if (nome && !clientesMap[id]) {
      clientesMap[id] = { id: id, nome: nome, nick: v.nickCliente || "" };
    }
  });
  
  const sugestoes = Object.values(clientesMap).filter(c => c.nome.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 5).map(c => {
    return `<div class="autocomplete-item" onclick="selecionarDestinoMesclar('${esc(c.id).replace(/'/g, "\\'")}', '${esc(c.nome).replace(/'/g, "\\'")}')">👤 ${esc(c.nome)} <span class="autocomplete-nick">🎮 ${esc(c.nick)}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function selecionarDestinoMesclar(idDestino, nomeDestino) {
  document.getElementById('mesclarDestinoId').value = idDestino;
  document.getElementById('mesclarDestinoBusca').value = nomeDestino;
  document.getElementById('mesclarSuggestions').style.display = 'none';
}

function executarMesclagem() {
  const origemId = document.getElementById('mesclarOrigemId').value;
  const origemNome = document.getElementById('mesclarOrigem').value;
  const destinoId = document.getElementById('mesclarDestinoId').value;
  const destinoNome = document.getElementById('mesclarDestinoBusca').value;

  if (!destinoId) {
    mostrarNotificacao("⚠️ Pesquise e selecione o Cliente Original!", "erro");
    return;
  }

  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao(
      "🚨 Confirmar Unificação",
      `Todo o histórico de "${origemNome}" será transferido para "${destinoNome}". O perfil antigo será apagado. Deseja continuar?`,
      () => {
        const unificarRegistros = (lista) => {
          if (!lista) return;
          lista.forEach(v => {
            const vId = v.clienteId || String(v.cliente || "").trim();
            if (vId === origemId) {
              v.clienteId = destinoId;
              v.cliente = destinoNome;
            }
          });
        };

        unificarRegistros(state.vendas);
        unificarRegistros(state.historicoVendas);
        unificarRegistros(state.agendamentos);
        unificarRegistros(state.lixeiraVendas);

        const infoOrigem = (state.clientesInfo || {})[origemId] || {};
        const infoDestino = (state.clientesInfo || {})[destinoId] || {};
        
        if (!infoDestino.whatsapp && infoOrigem.whatsapp) infoDestino.whatsapp = infoOrigem.whatsapp;
        if (!infoDestino.tiktok && infoOrigem.tiktok) infoDestino.tiktok = infoOrigem.tiktok;
        if (!infoDestino.observacao && infoOrigem.observacao) infoDestino.observacao = infoOrigem.observacao;
        
        if (!state.clientesInfo) state.clientesInfo = {};
        state.clientesInfo[destinoId] = infoDestino;

        delete state.clientesInfo[origemId];
        
        fecharModalMesclar();
        if (typeof fecharModalDetalhesCliente === 'function') fecharModalDetalhesCliente();
        
        if (typeof render === 'function') render();
        if (typeof save === 'function') save();
        if (typeof renderizarHistoricoClientesCompleto === 'function') renderizarHistoricoClientesCompleto();
        
        mostrarNotificacao("🔗 Clientes unificados com sucesso!", "sucesso");
      }
    );
  }
}