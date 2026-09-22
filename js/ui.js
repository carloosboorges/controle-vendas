// ========================================================
// MÓDULO PRINCIPAL DE INTERFACE (Renderização Global)
// ========================================================

const TIKTOK_SVG = '<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: middle; margin-top: -2px; margin-right: 2px;"><path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/></svg>';

let abaHistoricoAtiva = 'vendas';
const ITENS_POR_PAGINA = 8;
let balancoAberto = false;
let valoresOcultos = false;
let clienteContextoEdicao = null;

function toggleOcultarValores() {
  valoresOcultos = !valoresOcultos;
  if (typeof render === 'function') render();
}

function maskMoney(valueText) {
  if (!valueText) return "R$ *****";
  return valoresOcultos ? "R$ *****" : valueText;
}

function mudarAbaHistorico(aba) {
  abaHistoricoAtiva = aba;
  ["Vendas", "Agendamentos", "Apoiador", "Clientes", "Itens"].forEach(id => {
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
  
  if (aba === 'agendamentos' && typeof renderizarAgendamentos === 'function') renderizarAgendamentos();
  else if (aba === 'apoiador' && typeof renderizarHistoricoApoiadorCompleto === 'function') renderizarHistoricoApoiadorCompleto();
  else if (aba === 'clientes' && typeof renderizarHistoricoClientesCompleto === 'function') renderizarHistoricoClientesCompleto();
  else if (aba === 'itens' && typeof renderizarHistoricoItensCompleto === 'function') renderizarHistoricoItensCompleto();
}

function alterarQtdItens(delta) {
  const input = document.getElementById("quantidadeInput");
  if (!input) return;
  let atual = parseInt(input.value, 10) || 1;
  let novo = atual + delta;
  if (novo < 1) novo = 1;
  input.value = novo;
  // Quando clica no + ou -, avisa a função para PRESERVAR os valores digitados
  atualizarCamposItens(true); 
}

function removerItemEspecifico(indexParaRemover) {
  const container = document.getElementById("itensGroupContainer");
  const inputQtd = document.getElementById("quantidadeInput");
  if (!container || !inputQtd) return;

  if (container.children.length <= 1) {
    mostrarNotificacao("A venda precisa ter pelo menos um item.", "erro");
    return;
  }

  const valoresSalvos = [];
  for (let i = 0; i < container.children.length; i++) {
    if (i !== indexParaRemover) {
      valoresSalvos.push({
        tipo: document.getElementById(`itemTypeSelect_${i}`)?.value || "Traje",
        nome: document.getElementById(`itemNameInput_${i}`)?.value || "",
        vbucks: document.getElementById(`itemVbucksInput_${i}`)?.value || "",
        presente: document.getElementById(`itemPresenteInput_${i}`)?.value || ""
      });
    }
  }

  inputQtd.value = Math.max(1, valoresSalvos.length);
  atualizarCamposItensComDados(valoresSalvos);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    let fechouAlgumModal = false;

    const modaisIds = [
      "authModal",
      "clienteDetalhesModal",
      "editClienteModal",
      "leituraObsModal",
      "apoiadorModal",
      "valorBaseModal",
      "addContaModal",
      "editContaModal",
      "editSaleModal",
      "editItemModal",
      "itemDetalhesModal",
      "trashModal",
      "genericConfirmModal",
      "modalAntiDuplicacao",
      "modalMesclarClientes",
      "modalAdicionarClienteRetroativo"
    ];

    modaisIds.forEach(id => {
      const modal = document.getElementById(id);
      if (modal && modal.style.display === "flex") {
        modal.style.display = "none";
        fechouAlgumModal = true;
      }
    });

    if (typeof calPopoverAberto !== 'undefined') calPopoverAberto = false;
    if (typeof mesPopoverAberto !== 'undefined') mesPopoverAberto = false;
    if (typeof anoPopoverAberto !== 'undefined') anoPopoverAberto = false;
    if (typeof apoiadorPopoverAberto !== 'undefined') apoiadorPopoverAberto = false;
    if (typeof agendaPopoverAberto !== 'undefined') agendaPopoverAberto = false;
    if (typeof editAgendaPopoverAberto !== 'undefined') editAgendaPopoverAberto = false;

    ["clienteSuggestions", "nickSuggestions", "whatsappSuggestions", "tiktokSuggestions", "mesclarSuggestions"].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.style.display === "block") {
        el.style.display = "none";
        fechouAlgumModal = true;
      }
    });

    for (let j = 0; j < 20; j++) {
      const dropP = document.getElementById("nickPresenteSuggestions_" + j);
      if (dropP && dropP.style.display === "block") {
        dropP.style.display = "none";
        fechouAlgumModal = true;
      }
      const dropItem = document.getElementById("itemSuggestions_" + j);
      if (dropItem && dropItem.style.display === "block") {
        dropItem.style.display = "none";
        fechouAlgumModal = true;
      }
    }

    if (fechouAlgumModal && typeof render === 'function') {
      render();
    }
  }
});

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
    if (typeof calPopoverAberto !== 'undefined' && (calPopoverAberto || typeof mesPopoverAberto !== 'undefined' && mesPopoverAberto || typeof anoPopoverAberto !== 'undefined' && anoPopoverAberto)) {
      if (typeof calPopoverAberto !== 'undefined') calPopoverAberto = false;
      if (typeof mesPopoverAberto !== 'undefined') mesPopoverAberto = false;
      if (typeof anoPopoverAberto !== 'undefined') anoPopoverAberto = false;
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
        fechouAlgumModal = true;
      }
      const dropItem = document.getElementById("itemSuggestions_" + j);
      if (dropItem && dropItem.style.display === "block") {
        dropItem.style.display = "none";
        fechouAlgumModal = true;
      }
    }
    
    if (fechouAlgo && typeof render === 'function') render();
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

