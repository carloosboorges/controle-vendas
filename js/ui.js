// ========================================================
// MÓDULO PRINCIPAL DE INTERFACE (Renderização e Global)
// ========================================================

const TIKTOK_SVG = '<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: middle; margin-top: -2px; margin-right: 2px;"><path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/></svg>';

let abaHistoricoAtiva = 'vendas';
let contasAberto = false;
const ITENS_POR_PAGINA = 8;
let historicoPaginaAtual = 1;
let historicoTermoBusca = "";
let balancoAberto = false;

// Controle do Olhinho (Privacidade)
let valoresOcultos = false;

function toggleOcultarValores() {
  valoresOcultos = !valoresOcultos;
  render();
}

function maskMoney(valueText) {
  if (!valueText) return "R$ *****";
  return valoresOcultos ? "R$ *****" : valueText;
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
  ["Vendas", "Agendamentos", "Apoiador", "Clientes"].forEach(id => {
    const btn = document.getElementById(`tabBtn${id}`);
    const div = document.getElementById(`conteudoAba${id}`);
    if (btn) btn.classList.remove("active");
    if (div) div.style.display = "none";
  });
  
  const abaFormatada = aba.charAt(0).toUpperCase() + aba.slice(1);
  const btnAtivo = document.getElementById(`tabBtn${abaFormatada}`);
  const divAtivo = document.getElementById(`conteudoAba${abaFormatada}`);
  
  if (btnAtivo) btnAtivo.classList.add("active");
  if (divAtivo) divAtivo.style.display = "block";
  
  if (aba === 'agendamentos' && typeof renderizarAgendamentos === 'function') {
    renderizarAgendamentos();
  } else if (aba === 'apoiador') {
    renderizarHistoricoApoiadorCompleto();
  } else if (aba === 'clientes') {
    renderizarHistoricoClientesCompleto();
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".period-card-calendar-container") &&
      !e.target.closest(".period-card-mes-container") &&
      !e.target.closest(".period-card-ano-container") &&
      !e.target.closest(".apoiador-popover-container") &&
      !e.target.closest(".autocomplete-wrapper") &&
      !e.target.closest("#boxAgendaCalendario") &&
      !e.target.closest("#editDataEnvioContainer") &&
      !e.target.closest("#eyeToggleValoresHeader") &&
      !e.target.closest("#eyeToggleValoresSessao") &&
      !e.target.closest("#eyeToggleValores")) {
    
    let fechouAlgo = false;
    if (typeof calPopoverAberto !== 'undefined' && (calPopoverAberto || mesPopoverAberto || anoPopoverAberto)) {
      calPopoverAberto = mesPopoverAberto = anoPopoverAberto = false;
      fechouAlgo = true;
    }
    
    if (typeof apoiadorPopoverAberto !== 'undefined' && apoiadorPopoverAberto) {
      apoiadorPopoverAberto = false;
      fechouAlgo = true;
    }
    
    if (typeof agendaPopoverAberto !== 'undefined' && agendaPopoverAberto) {
      agendaPopoverAberto = false;
      if (typeof renderAgendaCalendario === 'function') renderAgendaCalendario();
      fechouAlgo = true;
    }
    
    if (typeof editAgendaPopoverAberto !== 'undefined' && editAgendaPopoverAberto) {
      editAgendaPopoverAberto = false;
      if (typeof renderEditAgendaCalendario === 'function') renderEditAgendaCalendario();
      fechouAlgo = true;
    }
    
    ["clienteSuggestions", "nickSuggestions", "whatsappSuggestions", "tiktokSuggestions"].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.style.display === "block") {
        el.style.display = "none";
        fechouAlgo = true;
      }
    });
    
    for (let j = 0; j < 20; j++) {
      const dropP = document.getElementById("nickPresenteSuggestions_" + j);
      if (dropP && dropP.style.display === "block") {
        dropP.style.display = "none";
        fechouAlgo = true;
      }
    }
    
    if (fechouAlgo) render();
  }
});

