// ==========================================
// MÓDULO DE PRÉ-VENDAS / AGENDAMENTOS
// ==========================================

// Variáveis de Estado do Calendário de Agendamento (Novo Form)
let agendaViewMes = new Date().getMonth();
let agendaViewAno = new Date().getFullYear();
let agendaPopoverAberto = false;

// Variáveis de Estado do Calendário de Edição
let editAgendaViewMes = new Date().getMonth();
let editAgendaViewAno = new Date().getFullYear();
let editAgendaPopoverAberto = false;

// ================= FUNÇÕES DO CALENDÁRIO NOVO =================

function toggleAgendaCalendario(e) {
  if (e) e.stopPropagation();
  // Fecha outros popovers caso estejam abertos (se existirem globalmente)
  if (typeof calPopoverAberto !== 'undefined') calPopoverAberto = false;
  if (typeof mesPopoverAberto !== 'undefined') mesPopoverAberto = false;
  if (typeof anoPopoverAberto !== 'undefined') anoPopoverAberto = false;
  if (typeof apoiadorPopoverAberto !== 'undefined') apoiadorPopoverAberto = false;
  
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
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  // Bloqueio do passado visual e lógico
  if (dataEscolhida < hoje) {
     mostrarNotificacao("Erro: Não é possível agendar uma pré-venda no passado!", "erro");
     return; 
  }
  
  const inputHidden = document.getElementById("dataEnvioInput");
  const label = document.getElementById("labelAgendaData");
  
  if (inputHidden && label) {
     inputHidden.value = `${a}-${m}-${d}`; 
     
     if (dataEscolhida.getTime() === hoje.getTime()) {
        label.textContent = "Hoje";
     } else {
        label.textContent = diaStr;
     }
  }
  
  agendaPopoverAberto = false;
  renderAgendaCalendario();
}

function renderAgendaCalendario() {
  const placeholder = document.getElementById("agendaPopoverPlaceholder");
  if (!placeholder) return;
  
  if (!agendaPopoverAberto) {
     placeholder.innerHTML = "";
     return;
  }
  
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
  const primeiroDiaSemana = new Date(agendaViewAno, agendaViewMes, 1).getDay();
  const totalDiasMes = new Date(agendaViewAno, agendaViewMes + 1, 0).getDate();
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  const inputHidden = document.getElementById("dataEnvioInput");
  let dataAtiva = "";
  if (inputHidden && inputHidden.value) {
     const [ya, ma, da] = inputHidden.value.split("-");
     dataAtiva = `${da}/${ma}/${ya}`;
  } else {
     dataAtiva = obterDataHojeFormatada();
  }

  let diasHtml = "";
  for (let i = 0; i < primeiroDiaSemana; i++) { diasHtml += `<div class="cal-day-empty"></div>`; }
  
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dataStr = `${String(dia).padStart(2, "0")}/${String(agendaViewMes + 1).padStart(2, "0")}/${agendaViewAno}`;
    const dataObj = new Date(agendaViewAno, agendaViewMes, dia);
    
    const isPassado = dataObj < hoje; 
    const isToday = dataObj.getTime() === hoje.getTime();
    const isSelected = dataStr === dataAtiva;

    diasHtml += `
      <button type="button" class="cal-day-btn ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}"
        ${isPassado ? "disabled style='opacity:0.25; cursor:not-allowed; border:none;'" : ""} onclick="selecionarAgendaDia('${dataStr}', event)">
        ${dia}
      </button>
    `;
  }

  placeholder.innerHTML = `
    <div class="custom-calendar-popover" style="top: calc(100% + 6px); left: 0; transform: none; width: 250px;" onclick="event.stopPropagation()">
      <div class="calendar-header-nav">
        <button type="button" class="calendar-nav-btn" onclick="navegarAgendaMes(-1, event)">‹</button>
        <strong>${nomesMeses[agendaViewMes]} ${agendaViewAno}</strong>
        <button type="button" class="calendar-nav-btn" onclick="navegarAgendaMes(1, event)">›</button>
      </div>
      <div class="calendar-weekdays-grid">${diasSemana.map(d => `<span>${d}</span>`).join("")}</div>
      <div class="calendar-days-grid">${diasHtml}</div>
    </div>
  `;
}

