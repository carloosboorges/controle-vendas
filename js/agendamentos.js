// ==========================================
// MÓDULO DE AGENDAMENTOS E PRÉ-VENDAS
// ==========================================

let agendaViewMes = new Date().getMonth(); 
let agendaViewAno = new Date().getFullYear(); 
let agendaPopoverAberto = false;
let editAgendaViewMes = new Date().getMonth(); 
let editAgendaViewAno = new Date().getFullYear(); 
let editAgendaPopoverAberto = false;

function toggleAgendaCalendario(e) { 
  if (e) e.stopPropagation(); 
  agendaPopoverAberto = !agendaPopoverAberto; 
  renderAgendaCalendario(); 
}

function navegarAgendaMes(direcao, e) { 
  if (e) e.stopPropagation(); 
  agendaViewMes += direcao; 
  if (agendaViewMes < 0) { agendaViewMes = 11; agendaViewAno--; } 
  else if (agendaViewMes > 11) { agendaViewMes = 0; agendaViewAno++; } 
  renderAgendaCalendario(); 
}

function selecionarAgendaDia(diaStr, e) { 
  if (e) e.stopPropagation(); 
  const [d, m, a] = diaStr.split("/"); 
  const dataEscolhida = new Date(a, m - 1, d); 
  const hoje = new Date(); hoje.setHours(0,0,0,0); 
  
  if (dataEscolhida < hoje) { 
    mostrarNotificacao("Erro: Não é possível agendar no passado!", "erro"); 
    return; 
  } 
  
  const inputHidden = document.getElementById("dataEnvioInput"); 
  const label = document.getElementById("labelAgendaData"); 
  
  if (inputHidden && label) { 
    inputHidden.value = `${a}-${m}-${d}`; 
    if (dataEscolhida.getTime() === hoje.getTime()) label.textContent = "Hoje"; 
    else label.textContent = diaStr; 
  } 
  
  agendaPopoverAberto = false; 
  renderAgendaCalendario(); 
}

function renderAgendaCalendario() {
  const placeholder = document.getElementById("agendaPopoverPlaceholder"); 
  if (!placeholder) return; 
  if (!agendaPopoverAberto) { placeholder.innerHTML = ""; return; }
  
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]; 
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"]; 
  const primeiroDiaSemana = new Date(agendaViewAno, agendaViewMes, 1).getDay(); 
  const totalDiasMes = new Date(agendaViewAno, agendaViewMes + 1, 0).getDate(); 
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const inputHidden = document.getElementById("dataEnvioInput"); 
  
  let dataAtiva = ""; 
  if (inputHidden && inputHidden.value) { 
    const [ya, ma, da] = inputHidden.value.split("-"); 
    dataAtiva = `${da}/${ma}/${ya}`; 
  } else { 
    dataAtiva = obterDataHojeFormatada(); 
  }
  
  let diasHtml = ""; 
  for (let i = 0; i < primeiroDiaSemana; i++) { 
    diasHtml += `<div class="cal-day-empty"></div>`; 
  }
  
  for (let dia = 1; dia <= totalDiasMes; dia++) { 
    const dataStr = `${String(dia).padStart(2, "0")}/${String(agendaViewMes + 1).padStart(2, "0")}/${agendaViewAno}`; 
    const dataObj = new Date(agendaViewAno, agendaViewMes, dia); 
    const isPassado = dataObj < hoje; 
    const isToday = dataObj.getTime() === hoje.getTime(); 
    const isSelected = dataStr === dataAtiva; 
    
    diasHtml += `<button type="button" class="cal-day-btn ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}" ${isPassado ? "disabled style='opacity:0.25; cursor:not-allowed; border:none;'" : ""} onclick="selecionarAgendaDia('${dataStr}', event)">${dia}</button>`; 
  }
  
  placeholder.innerHTML = `<div class="custom-calendar-popover" style="top: calc(100% + 6px); left: 0; transform: none; width: 250px;" onclick="event.stopPropagation()"><div class="calendar-header-nav"><button type="button" class="calendar-nav-btn" onclick="navegarAgendaMes(-1, event)">‹</button><strong>${nomesMeses[agendaViewMes]} ${agendaViewAno}</strong><button type="button" class="calendar-nav-btn" onclick="navegarAgendaMes(1, event)">›</button></div><div class="calendar-weekdays-grid">${diasSemana.map(d => `<span>${d}</span>`).join("")}</div><div class="calendar-days-grid">${diasHtml}</div></div>`;
}

function toggleEditAgendaCalendario(e) { 
  if (e) e.stopPropagation(); 
  editAgendaPopoverAberto = !editAgendaPopoverAberto; 
  renderEditAgendaCalendario(); 
}

function navegarEditAgendaMes(direcao, e) { 
  if (e) e.stopPropagation(); 
  editAgendaViewMes += direcao; 
  if (editAgendaViewMes < 0) { editAgendaViewMes = 11; editAgendaViewAno--; } 
  else if (editAgendaViewMes > 11) { editAgendaViewMes = 0; editAgendaViewAno++; } 
  renderEditAgendaCalendario(); 
}

function selecionarEditAgendaDia(diaStr, e) { 
  if (e) e.stopPropagation(); 
  const [d, m, a] = diaStr.split("/"); 
  const dataEscolhida = new Date(a, m - 1, d); 
  const hoje = new Date(); hoje.setHours(0,0,0,0); 
  
  if (dataEscolhida < hoje) { 
    mostrarNotificacao("Erro: Data no passado!", "erro"); 
    return; 
  } 
  
  const inputHidden = document.getElementById("editDataEnvioInput"); 
  const label = document.getElementById("labelEditAgendaData"); 
  
  if (inputHidden && label) { 
    inputHidden.value = `${a}-${m}-${d}`; 
    if (dataEscolhida.getTime() === hoje.getTime()) label.textContent = `${diaStr} (Hoje)`; 
    else label.textContent = diaStr; 
  } 
  
  editAgendaPopoverAberto = false; 
  renderEditAgendaCalendario(); 
}

