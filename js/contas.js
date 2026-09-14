// ========================================================
// MÓDULO DE CONTAS (Gerenciamento e Renderização)
// ========================================================

let contasAberto = false;

function toggleGerenciarContas() {
  contasAberto = !contasAberto;
  const content = document.getElementById("contasContent");
  const arrow = document.getElementById("contasToggleArrow");
  if (content && arrow) {
    content.style.display = contasAberto ? "block" : "none";
    arrow.textContent = contasAberto ? "▴" : "▾";
  }
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