// ================= FUNÇÕES DO CALENDÁRIO DE EDIÇÃO =================

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
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  if (dataEscolhida < hoje) {
     mostrarNotificacao("Erro: Não é possível reagendar para uma data que já passou!", "erro");
     return;
  }
  
  const inputHidden = document.getElementById("editDataEnvioInput");
  const label = document.getElementById("labelEditAgendaData");
  
  if (inputHidden && label) {
     inputHidden.value = `${a}-${m}-${d}`; 
     if (dataEscolhida.getTime() === hoje.getTime()) {
        label.textContent = "Hoje";
     } else {
        label.textContent = diaStr;
     }
  }
  
  editAgendaPopoverAberto = false;
  renderEditAgendaCalendario();
}

function renderEditAgendaCalendario() {
  const placeholder = document.getElementById("editAgendaPopoverPlaceholder");
  if (!placeholder) return;
  
  if (!editAgendaPopoverAberto) {
     placeholder.innerHTML = "";
     return;
  }
  
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
  const primeiroDiaSemana = new Date(editAgendaViewAno, editAgendaViewMes, 1).getDay();
  const totalDiasMes = new Date(editAgendaViewAno, editAgendaViewMes + 1, 0).getDate();
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  const inputHidden = document.getElementById("editDataEnvioInput");
  let dataAtiva = "";
  if (inputHidden && inputHidden.value) {
     const [ya, ma, da] = inputHidden.value.split("-");
     dataAtiva = `${da}/${ma}/${ya}`;
  } else {
     dataAtiva = obterDataHojeFormatada();
  }

  let diasHtml = "";
  for (let i = 0; i < primeiroDiaSemana; i++) { diasHtml += `<div class="cal-day-empty"></div>`; }
  
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dataStr = `${String(dia).padStart(2, "0")}/${String(editAgendaViewMes + 1).padStart(2, "0")}/${editAgendaViewAno}`;
    const dataObj = new Date(editAgendaViewAno, editAgendaViewMes, dia);
    
    const isPassado = dataObj < hoje; 
    const isToday = dataObj.getTime() === hoje.getTime();
    const isSelected = dataStr === dataAtiva;

    diasHtml += `
      <button type="button" class="cal-day-btn ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}"
        ${isPassado ? "disabled style='opacity:0.25; cursor:not-allowed; border:none;'" : ""} onclick="selecionarEditAgendaDia('${dataStr}', event)">
        ${dia}
      </button>
    `;
  }

  placeholder.innerHTML = `
    <div class="custom-calendar-popover" style="top: calc(100% + 6px); left: 0; transform: none; width: 250px;" onclick="event.stopPropagation()">
      <div class="calendar-header-nav">
        <button type="button" class="calendar-nav-btn" onclick="navegarEditAgendaMes(-1, event)">‹</button>
        <strong>${nomesMeses[editAgendaViewMes]} ${editAgendaViewAno}</strong>
        <button type="button" class="calendar-nav-btn" onclick="navegarEditAgendaMes(1, event)">›</button>
      </div>
      <div class="calendar-weekdays-grid">${diasSemana.map(d => `<span>${d}</span>`).join("")}</div>
      <div class="calendar-days-grid">${diasHtml}</div>
    </div>
  `;
}

// ================= LÓGICA PRINCIPAL =================