function renderEditAgendaCalendario() {
  const placeholder = document.getElementById("editAgendaPopoverPlaceholder"); 
  if (!placeholder) return; 
  if (!editAgendaPopoverAberto) { placeholder.innerHTML = ""; return; }
  
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]; 
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"]; 
  const primeiroDiaSemana = new Date(editAgendaViewAno, editAgendaViewMes, 1).getDay(); 
  const totalDiasMes = new Date(editAgendaViewAno, editAgendaViewMes + 1, 0).getDate(); 
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const inputHidden = document.getElementById("editDataEnvioInput"); 
  
  let dataAtiva = ""; 
  if (inputHidden && inputHidden.value) { 
    const [ya, ma, da] = inputHidden.value.split("-"); 
    dataAtiva = `${da}/${ma}/${ya}`; 
  } else { 
    dataAtiva = obterDataHojeFormatada(); 
  }
  
  let diasHtml = ""; 
  for (let i = 0; i < primeiroDiaSemana; i++) { 
    diasHtml += `<div class="cal-day-empty"></div>`; 
  }
  
  for (let dia = 1; dia <= totalDiasMes; dia++) { 
    const dataStr = `${String(dia).padStart(2, "0")}/${String(editAgendaViewMes + 1).padStart(2, "0")}/${editAgendaViewAno}`; 
    const dataObj = new Date(editAgendaViewAno, editAgendaViewMes, dia); 
    const isPassado = dataObj < hoje; 
    const isToday = dataObj.getTime() === hoje.getTime(); 
    const isSelected = dataStr === dataAtiva; 
    
    diasHtml += `<button type="button" class="cal-day-btn ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}" ${isPassado ? "disabled style='opacity:0.25; cursor:not-allowed; border:none;'" : ""} onclick="selecionarEditAgendaDia('${dataStr}', event)">${dia}</button>`; 
  }
  
  placeholder.innerHTML = `<div class="custom-calendar-popover" style="bottom: calc(100% + 6px); top: auto; left: 0; transform: none; width: 250px; z-index: 9999;" onclick="event.stopPropagation()"><div class="calendar-header-nav"><button type="button" class="calendar-nav-btn" onclick="navegarEditAgendaMes(-1, event)">‹</button><strong>${nomesMeses[editAgendaViewMes]} ${editAgendaViewAno}</strong><button type="button" class="calendar-nav-btn" onclick="navegarEditAgendaMes(1, event)">›</button></div><div class="calendar-weekdays-grid">${diasSemana.map(d => `<span>${d}</span>`).join("")}</div><div class="calendar-days-grid">${diasHtml}</div></div>`;
}

