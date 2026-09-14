function adicionarVenda() {
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

  if (!conta || !valor || !cliente || !nickCliente || itens.length < quantidade) {
    mostrarNotificacao("Preencha todos os campos obrigatórios.", "erro");
    return;
  }
  
  const usadas = usadasDaConta(conta);
  if (usadas + quantidade > 5) {
    mostrarNotificacao(`Limite excedido na conta ${conta}.`, "erro");
    return;
  }

  const contaObj = (state.contas || []).find(c => c.nome === conta);
  const vbucksNecessarios = Math.round((valor / baseAtual) * 100);
  
  if (Number(contaObj?.vbucks) < vbucksNecessarios) {
    mostrarNotificacao("Saldo de V-Bucks insuficiente.", "erro");
    return;
  }

  contaObj.vbucks = Math.max(0, Number(contaObj.vbucks) - vbucksNecessarios);
  const agora = Date.now(), d = new Date(), vendaId = `venda-${agora}`;

  const novaVenda = {
    id: vendaId, conta, valor: Number(valor), vbucks: vbucksNecessarios,
    valorBaseMomento: baseAtual, quantidade, cliente, nickCliente,
    observacao, item: itens[0] || "", itens, whatsapp, tiktok,
    data: d.toLocaleDateString("pt-BR"),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    criadoEmMs: agora
  };

  // ADICIONA DIRETAMENTE NO ESTADO LOCAL PARA APARECER INSTANTANEAMENTE (SEM DELAY)
  state.vendas.push(novaVenda);
  state.historicoVendas.push({ ...novaVenda, itens: [...itens] });
  
  for (let n = 0; n < quantidade; n++) {
    state.reservas.push(criarTimerReserva(conta, vendaId));
  }

  sincronizarDadosCliente(cliente, whatsapp, tiktok);
  
  // LIMPEZA FORÇADA DOS CAMPOS DO FORMULÁRIO
  ["valorInput", "clienteInput", "nickClienteInput", "whatsappInput", "tiktokInput", "observacaoInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  if (document.getElementById("quantidadeInput")) document.getElementById("quantidadeInput").value = "1";
  if (document.getElementById("dataEnvioInput")) document.getElementById("dataEnvioInput").value = "";
  if (document.getElementById("labelAgendaData")) document.getElementById("labelAgendaData").textContent = "Hoje";
  
  atualizarCamposItens();
  atualizarPreviewVBucks();
  verificarObservacaoCliente("");

  // RENDERIZA A TELA NA MESMA HORA E DISPARA SALVAMENTO EM SEGUNDO PLANO
  render();
  save(); 
  
  mostrarNotificacao("✅ Venda registrada com sucesso!", "sucesso");
}

function abrirModalEdicaoPorId(vendaId) {
  const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (i < 0) return;
  const venda = state.historicoVendas[i];

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
  document.getElementById("editDataInput").value = venda.data || "";
  document.getElementById("editHoraInput").value = venda.hora || "";
  document.getElementById("editValorInput").value = Number(venda.valor || 0).toFixed(2);
  
  const elDataEnvioContainer = document.getElementById("editDataEnvioContainer");
  if (elDataEnvioContainer) elDataEnvioContainer.style.display = "none";
  atualizarPreviewVBucksEdicao();

  const container = document.getElementById("editItensListContainer");
  const itens = Array.isArray(venda.itens) && venda.itens.length ? venda.itens : [venda.item || ""];

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
  if (i < 0) return;
  const venda = listaOriginal[i];

  const novaConta = document.getElementById("editContaSelect").value;
  const cliente = document.getElementById("editClientInput").value.trim();
  const nick = document.getElementById("editNickInput").value.trim();
  const whatsapp = document.getElementById("editWhatsappInput")?.value.trim() || "";
  const tiktok = document.getElementById("editTiktokInput")?.value.trim() || "";
  const observacao = document.getElementById("editObservacaoInput").value.trim();
  const novaData = document.getElementById("editDataInput").value.trim();
  const novaHora = document.getElementById("editHoraInput").value.trim();
  const valor = parseFloat(document.getElementById("editValorInput").value);

  if (!novaConta || !valor || !novaData || !cliente || !nick) {
    mostrarNotificacao("Preencha todos os campos corretamente.", "erro");
    return;
  }

  const itemBoxes = document.querySelectorAll("#editItensListContainer .item-picker-box");
  const novosItens = [];
  itemBoxes.forEach(box => {
    const tipo = box.querySelector(".edit-modal-item-type").value;
    const nome = box.querySelector(".edit-modal-item-name").value.trim();
    const presente = box.querySelector(".edit-modal-item-presente").value.trim();
    if (nome) novosItens.push({ tipo, nome, presente });
  });

  if (novosItens.length < itemBoxes.length) {
    mostrarNotificacao("Preencha o nome do(s) item(ns) vendido(s).", "erro");
    return;
  }

  const novoVbucks = Math.round((valor / (venda.valorBaseMomento || state.valorBase100 || 2.5)) * 100);
  const vbucksAntigo = venda.vbucks !== undefined ? Number(venda.vbucks) : valorParaVBucks(venda.valor, venda.valorBaseMomento);

  if (!isAgendamento && (venda.conta !== novaConta || venda.valor !== valor)) {
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
  venda.valor = Number(valor);
  venda.vbucks = novoVbucks;
  
  if (novosItens.length > 0) {
    venda.itens = novosItens;
    venda.item = novosItens[0];
  }

  if (isAgendamento) {
    venda.dataRegistro = novaData;
    venda.horaRegistro = novaHora || venda.horaRegistro || "—";
    const dataEnvioCrua = document.getElementById("editDataEnvioInput")?.value.trim();
    if (dataEnvioCrua) {
      const p = dataEnvioCrua.split("-");
      if (p.length === 3) venda.dataEnvio = `${p[2]}/${p[1]}/${p[0]}`;
    }
  } else {
    venda.data = novaData;
    venda.hora = novaHora || venda.hora || "—";
    const sessaoVenda = (state.vendas || []).find(v => v.id === venda.id);
    if (sessaoVenda) {
      Object.assign(sessaoVenda, {
        conta: novaConta, cliente, nickCliente: nick, whatsapp, tiktok,
        observacao, data: novaData, hora: novaHora, valor: Number(valor),
        vbucks: novoVbucks, itens: novosItens.length ? novosItens : sessaoVenda.itens,
        item: novosItens.length ? novosItens[0] : sessaoVenda.item
      });
    }
    if (state.reservas) {
      state.reservas.forEach(r => { if (r.vendaId === venda.id) r.conta = novaConta; });
    }
  }

  sincronizarDadosCliente(cliente, whatsapp, tiktok);
  save();
  fecharModalEdicao();
  
  if (isAgendamento && typeof renderizarAgendamentos === "function") {
    renderizarAgendamentos();
  }
  
  mostrarNotificacao(isAgendamento ? "Pré-venda atualizada!" : "Alterações salvas com sucesso!", "sucesso");
}

function excluirHistoricoPorId(vendaId) {
  const initialIndex = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
  if (initialIndex < 0) return;
  const clientName = state.historicoVendas[initialIndex].cliente;
  
  abrirModalConfirmacao("🗑️ Mover para Lixeira", `Mover venda de ${clientName} para a lixeira?`, () => {
    const i = (state.historicoVendas || []).findIndex(v => v.id === vendaId);
    if (i < 0) return;
    const venda = state.historicoVendas[i];
    const conta = (state.contas || []).find(c => c.nome === venda.conta);
    if (conta) conta.vbucks += (venda.vbucks || 0);
    
    state.reservas = (state.reservas || []).filter(r => r.vendaId !== venda.id);
    state.vendas = (state.vendas || []).filter(v => v.id !== venda.id);
    state.historicoVendas.splice(i, 1);
    
    if (!state.lixeiraVendas) state.lixeiraVendas = [];
    state.lixeiraVendas.unshift(venda);
    
    render();
    save();
    mostrarNotificacao("Venda movida para a lixeira.", "sucesso");
  });
}

function restaurarVenda(idx) {
  const venda = (state.lixeiraVendas || [])[idx];
  if (!venda) return;
  state.lixeiraVendas.splice(idx, 1);
  state.historicoVendas.push(venda);
  render();
  save();
  abrirModalLixeira();
  mostrarNotificacao("Venda restaurada com sucesso!", "sucesso");
}

function excluirDefinitivoLixeira(idx) {
  state.lixeiraVendas.splice(idx, 1);
  render();
  save();
  abrirModalLixeira();
  mostrarNotificacao("Venda apagada permanentemente.", "info");
}

function esvaziarLixeira() {
  state.lixeiraVendas = [];
  render();
  save();
  abrirModalLixeira();
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

function fecharModalEdicao() {
  if (document.getElementById("editSaleModal")) document.getElementById("editSaleModal").style.display = "none";
}

function valorRapido(v) {
  const input = document.getElementById("valorInput");
  if (!input) return;
  let valorAtual = input.valueAsNumber;
  if (isNaN(valorAtual)) valorAtual = 0;
  input.value = Math.round((valorAtual + Number(v)) * 100) / 100;
  atualizarPreviewVBucks();
  input.focus();
}

function toggleConta(i) {
  state.contas[i].ativa = !state.contas[i].ativa;
  render();
  save();
}

function removerConta(i) {
  state.contas.splice(i, 1);
  render();
  save();
}

function removerTimerEspecifico(idx) {
  state.reservas.splice(idx, 1);
  render();
  save();
}

function removerTimersConta(i) {
  const c = state.contas[i];
  if (c) {
    state.reservas = state.reservas.filter(r => r.conta !== c.nome);
    render();
    save();
  }
}

async function novaLive() {
  state.vendas = [];
  state.sessaoIniciadaEm = Date.now();
  render();
  await save();
  mostrarNotificacao("Nova sessão iniciada!", "sucesso");
}

function obterItensDaVenda() {
  const qtd = parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const lista = [];
  for (let i = 0; i < qtd; i++) {
    const tipo = document.getElementById(`itemTypeSelect_${i}`)?.value || "Outro";
    const nome = document.getElementById(`itemNameInput_${i}`)?.value.trim() || "";
    const presente = document.getElementById(`itemPresenteInput_${i}`)?.value.trim() || "";
    if (nome) lista.push({ tipo, nome, presente });
  }
  return lista;
}

function confirmarRemoverTimersConta(idx, nomeConta) {
  abrirModalConfirmacao("🗑️ Resetar Timers", `Os timers de envio da conta ${nomeConta} serão resetados (liberando as 5 vagas). Tem certeza que deseja continuar?`, () => {
    removerTimersConta(idx);
    mostrarNotificacao(`Timers da conta ${nomeConta} resetados!`, "sucesso");
  });
}

function confirmarRemoverVendasConta(nomeConta) {
  abrirModalConfirmacao("💲 Zerar R$ da Sessão", `O valor arrecadado (R$) na sessão atual para a conta ${nomeConta} será zerado. Tem certeza que deseja continuar?`, () => {
    state.vendas = (state.vendas || []).filter(v => v.conta !== nomeConta);
    render();
    save();
    mostrarNotificacao(`Vendas da sessão da conta ${nomeConta} zeradas!`, "sucesso");
  });
}

function adicionarTimerManual(nomeConta) {
  const usadas = usadasDaConta(nomeConta);
  if (usadas >= 5) {
    mostrarNotificacao(`A conta ${nomeConta} já atingiu o limite de 5 envios!`, "erro");
    return;
  }
  abrirModalConfirmacao("➕ Adicionar Envio Manual", `Deseja ocupar 1 vaga de envio na conta ${nomeConta} por 24h?`, () => {
    state.reservas.push(criarTimerReserva(nomeConta, 'envio-manual'));
    render();
    save();
    mostrarNotificacao(`Envio manual ativado na conta ${nomeConta}!`, "sucesso");
  });
}

const elLimparTudo = document.getElementById("limparTudoBtn");
if (elLimparTudo) {
  elLimparTudo.addEventListener("click", () => {
    ["valorInput", "clienteInput", "nickClienteInput", "whatsappInput", "tiktokInput", "observacaoInput"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (document.getElementById("quantidadeInput")) document.getElementById("quantidadeInput").value = "1";
    if (document.getElementById("dataEnvioInput")) document.getElementById("dataEnvioInput").value = "";
    if (document.getElementById("labelAgendaData")) document.getElementById("labelAgendaData").textContent = "Hoje";
    atualizarCamposItens();
    atualizarPreviewVBucks();
    verificarObservacaoCliente("");
  });
}

const elLimparValor = document.getElementById("limparSoValorBtn");
if (elLimparValor) {
  elLimparValor.addEventListener("click", () => {
    const valInput = document.getElementById("valorInput");
    if (valInput) {
      valInput.value = "";
      atualizarPreviewVBucks();
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
  await verificarSessao();
  atualizarInterfaceAuth();
  atualizarCamposItens();
  atualizarPreviewVBucks();
  mudarAbaHistorico('vendas');
  
  if (!currentUser) {
    if (footer) footer.textContent = "👀 Modo Visitante (Faça login como Admin)";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    render();
    return;
  }
  
  try {
    if (footer) footer.textContent = "☁️ Carregando dados da nuvem...";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.1&select=*`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await res.json();
    state = (Array.isArray(rows) && rows.length > 0 && rows[0].data) ? rows[0].data : JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    if (footer) footer.textContent = `🟢 Conectado à Nuvem (Admin: ${currentUser.email})`;
    render();
  } catch (err) {
    if (footer) footer.textContent = "⚠️ Erro ao sincronizar com banco";
    state = JSON.parse(JSON.stringify(DADOS_DEMO));
    sanitizarDados();
    render();
  }
}

ultimaDataHojeConhecida = obterDataHojeFormatada();
inicializar();

setInterval(() => {
  if (state) renderContasCards();
  const dataAtual = obterDataHojeFormatada();
  if (ultimaDataHojeConhecida !== dataAtual) {
    ultimaDataHojeConhecida = dataAtual;
    render();
    mostrarNotificacao("📅 Novo dia iniciado! Painel atualizado.", "info");
  }
}, 1000);