function agendarVenda() {
  limparReservasExpiradas();
  const conta = document.getElementById("contaSelect").value;
  const valor = parseFloat(document.getElementById("valorInput").value);
  const cliente = document.getElementById("clienteInput").value.trim();
  const nickCliente = document.getElementById("nickClienteInput").value.trim();
  const whatsapp = document.getElementById("whatsappInput")?.value.trim() || "";
  const tiktok = document.getElementById("tiktokInput")?.value.trim() || "";
  const observacao = document.getElementById("observacaoInput")?.value.trim() || "";
  const quantidade = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const itens = obterItensDaVenda();
  const baseAtual = state.valorBase100 || 2.5;

  // Lógica do Calendário Customizado
  const dataEnvioCrua = document.getElementById("dataEnvioInput")?.value;
  let dataEnvioFormatada = obterDataHojeFormatada(); // Default é hoje
  
  if (dataEnvioCrua) {
    const [ano, mes, dia] = dataEnvioCrua.split("-");
    const dataEscolhida = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 

    if (dataEscolhida < hoje) {
      mostrarNotificacao("Erro: Você não pode agendar uma pré-venda para uma data no passado!", "erro");
      return;
    }
    
    dataEnvioFormatada = `${dia}/${mes}/${ano}`;
  }

 if (!conta) { mostrarNotificacao("Selecione a conta de onde o item sairá.", "erro"); return; }
  if (!valor || valor <= 0) { mostrarNotificacao("Digite um valor válido pago antecipadamente.", "erro"); return; }
  if (!cliente) { mostrarNotificacao("Preencha o nome do cliente.", "erro"); return; }
  if (!nickCliente) { mostrarNotificacao("Preencha o nick do cliente.", "erro"); return; }
  if (itens.length < quantidade) { mostrarNotificacao("Preencha o nome do(s) item(ns) agendado(s).", "erro"); return; }

  const vbucksNecessarios = Math.round((valor / baseAtual) * 100);
  
  const contaObj = (state.contas || []).find(c => c.nome === conta);
  if (Number(contaObj?.vbucks) < vbucksNecessarios) { 
      mostrarNotificacao("Aviso: Saldo de V-Bucks atual é insuficiente, mas o agendamento será salvo.", "info"); 
  }

  const agora = Date.now(), d = new Date();
  const agendamentoId = crypto.randomUUID ? crypto.randomUUID() : `agenda-${Date.now()}`;

  const novoAgendamento = {
    id: agendamentoId, 
    conta, 
    valor: Number(valor), 
    vbucks: vbucksNecessarios, 
    valorBaseMomento: baseAtual,
    quantidade, 
    cliente, 
    nickCliente, 
    observacao, 
    item: itens[0] || "", 
    itens,
    whatsapp, 
    tiktok,
    dataEnvio: dataEnvioFormatada,
    dataRegistro: d.toLocaleDateString("pt-BR"), 
    horaRegistro: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), 
    criadoEmMs: agora
  };

  if (!state.agendamentos) state.agendamentos = [];
  state.agendamentos.unshift(novoAgendamento);

  sincronizarDadosCliente(cliente, whatsapp, tiktok);
  
  // Limpar e resetar form
  document.getElementById("limparTudoBtn").click();
  
  save();
  mostrarNotificacao(`⏳ Pré-venda agendada para ${dataEnvioFormatada}!`, "sucesso");
}