function agendarVenda() {
  if (typeof limparReservasExpiradas === 'function') limparReservasExpiradas();
  
  const conta = document.getElementById("contaSelect")?.value;
  const valorInputEl = document.getElementById("valorInput");
  const valorDigitado = typeof parseValorMonetario === 'function' ? parseValorMonetario(valorInputEl ? valorInputEl.value : 0) : parseFloat(valorInputEl ? valorInputEl.value : 0);
  const cliente = document.getElementById("clienteInput")?.value.trim();
  const nickCliente = document.getElementById("nickClienteInput")?.value.trim();
  const whatsapp = document.getElementById("whatsappInput")?.value.trim() || "";
  const tiktok = document.getElementById("tiktokInput")?.value.trim() || "";
  const observacao = document.getElementById("observacaoInput")?.value.trim() || "";
  const dataEnvioCrua = document.getElementById("dataEnvioInput")?.value.trim();
  
  const inputQtd = document.getElementById("quantidadeInput");
  const quantidade = inputQtd ? (parseInt(inputQtd.value, 10) || 1) : 1;
  const itens = typeof obterItensDaVenda === 'function' ? obterItensDaVenda() : [];
  const baseAtual = state.valorBase100 || 2.5;
  const primeiroItem = document.getElementById("itemNameInput_0")?.value?.trim();
  let clienteId = document.getElementById("clienteIdInput")?.value;

  if (window.ignorarChecagemDuplicacao) {
    window.ignorarChecagemDuplicacao = false;
  } else {
    if (typeof checarDuplicacaoAntesDeVender === 'function') {
      if (checarDuplicacaoAntesDeVender(cliente, clienteId, agendarVenda)) return;
    }
  }

  let dataEnvioFormatada = "Imediato";
  if (dataEnvioCrua) {
    const p = dataEnvioCrua.split("-");
    if (p.length === 3) {
      const dataEscolhida = new Date(p[0], p[1] - 1, p[2]);
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      if (dataEscolhida < hoje) {
        mostrarNotificacao("Erro: Não é possível agendar para o passado!", "erro");
        return;
      }
      dataEnvioFormatada = `${p[2]}/${p[1]}/${p[0]}`;
    }
  }

  if (!conta) { mostrarNotificacao("⚠️ Por favor, selecione uma Conta!", "erro"); return; }
  if (!valorDigitado || isNaN(valorDigitado) || valorDigitado <= 0) { mostrarNotificacao("⚠️ Por favor, informe o Valor da venda!", "erro"); return; }
  if (!cliente) { mostrarNotificacao("⚠️ Por favor, informe o Nome do Cliente!", "erro"); return; }
  if (!nickCliente) { mostrarNotificacao("⚠️ Por favor, informe o Nick do Cliente!", "erro"); return; }
  if (!primeiroItem) { mostrarNotificacao("⚠️ Por favor, informe o nome do Item!", "erro"); return; }
  
  if (itens.length < quantidade) {
      mostrarNotificacao("⚠️ Por favor, preencha o nome de todos os itens extras!", "erro"); return;
  }

  if (!window.ignorarAvisoLimiteAgendamento) {
    const dataVerificar = dataEnvioFormatada === "Imediato" ? obterDataHojeFormatada() : dataEnvioFormatada;
    const isAgendamentoParaHoje = dataVerificar === obterDataHojeFormatada();

    const contasEnvolvidas = {};
    itens.forEach(it => {
        const c = it.contaEnvio || conta; 
        contasEnvolvidas[c] = (contasEnvolvidas[c] || 0) + 1;
    });

    let contaEstourada = null;
    let vagasLivresDessaConta = 0;
    let qtdDessaConta = 0;

    for (const [nomeConta, qtdNecessaria] of Object.entries(contasEnvolvidas)) {
        let vagasOcupadas = 0;

        (state.agendamentos || []).forEach(a => {
            const dEnvio = (a.dataEnvio && a.dataEnvio !== "Imediato") ? a.dataEnvio : obterDataHojeFormatada();
            if (dEnvio === dataVerificar) {
                if (a.itens && a.itens.length > 0) {
                    a.itens.forEach(it => {
                        const cItem = it.contaEnvio || a.conta;
                        if (cItem === nomeConta) vagasOcupadas++;
                    });
                } else {
                    if (a.conta === nomeConta) vagasOcupadas += (Number(a.quantidade) || 1);
                }
            }
        });

        if (isAgendamentoParaHoje) {
            const fimDoDia = new Date();
            fimDoDia.setHours(23, 59, 59, 999);
            const timersConta = (state.reservas || []).filter(r => r.conta === nomeConta);
            timersConta.forEach(t => {
                const timeFim = t.expiresAt || t.expiraEm || t.fim || t.tempoFim || (t.criadoEmMs ? t.criadoEmMs + 86400000 : null);
                if (timeFim && timeFim > fimDoDia.getTime()) {
                    vagasOcupadas++;
                }
            });
        }

        const vagasDisponiveis = Math.max(0, 5 - vagasOcupadas);

        if (qtdNecessaria > vagasDisponiveis) {
            contaEstourada = nomeConta;
            vagasLivresDessaConta = vagasDisponiveis;
            qtdDessaConta = qtdNecessaria;
            break;
        }
    }

    if (contaEstourada) {
        if (typeof abrirModalConfirmacao === 'function') {
            abrirModalConfirmacao(
                "⚠️ Cuidado com a Lotação",
                `Vagas disponíveis na conta ${contaEstourada} para ${dataVerificar}: apenas ${vagasLivresDessaConta}.\nItens alocados para esta conta: ${qtdDessaConta}.\n\nA conta não terá espaço suficiente para enviar tudo no mesmo dia. Tem certeza que deseja agendar?`,
                () => {
                    window.ignorarAvisoLimiteAgendamento = true;
                    agendarVenda();
                }
            );
            return; 
        }
    }
  }
  window.ignorarAvisoLimiteAgendamento = false;

  const somaVbucksItens = itens.reduce((acc, it) => acc + (Number(it.vbucks) || 0), 0);
  const vbucksNecessarios = somaVbucksItens > 0 ? somaVbucksItens : Math.round((valorDigitado / baseAtual) * 100);
  
  const descontosPorConta = {};
  itens.forEach(it => {
      const c = it.contaEnvio || conta;
      descontosPorConta[c] = (descontosPorConta[c] || 0) + (Number(it.vbucks) || 0);
  });
  
  if (Object.keys(descontosPorConta).length === 0 || somaVbucksItens === 0) {
      descontosPorConta[conta] = vbucksNecessarios;
  }
  
  for (const [nomeConta, vbReq] of Object.entries(descontosPorConta)) {
      const cObjVer = (state.contas || []).find(c => c.nome === nomeConta);
      if (Number(cObjVer?.vbucks) < vbReq) {
          mostrarNotificacao(`Aviso: Saldo de V-Bucks insuficiente na conta ${nomeConta}, mas agendamento salvo.`, "info");
      }
  }

  if (!clienteId) {
    clienteId = "cli-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
  }

  const d = new Date();
  const novoAgendamento = { 
    id: `agenda-${Date.now()}`, 
    clienteId: clienteId, 
    conta, valor: Number(valorDigitado), 
    vbucks: vbucksNecessarios, 
    valorBaseMomento: baseAtual, 
    quantidade, cliente, nickCliente, 
    observacao, item: itens[0] || "", 
    itens, whatsapp, tiktok, 
    dataEnvio: dataEnvioFormatada, 
    dataRegistro: d.toLocaleDateString("pt-BR"), 
    horaRegistro: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), 
    criadoEmMs: Date.now() 
  };

  if (!state.agendamentos) state.agendamentos = []; 
  state.agendamentos.unshift(novoAgendamento);

  if (typeof sincronizarDadosCliente === 'function') sincronizarDadosCliente(clienteId, whatsapp, tiktok);
  
  ["valorInput", "clienteInput", "clienteIdInput", "nickClienteInput", "whatsappInput", "tiktokInput", "observacaoInput", "dataEnvioInput"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  if (document.getElementById("quantidadeInput")) document.getElementById("quantidadeInput").value = "1";
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
  mostrarNotificacao("⏳ Pré-venda agendada com sucesso!", "sucesso");
}

