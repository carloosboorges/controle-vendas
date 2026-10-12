// ==========================================
// MÓDULO DE VENDAS E INTERFACE PRINCIPAL
// ==========================================

let clienteOrigemEdicao = null; // Guarda o ID e Nome do cliente se a edição foi aberta a partir do perfil dele

function adicionarVenda() {
  if (typeof limparReservasExpiradas === 'function') limparReservasExpiradas();
  
  const conta = document.getElementById("contaSelect")?.value;
  const valorInputEl = document.getElementById("valorInput");
  const valorDigitado = parseFloat(valorInputEl ? valorInputEl.value : 0);
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

  // VALIDAÇÕES ESPECÍFICAS CAMPO A CAMPO
  if (!cliente) { mostrarNotificacao("⚠️ Por favor, informe o Nome do Cliente!", "erro"); return; }
  if (!nickCliente) { mostrarNotificacao("⚠️ Por favor, informe o Nick do Cliente!", "erro"); return; }
  if (!primeiroItem) { mostrarNotificacao("⚠️ Por favor, informe o nome do Item!", "erro"); return; }
  if (!valorDigitado || isNaN(valorDigitado)) { mostrarNotificacao("⚠️ Por favor, informe o Valor da venda!", "erro"); return; }
  if (!conta) { mostrarNotificacao("⚠️ Por favor, selecione uma Conta!", "erro"); return; }
  if (itens.length < quantidade) { mostrarNotificacao("⚠️ Por favor, preencha o nome de todos os itens extras!", "erro"); return; }

  // REGRA: Se tiver 2 ou mais itens, exige obrigatoriamente o V-Bucks de cada um
  if (quantidade >= 2) {
    for (let idx = 0; idx < itens.length; idx++) {
      if (!itens[idx].vbucks || Number(itens[idx].vbucks) <= 0) {
        mostrarNotificacao(`⚠️ Por favor, informe a quantidade em V-Bucks do Item ${idx + 1} (obrigatório para 2 ou mais itens)!`, "erro");
        return;
      }
    }
  }

  const usadas = typeof usadasDaConta === 'function' ? usadasDaConta(conta) : 0;
  const itensPendentesEnvio = itens.filter(it => !it.enviadoAvulso).length;

  if (usadas + itensPendentesEnvio > 5) {
    mostrarNotificacao(`Limite excedido na conta ${conta}.`, "erro");
    return;
  }

  // =========================================================
  // ALERTA 1: PREVISÃO DE VAGAS PARA RESERVAS DE HOJE
  // =========================================================
  if (!window.ignorarAvisoReserva) {
    const hojeObj = new Date(); 
    hojeObj.setHours(0,0,0,0);
    const hojeTime = hojeObj.getTime();
    
    const agendamentosPendentes = (state.agendamentos || []).filter(a => {
        if (a.conta !== conta) return false;
        if (!a.dataEnvio || a.dataEnvio === "Imediato") return true;
        const p = a.dataEnvio.split("/");
        if (p.length === 3) {
            const dataAg = new Date(p[2], p[1] - 1, p[0]);
            return dataAg.getTime() <= hojeTime;
        }
        return true;
    });
    
    const qtdReservadaHoje = agendamentosPendentes.reduce((acc, a) => acc + (Number(a.quantidade) || 1), 0);
    
    if (qtdReservadaHoje > 0) {
        const vagasLivresAgora = Math.max(0, 5 - usadas);
        
        let timersExpiraHoje = 0;
        let proximoTimer = null;
        const fimDoDia = new Date();
        fimDoDia.setHours(23, 59, 59, 999);
        
        const timersConta = (state.reservas || []).filter(r => r.conta === conta);
        timersConta.forEach(t => {
            const timeFim = t.expiresAt || t.expiraEm || t.fim || t.tempoFim || (t.criadoEmMs ? t.criadoEmMs + 86400000 + 120000 : null);
            if (timeFim) {
                if (timeFim <= fimDoDia.getTime()) {
                    timersExpiraHoje++;
                }
                if (!proximoTimer || timeFim < proximoTimer) {
                    proximoTimer = timeFim;
                }
            }
        });

        const vagasProjetadasHoje = vagasLivresAgora - itensPendentesEnvio + timersExpiraHoje;

        if (vagasProjetadasHoje < qtdReservadaHoje) {
            const displayVagas = Math.max(0, vagasProjetadasHoje);
            const txtPreVenda = qtdReservadaHoje === 1 ? "<b>1 pré-venda</b>" : `<b>${qtdReservadaHoje} pré-vendas</b>`;
            
            let txtVagaLivre = "";
            if (displayVagas === 0) {
                txtVagaLivre = "você ficará <b>sem nenhuma vaga livre</b> até as 23:59.";
            } else if (displayVagas === 1) {
                txtVagaLivre = "sobrará apenas <b>1 vaga livre</b> até as 23:59.";
            } else {
                txtVagaLivre = `sobrarão apenas <b>${displayVagas} livres</b> até as 23:59.`;
            }
            
            let txtProximoTimer = "";
            if (proximoTimer) {
                const proximoObj = new Date(proximoTimer);
                const hh = String(proximoObj.getHours()).padStart(2, '0');
                const mm = String(proximoObj.getMinutes()).padStart(2, '0');
                const isAmanha = proximoObj.getTime() > fimDoDia.getTime();
                txtProximoTimer = `A próxima vaga só será liberada às <b>${hh}:${mm}${isAmanha ? ' (de amanhã)' : ''}</b>.`;
            } else {
                txtProximoTimer = `<b>Nenhuma vaga será liberada hoje.</b>`;
            }

            if (typeof abrirModalConfirmacao === 'function') {
                const mensagemModal = `A conta <b>${conta}</b> possui ${txtPreVenda} para enviar HOJE.<br><br>Se registrar essa venda agora, ${txtVagaLivre}<br>${txtProximoTimer}<br><br>Deseja confirmar a venda e ocupar o timer mesmo assim?`;
                
                abrirModalConfirmacao("⚠️ Atenção com las Reservas", mensagemModal, () => {
                    window.ignorarAvisoReserva = true;
                    adicionarVenda(); 
                });
                return; 
            }
        }
    }
  }
  window.ignorarAvisoReserva = false; 
  // =========================================================

  const somaVbucksItens = itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
  const vbucksNecessarios = somaVbucksItens > 0 ? somaVbucksItens : (typeof valorParaVBucks === 'function' ? valorParaVBucks(valorDigitado) : Math.round((valorDigitado / baseAtual) * 100));

  const contaObj = (state.contas || []).find(c => c.nome === conta);
  if (Number(contaObj?.vbucks) < vbucksNecessarios) {
    mostrarNotificacao("Saldo de V-Bucks insuficiente.", "erro");
    return;
  }

  contaObj.vbucks = Math.max(0, Number(contaObj.vbucks) - vbucksNecessarios);
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
  
  // GERAÇÃO INTELIGENTE DE TIMERS (Evita duplicidade pegando o timer órfão)
  if (!state.reservas) state.reservas = [];
  
  itens.forEach(it => {
    if (it.enviadoAvulso) {
      // Procura a reserva que criamos avulsa (está sem vendaId) e vincula à venda
      const reservaOrfa = state.reservas.find(r => r.conta === conta && r.vendaId === null);
      if (reservaOrfa) {
        reservaOrfa.vendaId = vendaId; 
      } else {
        // Fallback de segurança (caso não ache)
        state.reservas.push({
          id: `timer-${agora}-${Math.random().toString(36).substr(2, 5)}`,
          conta: conta,
          vendaId: vendaId,
          expiresAt: agora + 86400000 + 120000
        });
      }
    } else {
      if (typeof criarTimerReserva === 'function') {
        state.reservas.push(criarTimerReserva(conta, vendaId));
      }
    }
  });

  if (typeof sincronizarDadosCliente === 'function') sincronizarDadosCliente(clienteId, cliente, whatsapp, tiktok);
  
  ["valorInput", "clienteInput", "clienteIdInput", "nickClienteInput", "whatsappInput", "tiktokInput", "observacaoInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  if (document.getElementById("quantidadeInput")) document.getElementById("quantidadeInput").value = "1";
  if (document.getElementById("dataEnvioInput")) document.getElementById("dataEnvioInput").value = "";
  if (document.getElementById("labelAgendaData")) document.getElementById("labelAgendaData").textContent = "Hoje";
  
  // LIMPEZA TOTAL DOS ITENS
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
  const conta = document.getElementById("contaSelect")?.value;
  const cliente = document.getElementById("clienteInput")?.value.trim();
  const nickCliente = document.getElementById("nickClienteInput")?.value.trim();
  const valorDigitado = parseFloat(document.getElementById("valorInput")?.value || 0);
  const nomeItem = document.getElementById(`itemNameInput_${i}`)?.value.trim();
  
  const inputQtd = document.getElementById("quantidadeInput");
  const quantidade = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;

  const inputEnviado = document.getElementById(`itemEnviadoAvulso_${i}`);
  const btnEnvio = document.getElementById(`btnEnvioAvulso_${i}`);

  // Se já estava enviado, o clique funciona como CANCELAR com confirmação
  if (inputEnviado && inputEnviado.value === "true") {
    if (typeof abrirModalConfirmacao === 'function') {
      abrirModalConfirmacao(
        "🔄 Cancelar Envio deste Item",
        `Deseja cancelar o envio do item ${i + 1} (${nomeItem || 'Sem nome'})? O timer criado será removido e o status voltará a pendente.`,
        () => {
          // Remove exatamente um timer órfão (vendaId === null) dessa conta
          const idxOrfao = (state.reservas || []).findIndex(r => r.conta === conta && r.vendaId === null);
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

  // VALIDAÇÕES ESPECÍFICAS PARA O ENVIO AVULSO
  if (!cliente) { mostrarNotificacao("⚠️ Por favor, informe o Nome do Cliente antes de enviar!", "erro"); return; }
  if (!nickCliente) { mostrarNotificacao("⚠️ Por favor, informe o Nick do Cliente antes de enviar!", "erro"); return; }
  if (!nomeItem) { mostrarNotificacao("⚠️ Por favor, preencha o nome do item antes de disparar o envio!", "erro"); return; }
  if (!valorDigitado || isNaN(valorDigitado)) { mostrarNotificacao("⚠️ Por favor, informe o Valor da venda antes de enviar o item!", "erro"); return; }
  if (!conta) { mostrarNotificacao("⚠️ Por favor, selecione uma Conta!", "erro"); return; }

  // REGRA: Se tiver 2 ou mais itens, exige o V-Bucks também no envio avulso
  const vbucksItemInput = parseInt(document.getElementById(`itemVbucksInput_${i}`)?.value, 10) || 0;
  if (quantidade >= 2 && (!vbucksItemInput || vbucksItemInput <= 0)) {
    mostrarNotificacao(`⚠️ Por favor, informe a quantidade em V-Bucks do Item ${i + 1} (obrigatório para 2 ou mais itens)!`, "erro");
    return;
  }

  const usadas = typeof usadasDaConta === 'function' ? usadasDaConta(conta) : 0;
  if (usadas >= 5) {
    mostrarNotificacao(`⚠️ A conta ${conta} já atingiu o limite máximo de 5 envios!`, "erro");
    return;
  }

  const agora = Date.now();

  if (inputEnviado) inputEnviado.value = "true";
  
  // CRIA O TIMER IMEDIATAMENTE NA HORA DO CLIQUE COM 24H + 2 MIN DE MARGEM
  if (!state.reservas) state.reservas = [];
  state.reservas.push({
    id: `timer-${agora}-${Math.random().toString(36).substr(2, 5)}`,
    conta: conta,
    vendaId: null, // Deixamos "órfão" para vincular no clique de Registrar
    expiresAt: agora + 86400000 + 120000 // 24 horas + 2 minutos
  });

  if (btnEnvio) {
    btnEnvio.textContent = "🚀 Enviado!";
    btnEnvio.style.background = "var(--green)";
    btnEnvio.style.borderColor = "var(--green)";
    btnEnvio.style.color = "#fff";
  }

  if (typeof render === 'function') render();
  if (typeof save === 'function') save();

  mostrarNotificacao(`🚀 Item ${i + 1} enviado! O timer começou a contar agora mesmo.`, "sucesso");
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
    if (nome) lista.push({ tipo, nome, vbucks, presente, enviadoAvulso });
  }
  return lista;
}

function agendarVenda() {
  if (typeof limparReservasExpiradas === 'function') limparReservasExpiradas();
  
  const conta = document.getElementById("contaSelect")?.value;
  const valorInputEl = document.getElementById("valorInput");
  const valorDigitado = parseFloat(valorInputEl ? valorInputEl.value : 0);
  const cliente = document.getElementById("clienteInput")?.value.trim();
  const nickCliente = document.getElementById("nickClienteInput")?.value.trim();
  let whatsapp = document.getElementById("whatsappInput")?.value.trim() || "";
  let tiktok = document.getElementById("tiktokInput")?.value.trim() || "";
  const observacao = document.getElementById("observacaoInput")?.value.trim() || "";
  const dataEnvioCrua = document.getElementById("dataEnvioInput")?.value.trim();
  
  const inputQtd = document.getElementById("quantidadeInput");
  const quantidade = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  const itens = obterItensDaVenda();
  const baseAtual = state.valorBase100 || 2.5;
  const primeiroItem = document.getElementById("itemNameInput_0")?.value?.trim();
  let clienteId = document.getElementById("clienteIdInput")?.value;

  if (!cliente) { mostrarNotificacao("⚠️ Por favor, informe o Nome do Cliente para a pré-venda!", "erro"); return; }
  if (!nickCliente) { mostrarNotificacao("⚠️ Por favor, informe o Nick do Cliente para a pré-venda!", "erro"); return; }
  if (!primeiroItem) { mostrarNotificacao("⚠️ Por favor, informe o nome do Item da pré-venda!", "erro"); return; }
  if (!valorDigitado || isNaN(valorDigitado)) { mostrarNotificacao("⚠️ Por favor, informe o Valor da pré-venda!", "erro"); return; }
  if (!conta) { mostrarNotificacao("⚠️ Por favor, selecione uma Conta!", "erro"); return; }
  if (itens.length < quantidade) { mostrarNotificacao("⚠️ Por favor, preencha o nome de todos os itens extras!", "erro"); return; }

  if (quantidade >= 2) {
    for (let idx = 0; idx < itens.length; idx++) {
      if (!itens[idx].vbucks || Number(itens[idx].vbucks) <= 0) {
        mostrarNotificacao(`⚠️ Por favor, informe a quantidade em V-Bucks do Item ${idx + 1} (obrigatório para 2 ou mais itens)!`, "erro");
        return;
      }
    }
  }

  const somaVbucksItens = itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
  const vbucksNecessarios = somaVbucksItens > 0 ? somaVbucksItens : (typeof valorParaVBucks === 'function' ? valorParaVBucks(valorDigitado) : Math.round((valorDigitado / baseAtual) * 100));

  const agora = Date.now(), d = new Date(), agendamentoId = `agendamento-${agora}`;
  if (!clienteId) clienteId = "cli-" + agora + "-" + Math.random().toString(36).substr(2, 4);

  let dataEnvioFormatada = "Imediato";
  if (dataEnvioCrua) {
    const p = dataEnvioCrua.split("-");
    if (p.length === 3) dataEnvioFormatada = `${p[2]}/${p[1]}/${p[0]}`;
  }

  const novoAgendamento = {
    id: agendamentoId, clienteId, conta, valor: Number(valorDigitado), vbucks: vbucksNecessarios,
    quantidade, cliente, nickCliente, observacao, item: itens[0] || "", itens, whatsapp, tiktok,
    dataRegistro: d.toLocaleDateString("pt-BR"),
    horaRegistro: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    dataEnvio: dataEnvioFormatada, criadoEmMs: agora
  };

  if (!state.agendamentos) state.agendamentos = [];
  state.agendamentos.push(novoAgendamento);

  if (typeof sincronizarDadosCliente === 'function') sincronizarDadosCliente(clienteId, cliente, whatsapp, tiktok);

  ["valorInput", "clienteInput", "clienteIdInput", "nickClienteInput", "whatsappInput", "tiktokInput", "observacaoInput", "dataEnvioInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  if (document.getElementById("quantidadeInput")) document.getElementById("quantidadeInput").value = "1";
  if (document.getElementById("labelAgendaData")) document.getElementById("labelAgendaData").textContent = "Hoje";
  
  // LIMPEZA TOTAL DOS ITENS
  if (typeof atualizarCamposItensComDados === 'function') {
    atualizarCamposItensComDados([{ tipo: "Traje", nome: "", vbucks: "", presente: "", enviadoAvulso: false }]);
  } else if (typeof atualizarCamposItens === 'function') {
    atualizarCamposItens(false);
  }

  if (typeof render === 'function') render();
  if (typeof save === 'function') save();
  mostrarNotificacao("⏳ Pré-venda agendada com sucesso!", "sucesso");
}

function abrirModalEdicaoPorId(vendaId, origemClienteId = null, origemClienteNome = null) {
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

  if (origemClienteId) {
    clienteOrigemEdicao = { id: origemClienteId, nome: origemClienteNome || venda.cliente };
  }

  const tipoInput = document.getElementById("editTipoRegistro");
  if (tipoInput) tipoInput.value = "venda";
  
  document.getElementById("editSaleTitle").innerHTML = "✏️ Editar Registro de Venda";
  document.getElementById("editVendaId").value = vendaId;
  
  const selectConta = document.getElementById("editContaSelect");
  if (selectConta) {
    selectConta.innerHTML = (state.contas || []).map(c => `
      <option value="${esc(c.nome)}" ${c.nome === venda.conta ? "selected" : ""}>
        ${esc(c.nome)} (${formatVBucks(c.vbucks)} VB)
      </option>`).join("");
    selectConta.value = venda.conta;
  }

  document.getElementById("editClientInput").value = venda.cliente || "";
  document.getElementById("editNickInput").value = venda.nickCliente || "";
  if (document.getElementById("editWhatsappInput")) document.getElementById("editWhatsappInput").value = venda.whatsapp || "";
  if (document.getElementById("editTiktokInput")) document.getElementById("editTiktokInput").value = venda.tiktok || "";
  document.getElementById("editObservacaoInput").value = venda.observacao || "";
  
  const inputDataCriacao = document.getElementById("editDataInput");
  const inputHoraCriacao = document.getElementById("editHoraInput");
  if (inputDataCriacao) {
    inputDataCriacao.value = venda.data || "";
    inputDataCriacao.readOnly = false;
    inputDataCriacao.style.opacity = "1";
    inputDataCriacao.style.cursor = "text";
  }
  if (inputHoraCriacao) {
    inputHoraCriacao.value = venda.hora || "";
    inputHoraCriacao.readOnly = false;
    inputHoraCriacao.style.opacity = "1";
    inputHoraCriacao.style.cursor = "text";
  }

  document.getElementById("editValorInput").value = Number(venda.valor || 0).toFixed(2);
  
  const elDataEnvioContainer = document.getElementById("editDataEnvioContainer");
  if (elDataEnvioContainer) elDataEnvioContainer.style.display = "none";
  if (typeof atualizarPreviewVBucksEdicao === 'function') atualizarPreviewVBucksEdicao();

  const container = document.getElementById("editItensListContainer");
  const itens = Array.isArray(venda.itens) && venda.itens.length ? venda.itens : [venda.item || ""];

  container.innerHTML = itens.map((itemObj, idx) => {
    let tipo = "Outro", nome = "", presente = "", vbucks = "";
    if (typeof itemObj === "string") {
      const parsed = typeof parseItemString === 'function' ? parseItemString(itemObj) : {tipo: "Outro", nome: itemObj};
      tipo = parsed.tipo; nome = parsed.nome;
    } else if (itemObj) {
      tipo = itemObj.tipo || "Outro"; nome = itemObj.nome || ""; presente = itemObj.presente || ""; vbucks = itemObj.vbucks || "";
    }
    const cats = typeof CATEGORIAS_ITENS !== 'undefined' ? CATEGORIAS_ITENS : ["Traje", "Gesto", "Picareta", "Música", "Pacote", "Pacotão", "Asa-delta", "Envelopamento", "Calçado", "Acessório", "Carro", "Mascote", "Outro"];
    const optionsHtml = cats.map(c => `<option value="${c}" ${c === tipo ? "selected" : ""}>${c}</option>`).join("");
    return `
      <div class="item-picker-box" style="margin-top: 0; margin-bottom: 8px; width: 100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <label style="font-size:12px;">Item ${idx + 1}</label>
          ${itens.length > 1 ? `<button type="button" class="btn-danger close-modal-btn" style="padding:2px 6px;" onclick="this.closest('.item-picker-box').remove()">✕</button>` : ""}
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <select class="item-type-select edit-modal-item-type" style="flex: 1; min-width: 90px; padding: 10px;">${optionsHtml}</select>
          <input class="item-name-input edit-modal-item-name" type="text" maxlength="120" value="${esc(nome)}" placeholder="Nome do item" style="flex: 2; min-width: 140px; padding: 10px;">
          <input class="item-vbucks-input edit-modal-item-vbucks" type="number" step="50" min="0" value="${esc(vbucks)}" placeholder="V-Bucks" style="flex: 0.8; min-width: 80px; padding: 10px; text-align: center;">
          <input class="item-name-input edit-modal-item-presente" type="text" maxlength="80" value="${esc(presente)}" placeholder="🎁 P/ Nick" style="flex: 1.5; min-width: 110px; padding: 10px;">
        </div>
      </div>`;
  }).join("");

  document.getElementById("editSaleModal").style.display = "flex";
}

function salvarEdicaoVenda() {
  const vendaId = document.getElementById("editVendaId").value;
  const tipoRegistro = document.getElementById("editTipoRegistro")?.value || "venda";
  const isAgendamento = tipoRegistro === "agendamento";
  
  const listaOriginal = isAgendamento ? state.agendamentos : state.historicoVendas;
  const i = (listaOriginal || []).findIndex(v => v.id === vendaId);
  if (i < 0) {
    mostrarNotificacao("Erro: Registro não encontrado para salvamento.", "erro");
    return;
  }
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
    if (nome) novosItens.push({ tipo, nome, vbucks, presente });
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

  const somaVbucksNovos = novosItens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
  const baseMomento = venda.valorBaseMomento || state.valorBase100 || 2.5;
  const novoVbucks = somaVbucksNovos > 0 ? somaVbucksNovos : (typeof valorParaVBucks === 'function' ? valorParaVBucks(parseFloat(document.getElementById("editValorInput")?.value) || 0) : Math.round(((parseFloat(document.getElementById("editValorInput")?.value) || 0) / baseMomento) * 100));
  
  const novoValorEmReais = Number(((novoVbucks / 100) * baseMomento).toFixed(2));
  const vbucksAntigo = venda.vbucks !== undefined ? Number(venda.vbucks) : (typeof valorParaVBucks === 'function' ? valorParaVBucks(venda.valor, venda.valorBaseMomento) : 0);

  if (!isAgendamento && (venda.conta !== novaConta || venda.vbucks !== novoVbucks)) {
    const cAntiga = state.contas.find(c => c.nome === venda.conta);
    if (cAntiga) cAntiga.vbucks += vbucksAntigo;
    const cNova = state.contas.find(c => c.nome === novaConta);
    if (cNova) cNova.vbucks = Math.max(0, cNova.vbucks - novoVbucks);
  }

  venda.conta = novaConta;
  venda.cliente = cliente;
  venda.nickCliente = nick;
  venda.whatsapp = whatsapp;
  venda.tiktok = tiktok;
  venda.nickPresente = "";
  venda.observacao = observacao;
  venda.valor = novoValorEmReais;
  venda.vbucks = novoVbucks;
  
  if (novosItens.length > 0) {
    venda.itens = novosItens;
    venda.item = novosItens[0];
    venda.quantidade = novosItens.length;
  }

  if (isAgendamento) {
    if (venda.dataRegistro === "28/09/2026" && venda.horaRegistro === "23:18") {
      venda.dataRegistro = "27/09/2026";
    }
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
        observacao, data: novaData, hora: novaHora, valor: novoValorEmReais,
        vbucks: novoVbucks, itens: novosItens.length ? novosItens : sessaoVenda.itens,
        item: novosItens.length ? novosItens[0] : sessaoVenda.item,
        quantidade: novosItens.length ? novosItens.length : sessaoVenda.quantidade
      });
    }
    if (state.reservas) {
      state.reservas.forEach(r => { if (r.vendaId === venda.id) r.conta = novaConta; });
    }
  }

  const idDoCliente = venda.clienteId || venda.cliente;
  if (typeof sincronizarDadosCliente === 'function') sincronizarDadosCliente(idDoCliente, cliente, whatsapp, tiktok);
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
      const conta = (state.contas || []).find(c => c.nome === venda.conta);
      if (conta) conta.vbucks += (venda.vbucks || 0);
      
      // GUARDA OS TIMERS NA VENDA ANTES DE APAGAR (Para poder restaurar invisivelmente depois)
      const timersDaVenda = (state.reservas || []).filter(r => r.vendaId === venda.id);
      venda.timersSalvos = JSON.parse(JSON.stringify(timersDaVenda));
      
      // REMOVE DEFINITIVAMENTE TODOS OS TIMERS VINCULADOS A ESTE VENDAID DA TELA
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
          // Salva os timers para possível restauração futura
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
  
  // DEBITA OS V-BUCKS NOVAMENTE DA CONTA (já que eles foram devolvidos ao excluir)
  const contaObj = (state.contas || []).find(c => c.nome === venda.conta);
  if (contaObj) {
    contaObj.vbucks = Math.max(0, contaObj.vbucks - (Number(venda.vbucks) || 0));
  }

  // RESTAURA OS TIMERS ("rodando invisível" porque o timestamp final continua o mesmo da época)
  if (venda.timersSalvos && venda.timersSalvos.length > 0) {
    if (!state.reservas) state.reservas = [];
    state.reservas.push(...venda.timersSalvos);
    delete venda.timersSalvos; // Limpa o cache para não pesar
  }

  // Devolve para a sessão se a venda for de hoje (da sessão atual)
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

function valorRapido(v) {
  const input = document.getElementById("valorInput");
  if (!input) return;
  let valorAtual = input.valueAsNumber;
  if (isNaN(valorAtual)) valorAtual = 0;
  input.value = Math.round((valorAtual + Number(v)) * 100) / 100;
  if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
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
    
    // LIMPEZA TOTAL NO BOTÃO LIMPAR TUDO TAMBÉM
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
    
    if (footer && typeof currentUser !== 'undefined' && currentUser) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
    if (typeof render === 'function') render();
  } catch (err) {
    if (footer) footer.textContent = "⚠️ Erro ao sincronizar com banco";
    if (typeof DADOS_DEMO !== 'undefined') state = JSON.parse(JSON.stringify(DADOS_DEMO));
    if (typeof sanitizarDados === 'function') sanitizarDados();
    if (typeof render === 'function') render();
  }
}

let ultimaDataHojeConhecida = typeof obterDataHojeFormatada === 'function' ? obterDataHojeFormatada() : new Date().toLocaleDateString('pt-BR');
inicializar();

// =============================================================
// O "CORAÇÃO" DO SISTEMA - RODA A CADA 1 SEGUNDO
// =============================================================
setInterval(() => {
  if (typeof state !== 'undefined' && state) {
      if (typeof atualizarRelogios === 'function') {
          atualizarRelogios(); 
      } else if (typeof renderContasCards === 'function') {
          renderContasCards(); 
      }
  }
  
  const dataAtual = typeof obterDataHojeFormatada === 'function' ? obterDataHojeFormatada() : new Date().toLocaleDateString('pt-BR');
  if (typeof ultimaDataHojeConhecida !== 'undefined' && ultimaDataHojeConhecida !== dataAtual) {
    ultimaDataHojeConhecida = dataAtual;
    if (typeof render === 'function') render();
    if (typeof mostrarNotificacao === 'function') mostrarNotificacao("📅 Novo dia iniciado! Painel atualizado.", "info");
  }
}, 1000);