function renderizarAgendamentos() {
  const container = document.getElementById("listaAgendamentosContainer");
  if (!container) return;
  const agendamentos = state.agendamentos || [];

  const valorTotalPreVendas = agendamentos.reduce((acc, a) => acc + Number(a.valor || 0), 0);
  
  const headerTotalHtml = `
    <div style="background: rgba(142,68,255,0.08); border: 1px solid rgba(168,85,247,0.25); border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 15px; font-weight: 700; color: #fff;">💰 Total Acumulado em Pré-vendas (Não enviadas):</span>
        <span style="font-size: 24px; font-weight: 900; color: var(--green);">${money(valorTotalPreVendas)}</span>
    </div>
  `;

  if (agendamentos.length === 0) {
    container.innerHTML = headerTotalHtml + `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">Nenhuma pré-venda agendada no momento. Tudo limpo!</div>`;
    return;
  }

  const hojeTime = new Date().setHours(0,0,0,0);

  const listaHtml = agendamentos.map(a => {
    const vb = a.vbucks !== undefined ? Number(a.vbucks) : valorParaVBucks(a.valor, a.valorBaseMomento);
    const itensHtmlStr = renderizarListaItensHtml(a.itens || [a.item]);

    const infosContato = [];
    const iconeTikTok = `<svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>`;

    if (a.whatsapp) infosContato.push(`<div style="display:flex; align-items:center; gap:4px; white-space: nowrap;">📱 <span class="copyable-text" onclick="copiarTexto('${esc(a.whatsapp)}', 'WhatsApp', event)" style="font-size:13px; font-weight:600; color:#eee;">${esc(a.whatsapp)}</span></div>`);
    if (a.tiktok) infosContato.push(`<div style="display:flex; align-items:center; gap:4px; white-space: nowrap;">${iconeTikTok} <span class="copyable-text" onclick="copiarTexto('${esc(a.tiktok)}', 'TikTok', event)" style="font-size:13px; font-weight:600; color:#eee;">${esc(a.tiktok)}</span></div>`);
    
    const contatoHtml = infosContato.length > 0 ? `<div class="history-client" style="margin-top: 4px; display:flex; align-items:center; gap: 12px; flex-wrap: nowrap;">${infosContato.join("")}</div>` : "";
    const observacaoHtml = a.observacao ? `<div style="margin-top: 6px; font-size: 12px; color: #ffb74d; background: rgba(255, 152, 0, 0.1); padding: 4px 8px; border-radius: 6px; border-left: 3px solid #ff9800;">💬 <b>Observação:</b> ${esc(a.observacao)}</div>` : "";

    const dataEnvioFormatada = a.dataEnvio || "Imediato";
    let badgeEnvioEstilo = "background: rgba(142,68,255,0.15); border: 1px solid var(--accent); color: var(--accent-light);";
    
    if (dataEnvioFormatada !== "Imediato" && parseDataBR(dataEnvioFormatada) <= hojeTime) {
        badgeEnvioEstilo = "background: rgba(255, 152, 0, 0.2); border: 1px solid rgba(255, 152, 0, 0.6); color: #ffb74d;";
    }

    return `
    <div class="history-card" style="border-left: 4px solid var(--accent-light);">
      <div class="history-main">
        <div class="history-info">
          <div class="history-account">Conta reservada: <span class="copyable-text" onclick="copiarTexto('${esc(a.conta)}', 'Conta', event)">${esc(a.conta)}</span></div>
          <div class="history-client">👤 <span class="copyable-text" onclick="copiarTexto('${esc(a.cliente)}', 'Cliente', event)">${esc(a.cliente)}</span></div>
          <div class="history-client">🎮 <span class="copyable-text" onclick="copiarTexto('${esc(a.nickCliente)}', 'Nick', event)">${esc(a.nickCliente)}</span></div>
          ${contatoHtml}
          <div class="history-item" style="margin-top: 8px;">${itensHtmlStr}</div>
          <div class="history-date">📅 Criado em: ${esc(a.dataRegistro)} às ${esc(a.horaRegistro)}</div>
          
          <div style="font-size: 12px; font-weight: bold; margin-top: 8px; padding: 4px 8px; border-radius: 6px; display: inline-block; ${badgeEnvioEstilo}">
            🚀 Enviar no dia: ${esc(dataEnvioFormatada)}
          </div>

          ${observacaoHtml}
        </div>
        <div class="history-value">${money(a.valor)}</div>
      </div>
      <div class="history-details">
        <span>🪙 ${formatVBucks(vb)} V-Bucks exigidos</span>
        <div class="history-actions">
          <button type="button" class="btn-green" style="padding:6px 12px; font-weight: bold;" onclick="efetivarAgendamento('${esc(a.id)}')">✅ Efetivar Venda</button>
          <button type="button" class="btn-gray" onclick="abrirModalEdicaoAgendamento('${esc(a.id)}')">✏️ Editar</button>
          <button type="button" class="btn-danger" onclick="excluirAgendamento('${esc(a.id)}')">🗑️ Cancelar</button>
        </div>
      </div>
    </div>`;
  }).join("");

  container.innerHTML = headerTotalHtml + listaHtml;
}

