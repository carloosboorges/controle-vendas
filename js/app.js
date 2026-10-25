// ==========================================
// MÓDULO DE VENDAS E INTERFACE PRINCIPAL
// ==========================================

let clienteOrigemEdicao = null;

function parseValorMonetario(valorStr) {
  if (!valorStr) return 0;
  if (typeof valorStr === 'number') return valorStr;
  
  let limpo = valorStr.toString().trim();
  if (limpo.includes(',')) {
      limpo = limpo.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(limpo) || 0;
}

// 🧹 VASSOURA AUTOMÁTICA 2.0: Auto-Cura de contatos trocados
function limparLixosDeContato() {
  if (!state) return;
  let alterou = false;

  const isTelefone = (str) => str.includes('+55') || (str.match(/\d/g) || []).length >= 10;
  const isTiktok = (str) => str.startsWith('@') || (!str.includes('+55') && str.match(/[a-zA-Z]/) && (str.match(/\d/g) || []).length < 8);

  const limparLista = (lista) => {
    if (!lista) return;
    lista.forEach(v => {
      const nome = String(v.cliente || "").trim().toLowerCase();
      const nick = String(v.nickCliente || "").trim().toLowerCase();
      let wpp = String(v.whatsapp || "").trim();
      let tk = String(v.tiktok || "").trim();

      if ((nome && wpp.toLowerCase() === nome) || (nick && wpp.toLowerCase() === nick)) {
        v.whatsapp = ""; wpp = ""; alterou = true;
      }
      if ((nome && tk.toLowerCase() === nome) || (nick && tk.toLowerCase() === nick)) {
        v.tiktok = ""; tk = ""; alterou = true;
      }

      if (wpp && isTiktok(wpp)) {
        if (!tk) v.tiktok = wpp;
        v.whatsapp = "";
        wpp = "";
        tk = v.tiktok;
        alterou = true;
      }

      if (tk && isTelefone(tk)) {
        if (!wpp) v.whatsapp = tk;
        v.tiktok = "";
        tk = "";
        alterou = true;
      }
    });
  };

  limparLista(state.historicoVendas);
  limparLista(state.vendas);
  limparLista(state.agendamentos);
  limparLista(state.lixeiraVendas);

  if (state.clientesInfo) {
    Object.values(state.clientesInfo).forEach(info => {
      let wpp = String(info.whatsapp || "").trim();
      let tk = String(info.tiktok || "").trim();

      if (wpp && isTiktok(wpp)) {
        if (!tk) info.tiktok = wpp;
        info.whatsapp = "";
        alterou = true;
      }

      if (tk && isTelefone(tk)) {
        if (!wpp) info.whatsapp = tk;
        info.tiktok = "";
        alterou = true;
      }
    });
  }

  if (alterou && typeof save === 'function') {
    save();
    console.log("🧹 Faxina Concluída: Dados trocados de WhatsApp e TikTok foram restaurados!");
  }
}

function atualizarCalculoEdicaoAutomatico() {
  const itemBoxes = document.querySelectorAll("#editItensListContainer .item-picker-box");
  let somaVbucks = 0;
  let valorCalculadoReais = 0;

  const modo = state.modoPrecificacao || 'padrao';
  const basePadrao = state.valorBase100 || 2.5;
  
  const metaVolume = state.volumeMeta || 1500;
  const baseNormal = state.volumeBaseNormal || 2.5;
  const basePromo = state.volumeBasePromo || 2.0;

  const modoDesc = state.modoAplicacaoDesconto || state.volumeModoAplicacao || state.tipoDescontoVolume || 'individual';
  const isDescontoPorItem = String(modoDesc).toLowerCase().includes('indivi') || String(modoDesc).toLowerCase().includes('item');

  itemBoxes.forEach(box => {
    const vb = parseInt(box.querySelector(".edit-modal-item-vbucks")?.value, 10) || 0;
    somaVbucks += vb;
    
    if (modo === 'volume_promo' && isDescontoPorItem) {
        const baseItem = vb >= metaVolume ? basePromo : baseNormal;
        valorCalculadoReais += (vb / 100) * baseItem;
    }
  });

  if (modo === 'global_promo') {
    const baseGlobal = state.valorBaseGlobal || basePadrao;
    valorCalculadoReais = (somaVbucks / 100) * baseGlobal;
  } else if (modo === 'volume_promo' && !isDescontoPorItem) {
    const baseTotal = somaVbucks >= metaVolume ? basePromo : baseNormal;
    valorCalculadoReais = (somaVbucks / 100) * baseTotal;
  } else if (modo !== 'volume_promo') {
    valorCalculadoReais = (somaVbucks / 100) * basePadrao;
  }

  const inputValorReais = document.getElementById("editValorInput");
  
  if (inputValorReais && somaVbucks > 0) {
    inputValorReais.value = valorCalculadoReais.toFixed(2);
  }

  let vbucksExibicao = somaVbucks;
  if (somaVbucks === 0) {
    const vendaId = document.getElementById("editVendaId")?.value;
    const tipoRegistro = document.getElementById("editTipoRegistro")?.value || "venda";
    const listaOriginal = tipoRegistro === "agendamento" ? state.agendamentos : state.historicoVendas;
    const vendaAtual = (listaOriginal || []).find(v => v.id === vendaId);
    
    if (vendaAtual) {
      vbucksExibicao = vendaAtual.vbucks !== undefined ? Number(vendaAtual.vbucks) : (typeof valorParaVBucks === 'function' ? valorParaVBucks(vendaAtual.valor, vendaAtual.valorBaseMomento) : 0);
    }
  }

  const spans = document.querySelectorAll("#editSaleModal span");
  spans.forEach(el => {
    if (el.textContent.includes("V-Bucks") || el.textContent.includes("VB")) {
      el.textContent = `🪙 ${vbucksExibicao.toLocaleString('pt-BR')} V-Bucks`;
    }
  });
}

function adicionarVenda() {
  if (typeof limparReservasExpiradas === 'function') limparReservasExpiradas();
  
  const conta = document.getElementById("contaSelect")?.value;
  const valorInputEl = document.getElementById("valorInput");
  const valorDigitado = parseValorMonetario(valorInputEl ? valorInputEl.value : 0);
  const cliente = document.getElementById("clienteInput")?.value.trim();
  const nickCliente = document.getElementById("nickClienteInput")?.value.trim();
  let whatsapp = document.getElementById("whatsappInput")?.value.trim() || "";
  let tiktok = document.getElementById("tiktokInput")?.value.trim() || "";
  const observacao = document.getElementById("observacaoInput")?.value.trim() || "";
  
  const inputQtd = document.getElementById("quantidadeInput");
  const quantidade = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  const itens = obterItensDaVenda(); 
  const baseAtual = state.valorBase100 || 2.5;

  const primeiroItem = document.getElementById("itemNameInput_0")?.value?.trim();
  let clienteId = document.getElementById("clienteIdInput")?.value;

  if (window.ignorarChecagemDuplicacao) {
    window.ignorarChecagemDuplicacao = false;
  } else {
    if (typeof checarDuplicacaoAntesDeVender === 'function') {
      if (checarDuplicacaoAntesDeVender(cliente, clienteId, adicionarVenda)) return;
    }
  }

  // 🚀 ALERTAS DE ERRO ESPECÍFICOS (RESTAURADOS)
  if (!conta) { mostrarNotificacao("⚠️ Por favor, selecione uma Conta!", "erro"); return; }
  if (!valorDigitado || isNaN(valorDigitado) || valorDigitado <= 0) { mostrarNotificacao("⚠️ Por favor, informe o Valor da venda!", "erro"); return; }
  if (!cliente) { mostrarNotificacao("⚠️ Por favor, informe o Nome do Cliente!", "erro"); return; }
  if (!nickCliente) { mostrarNotificacao("⚠️ Por favor, informe o Nick do Cliente!", "erro"); return; }
  if (!primeiroItem) { mostrarNotificacao("⚠️ Por favor, informe o nome do Item!", "erro"); return; }

  if (itens.length < quantidade) { mostrarNotificacao("⚠️ Por favor, preencha o nome de todos os itens extras!", "erro"); return; }

  if (quantidade >= 2) {
    for (let idx = 0; idx < itens.length; idx++) {
      if (!itens[idx].vbucks || Number(itens[idx].vbucks) <= 0) {
        mostrarNotificacao(`⚠️ Por favor, informe a quantidade em V-Bucks do Item ${idx + 1} (obrigatório para 2 ou mais itens)!`, "erro");
        return;
      }
    }
  }

  const limitesPendentes = {};
  const descontosPorConta = {};
  
  itens.forEach(it => {
     const c = it.contaEnvio || conta; 
     if (!it.enviadoAvulso) {
         limitesPendentes[c] = (limitesPendentes[c] || 0) + 1;
     }
     descontosPorConta[c] = (descontosPorConta[c] || 0) + (Number(it.vbucks) || 0);
  });

  for (const [nomeConta, qtdPendentes] of Object.entries(limitesPendentes)) {
      const u = typeof usadasDaConta === 'function' ? usadasDaConta(nomeConta) : 0;
      if (u + qtdPendentes > 5) {
         mostrarNotificacao(`Limite de vagas excedido! A conta ${nomeConta} não tem espaço.`, "erro");
         return;
      }
  }

  const somaVbucksItens = itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
  const vbucksNecessarios = somaVbucksItens > 0 ? somaVbucksItens : (typeof valorParaVBucks === 'function' ? valorParaVBucks(valorDigitado) : Math.round((valorDigitado / baseAtual) * 100));

  if (Object.keys(descontosPorConta).length === 0 || somaVbucksItens === 0) {
      descontosPorConta[conta] = vbucksNecessarios;
  }

  for (const [nomeConta, vbReq] of Object.entries(descontosPorConta)) {
      const cObj = (state.contas || []).find(c => c.nome === nomeConta);
      if (!cObj || Number(cObj.vbucks) < vbReq) {
          mostrarNotificacao(`Saldo de V-Bucks insuficiente na conta ${nomeConta}.`, "erro");
          return;
      }
  }

  for (const [nomeConta, vbReq] of Object.entries(descontosPorConta)) {
      const cObj = (state.contas || []).find(c => c.nome === nomeConta);
      if (cObj) cObj.vbucks = Math.max(0, Number(cObj.vbucks) - vbReq);
  }

  const agora = Date.now(), d = new Date(), vendaId = `venda-${agora}`;

  if (!clienteId) {
    clienteId = "cli-" + agora + "-" + Math.random().toString(36).substr(2, 4);
  }

  if ((!whatsapp || !tiktok) && clienteId) {
    const infoCli = (state.clientesInfo || {})[clienteId];
    if (infoCli) {
      if (!whatsapp) whatsapp = infoCli.whatsapp || "";
      if (!tiktok) tiktok = infoCli.tiktok || "";
    }
  }
  if ((!whatsapp || !tiktok) && cliente) {
    const infoCliPorNome = Object.values(state.clientesInfo || {}).find(c => String(c.nome || "").trim().toLowerCase() === cliente.toLowerCase());
    if (infoCliPorNome) {
      if (!whatsapp) whatsapp = infoCliPorNome.whatsapp || "";
      if (!tiktok) tiktok = infoCliPorNome.tiktok || "";
    }
  }
  if (!whatsapp || !tiktok) {
    const historicoReverso = [...(state.historicoVendas || [])].reverse();
    const ultimaDoCliente = historicoReverso.find(v => (v.clienteId === clienteId || String(v.cliente || "").trim().toLowerCase() === cliente.toLowerCase()));
    if (ultimaDoCliente) {
      if (!whatsapp) whatsapp = ultimaDoCliente.whatsapp || "";
      if (!tiktok) tiktok = ultimaDoCliente.tiktok || ""; 
    }
  }

  const novaVenda = {
    id: vendaId, 
    clienteId: clienteId, 
    conta, valor: Number(valorDigitado), vbucks: vbucksNecessarios,
    valorBaseMomento: baseAtual, quantidade, cliente, nickCliente,
    observacao, item: itens[0] || "", itens, whatsapp, tiktok,
    data: d.toLocaleDateString("pt-BR"),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    criadoEmMs: agora
  };

  state.vendas.push(novaVenda);
  state.historicoVendas.push({ ...novaVenda, itens: [...itens] });
  
  if (!state.reservas) state.reservas = [];
  
  itens.forEach(it => {
    const contaItem = it.contaEnvio || conta;
    if (it.enviadoAvulso) {
      const reservaOrfa = state.reservas.find(r => r.conta === contaItem && r.vendaId === null);
      if (reservaOrfa) {
        reservaOrfa.vendaId = vendaId; 
      } else {
        state.reservas.push({
          id: `timer-${agora}-${Math.random().toString(36).substr(2, 5)}`,
          conta: contaItem,
          vendaId: vendaId,
          expiresAt: agora + 86400000 + 120000
        });
      }
    } else {
      if (typeof criarTimerReserva === 'function') {
        state.reservas.push(criarTimerReserva(contaItem, vendaId));
      }
    }
  });

  if (typeof sincronizarDadosCliente === 'function') sincronizarDadosCliente(clienteId, whatsapp, tiktok);
  
  ["valorInput", "clienteInput", "clienteIdInput", "nickClienteInput", "whatsappInput", "tiktokInput", "observacaoInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  if (document.getElementById("quantidadeInput")) document.getElementById("quantidadeInput").value = "1";
  if (document.getElementById("dataEnvioInput")) document.getElementById("dataEnvioInput").value = "";
  if (document.getElementById("labelAgendaData")) document.getElementById("labelAgendaData").textContent = "Hoje";
  
  if (typeof atualizarCamposItensComDados === 'function') {
    atualizarCamposItensComDados([{ tipo: "Traje", nome: "", vbucks: "", presente: "", enviadoAvulso: false }]);
  } else if (typeof atualizarCamposItens === 'function') {
    atualizarCamposItens(false);
  }

  if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
  if (typeof verificarObservacaoCliente === 'function') verificarObservacaoCliente("");

  if (typeof render === 'function') render();
  if (typeof save === 'function') save(); 
  
  mostrarNotificacao("✅ Venda registrada com sucesso!", "sucesso");
}

function dispararEnvioItemAvulso(i) {
  const contaSeletorItem = document.getElementById(`itemContaSelect_${i}`)?.value;
  const contaPrincipal = document.getElementById("contaSelect")?.value;
  const contaSugerida = contaSeletorItem || contaPrincipal;

  const nomeItem = document.getElementById(`itemNameInput_${i}`)?.value.trim();
  const inputEnviado = document.getElementById(`itemEnviadoAvulso_${i}`);
  const btnEnvio = document.getElementById(`btnEnvioAvulso_${i}`);

  if (inputEnviado && inputEnviado.value === "true") {
    if (typeof abrirModalConfirmacao === 'function') {
      abrirModalConfirmacao(
        "🔄 Cancelar Envio deste Item",
        `Deseja cancelar o envio do item ${i + 1} (${nomeItem || 'Sem nome'}) da conta ${contaSugerida}? O timer criado será removido e o status voltará a pendente.`,
        () => {
          const idxOrfao = (state.reservas || []).findIndex(r => r.conta === contaSugerida && r.vendaId === null);
          if (idxOrfao !== -1) {
            state.reservas.splice(idxOrfao, 1);
          }
          if (inputEnviado) inputEnviado.value = "false";
          if (btnEnvio) {
            btnEnvio.textContent = "🚀 Enviar";
            btnEnvio.style.background = "rgba(142,68,255,0.2)";
            btnEnvio.style.borderColor = "rgba(142,68,255,0.4)";
            btnEnvio.style.color = "var(--accent-light)";
          }
          if (typeof render === 'function') render();
          if (typeof save === 'function') save();
          mostrarNotificacao("ℹ️ Envio do item cancelado e timer removido.", "info");
        }
      );
    }
    return;
  }

  if (!nomeItem) { mostrarNotificacao("⚠️ Preencha o nome do item antes de disparar o envio!", "erro"); return; }

  let selectHtml = `<div style="margin-top: 15px; text-align: left;">
      <label style="font-size: 12px; color: var(--accent-light); font-weight: bold;">Escolha a conta de envio:</label>
      <select id="selectContaEnvioModal" style="margin-top: 4px; width: 100%; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid var(--accent); outline: none; font-size: 13px; cursor: pointer;">`;
  
  (state.contas || []).filter(c => c.ativa).forEach(c => {
     const isSelected = c.nome === contaSugerida ? "selected" : "";
     selectHtml += `<option value="${esc(c.nome)}" ${isSelected}>${esc(c.nome)} (Saldo: ${formatVBucks(c.vbucks)} VB)</option>`;
  });
  selectHtml += `</select></div>`;

  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao(
      "🚀 Enviar Item Agora",
      `Você está prestes a iniciar o timer deste item.<br><br>Item: <b style="color:var(--accent-light);">${esc(nomeItem)}</b>${selectHtml}`,
      () => {
        const contaEscolhida = document.getElementById("selectContaEnvioModal")?.value || contaSugerida;
        
        const usadas = typeof usadasDaConta === 'function' ? usadasDaConta(contaEscolhida) : 0;
        if (usadas >= 5) {
          mostrarNotificacao(`A conta ${contaEscolhida} já atingiu o limite de 5 envios!`, "erro");
          return;
        }

        const inputSeletor = document.getElementById(`itemContaSelect_${i}`);
        if(inputSeletor) inputSeletor.value = contaEscolhida;

        const agora = Date.now();
        if (inputEnviado) inputEnviado.value = "true";
        
        if (!state.reservas) state.reservas = [];
        state.reservas.push({
          id: `timer-${agora}-${Math.random().toString(36).substr(2, 5)}`,
          conta: contaEscolhida,
          vendaId: null,
          expiresAt: agora + 86400000 + 120000
        });

        if (btnEnvio) {
          btnEnvio.textContent = "🚀 Enviado!";
          btnEnvio.style.background = "var(--green)";
          btnEnvio.style.borderColor = "var(--green)";
          btnEnvio.style.color = "#fff";
        }

        if (typeof render === 'function') render();
        if (typeof save === 'function') save();

        mostrarNotificacao(`🚀 Timer disparado na conta ${contaEscolhida}!`, "sucesso");
      }
    );
  }
}

function obterItensDaVenda() {
  const inputQtd = document.getElementById("quantidadeInput");
  const qtd = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  const lista = [];
  for (let i = 0; i < qtd; i++) {
    const tipo = document.getElementById(`itemTypeSelect_${i}`)?.value || "Outro";
    const nome = document.getElementById(`itemNameInput_${i}`)?.value.trim() || "";
    const vbucks = parseInt(document.getElementById(`itemVbucksInput_${i}`)?.value, 10) || 0;
    const presente = document.getElementById(`itemPresenteInput_${i}`)?.value.trim() || "";
    const enviadoAvulso = document.getElementById(`itemEnviadoAvulso_${i}`)?.value === "true";
    const contaEnvio = document.getElementById(`itemContaSelect_${i}`)?.value || ""; 
    
    if (nome) lista.push({ tipo, nome, vbucks, presente, enviadoAvulso, contaEnvio });
  }
  return lista;
}

function salvarEdicaoVenda() {
  const vendaId = document.getElementById("editVendaId").value;
  const tipoRegistro = document.getElementById("editTipoRegistro")?.value || "venda";
  const isAgendamento = tipoRegistro === "agendamento";
  
  const listaOriginal = isAgendamento ? state.agendamentos : state.historicoVendas;
  const i = (listaOriginal || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = listaOriginal[i];

  const novaConta = document.getElementById("editContaSelect")?.value || venda.conta;
  const cliente = document.getElementById("editClientInput")?.value.trim() || "";
  const nick = document.getElementById("editNickInput")?.value.trim() || "";
  const whatsapp = document.getElementById("editWhatsappInput")?.value.trim() || "";
  const tiktok = document.getElementById("editTiktokInput")?.value.trim() || "";
  const observacao = document.getElementById("editObservacaoInput")?.value.trim() || "";

  const itemBoxes = document.querySelectorAll("#editItensListContainer .item-picker-box");
  const novosItens = [];
  itemBoxes.forEach(box => {
    const tipo = box.querySelector(".edit-modal-item-type")?.value || "Outro";
    const nome = box.querySelector(".edit-modal-item-name")?.value.trim() || "";
    const vbucks = parseInt(box.querySelector(".edit-modal-item-vbucks")?.value, 10) || 0;
    const presente = box.querySelector(".edit-modal-item-presente")?.value.trim() || "";
    const contaEnvio = box.querySelector(".edit-modal-item-conta")?.value || "";
    const enviadoAvulso = box.querySelector(".edit-modal-item-enviado")?.value === "true";
    if (nome) novosItens.push({ tipo, nome, vbucks, presente, contaEnvio, enviadoAvulso });
  });

  if (novosItens.length < itemBoxes.length) {
    mostrarNotificacao("Preencha o nome do(s) item(ns) vendido(s).", "erro");
    return;
  }

  if (novosItens.length >= 2) {
    for (let idx = 0; idx < novosItens.length; idx++) {
      if (!novosItens[idx].vbucks || Number(novosItens[idx].vbucks) <= 0) {
        mostrarNotificacao(`⚠️ Por favor, informe a quantidade em V-Bucks do Item ${idx + 1} (obrigatório para 2 ou mais itens)!`, "erro");
        return;
      }
    }
  }

  if (!isAgendamento) {
      let somaVbVelhos = 0;
      if (venda.itens && venda.itens.length > 0) {
          somaVbVelhos = venda.itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
      }

      if (venda.itens && venda.itens.length > 0 && somaVbVelhos > 0) {
          venda.itens.forEach(it => {
              let cNome = it.contaEnvio || venda.conta;
              let cObj = state.contas.find(c => c.nome === cNome);
              if (cObj) cObj.vbucks = Number(cObj.vbucks) + (Number(it.vbucks) || 0);
          });
      } else {
          let cObj = state.contas.find(c => c.nome === venda.conta);
          if (cObj) cObj.vbucks = Number(cObj.vbucks) + (Number(venda.vbucks) || 0);
      }
  }

  const valorEditInputEl = document.getElementById("editValorInput");
  const novoValorEmReais = parseValorMonetario(valorEditInputEl ? valorEditInputEl.value : 0);
  const baseMomento = venda.valorBaseMomento || state.valorBase100 || 2.5;

  const descontosPorContaNovos = {};
  let somaVbNovos = 0;
  
  novosItens.forEach(it => {
      somaVbNovos += (Number(it.vbucks) || 0);
      let cNome = it.contaEnvio || novaConta; 
      descontosPorContaNovos[cNome] = (descontosPorContaNovos[cNome] || 0) + (Number(it.vbucks) || 0);
  });

  const novoVbucks = somaVbNovos > 0 ? somaVbNovos : (typeof valorParaVBucks === 'function' ? valorParaVBucks(novoValorEmReais, baseMomento) : Math.round((novoValorEmReais / baseMomento) * 100));

  if (somaVbNovos === 0) {
      descontosPorContaNovos[novaConta] = novoVbucks;
  }

  if (!isAgendamento) {
      for (const [nC, vBReq] of Object.entries(descontosPorContaNovos)) {
          let cObj = state.contas.find(c => c.nome === nC);
          if (cObj) {
              cObj.vbucks = Math.max(0, Number(cObj.vbucks) - vBReq);
          }
      }
      
      if (state.reservas) {
          let timersDaVenda = state.reservas.filter(r => r.vendaId === venda.id);
          for (let idx = 0; idx < novosItens.length; idx++) {
              if (timersDaVenda[idx]) {
                  timersDaVenda[idx].conta = novosItens[idx].contaEnvio || novaConta;
              }
          }
          timersDaVenda.forEach((t, idx) => {
             if (idx >= novosItens.length) {
                 t.conta = novaConta;
             }
          });
      }
  }

  venda.conta = novaConta;
  venda.cliente = cliente;
  venda.nickCliente = nick;
  venda.whatsapp = whatsapp;
  venda.tiktok = tiktok;
  venda.nickPresente = "";
  venda.observacao = observacao;
  venda.valor = Number(novoValorEmReais);
  venda.vbucks = novoVbucks;
  
  if (novosItens.length > 0) {
    venda.itens = novosItens;
    venda.item = novosItens[0];
    venda.quantidade = novosItens.length;
  }

  if (isAgendamento) {
    const dataEnvioCrua = document.getElementById("editDataEnvioInput")?.value.trim();
    if (dataEnvioCrua) {
      const p = dataEnvioCrua.split("-");
      if (p.length === 3) {
        venda.dataEnvio = `${p[2]}/${p[1]}/${p[0]}`;
      }
    }
  } else {
    const novaData = document.getElementById("editDataInput")?.value.trim() || venda.data;
    const novaHora = document.getElementById("editHoraInput")?.value.trim() || venda.hora || "—";
    venda.data = novaData;
    venda.hora = novaHora;
    const sessaoVenda = (state.vendas || []).find(v => v.id === venda.id);
    if (sessaoVenda) {
      Object.assign(sessaoVenda, {
        conta: novaConta, cliente, nickCliente: nick, whatsapp, tiktok,
        observacao, data: novaData, hora: novaHora, valor: Number(novoValorEmReais),
        vbucks: novoVbucks, itens: novosItens.length ? novosItens : sessaoVenda.itens,
        item: novosItens.length ? novosItens[0] : sessaoVenda.item,
        quantidade: novosItens.length ? novosItens.length : sessaoVenda.quantidade
      });
    }
  }

  const idDoCliente = venda.clienteId || venda.cliente;
  if (typeof sincronizarDadosCliente === 'function') sincronizarDadosCliente(idDoCliente, whatsapp, tiktok);
  if (typeof save === 'function') save();
  fecharModalEdicao();
  
  if (isAgendamento && typeof renderizarAgendamentos === "function") {
    renderizarAgendamentos();
  } else if (typeof render === 'function') {
    render();
  }
  
  mostrarNotificacao(isAgendamento ? "Pré-venda atualizada com sucesso!" : "Alterações salvas com sucesso!", "sucesso");
}

function fecharModalEdicao() {
  if (document.getElementById("editSaleModal")) {
    document.getElementById("editSaleModal").style.display = "none";
  }
  if (clienteOrigemEdicao) {
    const ctx = clienteOrigemEdicao;
    clienteOrigemEdicao = null;
    if (typeof abrirModalDetalhesCliente === 'function') {
      abrirModalDetalhesCliente(ctx.id, ctx.nome);
    }
  }
}

function excluirHistoricoPorId(vendaId) {
  const initialIndex = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (initialIndex < 0) return;
  const clientName = state.historicoVendas[initialIndex].cliente;
  
  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao("🗑️ Mover para Lixeira", `Mover venda de ${clientName} para a lixeira?`, () => {
      const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
      if (i < 0) return;
      const venda = state.historicoVendas[i];
      
      let somaVbucksItens = 0;
      if (venda.itens && venda.itens.length > 0) {
          somaVbucksItens = venda.itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
      }

      if (venda.itens && venda.itens.length > 0 && somaVbucksItens > 0) {
          venda.itens.forEach(it => {
              let cNome = it.contaEnvio || venda.conta;
              let cObj = (state.contas || []).find(c => c.nome === cNome);
              if (cObj) cObj.vbucks = Number(cObj.vbucks) + (Number(it.vbucks) || 0);
          });
      } else {
          let conta = (state.contas || []).find(c => c.nome === venda.conta);
          if (conta) conta.vbucks = Number(conta.vbucks) + (Number(venda.vbucks) || 0);
      }
      
      const timersDaVenda = (state.reservas || []).filter(r => r.vendaId === venda.id);
      venda.timersSalvos = JSON.parse(JSON.stringify(timersDaVenda));
      
      state.reservas = (state.reservas || []).filter(r => r.vendaId !== venda.id);
      
      state.vendas = (state.vendas || []).filter(v => v.id !== venda.id);
      state.historicoVendas.splice(i, 1);
      
      if (!state.lixeiraVendas) state.lixeiraVendas = [];
      state.lixeiraVendas.unshift(venda);
      
      if (typeof render === 'function') render();
      if (typeof save === 'function') save();
      mostrarNotificacao("Venda e timers associados movidos para a lixeira.", "sucesso");
    });
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
        
        vendasDoCliente.forEach(venda => {
          const timersDaVenda = (state.reservas || []).filter(r => r.vendaId === venda.id);
          venda.timersSalvos = JSON.parse(JSON.stringify(timersDaVenda));
          
          state.reservas = (state.reservas || []).filter(r => r.vendaId !== venda.id);
        });
        
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

function restaurarVenda(idx) {
  const venda = (state.lixeiraVendas || [])[idx];
  if (!venda) return;
  
  let somaVbucksItens = 0;
  if (venda.itens && venda.itens.length > 0) {
      somaVbucksItens = venda.itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
  }

  if (venda.itens && venda.itens.length > 0 && somaVbucksItens > 0) {
      venda.itens.forEach(it => {
          let cNome = it.contaEnvio || venda.conta;
          let cObj = (state.contas || []).find(c => c.nome === cNome);
          if (cObj) cObj.vbucks = Math.max(0, Number(cObj.vbucks) - (Number(it.vbucks) || 0));
      });
  } else {
      let contaObj = (state.contas || []).find(c => c.nome === venda.conta);
      if (contaObj) contaObj.vbucks = Math.max(0, Number(contaObj.vbucks) - (Number(venda.vbucks) || 0));
  }

  if (venda.timersSalvos && venda.timersSalvos.length > 0) {
    if (!state.reservas) state.reservas = [];
    state.reservas.push(...venda.timersSalvos);
    delete venda.timersSalvos;
  }

  if (venda.criadoEmMs && state.sessaoIniciadaEm && venda.criadoEmMs >= state.sessaoIniciadaEm) {
    if (!state.vendas) state.vendas = [];
    state.vendas.push(venda);
  }

  state.lixeiraVendas.splice(idx, 1);
  state.historicoVendas.push(venda);
  
  if (typeof render === 'function') render();
  if (typeof save === 'function') save();
  if (typeof abrirModalLixeira === 'function') abrirModalLixeira();
  mostrarNotificacao("Venda e timers restaurados com sucesso!", "sucesso");
}

function excluirDefinitivoLixeira(idx) {
  state.lixeiraVendas.splice(idx, 1);
  if (typeof render === 'function') render();
  if (typeof save === 'function') save();
  if (typeof abrirModalLixeira === 'function') abrirModalLixeira();
  mostrarNotificacao("Venda apagada permanentemente.", "info");
}

function esvaziarLixeira() {
  state.lixeiraVendas = [];
  if (typeof render === 'function') render();
  if (typeof save === 'function') save();
  if (typeof abrirModalLixeira === 'function') abrirModalLixeira();
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
      </div>`).join("");
  }
  if (modal) modal.style.display = "flex";
}

function fecharModalLixeira() {
  if (document.getElementById("trashModal")) document.getElementById("trashModal").style.display = "none";
}

// 🚀 O BOTÃO RÁPIDO ACUMULATIVO BLINDADO
function valorRapido(v) {
  const input = document.getElementById("valorInput");
  if (!input) return;
  
  // Pega o valor atual para acumular
  let valorAtual = parseValorMonetario(input.value);
  if (isNaN(valorAtual)) valorAtual = 0;
  
  // Soma os valores
  let novoValor = valorAtual + Number(v);
  
  // Injeta o valor formatado para evitar erros de ponto
  input.value = novoValor.toFixed(2);
  
  // Dispara os eventos essenciais para a máscara e o core.js agirem
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  setTimeout(() => {
      // Recalcula o preview usando a matemática, forçando a leitura correta
      if (typeof atualizarPreviewVBucks === 'function') {
          atualizarPreviewVBucks();
      }
      input.value = novoValor.toFixed(2); 
  }, 10);
  
  input.focus();
}

function toggleConta(i) {
  state.contas[i].ativa = !state.contas[i].ativa;
  if (typeof render === 'function') render();
  if (typeof save === 'function') save();
}

function removerConta(i) {
  state.contas.splice(i, 1);
  if (typeof render === 'function') render();
  if (typeof save === 'function') save();
}

function removerTimerEspecifico(idx) {
  state.reservas.splice(idx, 1);
  if (typeof render === 'function') render();
  if (typeof save === 'function') save();
}

function removerTimersConta(i) {
  const c = state.contas[i];
  if (c) {
    state.reservas = state.reservas.filter(r => r.conta !== c.nome);
    if (typeof render === 'function') render();
    if (typeof save === 'function') save();
  }
}

async function novaLive() {
  state.vendas = [];
  state.sessaoIniciadaEm = Date.now();
  if (typeof render === 'function') render();
  if (typeof save === 'function') await save();
  mostrarNotificacao("Nova sessão iniciada!", "sucesso");
}

function confirmarRemoverTimersConta(idx, nomeConta) {
  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao("🗑️ Resetar Timers", `Os timers de envio da conta ${nomeConta} serão resetados (liberando as 5 vagas). Tem certeza que deseja continuar?`, () => {
      removerTimersConta(idx);
      mostrarNotificacao(`Timers da conta ${nomeConta} resetados!`, "sucesso");
    });
  }
}

function confirmarRemoverVendasConta(nomeConta) {
  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao("💲 Zerar R$ da Sessão", `O valor arrecadado (R$) na sessão atual para a conta ${nomeConta} será zerado. Tem certeza que deseja continuar?`, () => {
      state.vendas = (state.vendas || []).filter(v => v.conta !== nomeConta);
      if (typeof render === 'function') render();
      if (typeof save === 'function') save();
      mostrarNotificacao(`Vendas da sessão da conta ${nomeConta} zeradas!`, "sucesso");
    });
  }
}

function adicionarTimerManual(nomeConta) {
  const usadas = typeof usadasDaConta === 'function' ? usadasDaConta(nomeConta) : 0;
  if (usadas >= 5) {
    mostrarNotificacao(`A conta ${nomeConta} já atingiu o limite de 5 envios!`, "erro");
    return;
  }
  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao("➕ Adicionar Envio Manual", `Deseja ocupar 1 vaga de envio na conta ${nomeConta} por 24h?`, () => {
      if (typeof criarTimerReserva === 'function') {
        state.reservas.push(criarTimerReserva(nomeConta, 'envio-manual'));
      }
      if (typeof render === 'function') render();
      if (typeof save === 'function') save();
      mostrarNotificacao(`Envio manual ativado na conta ${nomeConta}!`, "sucesso");
    });
  }
}

function alterarModoPrecificacao(novoModo) {
  if (!state) return;
  state.modoPrecificacao = novoModo;
  if (typeof save === 'function') save();
  if (typeof render === 'function') render();
  
  const nomesModos = {
    'padrao': 'Modo Padrão (Tabela + Base)',
    'global_promo': 'Valor Base Global',
    'volume_promo': 'Promoção por Volume'
  };
  mostrarNotificacao(`🔄 Modo alterado para: ${nomesModos[novoModo] || novoModo}`, "sucesso");
}

const elLimparTudo = document.getElementById("limparTudoBtn");
if (elLimparTudo) {
  elLimparTudo.addEventListener("click", () => {
    ["valorInput", "clienteInput", "clienteIdInput", "nickClienteInput", "whatsappInput", "tiktokInput", "observacaoInput"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (document.getElementById("quantidadeInput")) document.getElementById("quantidadeInput").value = "1";
    if (document.getElementById("dataEnvioInput")) document.getElementById("dataEnvioInput").value = "";
    if (document.getElementById("labelAgendaData")) document.getElementById("labelAgendaData").textContent = "Hoje";
    
    if (typeof atualizarCamposItensComDados === 'function') {
      atualizarCamposItensComDados([{ tipo: "Traje", nome: "", vbucks: "", presente: "", enviadoAvulso: false }]);
    } else if (typeof atualizarCamposItens === 'function') {
      atualizarCamposItens(false);
    }
    
    if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
    if (typeof verificarObservacaoCliente === 'function') verificarObservacaoCliente("");
  });
}

const elLimparValor = document.getElementById("limparSoValorBtn");
if (elLimparValor) {
  elLimparValor.addEventListener("click", () => {
    const valInput = document.getElementById("valorInput");
    if (valInput) {
      valInput.value = "";
      if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
      valInput.focus();
    }
  });
}

function toggleMostrarSenha() {
  const passInput = document.getElementById("authPassword");
  const toggleBtn = document.getElementById("togglePasswordBtn");
  if (passInput && toggleBtn) {
    if (passInput.type === "password") {
      passInput.type = "text"; toggleBtn.textContent = "🙈";
    } else {
      passInput.type = "password"; toggleBtn.textContent = "👁️";
    }
  }
}

async function inicializar() {
  const footer = document.getElementById("statusFooter");
  
  if (typeof verificarSessao === 'function') await verificarSessao();
  if (typeof atualizarInterfaceAuth === 'function') atualizarInterfaceAuth();
  
  if (typeof atualizarCamposItens === 'function') atualizarCamposItens();
  
  if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
  if (typeof mudarAbaHistorico === 'function') mudarAbaHistorico('vendas');
  
  if (typeof currentUser !== 'undefined' && !currentUser) {
    if (footer) footer.textContent = "👀 Modo Visitante (Faça login como Admin)";
    if (typeof DADOS_DEMO !== 'undefined') state = JSON.parse(JSON.stringify(DADOS_DEMO));
    if (typeof sanitizarDados === 'function') sanitizarDados();
    if (typeof render === 'function') render();
    return;
  }
  
  try {
    if (footer) footer.textContent = "☁️ Carregando dados da nuvem...";
    const url = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '';
    const key = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '';
    const res = await fetch(`${url}/rest/v1/app_state?id=eq.1&select=*`, {
      headers: { "apikey": key, "Authorization": `Bearer ${key}` }
    });
    const rows = await res.json();
    state = (Array.isArray(rows) && rows.length > 0 && rows[0].data) ? rows[0].data : JSON.parse(JSON.stringify(typeof DADOS_DEMO !== 'undefined' ? DADOS_DEMO : {}));
    
    if (typeof sanitizarDados === 'function') sanitizarDados();

    // 🧹 ATIVA A AUTO-CURA AUTOMÁTICA DE VARIÁVEIS TROCADAS
    limparLixosDeContato(); 
    
    if (footer && typeof currentUser !== 'undefined' && currentUser) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
    if (typeof render === 'function') render();
  } catch (err) {
    if (footer) footer.textContent = "⚠️ Erro ao sincronizar com banco";
    if (typeof DADOS_DEMO !== 'undefined') state = JSON.parse(JSON.stringify(DADOS_DEMO));
    if (typeof sanitizarDados === 'function') sanitizarDados();
    
    // 🧹 ATIVA A AUTO-CURA OFFLINE
    limparLixosDeContato();

    if (typeof render === 'function') render();
  }
}

let ultimaDataHojeConhecida = typeof obterDataHojeFormatada === 'function' ? obterDataHojeFormatada() : new Date().toLocaleDateString('pt-BR');
inicializar();

// -------------------------------------------------------------
// O "CORAÇÃO" DA RENDERIZAÇÃO GERAL
// -------------------------------------------------------------
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
  
  // 🚀 ATUALIZAÇÃO DO CARTÃO HÍBRIDO DE PRÉ-VENDAS
  const tSessao = typeof totais === 'function' ? totais() : {};
  if (document.getElementById("totalGeral")) document.getElementById("totalGeral").textContent = maskMoney(money((state.vendas || []).reduce((a, v) => a + Number(v.valor || 0), 0)));
  
  if (document.getElementById("totalAgendamentosSessao")) {
      const valorTotalPendenteGlobal = (state.agendamentos || []).reduce((sum, a) => sum + Number(a.valor || 0), 0);
      const valorSessaoPreVenda = (state.agendamentos || []).filter(a => a.criadoEmMs >= (state.sessaoIniciadaEm || 0)).reduce((sum, a) => sum + Number(a.valor || 0), 0);
      
      const textoPendenteMaior = maskMoney(money(valorTotalPendenteGlobal));
      const textSessaoMenor = maskMoney(money(valorSessaoPreVenda));
      
      // Sobrescreve o conteúdo do cartão para mostrar as duas variáveis!
      document.getElementById("totalAgendamentosSessao").innerHTML = `
          <div style="font-size: 24px; font-weight: 900; line-height: 1;">${textoPendenteMaior}</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px; font-weight: 600;">Na sessão: <span style="color: var(--accent-light);">${textSessaoMenor}</span></div>
      `;
      
      // Muda a etiqueta superior do cartão de "Pré-vendas (Sessão)" para "Pré-vendas Pendentes"
      const labelDoCartao = document.getElementById("totalAgendamentosSessao").previousElementSibling;
      if (labelDoCartao && labelDoCartao.classList.contains("label")) {
          labelDoCartao.textContent = "Pré-vendas Pendentes";
      }
  }

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
      <div class="account-row" 
           draggable="true" 
           ondragstart="iniciarArrasteConta(event, ${i})"
           ondragover="permitirSoltarConta(event)"
           ondragleave="sairAreaSoltoConta(event)"
           ondrop="soltarConta(event, ${i})"
           ondragend="fimArrasteConta(event)"
           style="display: flex; align-items: center; transition: all 0.2s ease;">
           
        <div style="cursor: grab; color: var(--muted); font-size: 22px; padding: 0 12px 0 4px; display: flex; align-items: center; user-select: none;" title="Pressione e arraste para reordenar a conta">⋮⋮</div>
        
        <div class="account-info" style="flex: 1;">
          <div class="account-header-line">
            <div class="account-name">${esc(c.nome)}</div>
            <span class="badge ${c.ativa ? "" : "off"}">${c.ativa ? "🟢 ATIVA" : "⚫ DESATIVADA"}</span>
          </div>
          <div class="small">${c.ativa ? `Saldo: ${formatVBucks(c.vbucks)} V-Bucks` : "Desativada"}</div>
        </div>
        <div class="account-actions">
          <button type="button" class="btn-gray" onclick="typeof abrirModalEditConta === 'function' ? abrirModalEditConta(${i}) : null">✏️ Editar</button>
          <button type="button" class="${c.ativa ? "btn-gray" : "btn-green"}" onclick="typeof toggleConta === 'function' ? toggleConta(${i}) : null">${c.ativa ? "Desativar" : "Ativar"}</button>
          <button type="button" class="btn-danger" onclick="typeof removerConta === 'function' ? removerConta(${i}) : null">🗑️ Remover</button>
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

setInterval(() => {
  if (typeof state !== 'undefined' && state) {
      if (typeof atualizarRelogios === 'function') {
          atualizarRelogios(); 
      } else if (typeof renderContasCards === 'function') {
          renderContasCards(); 
      }
  }
  
  const dataAtual = typeof obterDataHojeFormatada === 'function' ? obterDataHojeFormatada() : new Date().toLocaleDateString('pt-BR');
  if (ultimaDataHojeConhecida !== dataAtual) {
    ultimaDataHojeConhecida = dataAtual;
    if (typeof render === 'function') render();
    if (typeof mostrarNotificacao === 'function') mostrarNotificacao("📅 Novo dia iniciado! Painel atualizado.", "info");
  }
}, 1000);