function renderizarListaItensHtml(itens, vObj = null) {
  if (!Array.isArray(itens) || itens.length === 0) return "🎁 —";
  
  return itens.map((itemObj, n) => {
    let itemText = "", presenteText = "", copyText = "", priceText = "";
    
    if (typeof itemObj === "string") {
      itemText = itemObj; copyText = typeof extrairApenasNomeItem === 'function' ? extrairApenasNomeItem(itemObj) : itemObj;
    } else if (itemObj) {
      itemText = typeof formatItemString === 'function' ? formatItemString(itemObj.tipo, itemObj.nome) : itemObj.nome;
      copyText = itemObj.nome;
      
      if (itemObj.presente) {
        presenteText = `<span style="color:var(--accent-light); font-size:12px; margin-left:8px; background: rgba(142,68,255,0.15); padding: 2px 6px; border-radius: 6px; display:inline-flex; align-items:center; white-space:nowrap;">➡️ 🎁 Para: <span class="copyable-text" onclick="copiarTexto('${esc(itemObj.presente)}', 'Nick Presente', event)" style="margin:0 0 0 4px; padding:0; white-space:nowrap;">${esc(itemObj.presente)}</span></span>`;
      }
      
      let itemVb = Number(itemObj.vbucks) || 0;
      if (itemVb > 0) {
         priceText = `<span style="color:#ffb74d; font-size:11px; margin-left:6px; background: rgba(255, 183, 77, 0.15); padding: 2px 6px; border-radius: 6px; font-weight:700; white-space:nowrap;">🪙 ${formatVBucks(itemVb)} VB</span>`;
      }
    }
    
    return `
      <div style="margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap; line-height: 1.4;">
        <span style="white-space: nowrap;">🎁 ${n + 1}. </span>
        <span class="copyable-text" onclick="copiarTexto('${esc(copyText)}', 'Item', event)" style="margin-left: 4px; white-space: nowrap; font-weight: 600;">${esc(itemText)}</span>
        ${priceText}${presenteText}
      </div>`;
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

function atualizarPreviewVBucks() {
  const badge = document.getElementById("valorVbucksPreview");
  if (!badge) return;

  const inputQtd = document.getElementById("quantidadeInput");
  const qtd = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  
  let somaVb = 0;
  for (let i = 0; i < qtd; i++) {
    const itemVbInput = document.getElementById(`itemVbucksInput_${i}`);
    if (itemVbInput && itemVbInput.value) {
      somaVb += parseInt(itemVbInput.value, 10) || 0;
    }
  }

  if (somaVb > 0) {
    badge.textContent = `🪙 ${somaVb.toLocaleString("pt-BR")} V-Bucks`;
    return;
  }

  const input = document.getElementById("valorInput");
  const val = parseFloat(input?.value) || 0;
  const vb = val > 0 && typeof valorParaVBucks === 'function' ? valorParaVBucks(val) : 0;
  badge.textContent = `🪙 ${vb.toLocaleString("pt-BR")} V-Bucks`;
}

function atualizarPreviewVBucksEdicao() {
  const input = document.getElementById("editValorInput");
  const badge = document.getElementById("editVbucksPreview");
  if (!badge) return;
  const val = parseFloat(input?.value) || 0;
  const vb = val > 0 && typeof valorParaVBucks === 'function' ? valorParaVBucks(val) : 0;
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
  if (typeof save === 'function') save();
  fecharModalValorBase();
  mostrarNotificacao(`Valor base alterado!`, "sucesso");
}

function recalcularValorSugeridoPorItem() {
  const inputQtd = document.getElementById("quantidadeInput");
  const qtd = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  let somaVb = 0;
  for (let i = 0; i < qtd; i++) {
    const vbInput = document.getElementById(`itemVbucksInput_${i}`);
    if (vbInput && vbInput.value) {
      somaVb += Number(vbInput.value) || 0;
    }
  }
  if (somaVb > 0) {
    const valorSugerido = typeof calcularPrecoInteligente === 'function' ? calcularPrecoInteligente(somaVb) : (somaVb / 100) * Number(state?.valorBase100 || 2.5);
    const valorInput = document.getElementById("valorInput");
    if (valorInput) {
      valorInput.value = valorSugerido.toFixed(2);
      if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
    }
  }
}

// O parâmetro preserveValues agora por padrão é falso. 
// Isso significa que se a ordem vier do final da venda (app.js), a função vai LIMPAR TUDO sem questionar.
function atualizarCamposItens(preserveValues = false) {
  const inputQtd = document.getElementById("quantidadeInput");
  const qtd = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  const container = document.getElementById("itensGroupContainer");
  if (!container) return;
  
  const valoresSalvos = [];
  
  // Só verifica e salva o que está escrito se pedirmos explicitamente para preservar (via botão + ou -)
  if (preserveValues) {
    for (let i = 0; i < container.children.length; i++) {
      valoresSalvos.push({
        tipo: document.getElementById(`itemTypeSelect_${i}`)?.value || "Traje",
        nome: document.getElementById(`itemNameInput_${i}`)?.value || "",
        vbucks: document.getElementById(`itemVbucksInput_${i}`)?.value || "",
        presente: document.getElementById(`itemPresenteInput_${i}`)?.value || ""
      });
    }
  }
  
  // Preenche a lista com campos limpos até atingir a quantidade necessária
  while (valoresSalvos.length < qtd) {
    valoresSalvos.push({ tipo: "Traje", nome: "", vbucks: "", presente: "" });
  }
  
  if (valoresSalvos.length > qtd) {
    valoresSalvos.length = qtd;
  }
  
  atualizarCamposItensComDados(valoresSalvos);
}

function atualizarCamposItensComDados(valoresSalvos) {
  const container = document.getElementById("itensGroupContainer");
  const inputQtd = document.getElementById("quantidadeInput");
  if (!container || !inputQtd) return;
  
  const qtd = valoresSalvos.length;
  inputQtd.value = qtd;

  const categoriasArray = typeof CATEGORIAS_ITENS !== 'undefined' ? CATEGORIAS_ITENS : ["Traje", "Gesto", "Picareta", "Música", "Pacote", "Pacotão", "Asa-delta", "Envelopamento", "Calçado", "Acessório", "Carro", "Mascote", "Outro"];
  
  container.innerHTML = Array.from({ length: qtd }, (_, i) => {
    const saved = valoresSalvos[i] || { tipo: "Traje", nome: "", vbucks: "", presente: "" };
    const optionsHtml = categoriasArray.map(c => `<option value="${c}" ${c === saved.tipo ? "selected" : ""}>${c}</option>`).join("");
    
    const botaoExcluirHtml = qtd > 1 
      ? `<button type="button" class="btn-danger" style="padding: 0; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 8px; flex-shrink: 0;" onclick="removerItemEspecifico(${i})" title="Remover este item">✕</button>`
      : ``;
    
    return `
    <div class="item-picker-box" style="margin-bottom: 8px; width: 100%;">
      <div class="item-picker-row" style="display: flex; gap: 8px; align-items: center; flex-wrap: nowrap;">
        <select class="item-type-select" id="itemTypeSelect_${i}" style="flex: 1.2; min-width: 100px; padding: 10px;">${optionsHtml}</select>
        
        <div style="position: relative; flex: 2.5; min-width: 140px;">
          <input class="item-name-input" id="itemNameInput_${i}" type="text" maxlength="120" placeholder="Item Vendido" style="width: 100%; padding: 10px;" oninput="typeof buscarSugestoesItem === 'function' ? buscarSugestoesItem(this.value, ${i}) : null" autocomplete="off" value="${saved.nome.replace(/"/g, '&quot;')}">
          <div id="itemSuggestions_${i}" class="autocomplete-dropdown"></div>
        </div>

        <div style="flex: 1; min-width: 90px;">
          <input class="item-vbucks-input" id="itemVbucksInput_${i}" type="number" step="50" min="0" placeholder="V-Bucks" style="width: 100%; padding: 10px; text-align: center;" oninput="recalcularValorSugeridoPorItem(); atualizarPreviewVBucks();" title="Digite o V-Bucks oficial deste item" value="${saved.vbucks.replace(/"/g, '&quot;')}">
        </div>

        <div style="position: relative; flex: 2; min-width: 120px;">
          <input class="item-name-input" id="itemPresenteInput_${i}" type="text" maxlength="80" placeholder="🎁 P/ Nick" style="width: 100%; padding: 10px;" oninput="typeof sugerirNickPresente === 'function' ? sugerirNickPresente(this.value, ${i}) : null" autocomplete="off" value="${saved.presente.replace(/"/g, '&quot;')}">
          <div id="nickPresenteSuggestions_${i}" class="autocomplete-dropdown"></div>
        </div>

        ${botaoExcluirHtml}
      </div>
    </div>`;
  }).join("");

  recalcularValorSugeridoPorItem();
  atualizarPreviewVBucks();
}

function render() {
  if (!state) return;
  const baseEl = document.getElementById("valorBaseDisplay");
  if (baseEl) baseEl.textContent = money(state.valorBase100 || 2.5);
  if (typeof limparReservasExpiradas === 'function') limparReservasExpiradas();

  const modoAtual = state?.modoPrecificacao || 'padrao';
  const btnPadrao = document.getElementById("btnModoPadrao");
  const btnGlobal = document.getElementById("btnModoGlobal");
  const btnVolume = document.getElementById("btnModoVolume");

  if (btnPadrao && btnGlobal && btnVolume) {
    [btnPadrao, btnGlobal, btnVolume].forEach(b => {
      b.className = "btn-gray";
    });

    if (modoAtual === 'padrao') {
      btnPadrao.className = "btn-green";
    } else if (modoAtual === 'global_promo') {
      btnGlobal.className = "btn-green";
    } else if (modoAtual === 'volume_promo') {
      btnVolume.className = "btn-green";
    }
  }

  const configVolumeWrapper = document.getElementById("configVolumeWrapper");
  const inputValorPromoVolume = document.getElementById("inputValorPromoVolume");
  const inputLimiteVolume = document.getElementById("inputLimiteVolume");
  
  if (configVolumeWrapper) {
    if (modoAtual === 'volume_promo') {
      configVolumeWrapper.style.display = "block";
      if (inputValorPromoVolume && state) inputValorPromoVolume.value = Number(state.valorBasePromo || 2.00).toFixed(2);
      if (inputLimiteVolume && state) inputLimiteVolume.value = state.limiteVolumePromo || 1500;
    } else {
      configVolumeWrapper.style.display = "none";
      const content = document.getElementById("configVolumeContent");
      const arrow = document.getElementById("volumeToggleArrow");
      if (content) content.style.display = "none";
      if (arrow) arrow.textContent = "▾";
      if (typeof painelVolumeAberto !== 'undefined') painelVolumeAberto = false;
    }
  }
  
  const tSessao = typeof totais === 'function' ? totais() : {};
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
  
  if (typeof renderContasCards === 'function') renderContasCards(tSessao);
  
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
    if (!document.getElementById("eyeToggleValoresWrapper")) {
      histTotalLabel.innerHTML = `
        <span style="position: relative; display: inline-flex; align-items: center; white-space: nowrap;" id="eyeToggleValoresWrapper">
          💰 TOTAL DO HISTÓRICO
          <button type="button" id="eyeToggleValores" style="position: absolute; left: 100%; margin-left: 8px; background:none; border:none; color:inherit; font-size:18px; cursor:pointer; padding:0; outline:none; display:flex; align-items:center; justify-content:center; width: 30px; height: 30px;" title="Ocultar/Mostrar Valores">👁️</button>
        </span>
      `;
      document.getElementById("eyeToggleValores").addEventListener("click", toggleOcultarValores);
    }
    const eyeTotalBtn = document.getElementById("eyeToggleValores");
    if (eyeTotalBtn) eyeTotalBtn.textContent = valoresOcultos ? "🙈" : "👁️";
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
  
  if (typeof renderizarResumoPeriodos === 'function') renderizarResumoPeriodos();
  if (typeof renderizarListaHistorico === 'function') renderizarListaHistorico();
  if (abaHistoricoAtiva === 'agendamentos' && typeof renderizarAgendamentos === 'function') renderizarAgendamentos();
}