function lerObservacaoCliente(nome) {
  const info = (state.clientesInfo || {})[String(nome).trim()] || {};
  if (info.observacao) {
    document.getElementById('leituraObsNome').textContent = "👤 Cliente: " + nome;
    document.getElementById('leituraObsTexto').textContent = info.observacao;
    document.getElementById('leituraObsModal').style.display = 'flex';
  }
}

function verificarObservacaoCliente(nome) {
  const avisoEl = document.getElementById("clienteObsAviso");
  if (!avisoEl) return;
  if (!nome) {
    avisoEl.style.display = "none";
    return;
  }
  const info = (state.clientesInfo || {})[String(nome).trim()] || {};
  if (info.observacao) {
    avisoEl.innerHTML = `⚠️ ATENÇÃO: CLIENTE COM OBSERVAÇÃO (CLIQUE AQUI)`;
    avisoEl.onclick = () => lerObservacaoCliente(nome);
    avisoEl.style.display = "block";
  } else {
    avisoEl.style.display = "none";
  }
}

function preencherNovaVenda(nome, nick) {
  document.getElementById("clienteInput").value = nome || "";
  document.getElementById("nickClienteInput").value = nick || "";
  let wpp = "", tk = "";
  const ultimaVenda = [...(state.historicoVendas || [])].reverse().find(v => String(v.cliente || "").trim() === nome);
  if (ultimaVenda) {
    wpp = ultimaVenda.whatsapp || "";
    tk = ultimaVenda.tiktok || "";
  }
  if (document.getElementById("whatsappInput")) document.getElementById("whatsappInput").value = wpp;
  if (document.getElementById("tiktokInput")) document.getElementById("tiktokInput").value = tk;
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  mostrarNotificacao(`Formulário preenchido com ${nome}!`, "info");
  verificarObservacaoCliente(nome);
}

function preencherNovaVendaModal(nome, nick) {
  if (typeof fecharModalDetalhesCliente === 'function') fecharModalDetalhesCliente();
  mudarAbaHistorico('vendas');
  preencherNovaVenda(nome, nick);
}

function renderizarListaItensHtml(itens) {
  if (!Array.isArray(itens) || itens.length === 0) return "🎁 —";
  return itens.map((itemObj, n) => {
    let itemText = "", presenteText = "", copyText = "";
    if (typeof itemObj === "string") {
      itemText = itemObj; copyText = extrairApenasNomeItem(itemObj);
    } else if (itemObj) {
      itemText = formatItemString(itemObj.tipo, itemObj.nome);
      copyText = itemObj.nome;
      if (itemObj.presente) {
        presenteText = `<span style="color:var(--accent-light); font-size:12px; margin-left:8px; background: rgba(142,68,255,0.15); padding: 2px 6px; border-radius: 6px; display:inline-flex; align-items:center; white-space:nowrap;">➡️ 🎁 Para: <span class="copyable-text" onclick="copiarTexto('${esc(itemObj.presente)}', 'Nick Presente', event)" style="margin:0 0 0 4px; padding:0; white-space:nowrap;">${esc(itemObj.presente)}</span></span>`;
      }
    }
    return `<div style="margin-bottom: 6px; display: flex; align-items: center; flex-wrap: nowrap; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🎁 ${n + 1}. <span class="copyable-text" onclick="copiarTexto('${esc(copyText)}', 'Item', event)" style="margin-left: 4px; white-space: nowrap;">${esc(itemText)}</span>${presenteText}</div>`;
  }).join("");
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
  if (document.getElementById("genericConfirmModal")) document.getElementById("genericConfirmModal").style.display = "none";
  pendingConfirmCallback = null;
}

function abrirModalValorBase() {
  const modal = document.getElementById("valorBaseModal");
  const input = document.getElementById("novoValorBaseInput");
  if (input) input.value = Number(state?.valorBase100 || 2.5).toFixed(2);
  if (modal) modal.style.display = "flex";
}

function fecharModalValorBase() {
  if (document.getElementById("valorBaseModal")) document.getElementById("valorBaseModal").style.display = "none";
}

function salvarValorBaseModal() {
  const input = document.getElementById("novoValorBaseInput");
  const valor = parseFloat(input?.value);
  if (!Number.isFinite(valor) || valor <= 0) {
    mostrarNotificacao("Digite um valor válido.", "erro");
    return;
  }
  state.valorBase100 = Math.round(valor * 100) / 100;
  save();
  fecharModalValorBase();
  mostrarNotificacao(`Valor base alterado!`, "sucesso");
}