function dispararEnvioItemAgendado(agendamentoId, itemIdx) {
  const agendamento = (state.agendamentos || []).find(a => a.id === agendamentoId);
  if (!agendamento) return;
  
  const item = agendamento.itens[itemIdx];
  if (item.enviadoAvulso) return; 

  const contaSugerida = item.contaEnvio || agendamento.conta;

  let selectHtml = `<div style="margin-top: 15px; text-align: left;">
      <label style="font-size: 12px; color: var(--accent-light); font-weight: bold;">Escolha a conta de envio:</label>
      <select id="selectContaEnvioRapido" style="margin-top: 4px; width: 100%; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid var(--accent); outline: none; font-size: 13px; cursor: pointer;">`;
  
  (state.contas || []).filter(c => c.ativa).forEach(c => {
     const isSelected = c.nome === contaSugerida ? "selected" : "";
     selectHtml += `<option value="${esc(c.nome)}" ${isSelected}>${esc(c.nome)} (Saldo: ${formatVBucks(c.vbucks)} VB)</option>`;
  });
  selectHtml += `</select></div>`;

  const descricaoHtml = `Você está prestes a iniciar o timer deste item antecipadamente.<br><br>Item: <b style="color:var(--accent-light);">${esc(item.nome)}</b>${selectHtml}`;

  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao(
      "🚀 Enviar Item Agora",
      descricaoHtml,
      () => {
        const contaEscolhida = document.getElementById("selectContaEnvioRapido")?.value || contaSugerida;
        
        const usadas = typeof usadasDaConta === 'function' ? usadasDaConta(contaEscolhida) : 0;
        if (usadas >= 5) {
          mostrarNotificacao(`A conta ${contaEscolhida} já atingiu o limite de 5 envios!`, "erro");
          return;
        }

        const cObj = (state.contas || []).find(c => c.nome === contaEscolhida);
        const vbNecessario = Number(item.vbucks) || 0;
        
        if (!cObj || Number(cObj.vbucks) < vbNecessario) {
          mostrarNotificacao(`Saldo de V-Bucks insuficiente na conta ${contaEscolhida}.`, "erro");
          return;
        }

        cObj.vbucks = Math.max(0, Number(cObj.vbucks) - vbNecessario);
        item.enviadoAvulso = true; 
        item.contaEnvio = contaEscolhida; 

        if (!state.reservas) state.reservas = [];
        const agora = Date.now();
        state.reservas.push({
          id: `timer-${agora}-${Math.random().toString(36).substr(2, 5)}`,
          conta: contaEscolhida,
          vendaId: agendamento.id, 
          expiresAt: agora + 86400000 + 120000
        });

        if (typeof save === 'function') save();
        if (typeof render === 'function') render();
        renderizarAgendamentos();
        mostrarNotificacao(`🚀 Timer iniciado na conta ${contaEscolhida}!`, "sucesso");
      }
    );
  }
}

