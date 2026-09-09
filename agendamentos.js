// ==========================================
// MÓDULO DE PRÉ-VENDAS / AGENDAMENTOS
// ==========================================

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

  // NOVA LÓGICA DE DATA DE ENVIO
  const dataEnvioCrua = document.getElementById("dataEnvioInput")?.value;
  let dataEnvioFormatada = obterDataHojeFormatada(); // Se deixar vazio, joga para hoje
  if (dataEnvioCrua) {
    const [ano, mes, dia] = dataEnvioCrua.split("-");
    dataEnvioFormatada = `${dia}/${mes}/${ano}`;
  }

  if (!conta) { mostrarNotificacao("Selecione a conta de onde o item sairá.", "erro"); return; }
  if (!valor || valor <= 0) { mostrarNotificacao("Digite um valor válido pago antecipadamente.", "erro"); return; }
  if (!cliente || !nickCliente) { mostrarNotificacao("Preencha o cliente e o nick.", "erro"); return; }

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
    dataEnvio: dataEnvioFormatada, // DATA QUE O ITEM SERÁ ENVIADO
    dataRegistro: d.toLocaleDateString("pt-BR"), 
    horaRegistro: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), 
    criadoEmMs: agora
  };

  if (!state.agendamentos) state.agendamentos = [];
  state.agendamentos.unshift(novoAgendamento);

  sincronizarDadosCliente(cliente, whatsapp, tiktok);
  
  // Limpar form
  document.getElementById("limparTudoBtn").click();
  if (document.getElementById("dataEnvioInput")) document.getElementById("dataEnvioInput").value = "";
  
  save();
  mostrarNotificacao(`⏳ Pré-venda agendada para ${dataEnvioFormatada}!`, "sucesso");
}

function renderizarAgendamentos() {
  const container = document.getElementById("listaAgendamentosContainer");
  if (!container) return;
  const agendamentos = state.agendamentos || [];

  // SOMA TOTAL DE TODAS AS PRÉ-VENDAS PENDENTES NO SISTEMA
  const valorTotalPreVendas = agendamentos.reduce((acc, a) => acc + Number(a.valor || 0), 0);
  
  // Painel de Total das Pré-Vendas
  const headerTotalHtml = `
    <div style="background: rgba(142,68,255,0.15); border: 1px solid var(--accent); border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(142, 68, 255, 0.1);">
        <span style="font-size: 15px; font-weight: 700; color: #fff;">💰 Total Acumulado em Pré-vendas (Não enviadas):</span>
        <span style="font-size: 24px; font-weight: 900; color: var(--green); text-shadow: 0 0 10px rgba(0, 230, 118, 0.3);">${money(valorTotalPreVendas)}</span>
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

    // Lógica visual da Data de Envio
    const dataEnvioFormatada = a.dataEnvio || "Imediato";
    let badgeEnvioEstilo = "background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa;";
    
    if (dataEnvioFormatada !== "Imediato" && parseDataBR(dataEnvioFormatada) <= hojeTime) {
        // Se a data já bateu (Hoje) ou está atrasada, fica laranja/alerta
        badgeEnvioEstilo = "background: rgba(255, 152, 0, 0.2); border: 1px solid rgba(255, 152, 0, 0.6); color: #ffb74d;";
    }

    return `
    <div class="history-card" style="border-left: 4px solid #3b82f6;">
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
          <button type="button" class="btn-primary" style="padding:6px 12px; font-weight: bold; background: #3b82f6;" onclick="efetivarAgendamento('${esc(a.id)}')">✅ Efetivar Venda</button>
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
  
  // Exibe o input de Edição da Data de Envio apenas para pré-venda
  const elDataEnvioContainer = document.getElementById("editDataEnvioContainer");
  if(elDataEnvioContainer) {
      elDataEnvioContainer.style.display = "block";
      const inputDataEnvio = document.getElementById("editDataEnvioInput");
      if (inputDataEnvio && agendamento.dataEnvio) {
          const p = agendamento.dataEnvio.split("/");
          if(p.length === 3) inputDataEnvio.value = `${p[2]}-${p[1]}-${p[0]}`;
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
          delete novaVenda.dataEnvio; // Já foi enviada, limpa a data de programação

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