function abrirModalAddConta() {
  document.getElementById("novaContaNomeInput").value = "";
  document.getElementById("novaContaVbucksInput").value = "0";
  document.getElementById("novaContaEmailInput").value = "";
  document.getElementById("novaContaSenhaInput").value = "";
  if (document.getElementById("addContaModal")) document.getElementById("addContaModal").style.display = "flex";
}

function fecharModalAddConta() {
  if (document.getElementById("addContaModal")) document.getElementById("addContaModal").style.display = "none";
}

function salvarNovaContaModal() {
  const nome = document.getElementById("novaContaNomeInput")?.value.trim();
  const vbucks = parseInt(String(document.getElementById("novaContaVbucksInput")?.value || "0").replace(/\D/g, ""), 10) || 0;
  const email = document.getElementById("novaContaEmailInput")?.value.trim() || "";
  const senha = document.getElementById("novaContaSenhaInput")?.value.trim() || "";
  
  if (!nome) {
    mostrarNotificacao("Digite o nome da conta.", "erro");
    return;
  }
  
  state.contas.push({ nome, ativa: false, vbucks: Number(vbucks) || 0, email, senha });
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
  document.getElementById("editContaEmailInput").value = conta.email || "";
  document.getElementById("editContaSenhaInput").value = conta.senha || "";
  
  if (document.getElementById("editContaModal")) document.getElementById("editContaModal").style.display = "flex";
}

function fecharModalEditConta() {
  if (document.getElementById("editContaModal")) document.getElementById("editContaModal").style.display = "none";
}

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
  const novoEmail = document.getElementById("editContaEmailInput").value.trim();
  const novaSenha = document.getElementById("editContaSenhaInput").value.trim();
  
  if (!novoNome) return;
  
  conta.nome = novoNome;
  conta.vbucks = Number(novoVbucks) || 0;
  conta.email = novoEmail;
  conta.senha = novaSenha;
  
  save();
  fecharModalEditConta();
  mostrarNotificacao("Conta atualizada!", "sucesso");
}

function atualizarCamposItens() {
  const qtd = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const container = document.getElementById("itensGroupContainer");
  if (!container) return;
  
  const optionsHtml = CATEGORIAS_ITENS.map(c => `<option value="${c}">${c}</option>`).join("");
  
  container.innerHTML = Array.from({ length: qtd }, (_, i) => `
    <div class="item-picker-box" style="margin-bottom: 8px; width: 100%;">
      <div class="item-picker-row" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <select class="item-type-select" id="itemTypeSelect_${i}" style="flex: 1; min-width: 100px; padding: 10px;">${optionsHtml}</select>
        <input class="item-name-input" id="itemNameInput_${i}" type="text" maxlength="120" placeholder="Item Vendido" style="flex: 2; min-width: 160px; padding: 10px;">
        <div style="position: relative; flex: 1.5; min-width: 140px;">
          <input class="item-name-input" id="itemPresenteInput_${i}" type="text" maxlength="80" placeholder="🎁 Nick Presente (Opcional)" style="width: 100%; padding: 10px;" oninput="sugerirNickPresente(this.value, ${i})" autocomplete="off">
          <div id="nickPresenteSuggestions_${i}" class="autocomplete-dropdown"></div>
        </div>
      </div>
    </div>`).join("");
}

// FUNÇÃO NOVA PARA CONFIRMAÇÃO DE TIMER INDIVIDUAL
function confirmarRemoverTimerEspecifico(index, numeroVenda, nomeConta) {
  abrirModalConfirmacao(
    "⏱️ Remover Timer",
    `Tem certeza que deseja excluir o timer da Venda ${numeroVenda} da conta ${nomeConta}?`,
    () => {
      if (typeof removerTimerEspecifico === "function") {
        removerTimerEspecifico(index);
      }
    }
  );
}