function abrirModalEdicaoAgendamento(id) {
  const idx = (state.agendamentos || []).findIndex(a => a.id === id);
  if (idx < 0) return;
  const agendamento = state.agendamentos[idx];

  const tipoInput = document.getElementById("editTipoRegistro");
  if(tipoInput) tipoInput.value = "agendamento";
  
  document.getElementById("editVendaId").value = id;
  document.getElementById("editSaleTitle").innerHTML = "✏️ Editar Pré-venda Agendada";
  
  const selectConta = document.getElementById("editContaSelect");
  if (selectConta) {
    selectConta.innerHTML = (state.contas || []).map(c => `
      <option value="${esc(c.nome)}" ${c.nome === agendamento.conta ? "selected" : ""}>
        ${esc(c.nome)} (${formatVBucks(c.vbucks)} VB)
      </option>
    `).join("");
    selectConta.value = agendamento.conta;
  }

  document.getElementById("editClientInput").value = agendamento.cliente || "";
  document.getElementById("editNickInput").value = agendamento.nickCliente || "";
  if (document.getElementById("editWhatsappInput")) document.getElementById("editWhatsappInput").value = agendamento.whatsapp || "";
  if (document.getElementById("editTiktokInput")) document.getElementById("editTiktokInput").value = agendamento.tiktok || "";
  document.getElementById("editObservacaoInput").value = agendamento.observacao || "";
  document.getElementById("editDataInput").value = agendamento.dataRegistro || "";
  document.getElementById("editHoraInput").value = agendamento.horaRegistro || "";
  document.getElementById("editValorInput").value = Number(agendamento.valor || 0).toFixed(2);
  
  const elDataEnvioContainer = document.getElementById("editDataEnvioContainer");
  if(elDataEnvioContainer) {
      elDataEnvioContainer.style.display = "block";
      const inputDataEnvio = document.getElementById("editDataEnvioInput");
      const labelDataEnvio = document.getElementById("labelEditAgendaData");
      
      if (inputDataEnvio && agendamento.dataEnvio) {
          const p = agendamento.dataEnvio.split("/");
          if(p.length === 3) {
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

  atualizarPreviewVBucksEdicao();

  const container = document.getElementById("editItensListContainer");
  const itens = Array.isArray(agendamento.itens) && agendamento.itens.length ? agendamento.itens : [agendamento.item || ""];

  container.innerHTML = itens.map((itemObj, idx) => {
    let tipo = "Outro", nome = "", presente = "";
    if (typeof itemObj === "string") {
      const parsed = parseItemString(itemObj);
      tipo = parsed.tipo; nome = parsed.nome;
    } else if (itemObj) {
      tipo = itemObj.tipo || "Outro"; nome = itemObj.nome || ""; presente = itemObj.presente || "";
    }
    const optionsHtml = CATEGORIAS_ITENS.map(c => `<option value="${c}" ${c === tipo ? "selected" : ""}>${c}</option>`).join("");
    return `
      <div class="item-picker-box" style="margin-top: 0; margin-bottom: 8px; width: 100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <label style="font-size:12px;">Item ${idx + 1}</label>
          ${itens.length > 1 ? `<button type="button" class="btn-danger close-modal-btn" style="padding:2px 6px;" onclick="this.closest('.item-picker-box').remove()">✕</button>` : ""}
        </div>
        <div class="item-picker-row" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <select class="item-type-select edit-modal-item-type" style="flex: 1; min-width: 90px; padding: 10px;">${optionsHtml}</select>
          <input class="item-name-input edit-modal-item-name" type="text" maxlength="120" value="${esc(nome)}" placeholder="Nome do item" style="flex: 2; min-width: 150px; padding: 10px;">
          <input class="item-name-input edit-modal-item-presente" type="text" maxlength="80" value="${esc(presente)}" placeholder="🎁 P/ Nick (Opcional)" style="flex: 1.5; min-width: 120px; padding: 10px;">
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("editSaleModal").style.display = "flex";
}

function efetivarAgendamento(id) {
  const initialIndex = (state.agendamentos || []).findIndex(a => a.id === id);
  if (initialIndex < 0) return;
  const agendamento = state.agendamentos[initialIndex];

  const usadas = usadasDaConta(agendamento.conta);
  if (usadas + agendamento.quantidade > 5) { 
      mostrarNotificacao(`A conta ${agendamento.conta} não tem as ${agendamento.quantidade} vagas livres necessárias agora.`, "erro"); 
      return; 
  }

  const contaObj = (state.contas || []).find(c => c.nome === agendamento.conta);
  if (!contaObj || Number(contaObj.vbucks) < agendamento.vbucks) { 
      mostrarNotificacao(`Saldo de V-Bucks insuficiente na conta ${agendamento.conta} para efetivar a venda.`, "erro"); 
      return; 
  }

  abrirModalConfirmacao(
      "✅ Efetivar Pré-venda",
      `Confirmar o envio para ${agendamento.cliente}? Os V-Bucks serão descontados, a vaga ocupada, e o valor entrará no caixa imediatamente.`,
      () => {
          const currentIdx = (state.agendamentos || []).findIndex(a => a.id === id);
          if(currentIdx < 0) return;
          const currentAgendamento = state.agendamentos[currentIdx];

          contaObj.vbucks = Math.max(0, Number(contaObj.vbucks) - currentAgendamento.vbucks);
          
          const agora = Date.now(), d = new Date();
          const vendaId = crypto.randomUUID ? crypto.randomUUID() : `venda-${Date.now()}`;

          const novaVenda = {
              ...currentAgendamento, 
              id: vendaId,
              data: d.toLocaleDateString("pt-BR"), 
              hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), 
              criadoEmMs: agora
          };
          delete novaVenda.dataRegistro;
          delete novaVenda.horaRegistro;
          delete novaVenda.dataEnvio; 

          state.vendas.push(novaVenda);
          state.historicoVendas.push(JSON.parse(JSON.stringify(novaVenda)));
          
          for (let n = 0; n < currentAgendamento.quantidade; n++) {
              state.reservas.push({ id: `timer-${Date.now()}-${n}`, conta: currentAgendamento.conta, vendaId: vendaId, expiresAt: agora + 86400000 });
          }

          state.agendamentos.splice(currentIdx, 1);
          save();
          mostrarNotificacao("Venda efetivada com sucesso! O Timer começou a rodar.", "sucesso");
      }
  );
}

function excluirAgendamento(id) {
  const initialIndex = (state.agendamentos || []).findIndex(a => a.id === id);
  if (initialIndex < 0) return;
  const clientName = state.agendamentos[initialIndex].cliente;

  abrirModalConfirmacao(
    "🗑️ Cancelar Agendamento", 
    `Deseja realmente cancelar a pré-venda de ${clientName}? O dinheiro não será somado ao caixa. Essa ação não tem volta.`, 
    () => {
      const idx = (state.agendamentos || []).findIndex(a => a.id === id);
      if (idx > -1) {
        state.agendamentos.splice(idx, 1);
        save();
        mostrarNotificacao("Agendamento cancelado.", "info");
      }
    }
  );
}