function renderizarAgendamentos() {
  const container = document.getElementById("listaAgendamentosContainer"); 
  if (!container) return;
  const agendamentos = state.agendamentos || [];
  const valorTotalPreVendas = agendamentos.reduce((acc, a) => acc + Number(a.valor || 0), 0);
  
  const headerTotalHtml = `<div style="background: rgba(142,68,255,0.08); border: 1px solid rgba(168,85,247,0.25); border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 15px; font-weight: 700; color: #fff;">💰 Total Acumulado em Pré-vendas (Não enviadas):</span><span style="font-size: 24px; font-weight: 900; color: var(--green);">${maskMoney(money(valorTotalPreVendas))}</span></div>`;
  
  if (agendamentos.length === 0) { 
    container.innerHTML = headerTotalHtml + `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">Nenhuma pré-venda agendada. Tudo limpo!</div>`; 
    return; 
  }
  
  const hojeTime = new Date().setHours(0,0,0,0);
  
  const agendamentosOrdenados = [...agendamentos].sort((a, b) => {
    function getTempo(dStr) {
      if (!dStr || dStr === "Imediato") return hojeTime;
      const p = dStr.split("/");
      if (p.length === 3) return new Date(p[2], p[1] - 1, p[0]).getTime();
      return hojeTime;
    }
    const timeA = getTempo(a.dataEnvio);
    const timeB = getTempo(b.dataEnvio);
    if (timeA === timeB) return (a.criadoEmMs || 0) - (b.criadoEmMs || 0);
    return timeA - timeB;
  });
  
  container.innerHTML = headerTotalHtml + agendamentosOrdenados.map(a => {
    if (a.dataRegistro === "28/09/2026" && a.horaRegistro === "23:18") {
      a.dataRegistro = "27/09/2026";
    }
    const vb = a.vbucks !== undefined ? Number(a.vbucks) : (typeof valorParaVBucks === 'function' ? valorParaVBucks(a.valor, a.valorBaseMomento) : 0);
    
    // 🚀 LÓGICA ATUALIZADA DA COR DAS ETIQUETAS E DATA DE ATRASO
    const dataEnvioTime = (!a.dataEnvio || a.dataEnvio === "Imediato") ? (() => {
        if (!a.dataRegistro) return hojeTime;
        const p = a.dataRegistro.split("/");
        return p.length === 3 ? new Date(p[2], p[1] - 1, p[0]).getTime() : hojeTime;
    })() : (() => {
        const p = a.dataEnvio.split("/");
        return p.length === 3 ? new Date(p[2], p[1] - 1, p[0]).getTime() : hojeTime;
    })();

    let badgeEnvioEstilo = "";
    let textoAtraso = "";

    if (dataEnvioTime < hojeTime) {
        // Passou do dia (Atrasado) - Vermelho
        badgeEnvioEstilo = "background: rgba(244, 67, 54, 0.15); border: 1px solid rgba(244, 67, 54, 0.5); color: #ff5252;";
        textoAtraso = " ⚠️ ATRASADO";
    } else if (dataEnvioTime === hojeTime) {
        // Hoje (Imediato) - Laranja
        badgeEnvioEstilo = "background: rgba(255, 152, 0, 0.2); border: 1px solid rgba(255, 152, 0, 0.6); color: #ffb74d;";
    } else {
        // Futuro - Roxo
        badgeEnvioEstilo = "background: rgba(142,68,255,0.15); border: 1px solid var(--accent); color: var(--accent-light);";
    }
      
    const TIKTOK_ICON = typeof TIKTOK_SVG !== "undefined" ? TIKTOK_SVG : '<svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: middle; margin-top: -2px;"><path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/></svg>';

    const obsHtml = a.observacao ? `<div style="margin-top: 6px; font-size: 12px; color: var(--accent-light); background: rgba(142,68,255,0.08); padding: 6px 10px; border-radius: 6px; border-left: 3px solid var(--accent); white-space: pre-wrap; word-break: break-word;">💬 <b>Observação:</b> ${esc(a.observacao)}</div>` : "";

    const itensArray = Array.isArray(a.itens) && a.itens.length > 0 ? a.itens : [{ tipo: "Outro", nome: a.item, vbucks: a.vbucks, enviadoAvulso: false }];

    const listaItensHtml = itensArray.map((it, idx) => {
      let itemText = typeof it === 'string' ? it : (typeof formatItemString === 'function' ? formatItemString(it.tipo, it.nome) : it.nome);
      let itemVb = typeof it === 'string' ? 0 : (Number(it.vbucks) || 0);
      let cNome = it.contaEnvio || a.conta;

      let precoText = itemVb > 0 ? `<span style="color:#ffb74d; font-size:11px; margin-left:6px; background: rgba(255, 183, 77, 0.15); padding: 2px 6px; border-radius: 6px; font-weight:700;">🪙 ${typeof formatVBucks === 'function' ? formatVBucks(itemVb) : itemVb} VB</span>` : '';
      
      let linhaSubordinada = "";
      if (cNome !== a.conta && cNome !== "") {
          linhaSubordinada = `<div style="font-size: 11.5px; color: var(--muted); margin-top: 3px; margin-left: 20px; font-style: italic;">↳ Sairá de: <span style="font-weight: 700; color: var(--accent-light);">${esc(cNome)}</span></div>`;
      }

      let presenteText = it.presente ? `<span style="color:var(--accent-light); font-size:12px; margin-left:8px; background: rgba(142,68,255,0.15); padding: 2px 6px; border-radius: 6px;">➡️ 🎁 Para: <b>${esc(it.presente)}</b></span>` : '';

      let acaoHtml = "";
      if (it.enviadoAvulso) {
        acaoHtml = `<span style="color: var(--green); font-size: 11px; font-weight: bold; margin-left: auto;">✅ Enviado por ${esc(cNome)}</span>`;
      } else {
        acaoHtml = `<button type="button" class="btn-gray" style="padding: 2px 8px; font-size: 10px; height: 24px; margin-left: auto; border-radius: 6px; background: rgba(142,68,255,0.2); color: var(--accent-light); border: 1px solid rgba(142,68,255,0.4);" onclick="dispararEnvioItemAgendado('${a.id}', ${idx})">🚀 Enviar Agora</button>`;
      }

      return `<div style="display: flex; flex-direction: column; margin-bottom: 6px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                <div style="display: flex; align-items: center; flex-wrap: wrap;">
                  <span style="white-space: nowrap;">🎁 ${idx + 1}. </span>
                  <span style="margin-left: 4px; font-weight: 600;">${esc(itemText)}</span>
                  ${precoText}${presenteText}
                  ${acaoHtml}
                </div>
                ${linhaSubordinada}
              </div>`;
    }).join("");

    let breakdownHtmlAgenda = "";
    if (itensArray.length > 1) {
        let linhasSubtotais = "";
        itensArray.forEach(it => {
            let itName = typeof it === 'string' ? it : (it.nome || "");
            let itVb = typeof it === 'string' ? 0 : (Number(it.vbucks) || 0);
            
            if (itVb > 0 && vb > 0) {
                let calcRs = (itVb / vb) * Number(a.valor || 0);
                let nLimpo = itName.length > 15 ? itName.substring(0, 15) + "..." : itName;
                linhasSubtotais += `<div style="font-size: 11px; color: var(--muted); margin-bottom: 2px;">${esc(nLimpo)}: <span style="color:#fff; font-weight:600;">${money(calcRs)}</span></div>`;
            }
        });
        
        if (linhasSubtotais) {
            breakdownHtmlAgenda = `
                <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed rgba(255,255,255,0.15); width: 100%;">
                    <div style="font-size: 10px; color: var(--accent-light); font-weight: 800; margin-bottom: 4px; text-transform: uppercase;">Subtotais</div>
                    ${linhasSubtotais}
                </div>
            `;
        }
    }

    let descontoHtmlAgenda = "";
    if (vb > 0) {
        const baseMomentoAgenda = a.valorBaseMomento || state.valorBase100 || 2.5;
        const valorSemDesconto = (vb / 100) * baseMomentoAgenda;
        const diferencaDesconto = valorSemDesconto - Number(a.valor || 0);
        if (diferencaDesconto > 0.5) {
            descontoHtmlAgenda = `<div style="color: #ffb74d; font-size: 11px; font-weight: 700; white-space: nowrap; margin-top: 2px;">🏷️ Desconto aplicado: -${money(diferencaDesconto)}</div>`;
        }
    }

    return `
      <div class="history-card" style="border-left: 4px solid var(--accent-light);">
        <div class="history-main">
          <div class="history-info">
            <div class="history-account">${esc(a.conta)}</div>
            <div class="history-client" style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;">
              <div style="color: #fff; font-weight: 700;">👤 <span class="copyable-text" onclick="copiarTexto('${esc(a.cliente)}', 'Cliente', event)">${esc(a.cliente)}</span></div>
              <div style="color: var(--accent-light); font-weight: 600;">🎮 <span class="copyable-text" onclick="copiarTexto('${esc(a.nickCliente)}', 'Nick', event)">${esc(a.nickCliente)}</span></div>
              <div style="display: flex; gap: 12px; color: var(--muted); font-size: 12px;">
                ${a.whatsapp ? `<span>📱 <span class="copyable-text" onclick="copiarTexto('${esc(a.whatsapp)}', 'WhatsApp', event)">${esc(a.whatsapp)}</span></span>` : `<span>📱 —</span>`}
                ${a.tiktok ? `<span>${TIKTOK_ICON} <span class="copyable-text" onclick="copiarTexto('${esc(a.tiktok)}', 'TikTok', event)">${esc(a.tiktok)}</span></span>` : `<span>${TIKTOK_ICON} —</span>`}
              </div>
            </div>
            
            <div class="history-item" style="margin-top: 8px;">
              ${listaItensHtml}
            </div>

            <div class="history-date">📅 Criado em: ${esc(a.dataRegistro)} às ${esc(a.horaRegistro)}</div>
            ${obsHtml}
            <div style="font-size: 12px; font-weight: bold; margin-top: 8px; padding: 4px 8px; border-radius: 6px; display: inline-block; ${badgeEnvioEstilo}">🚀 Enviar no dia: ${esc(a.dataEnvio || "Imediato")}${textoAtraso}</div>
          </div>
          
          <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start; min-width: 140px;">
            ${breakdownHtmlAgenda}
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
               ${breakdownHtmlAgenda ? `<div style="font-size: 10px; color: var(--muted); text-transform: uppercase; font-weight: 800; margin-bottom: 2px;">Total da Pré-venda</div>` : ''}
               <div class="history-value" style="margin: 0; font-size: 22px;">${money(a.valor)}</div>
               ${descontoHtmlAgenda}
            </div>
          </div>
        </div>
        <div class="history-details">
          <span>🪙 ${formatVBucks(vb)} V-Bucks exigidos</span>
          <div class="history-actions">
            <button type="button" class="btn-green" style="padding:6px 12px; font-weight: bold;" onclick="efetivarAgendamento('${esc(a.id)}')">✅ Finalizar Venda</button>
            <button type="button" class="btn-gray" onclick="abrirModalEdicaoAgendamento('${esc(a.id)}')">✏️ Editar</button>
            <button type="button" class="btn-danger" onclick="excluirAgendamento('${esc(a.id)}')">🗑️ Cancelar</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

function abrirModalEdicaoAgendamento(id) {
  const idx = (state.agendamentos || []).findIndex(a => a.id === id); 
  if (idx < 0) return; 
  const agendamento = state.agendamentos[idx];

  if (agendamento.dataRegistro === "28/09/2026" && agendamento.horaRegistro === "23:18") {
    agendamento.dataRegistro = "27/09/2026";
  }
  
  document.getElementById("editTipoRegistro").value = "agendamento"; 
  document.getElementById("editVendaId").value = id; 
  document.getElementById("editSaleTitle").innerHTML = "✏️ Editar Pré-venda Agendada";
  
  const selectConta = document.getElementById("editContaSelect"); 
  if (selectConta) { 
    selectConta.innerHTML = (state.contas || []).map(c => `<option value="${esc(c.nome)}" ${c.nome === agendamento.conta ? "selected" : ""}>${esc(c.nome)} (${formatVBucks(c.vbucks)} VB)</option>`).join(""); 
    selectConta.value = agendamento.conta; 
  }
  
  document.getElementById("editClientInput").value = agendamento.cliente || ""; 
  document.getElementById("editNickInput").value = agendamento.nickCliente || ""; 
  document.getElementById("editWhatsappInput").value = agendamento.whatsapp || ""; 
  document.getElementById("editTiktokInput").value = agendamento.tiktok || ""; 
  document.getElementById("editObservacaoInput").value = agendamento.observacao || ""; 
  
  const valorEditNum = Number(agendamento.valor || 0);
  const editValorInputEl = document.getElementById("editValorInput");
  if (editValorInputEl) {
    editValorInputEl.value = valorEditNum.toFixed(2);
  }
  
  const inputDataCriacao = document.getElementById("editDataInput");
  const inputHoraCriacao = document.getElementById("editHoraInput");
  if (inputDataCriacao) {
    inputDataCriacao.value = agendamento.dataRegistro || "";
    inputDataCriacao.readOnly = true;
    inputDataCriacao.style.opacity = "0.6";
    inputDataCriacao.style.cursor = "not-allowed";
  }
  if (inputHoraCriacao) {
    inputHoraCriacao.value = agendamento.horaRegistro || "";
    inputHoraCriacao.readOnly = true;
    inputHoraCriacao.style.opacity = "0.6";
    inputHoraCriacao.style.cursor = "not-allowed";
  }
  
  let elDataEnvioContainer = document.getElementById("editDataEnvioContainer"); 
  const obsInput = document.getElementById("editObservacaoInput");

  if (!elDataEnvioContainer && obsInput) {
    elDataEnvioContainer = document.createElement("div");
    elDataEnvioContainer.id = "editDataEnvioContainer";
    elDataEnvioContainer.style.cssText = "margin-top: 14px; position: relative; width: 100%;";
    elDataEnvioContainer.innerHTML = `
      <label style="font-size: 12px; font-weight: 700; color: var(--muted); display: block; margin-bottom: 6px;">🚀 Data de Envio Programada (Alterar dia do envio)</label>
      <input type="hidden" id="editDataEnvioInput" value="">
      <button type="button" onclick="toggleEditAgendaCalendario(event)" style="width: 100%; padding: 11px 14px; background: rgba(142, 68, 255, 0.12); border: 1px solid var(--accent); color: #fff; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: 700; font-size: 13px;">
        <span>📅 Enviar em: <strong id="labelEditAgendaData" style="color: var(--accent-light);">Hoje</strong></span>
        <span style="color: var(--accent-light);">✏️ Alterar Data ▾</span>
      </button>
      <div id="editAgendaPopoverPlaceholder"></div>
    `;
    obsInput.insertAdjacentElement("afterend", elDataEnvioContainer);
  }

  if (elDataEnvioContainer) { 
    elDataEnvioContainer.style.display = "block"; 
    const inputDataEnvio = document.getElementById("editDataEnvioInput");
    const labelDataEnvio = document.getElementById("labelEditAgendaData"); 
    editAgendaPopoverAberto = false;
    renderEditAgendaCalendario();
    
    if (inputDataEnvio && agendamento.dataEnvio) { 
      const p = agendamento.dataEnvio.split("/"); 
      if (p.length === 3) { 
        inputDataEnvio.value = `${p[2]}-${p[1]}-${p[0]}`; 
        if (labelDataEnvio) labelDataEnvio.textContent = agendamento.dataEnvio; 
        editAgendaViewMes = Number(p[1]) - 1; 
        editAgendaViewAno = Number(p[2]); 
      } 
    } else { 
      if (inputDataEnvio) inputDataEnvio.value = ""; 
      if (labelDataEnvio) labelDataEnvio.textContent = "Hoje"; 
      editAgendaViewMes = new Date().getMonth(); 
      editAgendaViewAno = new Date().getFullYear(); 
    } 
  }
  
  if (typeof atualizarPreviewVBucksEdicao === 'function') atualizarPreviewVBucksEdicao();
  
  const container = document.getElementById("editItensListContainer");
  const itens = Array.isArray(agendamento.itens) && agendamento.itens.length ? agendamento.itens : [agendamento.item || ""];
  
  container.innerHTML = itens.map((itemObj, idx) => { 
    let tipo = "Outro", nome = "", presente = "", vbucks = "", contaEnvio = ""; 
    let isEnviado = false;
    
    if (typeof itemObj === "string") { 
      const parsed = typeof parseItemString === 'function' ? parseItemString(itemObj) : {tipo: "Outro", nome: itemObj};
      tipo = parsed.tipo; nome = parsed.nome; 
    } else if (itemObj) { 
      tipo = itemObj.tipo || "Outro"; 
      nome = itemObj.nome || ""; 
      presente = itemObj.presente || ""; 
      vbucks = itemObj.vbucks || "";
      contaEnvio = itemObj.contaEnvio || "";
      isEnviado = itemObj.enviadoAvulso === true;
    } 
    
    const travaEdicao = isEnviado ? "pointer-events: none; opacity: 0.6;" : "";
    
    const cats = typeof CATEGORIAS_ITENS !== 'undefined' ? CATEGORIAS_ITENS : ["Traje", "Gesto", "Picareta", "Música", "Pacote", "Pacotão", "Asa-delta", "Envelopamento", "Calçado", "Acessório", "Carro", "Mascote", "Outro"];
    const optionsHtml = cats.map(c => `<option value="${c}" ${c === tipo ? "selected" : ""}>${c}</option>`).join(""); 
    
    const contasOptions = (state.contas || []).filter(c => c.ativa).map(c => `<option value="${esc(c.nome)}" ${c.nome === contaEnvio ? "selected" : ""}>${esc(c.nome)}</option>`).join("");
    
    const tagEnviadoHtml = isEnviado ? `<span style="color:var(--green); font-size:10px; margin-left:8px; border:1px solid var(--green); padding: 2px 4px; border-radius: 4px;">✅ Já Enviado</span>` : "";

    const seletorContaHtml = itens.length >= 2 
      ? `<select class="edit-modal-item-conta" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; background: rgba(0,0,0,0.2); color: var(--accent-light); border: 1px solid rgba(142,68,255,0.3); outline: none; cursor: pointer; margin-left: 8px; ${travaEdicao}">
           <option value="">Seguir Conta Principal</option>
           ${contasOptions}
         </select>`
      : `<input type="hidden" class="edit-modal-item-conta" value="${esc(contaEnvio)}">`;

    return `
      <div class="item-picker-box" style="margin-top: 0; margin-bottom: 8px; width: 100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <div style="display:flex; align-items:center;">
            <label style="font-size:12px;">Item ${idx + 1}</label>
            ${seletorContaHtml}
            ${tagEnviadoHtml}
          </div>
          ${itens.length > 1 && !isEnviado ? `<button type="button" class="btn-danger close-modal-btn" style="padding:2px 6px;" onclick="this.closest('.item-picker-box').remove(); if(typeof atualizarCalculoEdicaoAutomatico==='function') atualizarCalculoEdicaoAutomatico();">✕</button>` : ""}
        </div>
        <div class="item-picker-row" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input type="hidden" class="edit-modal-item-enviado" value="${isEnviado ? "true" : "false"}">
          <select class="item-type-select edit-modal-item-type" style="flex: 1; min-width: 90px; padding: 10px;">${optionsHtml}</select>
          <input class="item-name-input edit-modal-item-name" type="text" maxlength="120" value="${esc(nome)}" placeholder="Nome do item" style="flex: 2; min-width: 140px; padding: 10px;">
          <input class="item-vbucks-input edit-modal-item-vbucks" type="number" step="50" min="0" value="${esc(vbucks)}" placeholder="V-Bucks" style="flex: 0.8; min-width: 80px; padding: 10px; text-align: center; ${travaEdicao}" ${isEnviado ? "readonly" : ""} oninput="if(typeof atualizarCalculoEdicaoAutomatico==='function') atualizarCalculoEdicaoAutomatico()">
          <input class="item-name-input edit-modal-item-presente" type="text" maxlength="80" value="${esc(presente)}" placeholder="🎁 P/ Nick" style="flex: 1.5; min-width: 110px; padding: 10px;">
        </div>
      </div>`; 
  }).join("");
  
  if (typeof atualizarCalculoEdicaoAutomatico === 'function') {
      atualizarCalculoEdicaoAutomatico();
  }
  document.getElementById("editSaleModal").style.display = "flex";
}

function efetivarAgendamento(id) {
  const currentIdx = (state.agendamentos || []).findIndex(a => a.id === id); 
  if (currentIdx < 0) return; 
  
  const agendamento = state.agendamentos[currentIdx];
  const itens = Array.isArray(agendamento.itens) && agendamento.itens.length > 0 ? agendamento.itens : [{ tipo: "Outro", nome: agendamento.item, vbucks: agendamento.vbucks, enviadoAvulso: false }];

  const limitesPendentes = {};
  const descontosPorConta = {};
  let precisaEfetivar = false;

  itens.forEach(it => {
     if (!it.enviadoAvulso) {
         precisaEfetivar = true;
         const c = it.contaEnvio || agendamento.conta;
         limitesPendentes[c] = (limitesPendentes[c] || 0) + 1;
         descontosPorConta[c] = (descontosPorConta[c] || 0) + (Number(it.vbucks) || 0);
     }
  });

  if (precisaEfetivar) {
      for (const [nomeConta, qtdPendentes] of Object.entries(limitesPendentes)) {
          const u = typeof usadasDaConta === 'function' ? usadasDaConta(nomeConta) : 0;
          if (u + qtdPendentes > 5) {
             mostrarNotificacao(`Sem vagas livres na conta ${nomeConta} agora.`, "erro");
             return;
          }
      }

      for (const [nomeConta, vbReq] of Object.entries(descontosPorConta)) {
          const cObj = (state.contas || []).find(c => c.nome === nomeConta);
          if (!cObj || Number(cObj.vbucks) < vbReq) {
              mostrarNotificacao(`Saldo de V-Bucks insuficiente na conta ${nomeConta}.`, "erro");
              return;
          }
      }
  }

  abrirModalConfirmacao("✅ Finalizar Venda", `Confirmar o envio final para ${agendamento.cliente}?`, () => {
    const agora = Date.now();
    if (!state.reservas) state.reservas = [];

    if (precisaEfetivar) {
        for (const [nomeConta, vbReq] of Object.entries(descontosPorConta)) {
            const cObj = (state.contas || []).find(c => c.nome === nomeConta);
            if (cObj) cObj.vbucks = Math.max(0, Number(cObj.vbucks) - vbReq);
        }

        itens.forEach(it => {
            if (!it.enviadoAvulso) {
                const c = it.contaEnvio || agendamento.conta;
                state.reservas.push(typeof criarTimerReserva === 'function' ? criarTimerReserva(c, agendamento.id) : {
                    id: `timer-${agora}-${Math.random().toString(36).substr(2, 5)}`,
                    conta: c, vendaId: agendamento.id, expiresAt: agora + 86400000 + 120000
                });
                it.enviadoAvulso = true; 
            }
        });
    }

    const vendaId = `venda-${agora}`;
    
    const novaVenda = { 
      ...agendamento, 
      id: vendaId, 
      itens: itens,
      data: new Date().toLocaleDateString("pt-BR"), 
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), 
      criadoEmMs: agora 
    };
    
    delete novaVenda.dataRegistro; 
    delete novaVenda.horaRegistro; 
    delete novaVenda.dataEnvio; 
    
    if (!state.vendas) state.vendas = [];
    if (!state.historicoVendas) state.historicoVendas = [];

    state.vendas.push(novaVenda); 
    state.historicoVendas.push(JSON.parse(JSON.stringify(novaVenda)));
    
    state.reservas.forEach(r => {
        if (r.vendaId === agendamento.id) r.vendaId = vendaId;
    });

    state.agendamentos.splice(currentIdx, 1); 
    
    if (typeof render === 'function') render();
    if (typeof save === 'function') save(); 
    mostrarNotificacao("Venda efetivada com sucesso! Todos os timers estão a rodar.", "sucesso");
  });
}

function excluirAgendamento(id) {
  const initialIndex = (state.agendamentos || []).findIndex(a => a.id === id); 
  if (initialIndex < 0) return; 
  
  const clientName = state.agendamentos[initialIndex].cliente;
  
  abrirModalConfirmacao("🗑️ Cancelar Agendamento", `Deseja realmente cancelar a pré-venda de ${clientName}?`, () => { 
    const idx = (state.agendamentos || []).findIndex(a => a.id === id); 
    if (idx > -1) { 
      state.agendamentos.splice(idx, 1); 
      if (typeof render === 'function') render();
      if (typeof save === 'function') save(); 
      mostrarNotificacao("Agendamento cancelado.", "info"); 
    } 
  });
}