function renderContasCards(t) {
  if (!t) t = totais();
  const container = document.getElementById("totaisPorConta");
  if (!container || !state) return;
  const hojeTime = new Date().setHours(0, 0, 0, 0);
  
  container.innerHTML = (state.contas || []).filter(c => c.ativa).map(c => {
    const quantidade = usadasDaConta(c.nome);
    const disponiveis = Math.max(0, 5 - quantidade);
    const reservasAtivas = (state.reservas || []).filter(r => r.conta === c.nome && r.expiresAt > Date.now());
    const agendamentosPendentes = (state.agendamentos || []).filter(a => {
      if (a.conta !== c.nome) return false;
      if (!a.dataEnvio) return true;
      return parseDataBR(a.dataEnvio) <= hojeTime;
    }).reduce((sum, a) => sum + (a.quantidade || 1), 0);
    
    const avisoAgenda = agendamentosPendentes > 0 ? `<div style="font-size: 11px; color: #ffb74d; margin-top: 4px; font-weight: bold; background: rgba(255, 152, 0, 0.1); padding: 4px 6px; border-radius: 4px;">⚠️ ${agendamentosPendentes} vagas reservadas</div>` : '';
    
    // O "X" AGORA CHAMA A NOSSA FUNÇÃO COM O MODAL DE CONFIRMAÇÃO
    const tempos = reservasAtivas.map((r, n) => `<div class="timer-line"><span>Venda ${n + 1}: ${tempoRestante(r.expiresAt - Date.now())}</span><button type="button" class="btn-danger timer-remove-btn" onclick="confirmarRemoverTimerEspecifico(${state.reservas.indexOf(r)}, ${n + 1}, '${esc(c.nome).replace(/'/g, "\\'")}')">✕</button></div>`);
    
    const btnEmail = c.email ? `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 8px;" onclick="copiarTexto('${esc(c.email)}', 'E-mail', event)">📧 Copiar E-mail</button>` : '';
    const btnSenha = c.senha ? `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 8px;" onclick="copiarTexto('${esc(c.senha)}', 'Senha', event)">🔑 Copiar Senha</button>` : '';
    const painelCreds = (c.email || c.senha) ? `<div style="display:flex; gap: 8px; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px;">${btnEmail}${btnSenha}</div>` : '';
    
    return `
      <div class="total-account ${quantidade >= 5 ? "limit-reached" : ""}">
        <div class="account-card-head" style="display:flex; align-items:center; flex-wrap:nowrap; gap:6px;">
          <div class="name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;" title="${esc(c.nome)}">${esc(c.nome)}</div>
          <div style="display:flex; gap: 4px; flex-shrink: 0;">
            <button type="button" class="btn-green" style="font-size: 11px; padding: 5px 8px; height: fit-content; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="adicionarTimerManual('${esc(c.nome).replace(/'/g, "\\'")}')" title="Adicionar envio manual">➕⏱️</button>
            <button type="button" class="btn-danger" style="font-size: 11px; padding: 5px 8px; height: fit-content; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="confirmarRemoverVendasConta('${esc(c.nome).replace(/'/g, "\\'")}')" title="Zerar R$ da Sessão">💲</button>
            <button type="button" class="btn-danger" style="font-size: 11px; padding: 5px 8px; height: fit-content; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="confirmarRemoverTimersConta(${state.contas.indexOf(c)}, '${esc(c.nome).replace(/'/g, "\\'")}')" title="Resetar Timers">⏱️</button>
          </div>
        </div>
        <div class="amount">${maskMoney(money(t[c.nome] || 0))}</div>
        <div class="sales-count">🪙 ${formatVBucks(c.vbucks)} V-Bucks</div>
        <div class="sales-count">🛒 ${quantidade === 1 ? "1 venda nessa conta" : quantidade + " vendas nessa conta"}</div>
        <div class="sales-count">📦 ${disponiveis === 1 ? "1 venda disponível" : disponiveis + " vendas disponíveis"}</div>
        ${avisoAgenda}
        <div class="timer">${tempos.length ? tempos.join("") : `🟢 5 disponíveis`}</div>
        ${painelCreds}
      </div>`;
  }).join("");
}

