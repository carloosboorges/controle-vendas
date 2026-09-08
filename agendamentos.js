// ==========================================
// MÓDULO DE AGENDAMENTOS (Pré-vendas)
// ==========================================

function agendarVenda() {
  limparReservasExpiradas();
  const conta = document.getElementById("contaSelect").value;
  const valor = parseFloat(document.getElementById("valorInput").value);
  const cliente = document.getElementById("clienteInput").value.trim();
  const nickCliente = document.getElementById("nickClienteInput").value.trim();
  const whatsapp = document.getElementById("whatsappInput")?.value.trim() || "";
  const tiktok = document.getElementById("tiktokInput")?.value.trim() || "";
  const observacao =
    document.getElementById("observacaoInput")?.value.trim() || "";
  const quantidade =
    parseInt(document.getElementById("quantidadeInput").value, 10) || 1;
  const itens = obterItensDaVenda();
  const baseAtual = state.valorBase100 || 2.5;

  if (!conta) {
    mostrarNotificacao("Selecione a conta de onde o item sairá.", "erro");
    return;
  }
  if (!valor || valor <= 0) {
    mostrarNotificacao("Digite um valor válido pago antecipadamente.", "erro");
    return;
  }
  if (!cliente || !nickCliente) {
    mostrarNotificacao("Preencha o cliente e o nick.", "erro");
    return;
  }

  const vbucksNecessarios = Math.round((valor / baseAtual) * 100);

  const contaObj = (state.contas || []).find((c) => c.nome === conta);
  if (Number(contaObj?.vbucks) < vbucksNecessarios) {
    mostrarNotificacao(
      "Aviso: Saldo de V-Bucks atual é insuficiente, mas o agendamento será salvo.",
      "info",
    );
  }

  const agora = Date.now(),
    d = new Date();
  const agendamentoId = crypto.randomUUID
    ? crypto.randomUUID()
    : `agenda-${Date.now()}`;

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
    dataRegistro: d.toLocaleDateString("pt-BR"),
    horaRegistro: d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    criadoEmMs: agora,
  };

  if (!state.agendamentos) state.agendamentos = [];
  state.agendamentos.unshift(novoAgendamento); // Adiciona no topo da fila

  sincronizarDadosCliente(cliente, whatsapp, tiktok);

  document.getElementById("limparTudoBtn").click();

  save();
  mostrarNotificacao("⏳ Pré-venda agendada com sucesso!", "sucesso");
}