function render() {
  if (!state) return;
  const baseEl = document.getElementById("valorBaseDisplay");
  if (baseEl) baseEl.textContent = money(state.valorBase100 || 2.5);
  limparReservasExpiradas();
  
  const tSessao = totais();
  if (document.getElementById("totalGeral")) document.getElementById("totalGeral").textContent = maskMoney(money((state.vendas || []).reduce((a, v) => a + Number(v.valor || 0), 0)));
  if (document.getElementById("totalAgendamentosSessao")) document.getElementById("totalAgendamentosSessao").textContent = maskMoney(money((state.agendamentos || []).filter(a => a.criadoEmMs >= (state.sessaoIniciadaEm || 0)).reduce((sum, a) => sum + Number(a.valor || 0), 0)));
  if (document.getElementById("qtdVendas")) document.getElementById("qtdVendas").textContent = `${(state.vendas || []).length} (${(state.vendas || []).reduce((a, v) => a + (Number(v.quantidade) || 1), 0)} itens)`;
  
  let top = "—", tv = 0;
  Object.entries(tSessao).forEach(([n, v]) => {
    if (v > tv) { top = n; tv = v; }
  });
  if (document.getElementById("topConta")) document.getElementById("topConta").textContent = tv ? `${top} — ${maskMoney(money(tv))}` : "—";
  
  const sel = document.getElementById("contaSelect");
  if (sel) {
    const old = sel.value;
    sel.innerHTML = (state.contas || []).filter(c => c.ativa).map(c => `<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join("");
    if ([...sel.options].some(o => o.value === old)) sel.value = old;
  }
  
  renderContasCards(tSessao);
  
  if (document.getElementById("contas")) {
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
  }
  
  const totalHistorico = (state.historicoVendas || []).reduce((s, v) => s + Number(v.valor || 0), 0);
  if (document.getElementById("historicoQtdTotal")) document.getElementById("historicoQtdTotal").textContent = `${(state.historicoVendas || []).length} pedidos · ${(state.historicoVendas || []).reduce((s, v) => s + (Number(v.quantidade) || 1), 0)} itens enviados`;
  
  const leftContainer = document.querySelector(".history-total-card > div:first-child");
  if (leftContainer) {
    leftContainer.style.textAlign = "center";
    leftContainer.style.display = "flex";
    leftContainer.style.flexDirection = "column";
    leftContainer.style.alignItems = "center";
  }

  const histTotalLabel = document.querySelector(".history-total-label");
  if (histTotalLabel) {
    histTotalLabel.style.cssText = "display: flex; flex-direction: row; align-items: center; justify-content: center; position: relative;";
    histTotalLabel.innerHTML = `
      <span style="position: relative; display: inline-flex; align-items: center; white-space: nowrap;">
        💰 TOTAL DO HISTÓRICO
        <button type="button" id="eyeToggleValores" style="position: absolute; left: 100%; margin-left: 8px; background:none; border:none; color:inherit; font-size:18px; cursor:pointer; padding:0; outline:none; display:flex; align-items:center; justify-content:center; width: 30px; height: 30px;" title="Ocultar/Mostrar Valores">
          ${valoresOcultos ? "🙈" : "👁️"}
        </button>
      </span>
    `;
    const eyeTotalBtn = document.getElementById("eyeToggleValores");
    if (eyeTotalBtn) eyeTotalBtn.addEventListener("click", toggleOcultarValores);
  }

  const headerActions = document.querySelector(".header-actions-bar");
  if (headerActions) {
    headerActions.style.alignItems = "stretch"; 
    if (!document.getElementById("eyeToggleValoresHeader")) {
      const eyeBtnHeader = document.createElement("button");
      eyeBtnHeader.id = "eyeToggleValoresHeader";
      eyeBtnHeader.className = "btn-gray";
      eyeBtnHeader.style.cssText = "padding: 0; font-size: 18px; width: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 12px;";
      eyeBtnHeader.title = "Ocultar/Mostrar Valores Globalmente";
      eyeBtnHeader.onclick = toggleOcultarValores;
      headerActions.insertBefore(eyeBtnHeader, headerActions.firstChild);
    }
    const eyeHeaderBtn = document.getElementById("eyeToggleValoresHeader");
    if (eyeHeaderBtn) eyeHeaderBtn.textContent = valoresOcultos ? "🙈" : "👁️";
  }

  const btnNovaSessao = document.querySelector('button[onclick*="novaLive"]');
  if (btnNovaSessao && !document.getElementById("eyeToggleValoresSessao")) {
    const parent = btnNovaSessao.parentNode;
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "8px";
    wrapper.style.alignItems = "stretch"; 
    btnNovaSessao.style.marginLeft = "0";
    wrapper.style.marginLeft = "auto";
    
    parent.insertBefore(wrapper, btnNovaSessao);
    
    const eyeBtnSessao = document.createElement("button");
    eyeBtnSessao.id = "eyeToggleValoresSessao";
    eyeBtnSessao.className = "btn-gray";
    eyeBtnSessao.style.cssText = "padding: 0; font-size: 16px; width: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 10px;";
    eyeBtnSessao.title = "Ocultar/Mostrar Valores Globalmente";
    eyeBtnSessao.onclick = toggleOcultarValores;
    
    wrapper.appendChild(eyeBtnSessao);
    wrapper.appendChild(btnNovaSessao);
  }
  const eyeSessaoBtn = document.getElementById("eyeToggleValoresSessao");
  if (eyeSessaoBtn) eyeSessaoBtn.textContent = valoresOcultos ? "🙈" : "👁️";

  if (document.getElementById("historicoTotal")) {
    document.getElementById("historicoTotal").textContent = maskMoney(money(totalHistorico));
  }

  if (document.getElementById("lixeiraBtn")) document.getElementById("lixeiraBtn").textContent = `🗑️ Lixeira (${(state.lixeiraVendas || []).length})`;
  
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
  
  if (!mesFiltroSelecionado) mesFiltroSelecionado = `${String(agoraData.getMonth() + 1).padStart(2, "0")}/${agoraData.getFullYear()}`;
  const [selM, selA] = mesFiltroSelecionado.split("/").map(Number);
  const mesTotalVendas = somaFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesVbucks = somaVbucksFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesPedidos = qtdPedidosFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  const mesItens = qtdItensFiltro(v => { const d = chaveData(v); return d && d.getMonth() === (selM - 1) && d.getFullYear() === selA; });
  
  const lucroVendasMes = mesTotalVendas * MARGEM_LUCRO;
  const lucroApoiadorMes = Number(((state.apoiadorRegistros || {})[mesFiltroSelecionado] || {}).liquidoBrl || 0);
  
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
  
  let totalLiquidoApoiadorGlobal = 0;
  Object.values(state.apoiadorRegistros || {}).forEach(reg => {
    totalLiquidoApoiadorGlobal += Number(reg.liquidoBrl || 0);
  });
  
  const lucroContinuoGeralVendas = totalHistorico * MARGEM_LUCRO;
  
  const periodosEl = document.getElementById("historicoPeriodos");
  if (periodosEl) {
    periodosEl.innerHTML = `
      <div class="period-card period-card-calendar-container" style="position:relative; cursor:pointer;" onclick="toggleCalendarioPopover(event)">
        <div class="period-header-select"><span>📅</span><strong style="font-size:12px; color:var(--accent-light);">${diaParaFiltrar} ▾</strong></div>
        <strong>${maskMoney(money(diaTotal))}</strong>
        <small>${diaPedidos} pedidos (${diaItens} itens)</small>
        <small class="period-vbucks-text">🪙 ${formatVBucks(diaVbucks)} V-Bucks</small>
        ${typeof calPopoverAberto !== 'undefined' && calPopoverAberto && typeof gerarHtmlCalendarioPopover === 'function' ? gerarHtmlCalendarioPopover() : ""}
      </div>
      <div class="period-card">
        <span>📅 Esta semana</span>
        <strong>${maskMoney(money(semanaTotal))}</strong>
        <small>${semanaPedidos} pedidos (${semanaItens} itens)</small>
        <small class="period-vbucks-text">🪙 ${formatVBucks(semanaVbucks)} V-Bucks</small>
      </div>
      <div class="period-card period-card-mes-container" style="position:relative; cursor:pointer;" onclick="toggleMesPopover(event)">
        <div class="period-header-select"><span>🗓️</span><strong style="font-size:12px; color:var(--accent-light);">Mês ▾</strong></div>
        <strong>${maskMoney(money(mesTotalVendas))}</strong>
        <small>${mesPedidos} pedidos (${mesItens} itens)</small>
        <small class="period-vbucks-text">🪙 ${formatVBucks(mesVbucks)} V-Bucks</small>
        <div style="font-size:10px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px; line-height:1.3;">
          <span style="color:var(--muted);">Vendas:</span> ${maskMoney(money(lucroVendasMes))}<br>
          <span style="color:var(--muted);">Apoiador:</span> ${maskMoney(money(lucroApoiadorMes))}<br>
          <strong style="color:var(--green);">Total: ${maskMoney(money(lucroVendasMes + lucroApoiadorMes))}</strong>
        </div>
        ${typeof mesPopoverAberto !== 'undefined' && mesPopoverAberto && typeof gerarHtmlMesPopover === 'function' ? gerarHtmlMesPopover() : ""}
      </div>
      <div class="period-card period-card-ano-container" style="position:relative; cursor:pointer;" onclick="toggleAnoPopover(event)">
        <div class="period-header-select"><span>📆</span><strong style="font-size:12px; color:var(--accent-light);">Ano ${anoFiltroSelecionado} ▾</strong></div>
        <strong>${maskMoney(money(anoTotalVendas))}</strong>
        <small>${anoPedidos} pedidos (${anoItens} itens)</small>
        <small class="period-vbucks-text">🪙 ${formatVBucks(anoVbucks)} V-Bucks</small>
        <div style="font-size:10px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06); padding-top:4px; line-height:1.3;">
          <span style="color:var(--muted);">Vendas:</span> ${maskMoney(money(lucroVendasAno))}<br>
          <span style="color:var(--muted);">Apoiador:</span> ${maskMoney(money(lucroApoiadorAno))}<br>
          <strong style="color:var(--green);">Total: ${maskMoney(money(lucroVendasAno + lucroApoiadorAno))}</strong>
        </div>
        ${typeof anoPopoverAberto !== 'undefined' && anoPopoverAberto && typeof gerarHtmlAnoPopover === 'function' ? gerarHtmlAnoPopover() : ""}
      </div>
      <div class="period-card profit-card">
        <span>📈 Lucro Global</span>
        <strong>${maskMoney(money(lucroContinuoGeralVendas + totalLiquidoApoiadorGlobal))}</strong>
        <small style="color:var(--green); font-weight:700;">Vendas: ${maskMoney(money(lucroContinuoGeralVendas))}</small>
        <small style="color:var(--accent-light); font-weight:700;">Apoiador: ${maskMoney(money(totalLiquidoApoiadorGlobal))}</small>
      </div>`;
  }

  const historicoContainer = document.getElementById("historico");
  if (historicoContainer) {
    const listaComIndices = historico.map((v, originalIdx) => ({ ...v, originalIdx, numeroPedido: `#${String(originalIdx + 1).padStart(2, "0")}` })).reverse();
    let listaFiltrada = listaComIndices;
    if (historicoTermoBusca) listaFiltrada = listaComIndices.filter(v => JSON.stringify(v).toLowerCase().includes(historicoTermoBusca));
    
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
                    ${v.tiktok ? `<span>${TIKTOK_SVG} <span class="copyable-text" onclick="copiarTexto('${esc(v.tiktok)}', 'TikTok', event)">${esc(v.tiktok)}</span></span>` : `<span>${TIKTOK_SVG} —</span>`}
                  </div>
                </div>
                <div class="history-item" style="margin-top: 8px;">${renderizarListaItensHtml(v.itens || [v.item])}</div>
                <div class="history-date">📅 ${esc(v.data)} às ${esc(v.hora)}</div>
                ${obsHtml}
              </div>
              <div class="history-value">${money(v.valor)}</div>
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
      if (totalItensFiltrados <= ITENS_POR_PAGINA) {
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
  }

  if (abaHistoricoAtiva === 'agendamentos' && typeof renderizarAgendamentos === 'function') renderizarAgendamentos();
}