function renderizarAgendamentos() {
  const container = document.getElementById("listaAgendamentosContainer");
  if (!container) return;

  const agendamentos = state.agendamentos || [];

  if (agendamentos.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">Nenhuma pré-venda agendada no momento. Tudo limpo!</div>`;
    return;
  }

  container.innerHTML = agendamentos
    .map((a) => {
      const vb =
        a.vbucks !== undefined
          ? Number(a.vbucks)
          : valorParaVBucks(a.valor, a.valorBaseMomento);
      const itensHtmlStr = renderizarListaItensHtml(a.itens || [a.item]);

      const infosContato = [];
      const iconeTikTok = `<svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>`;

      if (a.whatsapp)
        infosContato.push(
          `<div style="display:flex; align-items:center; gap:4px; white-space: nowrap;">📱 <span class="copyable-text" onclick="copiarTexto('${esc(a.whatsapp)}', 'WhatsApp', event)" style="font-size:13px; font-weight:600; color:#eee;">${esc(a.whatsapp)}</span></div>`,
        );
      if (a.tiktok)
        infosContato.push(
          `<div style="display:flex; align-items:center; gap:4px; white-space: nowrap;">${iconeTikTok} <span class="copyable-text" onclick="copiarTexto('${esc(a.tiktok)}', 'TikTok', event)" style="font-size:13px; font-weight:600; color:#eee;">${esc(a.tiktok)}</span></div>`,
        );

      const contatoHtml =
        infosContato.length > 0
          ? `<div class="history-client" style="margin-top: 4px; display:flex; align-items:center; gap: 12px; flex-wrap: nowrap;">${infosContato.join("")}</div>`
          : "";

      const observacaoHtml = a.observacao
        ? `
      <div style="margin-top: 6px; font-size: 12px; color: #ffb74d; background: rgba(255, 152, 0, 0.1); padding: 4px 8px; border-radius: 6px; border-left: 3px solid #ff9800;">
        💬 <b>Observação:</b> ${esc(a.observacao)}
      </div>
    `
        : "";

      return `
    <div class="history-card" style="border-left: 4px solid #3b82f6;">
      <div class="history-main">
        <div class="history-info">
          <div class="history-account">
            Conta reservada: <span class="copyable-text" onclick="copiarTexto('${esc(a.conta)}', 'Conta', event)">${esc(a.conta)}</span>
          </div>
          <div class="history-client">
            👤 <span class="copyable-text" onclick="copiarTexto('${esc(a.cliente)}', 'Cliente', event)">${esc(a.cliente)}</span>
          </div>
          <div class="history-client">
            🎮 <span class="copyable-text" onclick="copiarTexto('${esc(a.nickCliente)}', 'Nick', event)">${esc(a.nickCliente)}</span>
          </div>
          ${contatoHtml}
          <div class="history-item" style="margin-top: 8px;">${itensHtmlStr}</div>
          <div class="history-date">📅 Agendado em: ${esc(a.dataRegistro)} às ${esc(a.horaRegistro)}</div>
          ${observacaoHtml}
        </div>
        <div class="history-value">${money(a.valor)}</div>
      </div>
      <div class="history-details">
        <span>🪙 ${formatVBucks(vb)} V-Bucks exigidos</span>
        <div class="history-actions">
          <button type="button" class="btn-primary" style="padding:6px 12px; font-weight: bold; background: #3b82f6;" onclick="efetivarAgendamento('${esc(a.id)}')">✅ Efetivar Venda (Enviar Agora)</button>
          <button type="button" class="btn-danger" onclick="excluirAgendamento('${esc(a.id)}')">🗑️ Cancelar</button>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

function efetivarAgendamento(id) {
  const idx = (state.agendamentos || []).findIndex((a) => a.id === id);
  if (idx < 0) return;
  const agendamento = state.agendamentos[idx];

  const usadas = usadasDaConta(agendamento.conta);
  if (usadas + agendamento.quantidade > 5) {
    mostrarNotificacao(
      `A conta ${agendamento.conta} não tem as ${agendamento.quantidade} vagas livres necessárias agora.`,
      "erro",
    );
    return;
  }

  const contaObj = (state.contas || []).find(
    (c) => c.nome === agendamento.conta,
  );
  if (!contaObj || Number(contaObj.vbucks) < agendamento.vbucks) {
    mostrarNotificacao(
      `Saldo de V-Bucks insuficiente na conta ${agendamento.conta} para efetivar a venda.`,
      "erro",
    );
    return;
  }

  abrirModalConfirmacao(
    "✅ Efetivar Pré-venda",
    `Confirmar o envio para ${agendamento.cliente}? Os V-Bucks serão descontados, a vaga ocupada, e o valor entrará no caixa imediatamente.`,
    () => {
      contaObj.vbucks = Math.max(
        0,
        Number(contaObj.vbucks) - agendamento.vbucks,
      );

      const agora = Date.now(),
        d = new Date();
      const vendaId = crypto.randomUUID
        ? crypto.randomUUID()
        : `venda-${Date.now()}`;

      // Transforma o agendamento em uma Venda oficial com a hora de AGORA
      const novaVenda = {
        ...agendamento,
        id: vendaId,
        data: d.toLocaleDateString("pt-BR"),
        hora: d.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        criadoEmMs: agora,
      };
      delete novaVenda.dataRegistro;
      delete novaVenda.horaRegistro;

      state.vendas.unshift(novaVenda);
      state.historicoVendas.unshift(JSON.parse(JSON.stringify(novaVenda)));

      for (let n = 0; n < agendamento.quantidade; n++) {
        state.reservas.push({
          id: `timer-${Date.now()}-${n}`,
          conta: agendamento.conta,
          vendaId,
          expiresAt: agora + 86400000,
        });
      }

      state.agendamentos.splice(idx, 1);

      save();
      mostrarNotificacao(
        "Venda efetivada com sucesso! O Timer começou a rodar.",
        "sucesso",
      );
    },
  );
}

function excluirAgendamento(id) {
  const idx = (state.agendamentos || []).findIndex((a) => a.id === id);
  if (idx < 0) return;
  const agendamento = state.agendamentos[idx];

  abrirModalConfirmacao(
    "🗑️ Cancelar Agendamento",
    `Deseja realmente cancelar a pré-venda de ${agendamento.cliente}? O dinheiro não será somado ao caixa. Essa ação não tem volta.`,
    () => {
      state.agendamentos.splice(idx, 1);
      save();
      mostrarNotificacao("Agendamento cancelado.", "info");
    },
  );
}
